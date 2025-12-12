import { useState, useCallback, useEffect, useRef } from "react";
import { useSettings } from "./useSettings";
import { useConversation } from "./useConversation";
import { createLangChainMemoryAdapter, type LangChainMemoryAdapter } from "~services/memory/LangChainMemoryAdapter";
import type { ConversationContext } from "~types/messages";

/**
 * Enhanced Memory Hook - Integrates LangChain memory management with existing conversation system
 * Provides seamless upgrade path from current memory to LangChain-powered memory
 */

export interface EnhancedMemoryState {
  isEnabled: boolean;
  memoryStats: {
    messageCount: number;
    tokenCount: number;
    hasSummary: boolean;
    memoryType: string;
  };
  isLoading: boolean;
  error: string | null;
}

export interface UseEnhancedMemoryReturn {
  // State
  memoryState: EnhancedMemoryState;
  
  // Actions
  enhancePrompt: (userInput: string, context?: ConversationContext) => Promise<{
    enhancedPrompt: string;
    contextInfo: {
      hasMemory: boolean;
      messageCount: number;
      tokenCount: number;
    };
  }>;
  addConversationTurn: (userInput: string, aiResponse: string) => Promise<void>;
  clearMemory: () => Promise<void>;
  toggleMemory: (enabled: boolean) => void;
  
  // Utilities
  exportMemoryToContext: () => Promise<Partial<ConversationContext>>;
  getMemoryStats: () => Promise<EnhancedMemoryState['memoryStats']>;
}

export function useEnhancedMemory(): UseEnhancedMemoryReturn {
  const { settings } = useSettings();
  const { conversationContext } = useConversation();
  
  // State
  const [memoryState, setMemoryState] = useState<EnhancedMemoryState>({
    isEnabled: false, // Start disabled for gradual rollout
    memoryStats: {
      messageCount: 0,
      tokenCount: 0,
      hasSummary: false,
      memoryType: 'none'
    },
    isLoading: false,
    error: null
  });

  // Refs
  const memoryAdapterRef = useRef<LangChainMemoryAdapter | null>(null);

  // Initialize memory adapter when settings change
  useEffect(() => {
    if (memoryState.isEnabled && settings?.apiKey) {
      try {
        memoryAdapterRef.current = createLangChainMemoryAdapter(settings, {
          maxTokenLimit: Math.floor((settings.maxTokens || 2048) * 0.6), // Reserve 40% for response
          enableSummarization: true,
          returnMessages: true
        });
        
        // Load existing conversation context
        if (conversationContext) {
          memoryAdapterRef.current.loadFromConversationContext(conversationContext);
        }
        
        updateMemoryStats();
      } catch (error) {
        setMemoryState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize memory'
        }));
      }
    } else {
      memoryAdapterRef.current = null;
    }
  }, [memoryState.isEnabled, settings?.apiKey, settings?.maxTokens]);

  // Update memory stats
  const updateMemoryStats = useCallback(async () => {
    if (!memoryAdapterRef.current) {
      setMemoryState(prev => ({
        ...prev,
        memoryStats: {
          messageCount: 0,
          tokenCount: 0,
          hasSummary: false,
          memoryType: 'none'
        }
      }));
      return;
    }

    try {
      const stats = await memoryAdapterRef.current.getMemoryStats();
      setMemoryState(prev => ({
        ...prev,
        memoryStats: stats,
        error: null
      }));
    } catch (error) {
      console.error('[Enhanced Memory] Error updating stats:', error);
    }
  }, []);

  // Enhance prompt with memory context
  const enhancePrompt = useCallback(async (
    userInput: string, 
    context?: ConversationContext
  ): Promise<{
    enhancedPrompt: string;
    contextInfo: {
      hasMemory: boolean;
      messageCount: number;
      tokenCount: number;
    };
  }> => {
    // If memory is disabled, return original prompt
    if (!memoryState.isEnabled || !memoryAdapterRef.current || !settings) {
      return {
        enhancedPrompt: userInput,
        contextInfo: {
          hasMemory: false,
          messageCount: 0,
          tokenCount: 0
        }
      };
    }

    try {
      setMemoryState(prev => ({ ...prev, isLoading: true }));

      // Load context if provided
      if (context) {
        await memoryAdapterRef.current.loadFromConversationContext(context);
      }

      // Get enhanced context
      const memoryContext = await memoryAdapterRef.current.getConversationContext();
      
      // Build enhanced prompt
      let enhancedPrompt = userInput;
      
      if (memoryContext.summary) {
        enhancedPrompt = `CONVERSATION SUMMARY: ${memoryContext.summary}\n\nCURRENT QUESTION: ${userInput}`;
      } else if (memoryContext.messages.length > 0) {
        const recentMessages = memoryContext.messages.slice(-3); // Last 3 messages for context
        const contextStr = recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        enhancedPrompt = `RECENT CONVERSATION:\n${contextStr}\n\nCURRENT QUESTION: ${userInput}`;
      }

      const contextInfo = {
        hasMemory: memoryContext.messages.length > 0 || !!memoryContext.summary,
        messageCount: memoryContext.messages.length,
        tokenCount: memoryContext.tokenCount
      };

      return { enhancedPrompt, contextInfo };

    } catch (error) {
      console.error('[Enhanced Memory] Error enhancing prompt:', error);
      setMemoryState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to enhance prompt'
      }));
      
      return {
        enhancedPrompt: userInput,
        contextInfo: {
          hasMemory: false,
          messageCount: 0,
          tokenCount: 0
        }
      };
    } finally {
      setMemoryState(prev => ({ ...prev, isLoading: false }));
    }
  }, [memoryState.isEnabled, settings]);

  // Add conversation turn to memory
  const addConversationTurn = useCallback(async (userInput: string, aiResponse: string) => {
    if (!memoryState.isEnabled || !memoryAdapterRef.current) {
      return;
    }

    try {
      await memoryAdapterRef.current.addConversationTurn(userInput, aiResponse);
      await updateMemoryStats();
    } catch (error) {
      console.error('[Enhanced Memory] Error adding conversation turn:', error);
      setMemoryState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add conversation turn'
      }));
    }
  }, [memoryState.isEnabled, updateMemoryStats]);

  // Clear memory
  const clearMemory = useCallback(async () => {
    if (!memoryAdapterRef.current) {
      return;
    }

    try {
      await memoryAdapterRef.current.clearMemory();
      await updateMemoryStats();
    } catch (error) {
      console.error('[Enhanced Memory] Error clearing memory:', error);
      setMemoryState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear memory'
      }));
    }
  }, [updateMemoryStats]);

  // Toggle memory on/off
  const toggleMemory = useCallback((enabled: boolean) => {
    setMemoryState(prev => ({
      ...prev,
      isEnabled: enabled,
      error: null
    }));
  }, []);

  // Export memory to conversation context
  const exportMemoryToContext = useCallback(async (): Promise<Partial<ConversationContext>> => {
    if (!memoryAdapterRef.current) {
      return { history: [] };
    }

    try {
      return await memoryAdapterRef.current.exportToConversationContext();
    } catch (error) {
      console.error('[Enhanced Memory] Error exporting memory:', error);
      return { history: [] };
    }
  }, []);

  // Get current memory stats
  const getMemoryStats = useCallback(async (): Promise<EnhancedMemoryState['memoryStats']> => {
    if (!memoryAdapterRef.current) {
      return {
        messageCount: 0,
        tokenCount: 0,
        hasSummary: false,
        memoryType: 'none'
      };
    }

    try {
      return await memoryAdapterRef.current.getMemoryStats();
    } catch (error) {
      console.error('[Enhanced Memory] Error getting memory stats:', error);
      return {
        messageCount: 0,
        tokenCount: 0,
        hasSummary: false,
        memoryType: 'error'
      };
    }
  }, []);

  return {
    memoryState,
    enhancePrompt,
    addConversationTurn,
    clearMemory,
    toggleMemory,
    exportMemoryToContext,
    getMemoryStats
  };
}

