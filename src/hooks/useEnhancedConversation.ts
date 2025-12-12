import { useState, useCallback, useEffect, useRef } from "react";
import { Storage } from "@plasmohq/storage";
import { ConversationMemoryManager } from "../services/conversation/ConversationMemoryManager";
import type { 
  EnhancedConversationContext, 
  ConversationSummary 
} from "../services/conversation/ConversationMemoryManager";
import type { Settings } from "~types/settings";
import type { Entity } from "~types/messages";

interface UseEnhancedConversationReturn {
  conversationContext: EnhancedConversationContext;
  updateConversation: (userMessage: string, assistantMessage?: string, settings?: Settings) => Promise<void>;
  clearConversation: () => void;
  getContextualPrompt: (query: string, mode: string, settings: Settings) => Promise<{ systemPrompt: string; contextPrompt: string }>;
  retrieveRelevantContext: (query: string) => Promise<Array<{ content: string; relevance: number; source: string }>>;
  provideFeedback: (feedback: { type: 'like' | 'dislike'; reason?: string }, responseContent: string) => void;
  conversationStats: {
    totalMessages: number;
    entitiesTracked: number;
    hasLongTermMemory: boolean;
    hasSummary: boolean;
  };
}

export const useEnhancedConversation = (settings: Settings): UseEnhancedConversationReturn => {
  const [conversationContext, setConversationContext] = useState<EnhancedConversationContext>({
    history: [],
    entities: [],
    activeEntity: null,
    currentTopic: null,
    contextWindow: [],
    longTermMemory: [],
    userPreferences: {
      interests: []
    }
  });

  const memoryManagerRef = useRef<ConversationMemoryManager>();
  const storageKey = "enhancedConversationContext";

  // Initialize memory manager
  useEffect(() => {
    memoryManagerRef.current = new ConversationMemoryManager(settings, {
      maxBufferSize: 25,
      summaryTriggerSize: 20,
      entityTrackingEnabled: true,
      contextWindowSize: 12,
      enableConversationSummary: true
    });
  }, [settings]);

  // Load saved conversation context
  useEffect(() => {
    const loadConversation = async () => {
      const storage = new Storage();
      const savedContext = await storage.get<EnhancedConversationContext>(storageKey);
      
      if (savedContext) {
        // Ensure proper structure for backward compatibility
        const migratedContext: EnhancedConversationContext = {
          history: savedContext.history || [],
          entities: savedContext.entities || [],
          activeEntity: savedContext.activeEntity || null,
          currentTopic: savedContext.currentTopic || null,
          contextWindow: savedContext.contextWindow || [],
          longTermMemory: savedContext.longTermMemory || [],
          userPreferences: {
            interests: [],
            ...savedContext.userPreferences
          },
          summary: savedContext.summary,
          lastQuestion: savedContext.lastQuestion,
          lastAnswer: savedContext.lastAnswer
        };
        
        setConversationContext(migratedContext);
      }
    };

    loadConversation();
  }, []);

  // Auto-save conversation context
  const saveConversationContext = useCallback(async (context: EnhancedConversationContext) => {
    const storage = new Storage();
    await storage.set(storageKey, context);
  }, []);

  /**
   * Enhanced conversation update with advanced memory management
   */
  const updateConversation = useCallback(async (
    userMessage: string, 
    assistantMessage?: string,
    currentSettings?: Settings
  ) => {
    if (!memoryManagerRef.current) return;

    const activeSettings = currentSettings || settings;

    // Process the conversation updates
    const processUpdates = async (prev: EnhancedConversationContext) => {
      let updatedContext = { ...prev };

      // Process user message
      const userMessageProcessed = {
        role: "user" as const,
        content: userMessage
      };

      updatedContext = await memoryManagerRef.current!.manageConversationBuffer(
        updatedContext,
        userMessageProcessed
      );

      // Update traditional history for backward compatibility
      const newHistoryEntry = {
        role: "user" as const,
        content: userMessage,
        timestamp: Date.now()
      };

      updatedContext.history = [...updatedContext.history, newHistoryEntry];
      updatedContext.lastQuestion = userMessage;

      // Process assistant message if provided
      if (assistantMessage) {
        const assistantMessageProcessed = {
          role: "assistant" as const,
          content: assistantMessage
        };

        updatedContext = await memoryManagerRef.current!.manageConversationBuffer(
          updatedContext,
          assistantMessageProcessed
        );

        // Update traditional history
        const assistantHistoryEntry = {
          role: "assistant" as const,
          content: assistantMessage,
          timestamp: Date.now()
        };

        updatedContext.history = [...updatedContext.history, assistantHistoryEntry];
        updatedContext.lastAnswer = assistantMessage;
      }

      return updatedContext;
    };

    // Update state and save
    const updatedContext = await processUpdates(conversationContext);
    setConversationContext(updatedContext);
    await saveConversationContext(updatedContext);
  }, [settings, saveConversationContext, conversationContext]);

  /**
   * Get contextual prompts with advanced memory integration
   */
  const getContextualPrompt = useCallback(async (
    query: string, 
    mode: string, 
    currentSettings: Settings
  ): Promise<{ systemPrompt: string; contextPrompt: string }> => {
    if (!memoryManagerRef.current) {
      return { systemPrompt: "", contextPrompt: query };
    }

    // Retrieve relevant context from memory
    const relevantContext = await memoryManagerRef.current.retrieveRelevantContext(
      query, 
      conversationContext
    );

    // Build contextual prompts
    const prompts = memoryManagerRef.current.buildContextualPrompt(
      conversationContext,
      query,
      mode
    );

    // Enhance context prompt with retrieved memories
    let enhancedContextPrompt = prompts.contextPrompt;

    if (relevantContext.length > 0) {
      enhancedContextPrompt += `\n\nRELEVANT CONTEXT FROM MEMORY:`;
      relevantContext.forEach((context, index) => {
        enhancedContextPrompt += `\n${index + 1}. [${context.source}] ${context.content}`;
      });
    }

    return {
      systemPrompt: prompts.systemPrompt,
      contextPrompt: enhancedContextPrompt
    };
  }, [conversationContext]);

  /**
   * Retrieve relevant context for a query
   */
  const retrieveRelevantContext = useCallback(async (
    query: string
  ): Promise<Array<{ content: string; relevance: number; source: string }>> => {
    if (!memoryManagerRef.current) return [];

    return await memoryManagerRef.current.retrieveRelevantContext(query, conversationContext);
  }, [conversationContext]);

  /**
   * Provide feedback to improve conversation quality
   */
  const provideFeedback = useCallback((
    feedback: { type: 'like' | 'dislike'; reason?: string },
    responseContent: string
  ) => {
    if (!memoryManagerRef.current) return;

    setConversationContext(prev => {
      const updatedContext = memoryManagerRef.current!.updateUserPreferences(
        prev,
        feedback,
        responseContent
      );

      // Save updated preferences
      saveConversationContext(updatedContext);

      return updatedContext;
    });
  }, [saveConversationContext]);

  /**
   * Clear conversation with smart cleanup
   */
  const clearConversation = useCallback(async () => {
    // Before clearing, optionally save important information to long-term memory
    if (conversationContext.contextWindow.length > 5 && memoryManagerRef.current) {
      try {
        // Create a final summary for long-term storage
        const finalSummary = await memoryManagerRef.current['createConversationSummary'](
          conversationContext.contextWindow
        );

        const clearedContext: EnhancedConversationContext = {
          history: [],
          entities: [],
          activeEntity: null,
          currentTopic: null,
          contextWindow: [],
          longTermMemory: [
            ...conversationContext.longTermMemory,
            {
              topic: `Conversation ended ${new Date().toLocaleString()}`,
              summary: finalSummary.summary,
              entities: finalSummary.entities,
              lastAccessed: Date.now()
            }
          ],
          userPreferences: conversationContext.userPreferences // Preserve learned preferences
        };

        setConversationContext(clearedContext);
        await saveConversationContext(clearedContext);
      } catch (error) {
        console.warn('Error creating final summary:', error);
        
        // Fallback: Clear without summary
        const clearedContext: EnhancedConversationContext = {
          history: [],
          entities: [],
          activeEntity: null,
          currentTopic: null,
          contextWindow: [],
          longTermMemory: conversationContext.longTermMemory,
          userPreferences: conversationContext.userPreferences
        };

        setConversationContext(clearedContext);
        await saveConversationContext(clearedContext);
      }
    } else {
      // Simple clear for short conversations
      const clearedContext: EnhancedConversationContext = {
        history: [],
        entities: [],
        activeEntity: null,
        currentTopic: null,
        contextWindow: [],
        longTermMemory: conversationContext.longTermMemory,
        userPreferences: conversationContext.userPreferences
      };

      setConversationContext(clearedContext);
      
      const storage = new Storage();
      await storage.set(storageKey, clearedContext);
    }
  }, [conversationContext, saveConversationContext]);

  /**
   * Conversation statistics for debugging and user insights
   */
  const conversationStats = {
    totalMessages: conversationContext.contextWindow.length,
    entitiesTracked: conversationContext.entities.length,
    hasLongTermMemory: conversationContext.longTermMemory.length > 0,
    hasSummary: !!conversationContext.summary
  };

  return {
    conversationContext,
    updateConversation,
    clearConversation,
    getContextualPrompt,
    retrieveRelevantContext,
    provideFeedback,
    conversationStats
  };
}; 