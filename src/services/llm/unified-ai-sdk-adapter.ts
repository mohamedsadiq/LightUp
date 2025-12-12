/**
 * @deprecated This adapter has been superseded by ai-sdk-streaming.ts
 * 
 * The unified approach is now implemented in:
 * - ai-sdk-streaming.ts (main AI SDK integration)
 * - EnhancedLLMProcessor.ts (routing and orchestration)
 * 
 * This file is kept for reference but is NOT used in the main processing flow.
 * Can be safely removed after verification.
 * 
 * @since 2024-12 - Deprecated
 */
import { streamText, type CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { ProcessTextRequest, StreamChunk } from "~types/messages";
import type { Settings } from "~types/settings";

// Import existing provider functions
import { processOpenAIText } from './openai';
import { processGeminiText } from './gemini';
import { processXAIText } from './xai';
import { processLocalText } from './local';
import { processBasicText } from './basic';

/**
 * @deprecated Use processOpenAIWithAISDK and processXAIWithAISDK from ai-sdk-streaming.ts instead
 * 
 * Unified AI SDK Adapter - Multi-Provider Integration
 * Provides enhanced capabilities for all AI providers while maintaining backward compatibility
 */

export type AIProvider = 'openai' | 'gemini' | 'xai' | 'local' | 'basic';

export interface UnifiedAIConfig {
  provider: AIProvider;
  useEnhancedStreaming: boolean;
  enableFallback: boolean;
  enablePerformanceMetrics: boolean;
  enhancedProviders: AIProvider[]; // Providers that support AI SDK enhancement
}

export interface ProviderCapabilities {
  supportsAISDK: boolean;
  supportsStreaming: boolean;
  supportsMemoryIntegration: boolean;
  requiresApiKey: boolean;
}

// Provider capabilities matrix
const PROVIDER_CAPABILITIES: Record<AIProvider, ProviderCapabilities> = {
  openai: {
    supportsAISDK: true,
    supportsStreaming: true,
    supportsMemoryIntegration: true,
    requiresApiKey: true
  },
  gemini: {
    supportsAISDK: false, // Can be added later with @ai-sdk/google
    supportsStreaming: true,
    supportsMemoryIntegration: true,
    requiresApiKey: true
  },
  xai: {
    supportsAISDK: false, // Can be added later with custom provider
    supportsStreaming: true,
    supportsMemoryIntegration: true,
    requiresApiKey: true
  },
  local: {
    supportsAISDK: false,
    supportsStreaming: true,
    supportsMemoryIntegration: true,
    requiresApiKey: false
  },
  basic: {
    supportsAISDK: false,
    supportsStreaming: true,
    supportsMemoryIntegration: false,
    requiresApiKey: false
  }
};

export class UnifiedAIAdapter {
  private config: UnifiedAIConfig;
  private settings: Settings;

  constructor(settings: Settings, config: Partial<UnifiedAIConfig> = {}) {
    this.settings = settings;
    this.config = {
      provider: this.detectProvider(settings),
      useEnhancedStreaming: true,
      enableFallback: true,
      enablePerformanceMetrics: true,
      enhancedProviders: ['openai'], // Start with OpenAI, expand gradually
      ...config
    };
  }

  /**
   * Process text with unified interface across all providers
   */
  async* processText(request: ProcessTextRequest): AsyncGenerator<StreamChunk> {
    const capabilities = PROVIDER_CAPABILITIES[this.config.provider];
    const canUseEnhanced = this.config.enhancedProviders.includes(this.config.provider);
    
    // Performance tracking
    const startTime = this.config.enablePerformanceMetrics ? Date.now() : 0;
    let tokenCount = 0;
    let chunkCount = 0;

    try {
      if (this.config.useEnhancedStreaming && canUseEnhanced && capabilities.supportsAISDK) {
        // Use AI SDK for enhanced providers
        console.log(`[Unified AI] Using enhanced AI SDK for ${this.config.provider}`);
        yield* this.processWithAISDK(request);
      } else {
        // Use original provider implementation
        console.log(`[Unified AI] Using original implementation for ${this.config.provider}`);
        yield* this.processWithOriginalProvider(request);
      }

      // Log performance metrics
      if (this.config.enablePerformanceMetrics) {
        const duration = Date.now() - startTime;
        console.log(`[Unified AI] ${this.config.provider} Performance: ${duration}ms, ${tokenCount} tokens, ${chunkCount} chunks`);
      }

    } catch (error) {
      console.error(`[Unified AI] Error with ${this.config.provider}:`, error);
      
      if (this.config.enableFallback && canUseEnhanced) {
        console.log(`[Unified AI] Falling back to original ${this.config.provider} implementation`);
        yield* this.processWithOriginalProvider(request);
      } else {
        yield {
          type: 'error',
          error: error instanceof Error ? error.message : `${this.config.provider} processing failed`,
          isFollowUp: request.isFollowUp,
          id: request.id
        };
      }
    }
  }

  /**
   * Process with AI SDK (currently OpenAI only, expandable)
   */
  private async* processWithAISDK(request: ProcessTextRequest): AsyncGenerator<StreamChunk> {
    const { text, mode, settings, isFollowUp } = request;

    if (this.config.provider === 'openai') {
      // Build messages for AI SDK
      const messages: CoreMessage[] = [
        {
          role: 'system',
          content: this.buildSystemPrompt(mode, settings, isFollowUp)
        },
        {
          role: 'user',
          content: this.buildUserPrompt(text, mode, settings, isFollowUp, request.context)
        }
      ];

      // Configure OpenAI model
      const model = openai('gpt-3.5-turbo');
      
      // Stream using AI SDK
      const result = await streamText({
        model,
        messages,
        maxTokens: settings.maxTokens || 2048,
        temperature: 0.5,
        apiKey: settings.apiKey || settings.openaiApiKey,
      });

      // Convert AI SDK stream to StreamChunk format
      for await (const delta of result.textStream) {
        yield {
          type: 'chunk',
          content: delta,
          isFollowUp: request.isFollowUp,
          id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
        };
      }

      yield {
        type: 'done',
        isFollowUp: request.isFollowUp,
        id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
      };
    }
  }

  /**
   * Process with original provider implementations
   */
  private async* processWithOriginalProvider(request: ProcessTextRequest): AsyncGenerator<StreamChunk> {
    const processor = this.getOriginalProcessor();
    yield* processor(request);
  }

  /**
   * Get the appropriate original processor function
   */
  private getOriginalProcessor(): (request: ProcessTextRequest) => AsyncGenerator<StreamChunk> {
    switch (this.config.provider) {
      case 'openai':
        return processOpenAIText;
      case 'gemini':
        return processGeminiText;
      case 'xai':
        return processXAIText;
      case 'local':
        return processLocalText;
      case 'basic':
      default:
        return processBasicText;
    }
  }

  /**
   * Detect provider from settings
   */
  private detectProvider(settings: Settings): AIProvider {
    if (settings.modelType) {
      return settings.modelType as AIProvider;
    }
    
    // Fallback detection based on available API keys
    if (settings.openaiApiKey || settings.apiKey) return 'openai';
    if (settings.geminiApiKey) return 'gemini';
    if (settings.xaiApiKey) return 'xai';
    if (settings.serverUrl) return 'local';
    
    return 'basic'; // Default fallback
  }

  /**
   * Build system prompt (reused from existing logic)
   */
  private buildSystemPrompt(mode: string, settings: Settings, isFollowUp: boolean): string {
    // This logic is consistent across all providers
    const responseLanguage = settings.aiResponseLanguage || "en";
    const languageInstruction = responseLanguage !== "en" 
      ? `\n\nIMPORTANT: Respond in ${responseLanguage} language.` 
      : "";
      
    if (isFollowUp) {
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return `${settings.customPrompts.systemPrompts[mode]} 

FOLLOW-UP CONTEXT: You are continuing the conversation.${languageInstruction}`;
      }
    }
    
    if (settings.customPrompts?.systemPrompts?.[mode]) {
      return settings.customPrompts.systemPrompts[mode] + languageInstruction;
    }
    
    // Use a basic system prompt for unified processing
    return `You are a helpful AI assistant. ${languageInstruction}`;
  }

  /**
   * Build user prompt (reused from existing logic)
   */
  private buildUserPrompt(
    text: string,
    mode: string,
    settings: Settings,
    isFollowUp: boolean,
    context?: string
  ): string {
    if (isFollowUp && context) {
      const originalContent = context.length > 500 ? context.substring(0, 500) + "..." : context;
      return `ORIGINAL CONTENT CONTEXT:\n${originalContent}\n\nFOLLOW-UP QUESTION: ${text}`;
    }
    
    if (mode === "translate") {
      return `Translate the following text from ${settings.translationSettings?.fromLanguage || "en"} to ${settings.translationSettings?.toLanguage || "es"}:\n\n${text}`;
    }
    
    if (settings.customPrompts?.userPrompts?.[mode]) {
      return settings.customPrompts.userPrompts[mode].replace('${text}', text);
    }
    
    return text;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return PROVIDER_CAPABILITIES[this.config.provider];
  }

  /**
   * Check if provider supports specific feature
   */
  supportsFeature(feature: keyof ProviderCapabilities): boolean {
    return this.getCapabilities()[feature];
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): AIProvider {
    return this.config.provider;
  }

  /**
   * Switch provider dynamically
   */
  switchProvider(provider: AIProvider, settings: Settings): void {
    this.config.provider = provider;
    this.settings = settings;
  }
}

