/**
 * ContextWindowManager - Intelligent Context Window Management
 * 
 * PURPOSE: Manage context window efficiently with rolling summaries
 * REPLACES: Ad-hoc context injection in EnhancedLLMProcessor
 * 
 * FEATURES:
 * - Rolling summaries (incremental, not all-at-once)
 * - Token budget management
 * - Entity extraction and tracking
 * - Smart context prioritization
 * 
 * @author LightUp Team
 * @since 2024-12
 */

import type { Settings } from "~types/settings";
import { generateTextWithAISDK } from "~services/llm/ai-sdk-streaming";
import { 
  ConversationStore, 
  conversationStore,
  type ConversationMessage,
  type ConversationSummaryBlock,
  type EntityInfo 
} from "./ConversationStore";

// ============================================================================
// Types
// ============================================================================

export interface ContextWindowConfig {
  maxTokens: number; // Total token budget for context
  reserveForResponse: number; // Tokens reserved for AI response
  summaryTriggerThreshold: number; // Messages before triggering summary
  entityExtractionEnabled: boolean;
  rollingSummaryEnabled: boolean;
}

export interface PreparedContext {
  systemContext: string; // To prepend to system prompt
  conversationHistory: string; // Recent conversation
  entities: EntityInfo[];
  tokenCount: number;
  hasOlderContext: boolean; // Whether summaries are included
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: ContextWindowConfig = {
  maxTokens: 4000,
  reserveForResponse: 1000,
  summaryTriggerThreshold: 10,
  entityExtractionEnabled: true,
  rollingSummaryEnabled: true,
};

// Prompts for AI-powered operations
const SUMMARY_PROMPT = `Summarize this conversation segment concisely. Focus on:
1. Main topics discussed
2. Key decisions or conclusions
3. Important facts or context
4. User preferences revealed

Keep under 150 words. Be factual, not conversational.

CONVERSATION:
`;

const ENTITY_EXTRACTION_PROMPT = `Extract key entities (people, places, concepts, topics) from this text.
Return as JSON array: [{"name": "entity", "type": "person|place|concept|topic", "context": "brief description"}]
Only include significant entities, max 5.

TEXT:
`;

// ============================================================================
// ContextWindowManager Class
// ============================================================================

export class ContextWindowManager {
  private config: ContextWindowConfig;
  private store: ConversationStore;
  private settings: Settings | null = null;

  constructor(config?: Partial<ContextWindowConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = conversationStore;
  }

  /**
   * Initialize with settings (needed for AI calls)
   */
  setSettings(settings: Settings): void {
    this.settings = settings;
  }

  /**
   * Initialize store for a domain
   */
  async initializeForDomain(domain: string): Promise<void> {
    await this.store.initialize();
    await this.store.getOrCreateConversation(domain);
  }

  // --------------------------------------------------------------------------
  // Message Handling
  // --------------------------------------------------------------------------

  /**
   * Add user message and prepare for AI response
   */
  async addUserMessage(content: string): Promise<void> {
    // Extract entities if enabled
    let entities: string[] | undefined;
    if (this.config.entityExtractionEnabled && this.settings) {
      entities = await this.extractEntities(content);
    }

    await this.store.addMessage("user", content, entities);

    // Check if we need to process pending summaries
    await this.processPendingSummaries();
  }

  /**
   * Add assistant response
   */
  async addAssistantMessage(content: string): Promise<void> {
    let entities: string[] | undefined;
    if (this.config.entityExtractionEnabled && this.settings) {
      entities = await this.extractEntities(content);
    }

    await this.store.addMessage("assistant", content, entities);
  }

  // --------------------------------------------------------------------------
  // Context Preparation
  // --------------------------------------------------------------------------

  /**
   * Prepare context for LLM request
   * Returns optimized context within token budget
   */
  prepareContext(): PreparedContext {
    const { recentMessages, summaries, keyEntities, totalTokens } = 
      this.store.getContextForRequest();

    const availableTokens = this.config.maxTokens - this.config.reserveForResponse;

    // Build system context (summaries + entities)
    let systemContext = "";
    
    if (summaries.length > 0) {
      systemContext += "## Conversation Background\n";
      summaries.forEach((s, i) => {
        systemContext += `${s.content}\n`;
      });
      systemContext += "\n";
    }

    if (keyEntities.length > 0) {
      systemContext += "## Key Topics\n";
      keyEntities.slice(0, 5).forEach((e) => {
        if (e.context) {
          systemContext += `- **${e.name}**: ${e.context}\n`;
        } else {
          systemContext += `- ${e.name}\n`;
        }
      });
      systemContext += "\n";
    }

    // Build conversation history
    let conversationHistory = "";
    if (recentMessages.length > 0) {
      conversationHistory = recentMessages.map((m) => {
        const role = m.role === "user" ? "User" : "Assistant";
        const content = m.content.length > 300 
          ? m.content.substring(0, 300) + "..."
          : m.content;
        return `${role}: ${content}`;
      }).join("\n\n");
    }

    return {
      systemContext,
      conversationHistory,
      entities: keyEntities,
      tokenCount: totalTokens,
      hasOlderContext: summaries.length > 0,
    };
  }

