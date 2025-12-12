import type { ConversationContext, Entity } from "~types/messages";
import type { Settings } from "~types/settings";
import { generateTextWithAISDK } from "~services/llm/ai-sdk-streaming";

export interface MemoryConfig {
  maxBufferSize: number;
  summaryTriggerSize: number;
  entityTrackingEnabled: boolean;
  contextWindowSize: number;
  enableConversationSummary: boolean;
}

export interface ConversationSummary {
  summary: string;
  keyPoints: string[];
  entities: Entity[];
  totalMessages: number;
  createdAt: number;
}

export interface EnhancedConversationContext extends ConversationContext {
  summary?: ConversationSummary;
  contextWindow: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    entities?: Entity[];
    importance?: number; // 1-10 scale
  }>;
  longTermMemory: Array<{
    topic: string;
    summary: string;
    entities: Entity[];
    lastAccessed: number;
  }>;
  userPreferences: {
    responseStyle?: string;
    preferredLanguage?: string;
    expertiseLevel?: "beginner" | "intermediate" | "expert";
    interests: string[];
  };
}

export class ConversationMemoryManager {
  private config: MemoryConfig;
  private settings: Settings;

  constructor(settings: Settings, config?: Partial<MemoryConfig>) {
    this.settings = settings;
    this.config = {
      maxBufferSize: 20,
      summaryTriggerSize: 15,
      entityTrackingEnabled: true,
      contextWindowSize: 10,
      enableConversationSummary: true,
      ...config
    };
  }

  /**
   * ConversationBufferMemory Pattern
   * Maintains a buffer of recent conversations with intelligent trimming
   */
  async manageConversationBuffer(
    context: EnhancedConversationContext,
    newMessage: { role: "user" | "assistant"; content: string }
  ): Promise<EnhancedConversationContext> {
    const enhancedMessage = {
      ...newMessage,
      timestamp: Date.now(),
      entities: this.extractEntities(newMessage.content),
      importance: this.calculateImportance(newMessage.content, context)
    };

    // Add to context window
    const updatedWindow = [...context.contextWindow, enhancedMessage];

    // Trim buffer if needed
    if (updatedWindow.length > this.config.maxBufferSize) {
      // Keep high-importance messages and recent messages
      const trimmedWindow = this.intelligentTrim(updatedWindow);
      
      // Create summary if buffer is getting full
      if (updatedWindow.length >= this.config.summaryTriggerSize && this.config.enableConversationSummary) {
        const summary = await this.createConversationSummary(updatedWindow);
        return {
          ...context,
          contextWindow: trimmedWindow,
          summary,
          longTermMemory: this.updateLongTermMemory(context.longTermMemory, summary)
        };
      }

      return { ...context, contextWindow: trimmedWindow };
    }

    return { ...context, contextWindow: updatedWindow };
  }

  /**
   * ConversationSummaryMemory Pattern
   * Creates intelligent summaries to preserve context while managing token limits
   */
  private async createConversationSummary(messages: any[]): Promise<ConversationSummary> {
    const entities = this.aggregateEntities(messages);
    const keyPoints = this.extractKeyPoints(messages);
    
    // Use LLM to create intelligent summary
    const summaryPrompt = this.buildSummaryPrompt(messages, entities, keyPoints);
    const summary = await this.generateSummary(summaryPrompt);

    return {
      summary,
      keyPoints,
      entities,
      totalMessages: messages.length,
      createdAt: Date.now()
    };
  }

  /**
   * Chain-of-Thought Context Construction
   * Implements advanced prompt engineering with contextual reasoning
   */
  buildContextualPrompt(
    context: EnhancedConversationContext,
    currentQuery: string,
    mode: string
  ): { systemPrompt: string; contextPrompt: string } {
    const systemPrompt = this.buildEnhancedSystemPrompt(context, mode);
    const contextPrompt = this.buildContextPrompt(context, currentQuery);

    return { systemPrompt, contextPrompt };
  }

