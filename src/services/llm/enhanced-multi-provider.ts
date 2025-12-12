import type { ProcessTextRequest, StreamChunk, ConversationContext } from "~types/messages";
import type { Settings } from "~types/settings";
import { EnhancedLLMProcessor, type EnhancedProcessTextRequest, type EnhancedStreamChunk } from "./EnhancedLLMProcessor";
import { ConversationMemoryManager, type EnhancedConversationContext } from "../conversation/ConversationMemoryManager";
import { Storage } from "@plasmohq/storage";

/**
 * Enhanced Multi-Provider Router
 * Routes all LLM requests through the enhanced processor with memory and performance tracking
 */

export interface ProviderCapabilities {
  hasMemory: boolean;
  hasChainOfThought: boolean;
  hasFollowUpSuggestions: boolean;
  hasPerformanceTracking: boolean;
  qualityLevel: "standard" | "enhanced" | "premium";
}

export interface ProviderStatus {
  name: string;
  isAvailable: boolean;
  capabilities: ProviderCapabilities;
  lastUsed?: Date;
  errorCount: number;
  successCount: number;
}

export class EnhancedMultiProviderRouter {
  private processors: Map<string, EnhancedLLMProcessor> = new Map();
  private providerStatus: Map<string, ProviderStatus> = new Map();
  private storage: Storage;
  private memoryManager: ConversationMemoryManager | null = null;

  constructor() {
    this.storage = new Storage();
    this.initializeProviderStatus();
  }

  private initializeProviderStatus() {
    const providers = ['openai', 'gemini', 'xai', 'local', 'basic'];
    
    providers.forEach(provider => {
      this.providerStatus.set(provider, {
        name: provider,
        isAvailable: true,
        capabilities: this.getProviderCapabilitiesInternal(provider),
        errorCount: 0,
        successCount: 0
      });
    });
  }

  private getProviderCapabilitiesInternal(provider: string): ProviderCapabilities {
    switch (provider) {
      case 'openai':
        return {
          hasMemory: true,
          hasChainOfThought: true,
          hasFollowUpSuggestions: true,
          hasPerformanceTracking: true,
          qualityLevel: "premium"
        };
      case 'gemini':
      case 'xai':
      case 'local':
        return {
          hasMemory: true,
          hasChainOfThought: true,
          hasFollowUpSuggestions: true,
          hasPerformanceTracking: true,
          qualityLevel: "enhanced"
        };
      case 'basic':
        return {
          hasMemory: true,
          hasChainOfThought: true,
          hasFollowUpSuggestions: true,
          hasPerformanceTracking: true,
          qualityLevel: "enhanced"
        };
      default:
        return {
          hasMemory: false,
          hasChainOfThought: false,
          hasFollowUpSuggestions: false,
          hasPerformanceTracking: false,
          qualityLevel: "standard"
        };
    }
  }

  private createFullSettings(requestSettings: any): Settings {
    return {
      modelType: requestSettings.modelType,
      basicModel: requestSettings.basicModel,
      apiKey: requestSettings.apiKey,
      serverUrl: requestSettings.serverUrl,
      geminiApiKey: requestSettings.geminiApiKey,
      xaiApiKey: requestSettings.xaiApiKey,
      geminiModel: requestSettings.geminiModel,
      grokModel: requestSettings.grokModel,
      openaiModel: requestSettings.openaiModel,
      localModel: requestSettings.localModel,
      maxTokens: requestSettings.maxTokens,
      temperature: requestSettings.temperature,
      preferredModes: requestSettings.preferredModes || ["summarize", "explain", "analyze", "free"],
      customPrompts: requestSettings.customPrompts,
      customization: {
        showSelectedText: true,
        theme: "system",
        radicallyFocus: false,
        fontSize: "16px",
        highlightColor: "default",
        popupAnimation: "slide",
        persistHighlight: false,
        layoutMode: "sidebar",
        showGlobalActionButton: true,
        contextAwareness: false,
        activationMode: "manual",
        enablePDFSupport: false,
        showTextSelectionButton: true,
        automaticActivation: false,
        showWebsiteInfo: true,
        sidebarPinned: false
      }
    };
  }

  private async getOrCreateProcessor(settings: Settings): Promise<EnhancedLLMProcessor> {
    const key = `${settings.modelType}`;
    
    if (!this.processors.has(key)) {
      const processor = new EnhancedLLMProcessor(settings);
      this.processors.set(key, processor);
    }
    
    return this.processors.get(key)!;
  }

