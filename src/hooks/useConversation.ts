import { useState, useCallback } from "react";
import type { ConversationContext } from "~types/messages";

interface Entity {
  name: string;
  type: string;
  mentions: number;
  lastMentionedIndex: number;
  description?: string;
  relationships?: { [key: string]: string };
}

export const useConversation = () => {
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    history: [],
    entities: [],
    activeEntity: null
  });

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

      // Enhanced topic and entity detection
      const detectTopicAndEntities = () => {
        const recentMessages = newHistory.slice(-6);
        const allContent = recentMessages.map(msg => msg.content).join(" ");
        
        // Enhanced entity patterns
        const entityPatterns = [
          // Name patterns with role/title
          /(?:(?:is|was|about|founder|ceo|creator|created by|by|named)\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
          // Company/Product patterns with descriptors
          /(?:(?:about|using|with|from|at|called|named)\s+)([A-Z][a-zA-Z0-9]+)/g,
          // Pronouns with context and intent
          /(?:(?:tell me more about|know more about|information about|what about|how about|who is)\s+)(him|her|them|it|this|that)/gi,
          // Direct references
          /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|was|has|had|will|would)/g
        ];

        const entities: Entity[] = [...(prev.entities || [])];
        let activeEntity = prev.activeEntity;
        
        // Process each pattern
        entityPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(allContent)) !== null) {
            const entityName = match[1];
            const context = match.input.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50);
            
            // Determine entity type and extract context
            const entityType = entityName.toLowerCase().match(/^(him|her|they|it|this|that)$/i)
              ? 'pronoun'
              : context.toLowerCase().includes('founder') || context.toLowerCase().includes('ceo')
                ? 'person'
                : /^[A-Z][a-zA-Z0-9]+$/.test(entityName)
                  ? 'company'
                  : 'person';

            const existingEntity = entities.find(e => e.name.toLowerCase() === entityName.toLowerCase());
            
            if (existingEntity) {
              existingEntity.mentions++;
              existingEntity.lastMentionedIndex = newHistory.length - 1;
              // Update description if new context is found
              if (assistantMessage && !existingEntity.description) {
                existingEntity.description = assistantMessage;
              }
              activeEntity = existingEntity;
            } else {
              const newEntity = {
                name: entityName,
                type: entityType,
                mentions: 1,
                lastMentionedIndex: newHistory.length - 1,
                description: assistantMessage || undefined
              };
              entities.push(newEntity);
              activeEntity = newEntity;
            }
          }
        });

        // Enhanced pronoun resolution
        const resolvePronouns = (message: string): string => {
          const pronounPattern = /(him|her|them|it|this|that)/gi;
          let resolvedMessage = message;
          
          resolvedMessage = resolvedMessage.replace(pronounPattern, (match) => {
            const pronoun = match.toLowerCase();
            
            // First try to use the active entity
            if (activeEntity && activeEntity.type !== 'pronoun') {
              return activeEntity.name;
            }

            // Otherwise find the most recently mentioned entity of the appropriate type
            const recentEntity = entities
              .filter(e => {
                if (e.type === 'pronoun') return false;
                if (pronoun === 'it' && e.type === 'company') return true;
                if ((pronoun === 'him' || pronoun === 'her') && e.type === 'person') return true;
                return false;
              })
              .sort((a, b) => b.lastMentionedIndex - a.lastMentionedIndex)[0];
            
            return recentEntity ? recentEntity.name : match;
          });

          return resolvedMessage;
        };

        // Get main topic from most mentioned entity
        const mainEntity = entities
          .filter(e => e.type !== 'pronoun')
          .sort((a, b) => b.mentions - a.mentions)[0];

        return {
          topic: mainEntity?.name || prev.topic,
          entities,
          activeEntity,
          resolvedMessage: resolvePronouns(userMessage)
        };
      };

      const { topic, entities, activeEntity, resolvedMessage } = detectTopicAndEntities();

      return {
        ...prev,
        history: newHistory,
        lastQuestion: resolvedMessage || userMessage,
        lastAnswer: assistantMessage || prev.lastAnswer,
        topic,
        entities,
        activeEntity
      };
    });
  }, []);

  const clearConversation = useCallback(() => {
    setConversationContext({ history: [], entities: [], activeEntity: null });
  }, []);

  return {
    conversationContext,
    updateConversation,
    clearConversation
  };
}; 