  private buildEnhancedSystemPrompt(context: EnhancedConversationContext, mode: string): string {
    let prompt = `You are an expert AI assistant with perfect memory and contextual awareness.`;

    // Add conversation history context
    if (context.summary) {
      prompt += `\n\nCONVERSATION HISTORY SUMMARY:
${context.summary.summary}

KEY DISCUSSION POINTS:
${context.summary.keyPoints.join('\n- ')}`;
    }

    // Add entity awareness
    if (context.entities.length > 0) {
      prompt += `\n\nKEY ENTITIES IN OUR CONVERSATION:
${context.entities.map(e => `- ${e.name} (${e.type}): ${e.description || 'mentioned'}`).join('\n')}`;
    }

    // Add user preferences
    if (context.userPreferences) {
      prompt += `\n\nUSER PREFERENCES:
- Response Style: ${context.userPreferences.responseStyle || 'balanced'}
- Expertise Level: ${context.userPreferences.expertiseLevel || 'intermediate'}
- Language: ${context.userPreferences.preferredLanguage || 'English'}`;
      
      if (context.userPreferences.interests.length > 0) {
        prompt += `\n- Interests: ${context.userPreferences.interests.join(', ')}`;
      }
    }

    // Add Chain-of-Thought reasoning instruction
    prompt += `\n\nReasoning Instructions:
1. Consider the full conversation context and user preferences
2. Reference relevant entities and previous discussions when appropriate
3. Use step-by-step reasoning for complex queries
4. Maintain consistency with your previous responses
5. Adapt your response style to match the user's preferences`;

    return prompt;
  }

  private buildContextPrompt(context: EnhancedConversationContext, currentQuery: string): string {
    let contextPrompt = '';

    // Add recent context window
    if (context.contextWindow.length > 0) {
      contextPrompt += 'RECENT CONVERSATION CONTEXT:\n';
      const recentMessages = context.contextWindow.slice(-this.config.contextWindowSize);
      
      contextPrompt += recentMessages.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n');
    }

    // Add current query with enhanced context
    contextPrompt += `\n\nCURRENT QUERY: ${currentQuery}`;

    // Add reasoning chain prompt
    contextPrompt += `\n\nPlease provide a thoughtful response that:
1. Acknowledges relevant context from our conversation
2. Shows understanding of the progression of our discussion
3. Builds upon previously established concepts
4. Maintains conversational continuity`;

    return contextPrompt;
  }

  /**
   * RAG-Enhanced Memory (Retrieval-Augmented Generation)
   * Retrieves relevant context from long-term memory
   */
  async retrieveRelevantContext(
    query: string,
    context: EnhancedConversationContext
  ): Promise<Array<{ content: string; relevance: number; source: string }>> {
    const relevantMemories = [];

    // Search conversation history
    const historyResults = this.searchConversationHistory(query, context);
    relevantMemories.push(...historyResults);

    // Search long-term memory
    const longTermResults = this.searchLongTermMemory(query, context);
    relevantMemories.push(...longTermResults);

    // Search entity relationships
    const entityResults = this.searchEntityRelationships(query, context);
    relevantMemories.push(...entityResults);

    // Sort by relevance and return top results
    return relevantMemories
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
  }

  /**
   * Adaptive Learning and Personalization
   * Learns from user interactions to improve responses
   */
  updateUserPreferences(
    context: EnhancedConversationContext,
    userFeedback: { type: 'like' | 'dislike'; reason?: string },
    responseContent: string
  ): EnhancedConversationContext {
    const updatedPreferences = { ...context.userPreferences };

    // Analyze successful response patterns
    if (userFeedback.type === 'like') {
      // Extract successful patterns
      const responseStyle = this.analyzeResponseStyle(responseContent);
      updatedPreferences.responseStyle = responseStyle;

      // Update interests based on topic
      const topics = this.extractTopics(responseContent);
      updatedPreferences.interests = [
        ...new Set([...updatedPreferences.interests, ...topics])
      ].slice(0, 10); // Limit to 10 interests
    }

    return {
      ...context,
      userPreferences: updatedPreferences
    };
  }

  // Helper methods for entity extraction and importance calculation
  private extractEntities(content: string): Entity[] {
    // Implement entity extraction logic
    // This could use NLP libraries or simple pattern matching
    const entities: Entity[] = [];
    
    // Simple pattern matching for demonstration
    const patterns = {
      person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      location: /\b(in|at|from|to) ([A-Z][a-z\s]+)\b/g,
      organization: /\b[A-Z][A-Z\s&]+\b/g,
    };

         Object.entries(patterns).forEach(([type, pattern]) => {
       const matches = content.match(pattern);
       if (matches) {
         matches.forEach(match => {
           entities.push({
             name: match.trim(),
             type: type,
             mentions: 1,
             lastMentionedIndex: Date.now(),
             description: 'Auto-detected entity'
           });
         });
       }
     });

    return entities;
  }

