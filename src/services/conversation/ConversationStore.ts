/**
 * ConversationStore - Persistent Conversation Storage
 * 
 * PURPOSE: Store conversation history across sessions using Plasmo Storage
 * REPLACES: In-memory only conversation tracking
 * 
 * FEATURES:
 * - Persistent storage (survives popup close, page refresh)
 * - TTL-based expiration (conversations expire after inactivity)
 * - Automatic compression for large conversations
 * - Per-domain conversation isolation
 * 
 * @author LightUp Team
 * @since 2024-12
 */

import { Storage } from "@plasmohq/storage";

// ============================================================================
// Types
// ============================================================================

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  tokenEstimate?: number; // Rough token count
  entities?: string[]; // Extracted entities from this message
}

export interface ConversationSummaryBlock {
  content: string;
  messagesIncluded: number;
  createdAt: number;
  keyEntities: string[];
}

export interface StoredConversation {
  id: string;
  domain: string; // Website domain for isolation
  title?: string; // Optional conversation title
  messages: ConversationMessage[];
  summaries: ConversationSummaryBlock[]; // Rolling summaries
  entities: Map<string, EntityInfo> | Record<string, EntityInfo>; // Key entities tracked
  createdAt: number;
  lastActiveAt: number;
  totalTokensEstimate: number;
}

export interface EntityInfo {
  name: string;
  type: "person" | "place" | "concept" | "topic" | "other";
  mentions: number;
  firstMentionedAt: number;
  lastMentionedAt: number;
  context: string; // Brief context about this entity
}

export interface ConversationStoreConfig {
  maxMessagesInMemory: number; // Before triggering summary
  maxConversationAge: number; // TTL in milliseconds
  maxStoredConversations: number; // Per domain
  tokenBudget: number; // Max tokens for context window
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_PREFIX = "lightup_conv_";
const CONVERSATIONS_INDEX_KEY = "lightup_conversations_index";

const DEFAULT_CONFIG: ConversationStoreConfig = {
  maxMessagesInMemory: 20, // Keep last 20 messages before summarizing
  maxConversationAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxStoredConversations: 10, // Per domain
  tokenBudget: 4000, // Reserve 4K tokens for context
};

// Rough token estimation (4 chars ≈ 1 token)
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// ============================================================================
// ConversationStore Class
// ============================================================================

export class ConversationStore {
  private storage: Storage;
  private config: ConversationStoreConfig;
  private currentConversation: StoredConversation | null = null;
  private conversationsIndex: Map<string, string[]> = new Map(); // domain -> conversation IDs

  constructor(config?: Partial<ConversationStoreConfig>) {
    this.storage = new Storage({ area: "local" });
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  /**
   * Initialize store and load conversations index
   */
  async initialize(): Promise<void> {
    try {
      const index = await this.storage.get<Record<string, string[]>>(CONVERSATIONS_INDEX_KEY);
      if (index) {
        this.conversationsIndex = new Map(Object.entries(index));
      }
      // Clean up expired conversations
      await this.cleanupExpiredConversations();
    } catch (error) {
      console.error("[ConversationStore] Failed to initialize:", error);
    }
  }

  // --------------------------------------------------------------------------
  // Conversation Management
  // --------------------------------------------------------------------------

  /**
   * Start or resume a conversation for a domain
   */
  async getOrCreateConversation(domain: string, conversationId?: string): Promise<StoredConversation> {
    // Try to resume existing conversation
    if (conversationId) {
      const existing = await this.loadConversation(conversationId);
      if (existing) {
        this.currentConversation = existing;
        return existing;
      }
    }

    // Try to get most recent conversation for domain
    const domainConversations = this.conversationsIndex.get(domain) || [];
    if (domainConversations.length > 0) {
      const mostRecent = await this.loadConversation(domainConversations[0]);
      if (mostRecent && this.isConversationActive(mostRecent)) {
        this.currentConversation = mostRecent;
        return mostRecent;
      }
    }

    // Create new conversation
    const newConversation: StoredConversation = {
      id: this.generateId(),
      domain,
      messages: [],
      summaries: [],
      entities: {},
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      totalTokensEstimate: 0,
    };

    await this.saveConversation(newConversation);
    this.currentConversation = newConversation;
    return newConversation;
  }

  /**
   * Add a message to the current conversation
   */
  async addMessage(
    role: "user" | "assistant",
    content: string,
    entities?: string[]
  ): Promise<ConversationMessage> {
    if (!this.currentConversation) {
      throw new Error("No active conversation. Call getOrCreateConversation first.");
    }

    const message: ConversationMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: Date.now(),
      tokenEstimate: estimateTokens(content),
      entities,
    };

    this.currentConversation.messages.push(message);
    this.currentConversation.lastActiveAt = Date.now();
    this.currentConversation.totalTokensEstimate += message.tokenEstimate || 0;

    // Track entities
    if (entities) {
      this.trackEntities(entities, message.timestamp);
    }

    // Check if we need to create a rolling summary
    if (this.currentConversation.messages.length > this.config.maxMessagesInMemory) {
      await this.createRollingSummary();
    }

    await this.saveConversation(this.currentConversation);
    return message;
  }

