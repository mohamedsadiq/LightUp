/**
 * UnifiedAIService - Single Entry Point for All AI Operations
 * 
 * PRIVACY-FIRST DESIGN:
 * - Session-only memory (no persistence)
 * - Data cleared when popup closes
 * - No entity extraction or tracking
 * - Minimal context retention
 * 
 * FEATURES:
 * - Single entry point for all AI requests
 * - Automatic provider selection from settings
 * - Session-only context (privacy-respecting)
 * - Streaming with proper backpressure
 * - Unified error handling
 * 
 * @author LightUp Team
 * @since 2024-12
 */

import type { ProcessTextRequest, StreamChunk } from "~types/messages";
import type { Settings, Mode } from "~types/settings";
import { sessionMemory } from "~services/conversation/SessionMemory";
import { SYSTEM_PROMPTS } from "~utils/constants";
import {
    processOpenAIWithAISDK,
    processXAIWithAISDK,
    processGeminiWithAISDK
} from "./ai-sdk-streaming";
import { processLocalText } from "./local";
import { processBasicText } from "./basic";
import { processGeminiText } from "./gemini"; // Native Gemini implementation

// ============================================================================
// Types
// ============================================================================

export interface AIServiceRequest {
    text: string;
    mode: Mode;
    settings: Settings;
    domain?: string; // For conversation isolation
    sessionKey?: string; // Explicit session key (domain:tabId)
    isFollowUp?: boolean;
    context?: string; // Additional context (e.g., selected text)
    connectionId?: string;
    id?: string;
}

export interface AIServiceConfig {
    enableSessionMemory: boolean; // Session-only, privacy-respecting
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: AIServiceConfig = {
    enableSessionMemory: true, // Memory only during active session
};

// ============================================================================
// UnifiedAIService Class
// ============================================================================

export class UnifiedAIService {
    private config: AIServiceConfig;
    private initialized: boolean = false;
    private currentSessionKey: string | null = null;