  private createEnhancedContext(context: ConversationContext | undefined): EnhancedConversationContext {
    if (!context) {
      return {
        history: [],
        entities: [],
        activeEntity: null,
        currentTopic: null,
        contextWindow: [],
        longTermMemory: [],
        userPreferences: {
          interests: []
        }
      };
    }

    return {
      ...context,
      contextWindow: context.history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        importance: 5
      })),
      longTermMemory: [],
      userPreferences: {
        interests: []
      }
    };
  }

  /**
   * Enhanced text processing with automatic provider routing and memory integration
   */
  async* processTextEnhanced(request: ProcessTextRequest): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    const { settings, isFollowUp, conversationContext } = request;
    
    try {
      // Create full settings object
      const fullSettings = this.createFullSettings(settings);
      
      // Get or create processor for this provider
      const processor = await this.getOrCreateProcessor(fullSettings);
      
      // Initialize memory manager if not already done
      if (!this.memoryManager) {
        this.memoryManager = new ConversationMemoryManager(fullSettings);
      }

      // Create enhanced conversation context
      const enhancedContext = this.createEnhancedContext(conversationContext);

      // Build enhanced request
      const enhancedRequest: EnhancedProcessTextRequest = {
        ...request,
        conversationContext: enhancedContext,
        enableChainOfThought: true,
        enableMemoryIntegration: true,
        enableFollowUpSuggestions: true,
        qualityLevel: this.getProviderCapabilitiesInternal(settings.modelType).qualityLevel
      };

      // Process through enhanced processor
      let fullResponse = '';
      for await (const chunk of processor.processTextEnhanced(enhancedRequest)) {
        if (chunk.type === 'chunk' && chunk.content) {
          fullResponse += chunk.content;
        }

        // Convert enhanced chunk to regular chunk for compatibility
        const regularChunk: StreamChunk = {
          type: chunk.type,
          content: chunk.content,
          error: chunk.error,
          isFollowUp: chunk.isFollowUp,
          id: typeof chunk.id === 'string' ? parseInt(chunk.id) || 0 : chunk.id
        };

        yield regularChunk;

        // Handle errors
        if (chunk.type === 'error') {
          this.updateProviderStatus(settings.modelType, false);
          return;
        }
      }

      // Update provider status
      this.updateProviderStatus(settings.modelType, true);

      // Log performance metrics
      console.log(`Enhanced processing completed:`, {
        provider: settings.modelType,
        duration: Date.now() - startTime,
        responseCharacters: fullResponse.length
      });

    } catch (error) {
      console.error(`Enhanced processing error for ${settings.modelType}:`, error);
      this.updateProviderStatus(settings.modelType, false);
      
      yield {
        type: 'error',
        error: error.message,
        isFollowUp: request.isFollowUp,
        id: typeof request.id === 'string' ? parseInt(request.id) || 0 : request.id
      };
    }
  }

  private updateProviderStatus(provider: string, success: boolean) {
    const status = this.providerStatus.get(provider);
    if (status) {
      if (success) {
        status.successCount++;
        status.errorCount = Math.max(0, status.errorCount - 1);
      } else {
        status.errorCount++;
      }
      status.lastUsed = new Date();
      status.isAvailable = status.errorCount < 3;
    }
  }

  /**
   * Get provider status for UI display
   */
  getProviderStatus(): ProviderStatus[] {
    return Array.from(this.providerStatus.values());
  }

  /**
   * Get enhanced capabilities for a provider
   */
  getProviderCapabilities(provider: string): ProviderCapabilities {
    return this.providerStatus.get(provider)?.capabilities || {
      hasMemory: false,
      hasChainOfThought: false,
      hasFollowUpSuggestions: false,
      hasPerformanceTracking: false,
      qualityLevel: "standard"
    };
  }

  /**
   * Clear conversation memory
   */
  async clearConversationMemory(): Promise<void> {
    await this.storage.remove("enhancedConversationContext");
  }

  /**
   * Get conversation insights
   */
  async getConversationInsights(): Promise<any> {
    const context = await this.storage.get<EnhancedConversationContext>("enhancedConversationContext");
    if (!context) return null;

    return {
      totalMessages: context.history?.length || 0,
      entities: context.entities?.length || 0,
      memoryEntries: context.longTermMemory?.length || 0
    };
  }
}

// Export singleton instance
export const enhancedMultiProviderRouter = new EnhancedMultiProviderRouter(); 