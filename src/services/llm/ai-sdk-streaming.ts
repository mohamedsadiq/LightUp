/**
 * AI SDK Streaming Service
 * 
 * PURPOSE: Unified streaming implementation using Vercel AI SDK
 * REPLACES: Raw fetch() calls in openai.ts, ai-sdk-adapter.ts
 * 
 * INTEGRATION POINTS:
 * - EnhancedLLMProcessor.getLLMProcessor() -> routes here
 * - openai-enhanced.ts -> can delegate to this
 * 
 * PROVIDERS SUPPORTED:
 * - OpenAI: via @ai-sdk/openai
 * - xAI (Grok): via @ai-sdk/openai with custom baseURL (OpenAI-compatible API)
 * - Gemini: Keep existing implementation (AI SDK Google provider can be added later)
 * 
 * @author LightUp Team
 * @since 2024-12
 */

import { streamText, type CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { ProcessTextRequest, StreamChunk } from "~types/messages";
import type { Settings } from "~types/settings";
import { 
  SYSTEM_PROMPTS, 
  USER_PROMPTS, 
  FOLLOW_UP_SYSTEM_PROMPTS, 
  getMaxTokensFromPromptOrSetting 
} from "~utils/constants";
import { getSelectedLocale } from "~utils/i18n";

// ============================================================================
// Types
// ============================================================================

export type AISDKProvider = 'openai' | 'xai' | 'gemini';

export interface AISDKStreamingConfig {
  provider: AISDKProvider;
  enableFallback: boolean;
  enableMetrics: boolean;
}

interface StreamingMetrics {
  startTime: number;
  firstChunkTime?: number;
  totalChunks: number;
  totalCharacters: number;
}

// ============================================================================
// Provider Configuration
// ============================================================================

/**
 * Create AI provider instance
 * Supports OpenAI, xAI (OpenAI-compatible), and Gemini
 */
const createProvider = (settings: Settings, provider: AISDKProvider) => {
  if (provider === 'xai') {
    return createOpenAI({
      apiKey: settings.xaiApiKey || '',
      baseURL: 'https://api.x.ai/v1',
      compatibility: 'compatible', // Important for xAI
    });
  }
  
  if (provider === 'gemini') {
    return createGoogleGenerativeAI({
      apiKey: settings.geminiApiKey || '',
    });
  }
  
  // Default OpenAI
  return createOpenAI({
    apiKey: settings.apiKey || '',
  });
};

/**
 * Get model name for provider
 */
const getModelName = (settings: Settings, provider: AISDKProvider): string => {
  if (provider === 'xai') {
    // Handle image model fallback
    const model = settings.grokModel || 'grok-4-0709';
    return model === 'grok-2-image-1212' ? 'grok-4-0709' : model;
  }
  
  if (provider === 'gemini') {
    return settings.geminiModel || 'gemini-2.0-flash';
  }
  
  return settings.openaiModel || 'gpt-4o';
};

// ============================================================================
// Prompt Building (reused from existing logic)
// ============================================================================

/**
 * Build system prompt with language support
 */
const buildSystemPrompt = (
  mode: string,
  settings: Settings,
  isFollowUp: boolean,
  responseLanguage: string
): string => {
  const languageInstruction = responseLanguage !== "en" 
    ? `\n\nIMPORTANT: Respond in ${responseLanguage} language. Adapt your response to be culturally appropriate for speakers of this language.` 
    : "";
    
  if (isFollowUp) {
    if (settings.customPrompts?.systemPrompts?.[mode]) {
      return `${settings.customPrompts.systemPrompts[mode]} 

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.${languageInstruction}`;
    }
    const basePrompt = FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
    return basePrompt + languageInstruction;
  }
  
  if (settings.customPrompts?.systemPrompts?.[mode]) {
    return settings.customPrompts.systemPrompts[mode] + languageInstruction;
  }
  
  return (SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.free) + languageInstruction;
};

/**
 * Build user prompt with context handling
 */
const buildUserPrompt = (
  text: string,
  mode: string,
  settings: Settings,
  isFollowUp: boolean,
  context?: string
): string => {
  if (isFollowUp && context) {
    const originalContent = context.length > 500 ? context.substring(0, 500) + "..." : context;
    return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${text}

Instructions: Build on your previous analysis/explanation of this content. If the question asks for "more" or "other" aspects, provide genuinely new insights. Avoid repeating previous points unless directly relevant.`;
  }
  
  if (mode === "translate") {
    if (settings.customPrompts?.userPrompts?.[mode]) {
      return settings.customPrompts.userPrompts[mode]
        .replace('${fromLanguage}', settings.translationSettings?.fromLanguage || "en")
        .replace('${toLanguage}', settings.translationSettings?.toLanguage || "es")
        .replace('${text}', text);
    }
    return `Translate from ${settings.translationSettings?.fromLanguage || "en"} to ${settings.translationSettings?.toLanguage || "es"}:\n\n${text}`;
  }
  
  if (settings.customPrompts?.userPrompts?.[mode]) {
    return settings.customPrompts.userPrompts[mode].replace('${text}', text);
  }
  
  const prompt = USER_PROMPTS[mode];
  return typeof prompt === "function" ? prompt(text) : (prompt || "") + "\n" + text;
};

// ============================================================================
// Main Streaming Function
// ============================================================================

/**
 * Process text using AI SDK streaming
 * 
 * This is the main entry point for AI SDK-based streaming.
 * It handles OpenAI and xAI providers with proper error handling.
 * 
 * @param request - The processing request
 * @param provider - The AI provider to use
 * @yields StreamChunk - Streaming chunks compatible with existing UI
 */
export async function* processWithAISDKStreaming(
  request: ProcessTextRequest,
  provider: AISDKProvider = 'openai'
): AsyncGenerator<StreamChunk> {
  const { text, mode, settings, isFollowUp, context } = request;
  
  // Initialize metrics
  const metrics: StreamingMetrics = {
    startTime: Date.now(),
    totalChunks: 0,
    totalCharacters: 0
  };
  
  try {
    // Get response language
    const responseLanguage = settings.aiResponseLanguage || await getSelectedLocale();
    
    // Build messages
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: buildSystemPrompt(mode, settings, isFollowUp || false, responseLanguage)
      },
      {
        role: 'user',
        content: buildUserPrompt(text, mode, settings, isFollowUp || false, context)
      }
    ];
    
    // Create provider and model
    const aiProvider = createProvider(settings, provider);
    const modelName = getModelName(settings, provider);
    const model = aiProvider(modelName);
    
    // Get max tokens
    const systemPrompt = buildSystemPrompt(mode, settings, isFollowUp || false, responseLanguage);
    const maxTokens = getMaxTokensFromPromptOrSetting(mode, systemPrompt) || settings.maxTokens || 2048;
    
    let result;
    try {
      result = await streamText({
        model,
        messages,
        maxTokens,
        temperature: settings.temperature ?? 0.5,
      });
    } catch (streamError) {
      throw streamError;
    }
    
    // Convert AI SDK stream to StreamChunk format
    let chunkCount = 0;
    for await (const delta of result.textStream) {
      chunkCount++;
      if (!metrics.firstChunkTime) {
        metrics.firstChunkTime = Date.now();
      }
      
      metrics.totalChunks++;
      metrics.totalCharacters += delta.length;
      
      yield {
        type: 'chunk' as const,
        content: delta,
        isFollowUp: request.isFollowUp,
        id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
      };
    }
    
    if (chunkCount === 0) {
      const fullText = await result.text;
      if (fullText && fullText.length > 0) {
        yield {
          type: 'chunk' as const,
          content: fullText,
          isFollowUp: request.isFollowUp,
          id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
        };
      }
    }
    
    const totalTime = Date.now() - metrics.startTime;
    
    yield {
      type: 'done' as const,
      isFollowUp: request.isFollowUp,
      id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
    };
    
  } catch (error) {
    // Parse error message for better UX
    let errorMessage = 'AI processing failed';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Enhance error messages
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = `Invalid ${provider.toUpperCase()} API key. Please check your settings.`;
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('500') || errorMessage.includes('503')) {
        errorMessage = `${provider.toUpperCase()} server error. Please try again later.`;
      }
    }
    
    yield {
      type: 'error' as const,
      error: errorMessage,
      isFollowUp: request.isFollowUp,
      id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
    };
  }
}

// ============================================================================
// Provider-Specific Entry Points
// ============================================================================

/**
 * Process text with OpenAI using AI SDK
 */
export async function* processOpenAIWithAISDK(
  request: ProcessTextRequest
): AsyncGenerator<StreamChunk> {
  yield* processWithAISDKStreaming(request, 'openai');
}

/**
 * Process text with xAI (Grok) using AI SDK
 */
export async function* processXAIWithAISDK(
  request: ProcessTextRequest
): AsyncGenerator<StreamChunk> {
  yield* processWithAISDKStreaming(request, 'xai');
}

/**
 * Process text with Gemini using AI SDK
 */
export async function* processGeminiWithAISDK(
  request: ProcessTextRequest
): AsyncGenerator<StreamChunk> {
  yield* processWithAISDKStreaming(request, 'gemini');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate text without streaming (for summarization, etc.)
 * Uses AI SDK for non-streaming completions
 */
export async function generateTextWithAISDK(
  prompt: string,
  settings: Settings,
  provider: AISDKProvider = 'openai',
  maxTokens: number = 500
): Promise<string> {
  const aiProvider = createProvider(settings, provider);
  const modelName = getModelName(settings, provider);
  const model = aiProvider(modelName);
  
  const result = await streamText({
    model,
    messages: [{ role: 'user', content: prompt }],
    maxTokens,
    temperature: 0.3, // Lower temperature for summarization
  });
  
  // Collect full response
  let fullText = '';
  for await (const delta of result.textStream) {
    fullText += delta;
  }
  
  return fullText;
}