/**
 * Factory function to create unified AI adapter
 */
export function createUnifiedAIAdapter(
  settings: Settings,
  config?: Partial<UnifiedAIConfig>
): UnifiedAIAdapter {
  return new UnifiedAIAdapter(settings, config);
}

/**
 * Enhanced multi-provider processing function
 */
export async function* processTextWithUnifiedAI(
  request: ProcessTextRequest,
  config?: Partial<UnifiedAIConfig>
): AsyncGenerator<StreamChunk> {
  const adapter = createUnifiedAIAdapter(request.settings, config);
  yield* adapter.processText(request);
}

/**
 * Provider-aware processing with automatic provider selection
 */
export async function* processTextWithAutoProvider(
  request: ProcessTextRequest
): AsyncGenerator<StreamChunk> {
  const settings = request.settings;
  
  // Auto-select best available provider
  let selectedProvider: AIProvider = 'basic';
  
  if (settings.openaiApiKey || settings.apiKey) {
    selectedProvider = 'openai';
  } else if (settings.geminiApiKey) {
    selectedProvider = 'gemini';
  } else if (settings.xaiApiKey) {
    selectedProvider = 'xai';
  } else if (settings.serverUrl) {
    selectedProvider = 'local';
  }

  const adapter = createUnifiedAIAdapter(settings, {
    provider: selectedProvider,
    useEnhancedStreaming: selectedProvider === 'openai', // Only enhance OpenAI for now
    enableFallback: true
  });

  yield* adapter.processText(request);
}

/**
 * Multi-provider health check
 */
export async function checkProviderHealth(settings: Settings): Promise<{
  provider: AIProvider;
  available: boolean;
  enhanced: boolean;
  capabilities: ProviderCapabilities;
}[]> {
  const results: Array<{
    provider: AIProvider;
    available: boolean;
    enhanced: boolean;
    capabilities: ProviderCapabilities;
  }> = [];

  for (const provider of Object.keys(PROVIDER_CAPABILITIES) as AIProvider[]) {
    const capabilities = PROVIDER_CAPABILITIES[provider];
    let available = true;

    // Check if required API key is present
    if (capabilities.requiresApiKey) {
      switch (provider) {
        case 'openai':
          available = !!(settings.openaiApiKey || settings.apiKey);
          break;
        case 'gemini':
          available = !!settings.geminiApiKey;
          break;
        case 'xai':
          available = !!settings.xaiApiKey;
          break;
        case 'local':
          available = !!settings.serverUrl;
          break;
      }
    }

    results.push({
      provider,
      available,
      enhanced: capabilities.supportsAISDK,
      capabilities
    });
  }

  return results;
} 