/**
 * Higher-order hook that enhances existing conversation flow with LangChain memory
 */
export function useConversationWithEnhancedMemory() {
  const conversation = useConversation();
  const enhancedMemory = useEnhancedMemory();

  // Enhanced process text that uses memory
  const processTextWithMemory = useCallback(async (
    text: string,
    options: { useMemory?: boolean } = {}
  ): Promise<{ enhancedPrompt: string; contextInfo: any }> => {
    const { useMemory = enhancedMemory.memoryState.isEnabled } = options;

    if (useMemory) {
      // Enhance prompt with memory context
      const result = await enhancedMemory.enhancePrompt(
        text,
        conversation.conversationContext
      );

      console.log(`[Enhanced Memory] Using memory context: ${result.contextInfo.messageCount} messages, ${result.contextInfo.tokenCount} tokens`);
      
      return result;
    } else {
      // Return original prompt
      return {
        enhancedPrompt: text,
        contextInfo: {
          hasMemory: false,
          messageCount: 0,
          tokenCount: 0
        }
      };
    }
  }, [conversation, enhancedMemory]);

  // Enhanced add to conversation that updates memory
  const addToConversationWithMemory = useCallback(async (
    userInput: string,
    aiResponse: string
  ) => {
    // Add to original conversation system
    conversation.updateConversation(userInput, aiResponse);

    // Also add to enhanced memory if enabled
    if (enhancedMemory.memoryState.isEnabled) {
      await enhancedMemory.addConversationTurn(userInput, aiResponse);
    }
  }, [conversation, enhancedMemory]);

  return {
    ...conversation,
    ...enhancedMemory,
    processTextWithMemory,
    addToConversationWithMemory
  };
} 