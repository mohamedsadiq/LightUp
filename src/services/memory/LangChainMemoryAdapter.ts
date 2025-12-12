/**
 * @deprecated This adapter is deprecated in favor of AI SDK integration.
 * 
 * The LangChain memory system has been replaced by:
 * 1. Custom ConversationMemoryManager (pure TypeScript)
 * 2. AI SDK for LLM calls (generateTextWithAISDK)
 * 
 * This file is kept for backward compatibility and can be safely removed
 * once all consuming code has been migrated.
 * 
 * Migration path:
 * - ConversationSummaryBufferMemory -> ConversationMemoryManager.createConversationSummary()
 * - BufferMemory -> ConversationMemoryManager.manageConversationBuffer()
 * 
 * TO REMOVE: Delete this file and remove langchain dependencies from package.json:
 * - langchain
 * - @langchain/core
 * - @langchain/openai
 * - @langchain/community
 * - @langchain/google-genai
 * 
 * @since 2024-12 - Deprecated
 */
import { BufferMemory, ConversationSummaryBufferMemory } from "langchain/memory";
import { ChatOpenAI } from "@langchain/openai";
import { Storage } from "@plasmohq/storage";
import type { ConversationContext } from "~types/messages";
import type { Settings } from "~types/settings";

/**
 * LangChain Memory Adapter - Integrates LangChain's memory management with LightUp
 * Provides advanced conversation memory capabilities with automatic summarization
 */

export interface LangChainMemoryConfig {
  maxTokenLimit: number;
  returnMessages: boolean;
  enableSummarization: boolean;
  summaryPrompt?: string;
}

export class LangChainMemoryAdapter {
  private memory: BufferMemory | ConversationSummaryBufferMemory;
  private settings: Settings;
  private storage: Storage;
  private config: LangChainMemoryConfig;

  constructor(settings: Settings, config: Partial<LangChainMemoryConfig> = {}) {
    this.settings = settings;
    this.storage = new Storage();
    this.config = {
      maxTokenLimit: 3000, // Conservative limit for GPT-3.5-turbo
      returnMessages: true,
      enableSummarization: true,
      ...config
    };

    this.initializeMemory();
  }

  /**
   * Initialize appropriate memory type based on configuration
   */
  private initializeMemory() {
    if (this.config.enableSummarization && this.settings.apiKey) {
      // Use ConversationSummaryBufferMemory for intelligent summarization
      const llm = new ChatOpenAI({
        openAIApiKey: this.settings.apiKey,
        modelName: "gpt-3.5-turbo",
        temperature: 0.1, // Low temperature for consistent summaries
      });

      this.memory = new ConversationSummaryBufferMemory({
        llm,
        maxTokenLimit: this.config.maxTokenLimit,
        returnMessages: this.config.returnMessages,
      });
    } else {
      // Use simple BufferMemory as fallback
      this.memory = new BufferMemory({
        returnMessages: this.config.returnMessages,
      });
    }
  }

  /**
   * Add a conversation turn to memory
   */
  async addConversationTurn(userInput: string, aiResponse: string): Promise<void> {
    try {
      await this.memory.saveContext(
        { input: userInput },
        { output: aiResponse }
      );

      // Persist to extension storage
      await this.persistMemoryState();
    } catch (error) {
      console.error('[LangChain Memory] Error adding conversation turn:', error);
    }
  }

  /**
   * Get conversation context for next request
   */
  async getConversationContext(): Promise<{
    messages: Array<{ role: string; content: string }>;
    summary?: string;
    tokenCount: number;
  }> {
    try {
      const memoryVariables = await this.memory.loadMemoryVariables({});
      
      // Extract messages and summary
      let messages: Array<{ role: string; content: string }> = [];
      let summary: string | undefined;

      if (this.config.returnMessages && memoryVariables.history) {
        // Parse the chat history into messages
        const historyStr = memoryVariables.history.toString();
        messages = this.parseHistoryToMessages(historyStr);
      }

      if (memoryVariables.summary) {
        summary = memoryVariables.summary.toString();
      }

      // Estimate token count
      const tokenCount = this.estimateTokenCount(messages, summary);

      return {
        messages,
        summary,
        tokenCount
      };
    } catch (error) {
      console.error('[LangChain Memory] Error getting conversation context:', error);
      return { messages: [], tokenCount: 0 };
    }
  }

  /**
   * Clear memory (useful for new conversations)
   */
  async clearMemory(): Promise<void> {
    try {
      await this.memory.clear();
      await this.clearPersistedState();
    } catch (error) {
      console.error('[LangChain Memory] Error clearing memory:', error);
    }
  }

  /**
   * Load existing conversation from LightUp's conversation context
   */
  async loadFromConversationContext(context: ConversationContext): Promise<void> {
    try {
      // Clear existing memory first
      await this.memory.clear();

      // Load conversation history
      for (const turn of context.history) {
        if (turn.role === 'user') {
          // Find the corresponding assistant response
          const nextTurn = context.history.find(h => 
            h.timestamp > turn.timestamp && h.role === 'assistant'
          );
          
          if (nextTurn) {
            await this.memory.saveContext(
              { input: turn.content },
              { output: nextTurn.content }
            );
          }
        }
      }
    } catch (error) {
      console.error('[LangChain Memory] Error loading from conversation context:', error);
    }
  }