  /**
   * Get context for LLM request (optimized for token budget)
   */
  getContextForRequest(): {
    recentMessages: ConversationMessage[];
    summaries: ConversationSummaryBlock[];
    keyEntities: EntityInfo[];
    totalTokens: number;
  } {
    if (!this.currentConversation) {
      return {
        recentMessages: [],
        summaries: [],
        keyEntities: [],
        totalTokens: 0,
      };
    }

    const { messages, summaries, entities } = this.currentConversation;
    let tokenBudget = this.config.tokenBudget;
    let totalTokens = 0;

    // 1. Always include most recent messages (up to budget)
    const recentMessages: ConversationMessage[] = [];
    for (let i = messages.length - 1; i >= 0 && tokenBudget > 500; i--) {
      const msg = messages[i];
      const tokens = msg.tokenEstimate || estimateTokens(msg.content);
      if (tokens <= tokenBudget) {
        recentMessages.unshift(msg);
        tokenBudget -= tokens;
        totalTokens += tokens;
      } else {
        break;
      }
    }

    // 2. Include summaries if we have budget
    const includedSummaries: ConversationSummaryBlock[] = [];
    for (const summary of summaries) {
      const tokens = estimateTokens(summary.content);
      if (tokens <= tokenBudget) {
        includedSummaries.push(summary);
        tokenBudget -= tokens;
        totalTokens += tokens;
      }
    }

    // 3. Include key entities (low token cost, high value)
    const entitiesRecord = this.currentConversation.entities instanceof Map 
      ? Object.fromEntries(this.currentConversation.entities)
      : this.currentConversation.entities;
    
    const keyEntities = Object.values(entitiesRecord as Record<string, EntityInfo>)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10); // Top 10 entities

    return {
      recentMessages,
      summaries: includedSummaries,
      keyEntities,
      totalTokens,
    };
  }

  /**
   * Build prompt context string from stored data
   */
  buildContextPrompt(): string {
    const { recentMessages, summaries, keyEntities } = this.getContextForRequest();
    
    const parts: string[] = [];

    // Add summaries first (older context)
    if (summaries.length > 0) {
      parts.push("## Previous Conversation Summary");
      summaries.forEach((s) => {
        parts.push(s.content);
      });
    }

    // Add key entities
    if (keyEntities.length > 0) {
      parts.push("\n## Key Topics/Entities Discussed");
      keyEntities.forEach((e) => {
        parts.push(`- **${e.name}** (${e.type}): ${e.context}`);
      });
    }

    // Add recent messages
    if (recentMessages.length > 0) {
      parts.push("\n## Recent Conversation");
      recentMessages.forEach((m) => {
        const role = m.role === "user" ? "User" : "Assistant";
        // Truncate long messages in context
        const content = m.content.length > 500 
          ? m.content.substring(0, 500) + "..."
          : m.content;
        parts.push(`${role}: ${content}`);
      });
    }

    return parts.join("\n");
  }

  // --------------------------------------------------------------------------
  // Rolling Summary Management
  // --------------------------------------------------------------------------

  /**
   * Create a rolling summary of older messages
   * This is called when messages exceed maxMessagesInMemory
   */
  private async createRollingSummary(): Promise<void> {
    if (!this.currentConversation) return;

    const { messages } = this.currentConversation;
    const messagesToSummarize = messages.slice(0, messages.length - 10); // Keep last 10

    if (messagesToSummarize.length < 5) return; // Not enough to summarize

    // Extract entities from messages being summarized
    const keyEntities: string[] = [];
    messagesToSummarize.forEach((m) => {
      if (m.entities) {
        keyEntities.push(...m.entities);
      }
    });

    // Create summary block (actual summarization happens via AI in ContextWindowManager)
    const summaryBlock: ConversationSummaryBlock = {
      content: `[Summary of ${messagesToSummarize.length} messages - pending AI summarization]`,
      messagesIncluded: messagesToSummarize.length,
      createdAt: Date.now(),
      keyEntities: [...new Set(keyEntities)],
    };

    // Mark for summarization (will be processed by ContextWindowManager)
    this.currentConversation.summaries.push(summaryBlock);
    
    // Remove summarized messages from active list
    this.currentConversation.messages = messages.slice(messages.length - 10);

    console.log(`[ConversationStore] Created rolling summary for ${messagesToSummarize.length} messages`);
  }

  /**
   * Update a summary block with AI-generated content
   */
  async updateSummaryContent(summaryIndex: number, content: string): Promise<void> {
    if (!this.currentConversation) return;
    if (summaryIndex < this.currentConversation.summaries.length) {
      this.currentConversation.summaries[summaryIndex].content = content;
      await this.saveConversation(this.currentConversation);
    }
  }