  private calculateImportance(content: string, context: EnhancedConversationContext): number {
    let importance = 5; // Base importance

    // Higher importance for questions
    if (content.includes('?')) importance += 2;

    // Higher importance for responses to questions
    if (context.contextWindow.length > 0) {
      const lastMessage = context.contextWindow[context.contextWindow.length - 1];
      if (lastMessage?.content.includes('?')) importance += 2;
    }

    // Higher importance for entity mentions
    const entities = this.extractEntities(content);
    importance += entities.length * 0.5;

    // Higher importance for longer, detailed responses
    if (content.length > 500) importance += 1;

    return Math.min(importance, 10);
  }

  private intelligentTrim(messages: any[]): any[] {
    // Keep recent messages and high-importance messages
    const sorted = messages.sort((a, b) => {
      // Prioritize recent messages and high importance
      const aScore = (a.importance || 5) + (Date.now() - a.timestamp) * -0.000001;
      const bScore = (b.importance || 5) + (Date.now() - b.timestamp) * -0.000001;
      return bScore - aScore;
    });

    return sorted.slice(0, this.config.contextWindowSize);
  }

  private aggregateEntities(messages: any[]): Entity[] {
    const entityMap = new Map<string, Entity>();

    messages.forEach(msg => {
      if (msg.entities) {
                 msg.entities.forEach((entity: Entity) => {
           const key = `${entity.name}_${entity.type}`;
           if (entityMap.has(key)) {
             const existing = entityMap.get(key)!;
             existing.mentions++;
             existing.lastMentionedIndex = Math.max(existing.lastMentionedIndex, entity.lastMentionedIndex);
           } else {
             entityMap.set(key, { ...entity });
           }
         });
      }
    });

    return Array.from(entityMap.values());
  }

  private extractKeyPoints(messages: any[]): string[] {
    // Extract key discussion points from messages
    const keyPoints: string[] = [];

    messages.forEach(msg => {
      // Extract sentences that seem like key points
      const sentences = msg.content.split(/[.!?]+/);
      sentences.forEach((sentence: string) => {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && this.isKeyPoint(trimmed)) {
          keyPoints.push(trimmed);
        }
      });
    });

