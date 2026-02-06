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
  sessionKey: string;
  startedAt: number;
}

export interface SessionMemoryConfig {
  maxMessages: number; // Maximum messages to keep
  maxTokens: number; // Token budget for context
  seedPreservation: boolean; // Always keep the first message (page context)
  tailSize: number; // Number of recent messages to keep in full
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: SessionMemoryConfig = {
  maxMessages: 50, // Increased from 10 since we use token-based trimming now
  maxTokens: 2000, // Conservative token budget
  seedPreservation: true,
  tailSize: 3, // Keep last 3 messages in full
};

// Advanced token estimation: ~4 chars per token for English, but we use 3.5 to be safe
// Also account for non-English characters which are often 1:1 or 1:2 token-to-char
const estimateTokens = (text: string): number => {
  if (!text) return 0;
  // Count non-ASCII characters (often multi-token)
  const nonAsciiCount = (text.match(/[^\x00-\x7F]/g) || []).length;
  const asciiCount = text.length - nonAsciiCount;
  
  // 3.5 chars per token for ASCII, 1.5 chars per token for non-ASCII (conservative)
  return Math.ceil((asciiCount / 3.5) + (nonAsciiCount / 1.5));
};

// ============================================================================
// SessionMemory Class
// ============================================================================

export class SessionMemory {
  private config: SessionMemoryConfig;
  private sessions: Map<string, SessionContext> = new Map();
  private currentDomain: string | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SessionMemoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Set up periodic cleanup every 30 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldSessions();
    }, 30 * 60 * 1000);
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  /**
   * Start or get session for a domain
   */
  getSession(domain: string): SessionContext {
    this.currentDomain = domain;
    return this.getOrCreateSession(domain);
  }

  /**
   * Start or get session for a specific key without mutating currentDomain
   */
  getSessionByKey(sessionKey: string): SessionContext {
    return this.getOrCreateSession(sessionKey);
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
   * Add assistant response to a specific session key
   */
  addAssistantMessageForKey(sessionKey: string, content: string): void {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    session.messages.push({
      role: "assistant",
      content,
      timestamp: Date.now(),
    });

    this.trimIfNeeded(session);
  }

  /**
   * Add user message to a specific session key
   */
  addUserMessageForKey(sessionKey: string, content: string): void {
    const session = this.sessions.get(sessionKey);
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
   * Get context string for LLM using Seed-Middle-Tail prioritization
   */
  getContextString(): string {
    if (!this.currentDomain) return "";

    const session = this.sessions.get(this.currentDomain);
    if (!session || session.messages.length === 0) return "";

    return this.buildContextString(session);
  }

  /**
   * Get context string for a specific session key
   */
  getContextStringForKey(sessionKey: string): string {
    const session = this.sessions.get(sessionKey);
    if (!session || session.messages.length === 0) return "";

    return this.buildContextString(session);
  }

  /**
   * Build context string from a session
   */
  private buildContextString(session: SessionContext): string {
    const messages = session.messages;
    const contextParts: string[] = [];
    let currentTokens = 0;

    // 1. Always include the SEED (first message) if enabled
    if (this.config.seedPreservation && messages.length > 0) {
      const seed = messages[0];
      const seedText = this.formatMessage(seed);
      contextParts.push(seedText);
      currentTokens += estimateTokens(seedText);
    }

    // 2. Identify TAIL (most recent messages)
    const tailStartIndex = Math.max(
      this.config.seedPreservation ? 1 : 0,
      messages.length - this.config.tailSize
    );
    const tailMessages = messages.slice(tailStartIndex);

    // 3. Identify MIDDLE (everything between seed and tail)
    const middleMessages = messages.slice(
      this.config.seedPreservation ? 1 : 0,
      tailStartIndex
    );

    // 4. Add TAIL messages (working backwards to fit budget)
    const tailParts: string[] = [];
    for (let i = tailMessages.length - 1; i >= 0; i--) {
      const msg = tailMessages[i];
      const formatted = this.formatMessage(msg);
      const tokens = estimateTokens(formatted);

      if (currentTokens + tokens > this.config.maxTokens) break;

      tailParts.unshift(formatted);
      currentTokens += tokens;
    }

    // 5. Add MIDDLE messages (highly compressed "Essence" mode)
    const middleParts: string[] = [];
    if (currentTokens < this.config.maxTokens && middleMessages.length > 0) {
      for (let i = middleMessages.length - 1; i >= 0; i--) {
        const msg = middleMessages[i];
        // Distill middle messages to just the first 100 chars to save space
        const content = msg.content.length > 100 
          ? msg.content.substring(0, 100) + "..." 
          : msg.content;
        const formatted = `(Past) ${msg.role === "user" ? "User" : "AI"}: ${content}`;
        const tokens = estimateTokens(formatted);

        if (currentTokens + tokens > this.config.maxTokens) break;

        middleParts.unshift(formatted);
        currentTokens += tokens;
      }
    }

    // Final assembly
    const finalParts = [];
    if (this.config.seedPreservation && contextParts.length > 0) {
      finalParts.push(contextParts[0]);
    }
    if (middleParts.length > 0) {
      finalParts.push("--- Past Conversation Essence ---");
      finalParts.push(...middleParts);
    }
    if (tailParts.length > 0) {
      finalParts.push("--- Recent Exchange ---");
      finalParts.push(...tailParts);
    }

    return finalParts.join("\n\n");
  }

  /**
   * Format message for context string
   */
  private formatMessage(msg: SessionMessage): string {
    const role = msg.role === "user" ? "User" : "Assistant";
    return `${role}: ${msg.content}`;
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
   * Check if there's any context for a specific session key
   */
  hasContextForKey(sessionKey: string): boolean {
    const session = this.sessions.get(sessionKey);
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

  /**
   * Get message count for a specific session key
   */
  getMessageCountForKey(sessionKey: string): number {
    const session = this.sessions.get(sessionKey);
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
   * Clear a specific session key
   */
  clearSessionByKey(sessionKey: string): void {
    this.sessions.delete(sessionKey);
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    this.sessions.clear();
    this.currentDomain = null;
  }

  /**
   * Clean up old sessions to prevent memory leaks
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 hours
    const MAX_DOMAINS = 100; // Maximum number of domains to keep
    
    // Remove sessions older than TTL
    for (const [sessionKey, session] of this.sessions.entries()) {
      if (now - session.startedAt > TTL) {
        this.sessions.delete(sessionKey);
      }
    }
    
    // If we still have too many domains, remove the oldest ones
    if (this.sessions.size > MAX_DOMAINS) {
      const sortedSessions = Array.from(this.sessions.entries())
        .sort((a, b) => a[1].startedAt - b[1].startedAt);
      
      const toRemove = sortedSessions.slice(0, this.sessions.size - MAX_DOMAINS);
      toRemove.forEach(([sessionKey]) => this.sessions.delete(sessionKey));
    }
  }

  /**
   * Cleanup method to be called when extension is shutting down
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clearAll();
  }

  /**
   * Get current session metrics
   */
  getMetrics(): { usedTokens: number; totalTokens: number; isDistilled: boolean } {
    if (!this.currentDomain) {
      return { usedTokens: 0, totalTokens: this.config.maxTokens, isDistilled: false };
    }

    const session = this.sessions.get(this.currentDomain);
    if (!session) {
      return { usedTokens: 0, totalTokens: this.config.maxTokens, isDistilled: false };
    }

    return this.getMetricsForKey(this.currentDomain);
  }

  /**
   * Get session metrics for a specific key
   */
  getMetricsForKey(sessionKey: string): { usedTokens: number; totalTokens: number; isDistilled: boolean } {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      return { usedTokens: 0, totalTokens: this.config.maxTokens, isDistilled: false };
    }

    // Calculate current usage of the generated context string
    const contextString = this.getContextStringForKey(sessionKey);
    const usedTokens = estimateTokens(contextString);

    // Distillation is active if we have more messages than are fully represented in the tail/seed
    const isDistilled = session.messages.length > (this.config.tailSize + (this.config.seedPreservation ? 1 : 0));

    return {
      usedTokens,
      totalTokens: this.config.maxTokens,
      isDistilled
    };
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

  /**
   * Create or retrieve a session for a given key
   */
  private getOrCreateSession(sessionKey: string): SessionContext {
    if (!this.sessions.has(sessionKey)) {
      this.sessions.set(sessionKey, {
        messages: [],
        sessionKey,
        startedAt: Date.now(),
      });
    }

    return this.sessions.get(sessionKey)!;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const sessionMemory = new SessionMemory();
