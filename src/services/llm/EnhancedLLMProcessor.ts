import type { ProcessTextRequest, StreamChunk } from "~types/messages";
import type { Settings } from "~types/settings";
import { ConversationMemoryManager } from "../conversation/ConversationMemoryManager";
import type { EnhancedConversationContext } from "../conversation/ConversationMemoryManager";
import { ChainOfThoughtPrompts } from "../prompts/ChainOfThoughtPrompts";
// Legacy processors (kept for fallback and non-AI SDK providers)
import { processOpenAIText } from "./openai";
import { processEnhancedOpenAIText } from "./openai-enhanced";
import { processGeminiText } from "./gemini";
import { processXAIText } from "./xai";
import { processLocalText } from "./local";
import { processBasicText } from "./basic";
// New AI SDK streaming (preferred for OpenAI, xAI, and Gemini)
import { processOpenAIWithAISDK, processXAIWithAISDK, processGeminiWithAISDK } from "./ai-sdk-streaming";

/**
 * Enhanced LLM Processor with Advanced Conversational AI Capabilities
 * Integrates memory management, Chain-of-Thought reasoning, and contextual awareness
 */

export interface EnhancedProcessTextRequest extends ProcessTextRequest {
  conversationContext: EnhancedConversationContext;
  enableChainOfThought?: boolean;
  enableMemoryIntegration?: boolean;
  enableFollowUpSuggestions?: boolean;
  qualityLevel?: "standard" | "enhanced" | "premium";
}

export interface EnhancedStreamChunk extends StreamChunk {
  contextUsed?: boolean;
  memoryRetrieved?: boolean;
  reasoningSteps?: string[];
  followUpSuggestions?: string[];
  confidenceScore?: number;
  relevanceScore?: number;
}

