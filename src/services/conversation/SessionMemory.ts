/**
 * SessionMemory - Privacy-First Session-Only Conversation Memory
 * 
 * PRIVACY PRINCIPLES:
 * - NO persistent storage - data lives only in memory
 * - Cleared automatically when popup closes or page navigates
 * - No entity extraction or tracking
 * - Minimal data retention - only what's needed for context
 * 
 * PURPOSE: Maintain conversation context during active use
 * without leaving any trace after the session ends.
 * 
 * @author LightUp Team
 * @since 2024-12
 */

// ============================================================================
// Types
// ============================================================================

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface SessionContext {
  messages: SessionMessage[];
  domain: string;
  startedAt: number;
}

export interface SessionMemoryConfig {
  maxMessages: number; // Maximum messages to keep
  maxTokens: number; // Token budget for context
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: SessionMemoryConfig = {
  maxMessages: 10, // Keep only last 10 messages
  maxTokens: 2000, // Conservative token budget
};

// Simple token estimation
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// ============================================================================
// SessionMemory Class
// ============================================================================

export class SessionMemory {
  private config: SessionMemoryConfig;
  private sessions: Map<string, SessionContext> = new Map();
  private currentDomain: string | null = null;

  constructor(config?: Partial<SessionMemoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  /**
   * Start or get session for a domain
   */
  getSession(domain: string): SessionContext {
    this.currentDomain = domain;

    if (!this.sessions.has(domain)) {
      this.sessions.set(domain, {
        messages: [],
        domain,
        startedAt: Date.now(),
      });
    }

    return this.sessions.get(domain)!;
  }

  /**
   * Add user message
   */
  addUserMessage(content: string): void {
    if (!this.currentDomain) return;

    const session = this.sessions.get(this.currentDomain);
    if (!session) return;

    session.messages.push({
      role: "user",
      content,
      timestamp: Date.now(),
    });

    this.trimIfNeeded(session);
  }

  /**
   * Add assistant response
   */
  addAssistantMessage(content: string): void {
    if (!this.currentDomain) return;

    const session = this.sessions.get(this.currentDomain);
    if (!session) return;

    session.messages.push({
      role: "assistant",
      content,
      timestamp: Date.now(),
    });

    this.trimIfNeeded(session);
  }

  // --------------------------------------------------------------------------
  // Context Building
  // --------------------------------------------------------------------------

  /**
   * Get context string for LLM (recent messages only)
   */
  getContextString(): string {
    if (!this.currentDomain) return "";

    const session = this.sessions.get(this.currentDomain);
    if (!session || session.messages.length === 0) return "";

    // Build simple context from recent messages
    const contextParts: string[] = [];
    let tokenCount = 0;

    // Work backwards from most recent
    for (let i = session.messages.length - 1; i >= 0 && tokenCount < this.config.maxTokens; i--) {
      const msg = session.messages[i];
      const msgTokens = estimateTokens(msg.content);

      if (tokenCount + msgTokens > this.config.maxTokens) break;

      const role = msg.role === "user" ? "User" : "Assistant";
      const truncatedContent = msg.content.length > 200 
        ? msg.content.substring(0, 200) + "..." 
        : msg.content;
      
      contextParts.unshift(`${role}: ${truncatedContent}`);
      tokenCount += msgTokens;
    }

    if (contextParts.length === 0) return "";

    return contextParts.join("\n\n");
  }

  /**
   * Check if there's any context
   */
  hasContext(): boolean {
    if (!this.currentDomain) return false;
    const session = this.sessions.get(this.currentDomain);
    return session !== undefined && session.messages.length > 0;
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    if (!this.currentDomain) return 0;
    const session = this.sessions.get(this.currentDomain);
    return session?.messages.length || 0;
  }

  // --------------------------------------------------------------------------
  // Privacy Controls
  // --------------------------------------------------------------------------

  /**
   * Clear current session - user-triggered
   */
  clearCurrentSession(): void {
    if (this.currentDomain) {
      this.sessions.delete(this.currentDomain);
    }
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    this.sessions.clear();
    this.currentDomain = null;
  }

  /**
   * Get current domain
   */
  getCurrentDomain(): string | null {
    return this.currentDomain;
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /**
   * Trim session to stay within limits
   */
  private trimIfNeeded(session: SessionContext): void {
    // Keep only last N messages
    if (session.messages.length > this.config.maxMessages) {
      session.messages = session.messages.slice(-this.config.maxMessages);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const sessionMemory = new SessionMemory();