  /**
   * Export to LightUp's conversation context format
   */
  async exportToConversationContext(): Promise<Partial<ConversationContext>> {
    try {
      const context = await this.getConversationContext();
      
      const history = context.messages.map((msg, index) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: Date.now() - (context.messages.length - index) * 1000 // Approximate timestamps
      }));

      return {
        history,
        lastQuestion: history.filter(h => h.role === 'user').pop()?.content,
        lastAnswer: history.filter(h => h.role === 'assistant').pop()?.content,
      };
    } catch (error) {
      console.error('[LangChain Memory] Error exporting to conversation context:', error);
      return { history: [] };
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<{
    messageCount: number;
    tokenCount: number;
    hasSummary: boolean;
    memoryType: string;
  }> {
    const context = await this.getConversationContext();
    
    return {
      messageCount: context.messages.length,
      tokenCount: context.tokenCount,
      hasSummary: !!context.summary,
      memoryType: this.memory instanceof ConversationSummaryBufferMemory ? 'summary_buffer' : 'buffer'
    };
  }

  /**
   * Private helper methods
   */
  private parseHistoryToMessages(historyStr: string): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    
    // Simple parsing - LangChain typically formats as "Human: ... AI: ..."
    const lines = historyStr.split('\n');
    let currentMessage = '';
    let currentRole = '';

    for (const line of lines) {
      if (line.startsWith('Human: ')) {
        if (currentMessage && currentRole) {
          messages.push({ role: currentRole, content: currentMessage.trim() });
        }
        currentRole = 'user';
        currentMessage = line.replace('Human: ', '');
      } else if (line.startsWith('AI: ')) {
        if (currentMessage && currentRole) {
          messages.push({ role: currentRole, content: currentMessage.trim() });
        }
        currentRole = 'assistant';
        currentMessage = line.replace('AI: ', '');
      } else {
        currentMessage += '\n' + line;
      }
    }

    // Add the last message
    if (currentMessage && currentRole) {
      messages.push({ role: currentRole, content: currentMessage.trim() });
    }

    return messages;
  }

  private estimateTokenCount(messages: Array<{ role: string; content: string }>, summary?: string): number {
    let count = 0;
    
    // Rough estimation: ~4 characters per token
    messages.forEach(msg => {
      count += Math.ceil(msg.content.length / 4);
    });

    if (summary) {
      count += Math.ceil(summary.length / 4);
    }

    return count;
  }

  private async persistMemoryState(): Promise<void> {
    try {
      const context = await this.getConversationContext();
      await this.storage.set('langchain_memory_state', {
        messages: context.messages,
        summary: context.summary,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[LangChain Memory] Error persisting memory state:', error);
    }
  }

  private async clearPersistedState(): Promise<void> {
    try {
      await this.storage.remove('langchain_memory_state');
    } catch (error) {
      console.error('[LangChain Memory] Error clearing persisted state:', error);
    }
  }
}

/**
 * Factory function to create LangChain memory adapter
 */
export function createLangChainMemoryAdapter(
  settings: Settings,
  config?: Partial<LangChainMemoryConfig>
): LangChainMemoryAdapter {
  return new LangChainMemoryAdapter(settings, config);
}

/**
 * Enhanced conversation hook that uses LangChain memory
 */
export async function enhanceConversationWithLangChain(
  userInput: string,
  settings: Settings,
  existingContext?: ConversationContext
): Promise<{
  enhancedPrompt: string;
  memoryAdapter: LangChainMemoryAdapter;
  contextInfo: {
    hasMemory: boolean;
    messageCount: number;
    tokenCount: number;
  };
}> {
  const memoryAdapter = createLangChainMemoryAdapter(settings, {
    maxTokenLimit: settings.maxTokens ? Math.floor(settings.maxTokens * 0.7) : 2000 // Reserve 30% for response
  });

  // Load existing context if available
  if (existingContext) {
    await memoryAdapter.loadFromConversationContext(existingContext);
  }

  // Get conversation context
  const context = await memoryAdapter.getConversationContext();
  const stats = await memoryAdapter.getMemoryStats();

  // Build enhanced prompt with memory context
  let enhancedPrompt = userInput;

  if (context.summary) {
    enhancedPrompt = `CONVERSATION SUMMARY: ${context.summary}\n\nCURRENT QUESTION: ${userInput}`;
  } else if (context.messages.length > 0) {
    const recentMessages = context.messages.slice(-4); // Last 4 messages for context
    const contextStr = recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    enhancedPrompt = `RECENT CONVERSATION:\n${contextStr}\n\nCURRENT QUESTION: ${userInput}`;
  }

  return {
    enhancedPrompt,
    memoryAdapter,
    contextInfo: {
      hasMemory: context.messages.length > 0 || !!context.summary,
      messageCount: stats.messageCount,
      tokenCount: stats.tokenCount
    }
  };
} 