    constructor(config?: Partial<AIServiceConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // --------------------------------------------------------------------------
    // Initialization
    // --------------------------------------------------------------------------

    /**
     * Initialize service for a session (domain:tabId)
     * Session-only: no data persisted to disk
     */
    async initialize(sessionKey: string, _settings: Settings): Promise<void> {
        if (this.config.enableSessionMemory) {
            sessionMemory.getSessionByKey(sessionKey);
        }
        this.currentSessionKey = sessionKey;
        this.initialized = true;
        console.log(`[UnifiedAIService] Session started for: ${sessionKey} (no data persisted)`);
    }

    // --------------------------------------------------------------------------
    // Main Entry Point
    // --------------------------------------------------------------------------

    /**
     * Process text with AI - main entry point
     * Handles all providers, context management, and streaming
     */
    async* processText(request: AIServiceRequest): AsyncGenerator<StreamChunk> {
        const { text, mode, settings, isFollowUp, context } = request;
        const sessionKey = this.getSessionKey(request);

        try {
            // 1. Add user message to session memory (not persisted)
            if (this.config.enableSessionMemory && this.initialized && sessionKey) {
                sessionMemory.addUserMessageForKey(sessionKey, text);
            }

            // 2. Build enhanced request with context
            const enhancedRequest = this.buildEnhancedRequest(request);

            // 3. Route to appropriate provider
            const processor = this.getProcessor(settings.modelType);
            let fullResponse = "";

            // 4. Stream response
            for await (const chunk of processor(enhancedRequest)) {
                if (chunk.type === "chunk" && chunk.content) {
                    fullResponse += chunk.content;
                }
                yield chunk;
            }

            // 5. Store assistant response in session (not persisted)
            if (this.config.enableSessionMemory && this.initialized && fullResponse && sessionKey) {
                sessionMemory.addAssistantMessageForKey(sessionKey, fullResponse);
            }

        } catch (error) {
            console.error("[UnifiedAIService] Processing error:", error);
            yield {
                type: "error" as const,
                error: error instanceof Error ? error.message : "AI processing failed",
            };
        }
    }

    // --------------------------------------------------------------------------
    // Request Building
    // --------------------------------------------------------------------------

    /**
     * Build enhanced request with context injected
     */
    private buildEnhancedRequest(request: AIServiceRequest): ProcessTextRequest {
        const { text, mode, settings, isFollowUp, context, connectionId, id } = request;
        const sessionKey = this.getSessionKey(request);

        // Get session context (not persisted, privacy-first)
        let conversationContext = "";
        if (this.config.enableSessionMemory && this.initialized && sessionKey) {
            conversationContext = sessionMemory.getContextStringForKey(sessionKey);
        }

        // Build enhanced text with context
        let enhancedText = text;
        if (conversationContext && !isFollowUp) {
            // For new questions, include context as background
            enhancedText = text;
            // Context will be added to system prompt
        } else if (isFollowUp && context) {
            // For follow-ups, include original context
            enhancedText = text;
        }

        // Build settings with enhanced system prompt
        // Pass isFollowUp to control how context is presented to AI
        const enhancedSettings = this.buildEnhancedSettings(settings, mode, conversationContext, isFollowUp || false);

        return {
            text: enhancedText,
            mode,
            settings: enhancedSettings,
            isFollowUp,
            context: context || conversationContext,
            connectionId,
            id,
        };
    }

    /**
     * Build settings with context-aware system prompt
     */
    private buildEnhancedSettings(
        settings: Settings,
        mode: Mode,
        conversationContext: string,
        isFollowUp: boolean
    ): ProcessTextRequest["settings"] {
        // Get base system prompt - use custom if set, otherwise fall back to default SYSTEM_PROMPTS
        const baseSystemPrompt = settings.customPrompts?.systemPrompts?.[mode] 
            || SYSTEM_PROMPTS[mode] 
            || SYSTEM_PROMPTS.free 
            || "";

        // Enhance with conversation context
        let enhancedSystemPrompt = baseSystemPrompt;
        if (conversationContext) {
            if (isFollowUp) {
                // For follow-up questions: can reference the ongoing conversation naturally
                enhancedSystemPrompt = `${baseSystemPrompt}

## Conversation Context
${conversationContext}

This is a follow-up question. You may naturally reference what was just discussed.`;
            } else {
                // For NEW selections: use context silently, NEVER mention past interactions
                enhancedSystemPrompt = `${baseSystemPrompt}

## Background Context (INTERNAL USE ONLY)
${conversationContext}

IMPORTANT INSTRUCTIONS:
- Use this background to give better answers, but NEVER explicitly mention or reference it.
- Do NOT say things like "as we discussed", "given your interest in", "based on our previous conversation".
- Do NOT reference the user's name from past context.
- Treat each new text selection as a fresh, standalone request.
- Answer directly and naturally as if this is the first interaction.`;
            }
        }

        return {
            serverUrl: settings.serverUrl || "",
            apiKey: settings.apiKey || "",
            geminiApiKey: settings.geminiApiKey,
            xaiApiKey: settings.xaiApiKey,
            geminiModel: settings.geminiModel,
            grokModel: settings.grokModel,
            openaiModel: settings.openaiModel,
            localModel: settings.localModel as any,
            maxTokens: settings.maxTokens,
            temperature: settings.temperature,
            translationSettings: settings.translationSettings,
            aiResponseLanguage: settings.aiResponseLanguage,
            modelType: settings.modelType,
            customPrompts: enhancedSystemPrompt
                ? {
                    ...settings.customPrompts,
                    systemPrompts: {
                        ...settings.customPrompts?.systemPrompts,
                        [mode]: enhancedSystemPrompt,
                    },
                }
                : settings.customPrompts,
        };
    }

    // --------------------------------------------------------------------------
    // Provider Routing
    // --------------------------------------------------------------------------

    /**
     * Get processor for model type
     */
    private getProcessor(modelType: string): (request: ProcessTextRequest) => AsyncGenerator<StreamChunk> {
        switch (modelType) {
            case "openai":
                return processOpenAIWithAISDK as (request: ProcessTextRequest) => AsyncGenerator<StreamChunk>;
            case "xai":
            case "grok":
                return processXAIWithAISDK as (request: ProcessTextRequest) => AsyncGenerator<StreamChunk>;
            case "gemini":
                // Use native Gemini implementation instead of AI SDK (AI SDK has streaming issues)
                console.log(`[UnifiedAIService] Using native Gemini implementation for custom API key`);
                return processGeminiText as (request: ProcessTextRequest) => AsyncGenerator<StreamChunk>;
            case "local":
                return processLocalText as (request: ProcessTextRequest) => AsyncGenerator<StreamChunk>;
            case "basic":
                return processBasicText as (request: ProcessTextRequest) => AsyncGenerator<StreamChunk>;
            default:
                console.warn(`[UnifiedAIService] Unknown model type: ${modelType}, falling back to basic`);
                return processBasicText as (request: ProcessTextRequest) => AsyncGenerator<StreamChunk>;
        }
    }

    // --------------------------------------------------------------------------
    // Context Management
    // --------------------------------------------------------------------------

    /**
     * Clear session memory (user-triggered)
     */
    clearContext(): void {
        if (!this.config.enableSessionMemory || !this.currentSessionKey) return;

        sessionMemory.clearSessionByKey(this.currentSessionKey);
        console.log("[UnifiedAIService] Session memory cleared");
    }

    /**
     * Check if session has context
     */
    hasContext(): boolean {
        if (!this.config.enableSessionMemory || !this.currentSessionKey) return false;
        return sessionMemory.hasContextForKey(this.currentSessionKey);
    }

    /**
     * Get message count in current session
     */
    getMessageCount(): number {
        if (!this.currentSessionKey) return 0;
        return sessionMemory.getMessageCountForKey(this.currentSessionKey);
    }

    /**
     * Get current context usage metrics
     * Returns { usedTokens: number, totalTokens: number, isDistilled: boolean }
     */
    getContextMetrics(): { usedTokens: number; totalTokens: number; isDistilled: boolean } {
        if (!this.currentSessionKey) {
            return { usedTokens: 0, totalTokens: 0, isDistilled: false };
        }
        return sessionMemory.getMetricsForKey(this.currentSessionKey);
    }

    // --------------------------------------------------------------------------
    // Utilities
    // --------------------------------------------------------------------------

    /**
     * Check if service is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get current session key
     */
    getCurrentSessionKey(): string | null {
        return this.currentSessionKey;
    }

    /**
     * Resolve session key from request or current state
     */
    private getSessionKey(request: AIServiceRequest): string | null {
        return request.sessionKey || request.domain || this.currentSessionKey || null;
    }

    /**
     * Update settings (e.g., when user changes provider)
     * Note: Session memory doesn't need settings updates
     */
    updateSettings(_settings: Settings): void {
        // Session memory is stateless regarding settings
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const unifiedAIService = new UnifiedAIService();

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Quick process function for simple use cases
 * Handles initialization automatically
 */
export async function* processWithUnifiedAI(
    request: AIServiceRequest
): AsyncGenerator<StreamChunk> {
    const service = unifiedAIService;

    // Auto-initialize if needed
    const sessionKey = request.domain;
    if (!service.isInitialized() && sessionKey) {
        await service.initialize(sessionKey, request.settings);
    }

    yield* service.processText(request);
}