  /**
   * Get full context string for injection into prompt
   */
  getContextString(): string {
    const { systemContext, conversationHistory } = this.prepareContext();
    
    if (!systemContext && !conversationHistory) {
      return "";
    }

    let result = "";
    
    if (systemContext) {
      result += systemContext;
    }
    
    if (conversationHistory) {
      result += "## Recent Conversation\n" + conversationHistory + "\n";
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Rolling Summary Generation
  // --------------------------------------------------------------------------

  /**
   * Process any pending summaries that need AI generation
   */
  private async processPendingSummaries(): Promise<void> {
    if (!this.config.rollingSummaryEnabled || !this.settings) {
      return;
    }

    const conversation = this.store.getCurrentConversation();
    if (!conversation) return;

    // Find summaries that need processing (contain "pending" marker)
    for (let i = 0; i < conversation.summaries.length; i++) {
      const summary = conversation.summaries[i];
      if (summary.content.includes("pending AI summarization")) {
        const generatedSummary = await this.generateSummary(conversation.messages, i);
        if (generatedSummary) {
          await this.store.updateSummaryContent(i, generatedSummary);
        }
      }
    }
  }

  /**
   * Generate summary using AI SDK
   */
  private async generateSummary(
    messages: ConversationMessage[], 
    _summaryIndex: number
  ): Promise<string | null> {
    if (!this.settings) return null;

    try {
      // Build conversation text for summarization
      const conversationText = messages
        .slice(-15) // Last 15 messages for context
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const prompt = SUMMARY_PROMPT + conversationText;

      // Determine provider based on settings
      const provider = this.settings.modelType === 'xai' ? 'xai' 
        : this.settings.modelType === 'gemini' ? 'gemini' 
        : 'openai';

      const summary = await generateTextWithAISDK(
        prompt,
        this.settings,
        provider,
        200 // Short summary
      );

      console.log("[ContextWindowManager] Generated rolling summary");
      return summary;

    } catch (error) {
      console.error("[ContextWindowManager] Failed to generate summary:", error);
      // Return a basic fallback summary
      const topics = messages
        .filter((m) => m.role === "user")
        .slice(-3)
        .map((m) => m.content.substring(0, 50))
        .join("; ");
      return `Discussion covered: ${topics}`;
    }
  }

  // --------------------------------------------------------------------------
  // Entity Extraction
  // --------------------------------------------------------------------------

  /**
   * Extract entities from text using AI
   */
  private async extractEntities(text: string): Promise<string[]> {
    if (!this.settings || text.length < 50) {
      return [];
    }

    try {
      const prompt = ENTITY_EXTRACTION_PROMPT + text;

      const provider = this.settings.modelType === 'xai' ? 'xai' 
        : this.settings.modelType === 'gemini' ? 'gemini' 
        : 'openai';

      const response = await generateTextWithAISDK(
        prompt,
        this.settings,
        provider,
        150
      );

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const entities = JSON.parse(jsonMatch[0]) as Array<{ name: string; type: string; context: string }>;
        
        // Update entity contexts in store
        for (const entity of entities) {
          await this.store.updateEntityContext(
            entity.name, 
            entity.context, 
            entity.type as EntityInfo["type"]
          );
        }

        return entities.map((e) => e.name);
      }

      return [];

    } catch (error) {
      console.warn("[ContextWindowManager] Entity extraction failed:", error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  /**
   * Get current token usage
   */
  getTokenUsage(): { used: number; available: number; budget: number } {
    const { totalTokens } = this.store.getContextForRequest();
    return {
      used: totalTokens,
      available: this.config.maxTokens - totalTokens - this.config.reserveForResponse,
      budget: this.config.maxTokens,
    };
  }

  /**
   * Clear conversation context
   */
  async clearContext(): Promise<void> {
    await this.store.clearCurrentConversation();
  }

  /**
   * Check if conversation has meaningful context
   */
  hasContext(): boolean {
    const conversation = this.store.getCurrentConversation();
    return conversation !== null && (
      conversation.messages.length > 0 || 
      conversation.summaries.length > 0
    );
  }
}

// Export singleton instance
export const contextWindowManager = new ContextWindowManager();
