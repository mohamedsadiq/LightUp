import type { ProcessTextRequest } from "~types/messages"
import { processTextWithAISDK } from "./ai-sdk-adapter"
import { processOpenAIText } from "./openai"

/**
 * Enhanced OpenAI service with AI SDK integration
 * Features gradual rollout capability and maintains backward compatibility
 */

interface EnhancedOpenAIConfig {
  useAISDK: boolean;
  fallbackToOriginal: boolean;
  enablePerformanceMetrics: boolean;
}

// Feature flags - can be controlled via extension settings or remote config
const DEFAULT_CONFIG: EnhancedOpenAIConfig = {
  useAISDK: true,  // Enable AI SDK by default for testing
  fallbackToOriginal: true,  // Fallback to original implementation on errors
  enablePerformanceMetrics: true
};

export const processEnhancedOpenAIText = async function*(
  request: ProcessTextRequest,
  config: Partial<EnhancedOpenAIConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Performance tracking
  const startTime = finalConfig.enablePerformanceMetrics ? Date.now() : 0;
  let tokenCount = 0;
  let chunkCount = 0;
  
  try {
    if (finalConfig.useAISDK) {
      // Use new AI SDK adapter
      console.log('[Enhanced OpenAI] Using AI SDK adapter');
      
      for await (const chunk of processTextWithAISDK(request, 'openai')) {
        if (chunk.type === 'chunk' && chunk.content) {
          tokenCount += Math.ceil(chunk.content.length / 4); // Rough token estimation
          chunkCount++;
        }
        
        yield chunk;
        
        // Early termination on error
        if (chunk.type === 'error') {
          if (finalConfig.fallbackToOriginal) {
            console.log('[Enhanced OpenAI] Falling back to original implementation');
            yield* processOpenAIText(request);
            return;
          }
          break;
        }
      }
    } else {
      // Use original implementation
      console.log('[Enhanced OpenAI] Using original implementation');
      yield* processOpenAIText(request);
    }
    
    // Log performance metrics
    if (finalConfig.enablePerformanceMetrics) {
      const duration = Date.now() - startTime;
      console.log(`[Enhanced OpenAI] Performance: ${duration}ms, ${tokenCount} tokens, ${chunkCount} chunks`);
    }
    
  } catch (error) {
    console.error('[Enhanced OpenAI] Error:', error);
    
    if (finalConfig.fallbackToOriginal && finalConfig.useAISDK) {
      console.log('[Enhanced OpenAI] Falling back to original implementation after error');
      yield* processOpenAIText(request);
    } else {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Enhanced OpenAI processing failed',
        isFollowUp: request.isFollowUp,
        id: request.id
      };
    }
  }
};

/**
 * Factory function to create enhanced OpenAI processor with custom config
 */
export function createEnhancedOpenAIProcessor(config: Partial<EnhancedOpenAIConfig> = {}) {
  return function* (request: ProcessTextRequest) {
    return processEnhancedOpenAIText(request, config);
  };
}

/**
 * A/B testing helper - randomly chooses between enhanced and original
 */
export function processOpenAITextWithABTest(
  request: ProcessTextRequest,
  enhancedRatio: number = 0.5 // 50% use enhanced by default
) {
  const useEnhanced = Math.random() < enhancedRatio;
  
  if (useEnhanced) {
    return processEnhancedOpenAIText(request, { useAISDK: true });
  } else {
    return processOpenAIText(request);
  }
} 