    return keyPoints.slice(0, 10); // Limit to top 10 key points
  }

  private isKeyPoint(sentence: string): boolean {
    // Simple heuristics to identify key points
    const keyIndicators = [
      'important', 'key', 'main', 'significant', 'crucial',
      'first', 'second', 'third', 'finally', 'conclusion',
      'therefore', 'because', 'however', 'although'
    ];

    return keyIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator)
    );
  }

  private buildSummaryPrompt(messages: any[], entities: Entity[], keyPoints: string[]): string {
    return `Please create a concise but comprehensive summary of this conversation:

MESSAGES:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

KEY ENTITIES DISCUSSED:
${entities.map(e => `- ${e.name} (${e.type})`).join('\n')}

IMPORTANT POINTS IDENTIFIED:
${keyPoints.map(p => `- ${p}`).join('\n')}

Create a summary that captures:
1. Main topics discussed
2. Key decisions or conclusions
3. Important context for future conversations
4. User preferences or interests revealed

Keep the summary under 200 words but ensure it provides sufficient context for continuing the conversation meaningfully.`;
  }

  /**
   * Generate conversation summary using AI SDK
   * 
   * INTEGRATION: Uses generateTextWithAISDK from ai-sdk-streaming.ts
   * FALLBACK: Returns basic summary if AI call fails
   */
  private async generateSummary(prompt: string): Promise<string> {
    try {
      // Determine which provider to use based on settings
      const provider = this.settings.modelType === 'xai' ? 'xai' : 'openai';
      
      // Check if we have valid API credentials
      const hasValidKey = provider === 'xai' 
        ? !!this.settings.xaiApiKey 
        : !!this.settings.apiKey;
      
      if (!hasValidKey) {
        console.warn('[Memory] No API key available for summarization, using fallback');
        return this.generateFallbackSummary(prompt);
      }
      
      // Generate summary using AI SDK
      const summary = await generateTextWithAISDK(
        prompt,
        this.settings,
        provider,
        300 // Keep summaries concise
      );
      
      console.log('[Memory] Generated AI-powered summary:', summary.substring(0, 100) + '...');
      return summary;
      
    } catch (error) {
      console.error('[Memory] Error generating summary with AI:', error);
      return this.generateFallbackSummary(prompt);
    }
  }

  /**
   * Fallback summary generation when AI is unavailable
   * Extracts key information from the prompt without AI
   */
  private generateFallbackSummary(prompt: string): string {
    // Extract message content from the prompt
    const messagesMatch = prompt.match(/MESSAGES:\n([\s\S]*?)\n\nKEY ENTITIES/);
    if (!messagesMatch) {
      return "Conversation in progress. Summary will be available when AI is configured.";
    }
    
    const messages = messagesMatch[1];
    const lines = messages.split('\n').filter(l => l.trim());
    const userMessages = lines.filter(l => l.startsWith('user:')).slice(-3);
    
    if (userMessages.length === 0) {
      return "Brief conversation started.";
    }
    
    return `Recent discussion topics: ${userMessages.map(m => m.replace('user:', '').trim().substring(0, 50)).join('; ')}`;
  }

  private updateLongTermMemory(
    currentMemory: any[],
    newSummary: ConversationSummary
  ): any[] {
    // Add new summary to long-term memory
    const newMemoryEntry = {
      topic: this.extractMainTopic(newSummary.keyPoints),
      summary: newSummary.summary,
      entities: newSummary.entities,
      lastAccessed: Date.now()
    };

    const updated = [...currentMemory, newMemoryEntry];

    // Keep only the most recent 50 entries
    return updated.slice(-50);
  }

  private extractMainTopic(keyPoints: string[]): string {
    // Simple topic extraction from key points
    if (keyPoints.length === 0) return "General Discussion";
    
    // Use the first key point as the main topic
    const firstPoint = keyPoints[0];
    const words = firstPoint.split(' ');
    
    // Return first few words as topic
    return words.slice(0, 3).join(' ');
  }

  private searchConversationHistory(query: string, context: EnhancedConversationContext): any[] {
    // Simple text search in conversation history
    const results: any[] = [];
    const queryLower = query.toLowerCase();

    context.contextWindow.forEach(msg => {
      if (msg.content.toLowerCase().includes(queryLower)) {
        results.push({
          content: msg.content,
          relevance: this.calculateTextRelevance(query, msg.content),
          source: 'conversation_history'
        });
      }
    });

    return results;
  }

  private searchLongTermMemory(query: string, context: EnhancedConversationContext): any[] {
    // Search long-term memory summaries
    const results: any[] = [];
    const queryLower = query.toLowerCase();

    context.longTermMemory.forEach(memory => {
      if (memory.summary.toLowerCase().includes(queryLower) || 
          memory.topic.toLowerCase().includes(queryLower)) {
        results.push({
          content: memory.summary,
          relevance: this.calculateTextRelevance(query, memory.summary),
          source: 'long_term_memory'
        });
      }
    });

    return results;
  }

  private searchEntityRelationships(query: string, context: EnhancedConversationContext): any[] {
    // Search for entity relationships
    const results: any[] = [];
    const queryLower = query.toLowerCase();

    context.entities.forEach(entity => {
      if (entity.name.toLowerCase().includes(queryLower)) {
        results.push({
          content: `Entity: ${entity.name} (${entity.type}) - ${entity.description || 'Previously discussed'}`,
          relevance: 0.8,
          source: 'entity_memory'
        });
      }
    });

    return results;
  }

  private calculateTextRelevance(query: string, text: string): number {
    // Simple relevance calculation
    const queryWords = query.toLowerCase().split(' ');
    const textWords = text.toLowerCase().split(' ');
    
    let matches = 0;
    queryWords.forEach(word => {
      if (textWords.includes(word)) matches++;
    });

    return matches / queryWords.length;
  }

  private analyzeResponseStyle(content: string): string {
    // Analyze response characteristics
    if (content.length > 500) return "detailed";
    if (content.includes("1.") || content.includes("•")) return "structured";
    if (content.split('?').length > 2) return "questioning";
    if (content.includes("example") || content.includes("for instance")) return "example-rich";
    
    return "concise";
  }

  private extractTopics(content: string): string[] {
    // Simple topic extraction
    const words = content.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should']);
    
    const topics = words
      .filter(word => word.length > 4 && !commonWords.has(word))
      .slice(0, 5);

    return topics;
  }
} 