import { useState, useCallback, useEffect } from "react";
import { Storage } from "@plasmohq/storage"
import type { ConversationContext, Entity } from "~types/messages";

export const useConversation = () => {
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    history: [],
    entities: [],
    activeEntity: null,
    currentTopic: null
  });

  useEffect(() => {
    const storage = new Storage();
    storage.get<ConversationContext>("conversationContext").then((savedContext) => {
      if (savedContext) {
        setConversationContext(savedContext);
      }
    });
  }, []);

  const updateConversation = useCallback((userMessage: string, assistantMessage?: string) => {
    setConversationContext(prev => {
      const newHistory = [
        ...prev.history,
        {
          role: "user" as const,
          content: userMessage,
          timestamp: Date.now()
        }
      ];

      if (assistantMessage) {
        newHistory.push({
          role: "assistant" as const,
          content: assistantMessage,
          timestamp: Date.now()
        });
      }

      const newContext = {
        ...prev,
        history: newHistory,
        lastQuestion: userMessage,
        lastAnswer: assistantMessage || prev.lastAnswer
      };

      const storage = new Storage();
      storage.set("conversationContext", newContext);

      return newContext;
    });
  }, []);

  const clearConversation = useCallback(() => {
    setConversationContext({
      history: [],
      entities: [],
      activeEntity: null,
      currentTopic: null,
      lastQuestion: undefined,
      lastAnswer: undefined,
    });
    const storage = new Storage();
    storage.remove("conversationContext");
  }, []);

  return { conversationContext, updateConversation, clearConversation };
}; 