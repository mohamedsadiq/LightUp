import { useState, useCallback, useEffect } from "react";
import { Storage } from "@plasmohq/storage"
import type { ConversationContext } from "~types/messages";

interface Entity {
  name: string;
  type: string;
  mentions: number;
  lastMentionedIndex: number;
  firstMentionedIndex: number;
  description?: string;
  relationships?: { [key: string]: string };
  metadata: {
    category: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    contextValidity: number;
    attributes: Record<string, any>;
  };
}

export const useConversation = () => {
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    history: [],
    entities: [],
    activeEntity: null,
    currentTopic: null
  });

  // Enhanced context loading with smart filtering
  useEffect(() => {
    const storage = new Storage();
    storage.get<ConversationContext>("conversationContext").then((savedContext) => {
      if (savedContext) {
        // Filter out expired or low-importance entities
        const now = Date.now();
        const validEntities = savedContext.entities.filter(entity => {
          const isValid = entity.metadata?.contextValidity > now;
          const isImportant = entity.metadata?.importance === 'critical' || entity.metadata?.importance === 'high';
          const isRecentlyMentioned = now - entity.lastMentionedIndex < 30 * 60 * 1000; // 30 minutes
          return isValid || isImportant || isRecentlyMentioned;
        });

        setConversationContext({
          ...savedContext,
          entities: validEntities
        });
      }
    });
  }, []);

  const updateConversation = useCallback((userMessage: string, assistantMessage?: string) => {
    setConversationContext(prev => {
      // Analyze message importance and context
      const analyzeMessage = (message: string) => {
        const patterns = {
          question: /^(what|who|where|when|why|how|can|could|would|should|is|are|was|were)/i,
          command: /^(show|tell|explain|describe|analyze|compare|list|find|search|help)/i,
          reference: /(this|that|these|those|it|they|he|she|him|her)/i,
          topic: /(about|regarding|concerning|discussing|talking about)/i
        };

        return {
          requiresContext: patterns.reference.test(message),
          isQuestion: patterns.question.test(message),
          isCommand: patterns.command.test(message),
          hasTopic: patterns.topic.test(message),
          importance: patterns.question.test(message) ? 'high' : 'medium'
        };
      };

      const userMessageAnalysis = analyzeMessage(userMessage);
      
      const newHistory = [
        ...prev.history,
        {
          role: "user",
          content: userMessage,
          timestamp: Date.now(),
          metadata: {
            importance: userMessageAnalysis.importance,
            requiresContext: userMessageAnalysis.requiresContext,
            type: userMessageAnalysis.isQuestion ? 'question' : 'statement'
          }
        }
      ];

      if (assistantMessage) {
        const assistantAnalysis = analyzeMessage(assistantMessage);
        newHistory.push({
          role: "assistant",
          content: assistantMessage,
          timestamp: Date.now(),
          metadata: {
            importance: assistantAnalysis.importance,
            requiresContext: false,
            type: 'answer'
          }
        });
      }

      // Enhanced entity detection with better pattern matching
      const detectEntities = () => {
        const recentMessages = newHistory.slice(-6);
        const allContent = recentMessages.map(msg => msg.content).join(" ");
        
        // Enhanced patterns for various types of entities
        const patterns = [
          // Names and proper nouns
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
          
          // Concepts and topics
          /(?:about|regarding|concerning)\s+([a-z]+(?:\s+[a-z]+)*)/gi,
          
          // Technical terms
          /\b([A-Za-z]+(?:\.[A-Za-z]+)+)\b/g,
          
          // Quoted phrases
          /"([^"]+)"/g,
          
          // Numbers and measurements
          /\b(\d+(?:\.\d+)?(?:\s*[a-zA-Z]+)?)\b/g
        ];

        const entities: Entity[] = [...prev.entities];
        let activeEntity = prev.activeEntity;
        let currentTopic = prev.currentTopic;

        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(allContent)) !== null) {
            const entityName = match[1];
            const context = match.input.substring(
              Math.max(0, match.index - 50),
              Math.index + match[0].length + 50
            );

            const entityType = determineEntityType(entityName, context);
            const importance = calculateImportance(entityName, context, userMessageAnalysis);

            const existingEntity = entities.find(e => 
              e.name.toLowerCase() === entityName.toLowerCase()
            );

            if (existingEntity) {
              updateExistingEntity(existingEntity, newHistory.length, importance);
            } else {
              const newEntity = createNewEntity(
                entityName,
                entityType,
                newHistory.length,
                importance,
                context
              );
              entities.push(newEntity);
            }
          }
        });

        return {
          entities,
          activeEntity: determineActiveEntity(entities, userMessage),
          currentTopic: determineCurrentTopic(entities, userMessageAnalysis)
        };
      };

      const { entities, activeEntity, currentTopic } = detectEntities();

      // Update context with smart pruning
      const newContext = {
        ...prev,
        history: pruneHistory(newHistory),
        entities: pruneEntities(entities),
        activeEntity,
        currentTopic,
        lastQuestion: userMessageAnalysis.isQuestion ? userMessage : prev.lastQuestion,
        lastAnswer: assistantMessage || prev.lastAnswer
      };

      // Persist to storage
      const storage = new Storage();
      storage.set("conversationContext", newContext);

      return newContext;
    });
  }, []);

  // Helper functions
  const determineEntityType = (name: string, context: string): string => {
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(name)) return 'proper_noun';
    if (/^\d+(?:\.\d+)?(?:\s*[a-zA-Z]+)?$/.test(name)) return 'measurement';
    if (/^[A-Za-z]+(?:\.[A-Za-z]+)+$/.test(name)) return 'technical';
    if (/"[^"]+"/.test(name)) return 'quoted_phrase';
    return 'concept';
  };

  const calculateImportance = (name: string, context: string, messageAnalysis: any) => {
    if (messageAnalysis.isQuestion && context.includes(name)) return 'high';
    if (messageAnalysis.hasTopic && context.includes(name)) return 'high';
    if (name.length > 20) return 'medium';
    return 'low';
  };

  const updateExistingEntity = (entity: Entity, messageIndex: number, importance: string) => {
    entity.mentions++;
    entity.lastMentionedIndex = messageIndex;
    if (importance === 'high') {
      entity.metadata.importance = 'high';
      entity.metadata.contextValidity = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    }
  };

  const createNewEntity = (name: string, type: string, messageIndex: number, importance: string, context: string): Entity => ({
    name,
    type,
    mentions: 1,
    firstMentionedIndex: messageIndex,
    lastMentionedIndex: messageIndex,
    metadata: {
      category: type,
      importance: importance as 'critical' | 'high' | 'medium' | 'low',
      contextValidity: Date.now() + 24 * 60 * 60 * 1000,
      attributes: {}
    }
  });

  const pruneHistory = (history: any[]) => {
    const now = Date.now();
    return history.filter(entry => {
      const age = now - entry.timestamp;
      if (entry.metadata.importance === 'high') return true;
      if (age < 30 * 60 * 1000) return true; // Keep last 30 minutes
      if (entry.metadata.requiresContext) return true;
      return false;
    });
  };

  const pruneEntities = (entities: Entity[]) => {
    const now = Date.now();
    return entities.filter(entity => {
      const isValid = entity.metadata.contextValidity > now;
      const isImportant = entity.metadata.importance === 'high' || entity.metadata.importance === 'critical';
      const isRecent = now - entity.lastMentionedIndex < 30 * 60 * 1000;
      return isValid || isImportant || isRecent;
    });
  };

  const determineActiveEntity = (entities: Entity[], currentMessage: string) => {
    return entities
      .filter(e => currentMessage.toLowerCase().includes(e.name.toLowerCase()))
      .sort((a, b) => b.mentions - a.mentions)[0] || null;
  };

  const determineCurrentTopic = (entities: Entity[], messageAnalysis: any) => {
    if (!messageAnalysis.hasTopic) return null;
    return entities
      .filter(e => e.metadata.importance === 'high')
      .sort((a, b) => b.lastMentionedIndex - a.lastMentionedIndex)[0] || null;
  };

  const clearConversation = useCallback(() => {
    const emptyContext = {
      history: [],
      entities: [],
      activeEntity: null,
      currentTopic: null
    };
    setConversationContext(emptyContext);
    const storage = new Storage();
    storage.set("conversationContext", emptyContext);
  }, []);

  return {
    conversationContext,
    updateConversation,
    clearConversation
  };
}; 