import type { ProcessTextRequest, StreamChunk } from "~types/messages";
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS, getMaxTokensFromPromptOrSetting } from "../../utils/constants";
import { getSelectedLocale } from "../../utils/i18n";

/**
 * AI SDK Adapter - Bridges new AI SDK streaming with existing StreamChunk interface
 * This allows gradual migration while maintaining backward compatibility
 * 
 * Note: This is a transitional adapter that maintains the existing API while 
 * preparing for full AI SDK integration
 */

export interface AISDKConfig {
  provider: 'openai' | 'gemini' | 'grok' | 'basic';
  model?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AISDKAdapter {
  private config: AISDKConfig;

  constructor(config: AISDKConfig) {
    this.config = config;
  }

  /**
   * Process text using enhanced streaming while maintaining StreamChunk compatibility
   * This implementation uses the existing fetch approach but with improved streaming
   */
  async* processText(request: ProcessTextRequest): AsyncGenerator<StreamChunk> {
    const { text, mode, settings, isFollowUp } = request;
    
    try {
      // Get the user's selected language for AI responses
      const responseLanguage = settings.aiResponseLanguage || await getSelectedLocale();
      
      // Build messages using existing logic
      const messages = [
        {
          role: "system",
          content: this.buildSystemPrompt(mode, settings, isFollowUp, responseLanguage)
        },
        {
          role: "user",
          content: this.buildUserPrompt(text, mode, settings, isFollowUp, request.context)
        }
      ];

      // Enhanced streaming with better error handling and performance
      const selectedModel = settings.openaiModel || "gpt-4o";

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey || settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          max_tokens: getMaxTokensFromPromptOrSetting(mode, this.buildSystemPrompt(mode, settings, isFollowUp, responseLanguage)) || settings.maxTokens || 2048,
          temperature: 0.5,
          stream: true
        }),
      });

      if (!response.ok) {
        let errorMessage = `OpenAI API Error (${response.status})`;
        try {
          const errorJson = await response.json();
          const openAiError = errorJson?.error?.message;
          if (openAiError) {
            errorMessage = openAiError;
          }
        } catch (parseError) {
          errorMessage = `OpenAI API Error: ${response.status} ${response.statusText || ''}`.trim();
        }

        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (buffer) {
            yield {
              type: 'chunk',
              content: buffer,
              isFollowUp: request.isFollowUp,
              id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
            };
          }
          yield {
            type: 'done',
            isFollowUp: request.isFollowUp,
            id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
          };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Enhanced buffer processing with better performance
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        const chunksToProcess = [];
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.includes('[DONE]')) {
            yield { 
              type: 'done',
              isFollowUp: request.isFollowUp,
              id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
            };
            continue;
          }
          
          try {
            const data = JSON.parse(line.replace(/^data: /, ''));
            if (data.choices?.[0]?.delta?.content) {
              chunksToProcess.push(data.choices[0].delta.content);
            }
          } catch (e) {
            console.warn('Failed to parse line:', line);
          }
        }
        
        // Send chunks with improved batching
        if (chunksToProcess.length > 0) {
          yield {
            type: 'chunk',
            content: chunksToProcess.join(''),
            isFollowUp: request.isFollowUp,
            id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
          };
        }
      }

    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'AI SDK processing failed',
        isFollowUp: request.isFollowUp,
        id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
      };
    }
  }

  /**
   * Build system prompt using existing logic
   */
  private buildSystemPrompt(
    mode: string, 
    settings: any, 
    isFollowUp: boolean, 
    responseLanguage: string
  ): string {
    // Language instruction to add to all system prompts
    const languageInstruction = responseLanguage !== "en" 
      ? `\n\nIMPORTANT: Respond in ${responseLanguage} language. Adapt your response to be culturally appropriate for speakers of this language.` 
      : "";
      
    // For follow-up questions, use enhanced context-aware prompts
    if (isFollowUp) {
      // If custom system prompt is available for follow-ups, use it
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return `${settings.customPrompts.systemPrompts[mode]} 

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.${languageInstruction}`;
      }
      // Otherwise use enhanced follow-up prompt
      const basePrompt = FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
      return basePrompt + languageInstruction;
    }
    
    // If custom system prompt is available, use it
    if (settings.customPrompts?.systemPrompts?.[mode]) {
      return settings.customPrompts.systemPrompts[mode] + languageInstruction;
    }
    // Otherwise use default
    return SYSTEM_PROMPTS[mode] + languageInstruction;
  }

  /**
   * Build user prompt using existing logic
   */
  private buildUserPrompt(
    text: string,
    mode: string,
    settings: any,
    isFollowUp: boolean,
    context?: string
  ): string {
    if (isFollowUp) {
      // Include rich context for follow-ups with original content and conversation history
      const contextText = context || '';
      const originalContent = contextText.length > 500 ? contextText.substring(0, 500) + "..." : contextText;
      
      return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${text}

Instructions: Build on your previous analysis/explanation of this content. If the question asks for "more" or "other" aspects (like "what else is strange/unusual/problematic"), provide genuinely new insights you haven't covered yet. Avoid repeating previous points unless directly relevant to the new question.`;
    }
    
    // For translate mode
    if (mode === "translate") {
      // Use custom user prompt if available
      if (settings.customPrompts?.userPrompts?.[mode]) {
        const customPrompt = settings.customPrompts.userPrompts[mode];
        return customPrompt
          .replace('${fromLanguage}', settings.translationSettings?.fromLanguage || "en")
          .replace('${toLanguage}', settings.translationSettings?.toLanguage || "es")
          .replace('${text}', text);
      }
      
      // Otherwise use default
      return typeof USER_PROMPTS.translate === 'function'
        ? USER_PROMPTS.translate(
            settings.translationSettings?.fromLanguage || "en",
            settings.translationSettings?.toLanguage || "es"
          ) + "\n" + text
        : text;
    }
    
    // For other modes
    if (settings.customPrompts?.userPrompts?.[mode]) {
      // Use custom user prompt if available
      return settings.customPrompts.userPrompts[mode].replace('${text}', text);
    }
    
    // Otherwise use default
    return typeof USER_PROMPTS[mode] === 'function'
      ? USER_PROMPTS[mode](text)
      : USER_PROMPTS[mode] + "\n" + text;
  }
}

/**
 * Factory function to create AI SDK adapter instances
 */
export function createAISDKAdapter(config: AISDKConfig): AISDKAdapter {
  return new AISDKAdapter(config);
}

/**
 * Enhanced streaming function that uses AI SDK under the hood
 */
export async function* processTextWithAISDK(
  request: ProcessTextRequest,
  provider: 'openai' | 'gemini' | 'grok' | 'basic' = 'openai'
): AsyncGenerator<StreamChunk> {
  const adapter = createAISDKAdapter({
    provider,
    apiKey: request.settings.apiKey
  });

  yield* adapter.processText(request);
} 