  // --------------------------------------------------------------------------
  // Entity Tracking
  // --------------------------------------------------------------------------

  private trackEntities(entities: string[], timestamp: number): void {
    if (!this.currentConversation) return;

    // Ensure entities is a plain object, not a Map
    if (this.currentConversation.entities instanceof Map) {
      this.currentConversation.entities = Object.fromEntries(this.currentConversation.entities);
    }

    const entitiesRecord = this.currentConversation.entities as Record<string, EntityInfo>;

    entities.forEach((entity) => {
      const existing = entitiesRecord[entity];
      if (existing) {
        existing.mentions++;
        existing.lastMentionedAt = timestamp;
      } else {
        entitiesRecord[entity] = {
          name: entity,
          type: "other",
          mentions: 1,
          firstMentionedAt: timestamp,
          lastMentionedAt: timestamp,
          context: "",
        };
      }
    });
  }

  /**
   * Update entity context (called after AI processing)
   */
  async updateEntityContext(entityName: string, context: string, type?: EntityInfo["type"]): Promise<void> {
    if (!this.currentConversation) return;

    const entitiesRecord = this.currentConversation.entities instanceof Map
      ? Object.fromEntries(this.currentConversation.entities)
      : this.currentConversation.entities as Record<string, EntityInfo>;

    if (entitiesRecord[entityName]) {
      entitiesRecord[entityName].context = context;
      if (type) {
        entitiesRecord[entityName].type = type;
      }
      this.currentConversation.entities = entitiesRecord;
      await this.saveConversation(this.currentConversation);
    }
  }

  // --------------------------------------------------------------------------
  // Storage Operations
  // --------------------------------------------------------------------------

  private async saveConversation(conversation: StoredConversation): Promise<void> {
    const key = `${STORAGE_KEY_PREFIX}${conversation.id}`;
    
    // Ensure entities is serializable (convert Map to Object if needed)
    const toSave = {
      ...conversation,
      entities: conversation.entities instanceof Map 
        ? Object.fromEntries(conversation.entities)
        : conversation.entities,
    };
    
    await this.storage.set(key, toSave);

    // Update index
    const domainConversations = this.conversationsIndex.get(conversation.domain) || [];
    if (!domainConversations.includes(conversation.id)) {
      domainConversations.unshift(conversation.id);
      // Limit stored conversations per domain
      if (domainConversations.length > this.config.maxStoredConversations) {
        const toRemove = domainConversations.pop();
        if (toRemove) {
          await this.storage.remove(`${STORAGE_KEY_PREFIX}${toRemove}`);
        }
      }
      this.conversationsIndex.set(conversation.domain, domainConversations);
      await this.saveIndex();
    }
  }

  private async loadConversation(id: string): Promise<StoredConversation | null> {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    const data = await this.storage.get<StoredConversation>(key);
    return data || null;
  }

  private async saveIndex(): Promise<void> {
    const indexObj = Object.fromEntries(this.conversationsIndex);
    await this.storage.set(CONVERSATIONS_INDEX_KEY, indexObj);
  }

  private async cleanupExpiredConversations(): Promise<void> {
    const now = Date.now();
    
    for (const [domain, ids] of this.conversationsIndex) {
      const validIds: string[] = [];
      
      for (const id of ids) {
        const conv = await this.loadConversation(id);
        if (conv && (now - conv.lastActiveAt) < this.config.maxConversationAge) {
          validIds.push(id);
        } else {
          // Remove expired conversation
          await this.storage.remove(`${STORAGE_KEY_PREFIX}${id}`);
          console.log(`[ConversationStore] Cleaned up expired conversation: ${id}`);
        }
      }
      
      this.conversationsIndex.set(domain, validIds);
    }
    
    await this.saveIndex();
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private isConversationActive(conversation: StoredConversation): boolean {
    const age = Date.now() - conversation.lastActiveAt;
    // Consider conversation "active" if used within last 30 minutes
    return age < 30 * 60 * 1000;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current conversation (for external access)
   */
  getCurrentConversation(): StoredConversation | null {
    return this.currentConversation;
  }

  /**
   * Clear current conversation (start fresh)
   */
  async clearCurrentConversation(): Promise<void> {
    this.currentConversation = null;
  }

  /**
   * Get all conversations for a domain
   */
  async getConversationsForDomain(domain: string): Promise<StoredConversation[]> {
    const ids = this.conversationsIndex.get(domain) || [];
    const conversations: StoredConversation[] = [];
    
    for (const id of ids) {
      const conv = await this.loadConversation(id);
      if (conv) {
        conversations.push(conv);
      }
    }
    
    return conversations;
  }
}

// Export singleton instance
export const conversationStore = new ConversationStore();