export class EnhancedLLMProcessor {
  private memoryManager: ConversationMemoryManager;
  private chainOfThoughtPrompts: ChainOfThoughtPrompts;
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
    this.memoryManager = new ConversationMemoryManager(settings);
    this.chainOfThoughtPrompts = new ChainOfThoughtPrompts({
      enableReasoning: true,
      reasoningDepth: "intermediate",
      includeStepByStep: true,
      enableSelfReflection: true,
      includeAlternatives: false
    });
  }

  /**
   * Enhanced text processing with full conversational AI capabilities
   */
  async* processTextEnhanced(request: EnhancedProcessTextRequest): AsyncGenerator<EnhancedStreamChunk> {
    const startTime = Date.now();
    const {
      text,
      mode,
      settings,
      conversationContext,
      enableChainOfThought = true,
      enableMemoryIntegration = true,
      enableFollowUpSuggestions = true,
      qualityLevel = "enhanced"
    } = request;

    try {
      // Step 1: Memory Integration and Context Retrieval
      let enhancedContext = conversationContext;
      let relevantMemories: Array<{ content: string; relevance: number; source: string }> = [];
      
      if (enableMemoryIntegration) {
        relevantMemories = await this.memoryManager.retrieveRelevantContext(text, enhancedContext);
      }

      // Step 2: Chain-of-Thought Prompt Construction
      let enhancedSystemPrompt = '';
      let enhancedUserPrompt = text;

      if (enableChainOfThought && qualityLevel !== "standard") {
        enhancedSystemPrompt = this.chainOfThoughtPrompts.buildEnhancedSystemPrompt(
          mode,
          enhancedContext,
          text,
          settings
        );

        // Add few-shot examples for premium quality
        if (qualityLevel === "premium") {
          const fewShotExamples = this.chainOfThoughtPrompts.buildFewShotExamples(mode);
          if (fewShotExamples) {
            enhancedUserPrompt = fewShotExamples + "\n\n" + text;
          }
        }

        // Integrate retrieved memories into the prompt
        if (relevantMemories.length > 0) {
          enhancedUserPrompt += `\n\nRELEVANT CONTEXT FROM OUR PREVIOUS CONVERSATIONS:`;
          relevantMemories.forEach((memory, index) => {
            enhancedUserPrompt += `\n${index + 1}. [${memory.source}] ${memory.content}`;
          });
        }


      }

      // Step 3: Enhanced LLM Request Construction
      // IMPORTANT: Only override system prompt if we actually have an enhanced prompt
      // Otherwise, preserve the user's custom prompts from settings
      const enhancedRequest: ProcessTextRequest = {
        ...request,
        text: enhancedUserPrompt,
        settings: {
          ...settings,
          customPrompts: enhancedSystemPrompt
            ? {
                ...settings.customPrompts,
                systemPrompts: {
                  ...settings.customPrompts?.systemPrompts,
                  [mode]: enhancedSystemPrompt
                }
              }
            : settings.customPrompts
        }
      };

      // Step 4: Route to appropriate LLM service
      const llmProcessor = this.getLLMProcessor(settings.modelType);
      let fullResponse = '';
      let chunkCount = 0;

      for await (const chunk of llmProcessor(enhancedRequest)) {
        chunkCount++;

        // Enhance chunks with additional metadata
        const enhancedChunk: EnhancedStreamChunk = {
          ...chunk,
          contextUsed: relevantMemories.length > 0,
          memoryRetrieved: enableMemoryIntegration,
          confidenceScore: this.calculateConfidenceScore(chunk, chunkCount),
          relevanceScore: this.calculateRelevanceScore(chunk, text, relevantMemories)
        };

        if (chunk.type === 'chunk' && chunk.content) {
          fullResponse += chunk.content;
        }

        yield enhancedChunk;

        // Early termination check for quality control
        if (chunk.type === 'error') {
          return;
        }
      }

      // Step 5: Post-processing and Follow-up Suggestions
      if (enableFollowUpSuggestions && fullResponse) {
        const followUpSuggestions = this.chainOfThoughtPrompts.generateFollowUpSuggestions(
          text,
          fullResponse,
          enhancedContext
        );

        if (followUpSuggestions.length > 0) {
          yield {
            type: 'chunk',
            content: '',
            isFollowUp: request.isFollowUp,
            id: request.id,
            followUpSuggestions
          };
        }
      }

      // Step 6: Update Conversation Memory
      if (enableMemoryIntegration) {
        // This would typically be handled by the calling code
        // but we can provide the enhanced context back
        yield {
          type: 'done',
          isFollowUp: request.isFollowUp,
          id: request.id,
          contextUsed: true,
          memoryRetrieved: true
        };
      }

      // Step 7: Performance Metrics
      const processingTime = Date.now() - startTime;
      console.log(`Enhanced LLM Processing completed in ${processingTime}ms`, {
        memoryRetrieved: relevantMemories.length,
        contextUsed: relevantMemories.length > 0,
        qualityLevel,
        responseCharacters: fullResponse.length
      });

    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Enhanced processing failed',
        isFollowUp: request.isFollowUp,
        id: request.id
      };
    }
  }

  /**
   * Self-correction and improvement capability
   */
  async* improvePreviousResponse(
    originalResponse: string,
    userFeedback: string,
    context: EnhancedConversationContext,
    settings: Settings
  ): AsyncGenerator<EnhancedStreamChunk> {
    const correctionPrompt = this.chainOfThoughtPrompts.buildSelfCorrectionPrompt(
      originalResponse,
      userFeedback
    );

    const correctionRequest: EnhancedProcessTextRequest = {
      text: correctionPrompt,
      mode: "free",
      settings,
      conversationContext: context,
      enableChainOfThought: true,
      enableMemoryIntegration: true,
      qualityLevel: "premium"
    };

    yield* this.processTextEnhanced(correctionRequest);
  }

  /**
   * Contextual conversation continuation
   */
  async* continueConversation(
    followUpQuestion: string,
    context: EnhancedConversationContext,
    settings: Settings,
    mode: string = "free"
  ): AsyncGenerator<EnhancedStreamChunk> {
    // Build enhanced context for follow-up
    const contextualPrompt = await this.memoryManager.buildContextualPrompt(
      context,
      followUpQuestion,
      mode
    );

    const followUpRequest: EnhancedProcessTextRequest = {
      text: followUpQuestion,
      context: contextualPrompt.contextPrompt,
      mode,
      settings: {
        ...settings,
        customPrompts: {
          ...settings.customPrompts,
          systemPrompts: {
            ...settings.customPrompts?.systemPrompts,
            [mode]: contextualPrompt.systemPrompt
          }
        }
      },
      conversationContext: context,
      isFollowUp: true,
      enableChainOfThought: true,
      enableMemoryIntegration: true,
      enableFollowUpSuggestions: true,
      qualityLevel: "enhanced"
    };

    yield* this.processTextEnhanced(followUpRequest);
  }

  /**
   * Adaptive Quality Control
   */
  private calculateConfidenceScore(chunk: StreamChunk, chunkIndex: number): number {
    // Simple heuristic for confidence based on content quality
    if (chunk.type !== 'chunk' || !chunk.content) return 0.5;

    let score = 0.7; // Base confidence

    // Higher confidence for structured content
    if (chunk.content.includes('**') || chunk.content.includes('##')) score += 0.1;
    
    // Higher confidence for detailed explanations
    if (chunk.content.length > 100) score += 0.1;
    
    // Lower confidence for very short responses
    if (chunk.content.length < 20) score -= 0.2;

    // Adjust based on position in stream
    if (chunkIndex < 3) score -= 0.1; // Initial chunks might be less confident
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private calculateRelevanceScore(
    chunk: StreamChunk,
    originalQuery: string,
    memories: Array<{ content: string; relevance: number; source: string }>
  ): number {
    if (chunk.type !== 'chunk' || !chunk.content) return 0.5;

    // Base relevance from memory integration
    const memoryRelevance = memories.length > 0 ? 
      memories.reduce((sum, m) => sum + m.relevance, 0) / memories.length : 0.5;

    // Query-response alignment
    const queryWords = originalQuery.toLowerCase().split(' ');
    const responseWords = chunk.content.toLowerCase().split(' ');
    const overlap = queryWords.filter(word => responseWords.includes(word)).length;
    const queryAlignment = queryWords.length > 0 ? overlap / queryWords.length : 0.5;

    return (memoryRelevance * 0.6) + (queryAlignment * 0.4);
  }

  /**
   * Get appropriate LLM processor based on model type
   * 
   * ROUTING STRATEGY:
   * - OpenAI: AI SDK streaming (cleaner, better error handling)
   * - xAI: AI SDK streaming (OpenAI-compatible API)
   * - Gemini: Native implementation (AI SDK Google provider can be added later)
   * - Local: Native implementation (custom server protocol)
   * - Basic: Native implementation (uses Gemini under the hood)
   * 
   * FALLBACK: If AI SDK fails, legacy processors are still available
   */
  private getLLMProcessor(modelType: string): (request: ProcessTextRequest) => AsyncGenerator<StreamChunk> {
    switch (modelType) {
      case 'openai':
        // Use AI SDK for OpenAI - cleaner streaming and error handling
        return processOpenAIWithAISDK;
      case 'xai':
        // Use AI SDK for xAI (Grok) - OpenAI-compatible API
        return processXAIWithAISDK;
      case 'gemini':
        // Use AI SDK for Gemini - cleaner streaming and error handling
        return processGeminiWithAISDK;
      case 'local':
        // Keep native implementation (custom server protocol)
        return processLocalText;
      case 'basic':
        // Keep native implementation
        return processBasicText;
      default:
        return processBasicText;
    }
  }

  /**
   * Response Quality Analysis
   */
  analyzeResponseQuality(response: string, context: EnhancedConversationContext): {
    coherence: number;
    completeness: number;
    contextRelevance: number;
    overallQuality: number;
  } {
    const coherence = this.analyzeCoherence(response);
    const completeness = this.analyzeCompleteness(response);
    const contextRelevance = this.analyzeContextRelevance(response, context);
    
    const overallQuality = (coherence + completeness + contextRelevance) / 3;

    return {
      coherence,
      completeness,
      contextRelevance,
      overallQuality
    };
  }

  private analyzeCoherence(response: string): number {
    // Simple coherence analysis
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 0.7;

    // Check for consistent structure and flow
    let coherenceScore = 0.7;

    // Higher score for structured responses
    if (response.includes('**') || response.includes('##') || response.includes('1.')) {
      coherenceScore += 0.2;
    }

    // Check for transition words/phrases
    const transitions = ['however', 'therefore', 'additionally', 'furthermore', 'in conclusion'];
    const hasTransitions = transitions.some(t => response.toLowerCase().includes(t));
    if (hasTransitions) coherenceScore += 0.1;

    return Math.min(1.0, coherenceScore);
  }

  private analyzeCompleteness(response: string): number {
    let completenessScore = 0.5;

    // Length-based completeness
    if (response.length > 200) completenessScore += 0.2;
    if (response.length > 500) completenessScore += 0.1;

    // Structure-based completeness
    if (response.includes('conclusion') || response.includes('summary')) completenessScore += 0.1;
    if (response.split('\n').length > 3) completenessScore += 0.1; // Multi-paragraph

    return Math.min(1.0, completenessScore);
  }

  private analyzeContextRelevance(response: string, context: EnhancedConversationContext): number {
    let relevanceScore = 0.6;

    // Entity mention relevance
    if (context.entities.length > 0) {
      const entityMentions = context.entities.filter(entity =>
        response.toLowerCase().includes(entity.name.toLowerCase())
      );
      relevanceScore += (entityMentions.length / context.entities.length) * 0.3;
    }

    // Context window relevance
    if (context.contextWindow.length > 0) {
      const recentMessage = context.contextWindow[context.contextWindow.length - 1];
      const commonWords = this.findCommonWords(response, recentMessage.content);
      if (commonWords > 0) relevanceScore += 0.1;
    }

    return Math.min(1.0, relevanceScore);
  }

  private findCommonWords(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    
    let commonCount = 0;
    words1.forEach(word => {
      if (words2.has(word)) commonCount++;
    });

    return commonCount;
  }
} 