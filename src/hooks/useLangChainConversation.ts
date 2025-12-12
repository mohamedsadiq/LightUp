import { useState, useCallback, useEffect } from "react";
import { Storage } from "@plasmohq/storage";
import type { Settings } from "~types/settings";

// Enhanced conversation state with memory management
export interface EnhancedConversationState {
  memory: {
    history: Array<{
      role: "human" | "ai";
      content: string;
      timestamp: number;
    }>;
    summary?: string;
    maxTokens: number;
    windowSize: number;
  };
  stats: {
    messageCount: number;
    tokensUsed: number;
    memoryType: "buffer" | "summary" | "window" | "summary_buffer";
  };
  insights: {
    topics: string[];
    contextAwareness: number; // 0-1 score
    needsSummarization: boolean;
    conversationFlow: "good" | "fragmented" | "needs_context";
  };
}

export const useEnhancedConversation = (settings: Settings) => {
  const [conversationState, setConversationState] = useState<EnhancedConversationState>({
    memory: {
      history: [],
      maxTokens: 1500,
      windowSize: 6
    },
    stats: {
      messageCount: 0,
      tokensUsed: 0,
      memoryType: "buffer"
    },
    insights: {
      topics: [],
      contextAwareness: 0,
      needsSummarization: false,
      conversationFlow: "good"
    }
  });

  const storageKey = "enhanced_conversation_state";

  // Load conversation state on mount
  useEffect(() => {
    const loadState = async () => {
      const storage = new Storage();
      const saved = await storage.get<EnhancedConversationState>(storageKey);
      if (saved) {
        setConversationState(saved);
      }
    };
    loadState();
  }, []);

  // Save state whenever it changes
  const saveState = useCallback(async (state: EnhancedConversationState) => {
    const storage = new Storage();
    await storage.set(storageKey, state);
  }, []);

  /**
   * Enhanced prompt builder that includes conversation context and intelligence
   */
  const buildContextualPrompt = useCallback(async (userInput: string, mode: string = "free"): Promise<{
    systemPrompt: string;
    userPrompt: string;
    hasContext: boolean;
    contextQuality: "excellent" | "good" | "basic" | "none";
  }> => {
    const memory = conversationState.memory;
    const hasContext = memory.history.length > 0;

    // Enhanced system prompt with conversation intelligence
    let systemPrompt = `You are LightUp AI, an intelligent browser extension assistant that helps users understand and analyze web content more effectively. Your core philosophy is "Read Smarter, Not Harder" - helping users grasp complex information quickly and efficiently.

CORE CAPABILITIES:
- Analyze and explain web content, articles, and documents
- Provide summaries and key insights  
- Translate content while preserving meaning and context
- Answer follow-up questions with full conversation awareness
- Adapt response style based on user preferences and content complexity

ENHANCED CONVERSATION INTELLIGENCE:
- Maintain conversation continuity and reference previous discussions when relevant
- Build on previous explanations and avoid repetition unless clarification is needed
- Remember user preferences and adapt explanations accordingly
- Identify when the user is asking follow-up questions about the same topic
- Provide contextually relevant examples based on the conversation history

INSTRUCTIONS:
1. ALWAYS maintain conversation continuity - if this is a follow-up question, reference and build on previous answers
2. Provide clear, actionable insights that help users understand content better
3. Use examples and analogies to explain complex concepts
4. Ask clarifying questions when the user's intent is unclear
5. Adapt your expertise level to match the user's demonstrated knowledge from the conversation`;

    let contextQuality: "excellent" | "good" | "basic" | "none" = "none";

    // Add conversation context if available
    if (hasContext) {
      const recentHistory = memory.history.slice(-memory.windowSize);
      const contextString = recentHistory
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');

      systemPrompt += `\n\nCONVERSATION CONTEXT:\n${contextString}`;

      // Add summary if available  
      if (memory.summary) {
        systemPrompt += `\n\nCONVERSATION SUMMARY: ${memory.summary}`;
        contextQuality = "excellent";
      } else if (recentHistory.length >= 4) {
        contextQuality = "good";
      } else if (recentHistory.length >= 2) {
        contextQuality = "basic";
      }

      // Add topic analysis
      const topics = conversationState.insights.topics;
      if (topics.length > 0) {
        systemPrompt += `\n\nCONVERSATION TOPICS: ${topics.join(', ')}`;
      }
    }

    // Enhanced user prompt with mode context and conversation awareness
    let userPrompt = userInput;
    if (mode !== "free") {
      userPrompt = `[Mode: ${mode}] ${userInput}`;
    }

    if (hasContext) {
      // Analyze if this is likely a follow-up question
      const isFollowUp = isLikelyFollowUpQuestion(userInput, memory.history);
      
      if (isFollowUp) {
        userPrompt = `FOLLOW-UP QUESTION: ${userPrompt}

Please provide a response that builds on our previous discussion. Reference relevant points from our conversation history and provide new insights that complement what we've already covered.`;
      } else {
        userPrompt = `NEW TOPIC: ${userPrompt}

Please provide a fresh analysis while being aware of our conversation context.`;
      }
    }

    return {
      systemPrompt,
      userPrompt,
      hasContext,
      contextQuality
    };
  }, [conversationState.memory, conversationState.insights]);

  /**
   * Add message to conversation memory with intelligent management
   */
  const addToMemory = useCallback(async (userInput: string, aiResponse: string) => {
    setConversationState(prev => {
      const newMemory = { ...prev.memory };
      
      // Add new messages
      newMemory.history.push(
        {
          role: "human",
          content: userInput,
          timestamp: Date.now()
        },
        {
          role: "ai", 
          content: aiResponse,
          timestamp: Date.now()
        }
      );

      // Estimate token usage
      const tokenEstimate = Math.ceil((userInput.length + aiResponse.length) / 4);

      // Intelligent memory management
      const managedMemory = manageMemorySize(newMemory, tokenEstimate);
      
      // Extract insights
      const insights = analyzeConversationInsights(managedMemory.history);

      const newState: EnhancedConversationState = {
        memory: managedMemory,
        stats: {
          messageCount: managedMemory.history.filter(m => m.role === "human").length,
          tokensUsed: prev.stats.tokensUsed + tokenEstimate,
          memoryType: prev.stats.memoryType
        },
        insights
      };

      // Save to storage
      saveState(newState);
      
      return newState;
    });
  }, [saveState]);

  /**
   * Process message with enhanced conversation context
   */
  const processMessage = useCallback(async (userInput: string, mode: string = "free"): Promise<{
    response: string;
    memoryUsed: boolean;
    tokenCount?: number;
    contextQuality: "excellent" | "good" | "basic" | "none";
  }> => {
    try {
      // Get enhanced prompt context
      const promptContext = await buildContextualPrompt(userInput, mode);
      
      // This would integrate with your existing LLM services
      // For demonstration, showing what enhanced context looks like
      const response = `[Enhanced Conversation Mode]

Context Quality: ${promptContext.contextQuality}
Has Previous Context: ${promptContext.hasContext}

Your LLM service would use:
- System Prompt: Enhanced with conversation context and continuity instructions
- User Prompt: "${promptContext.userPrompt}"

This enables ChatGPT-like conversation continuity where the AI remembers previous interactions and builds upon them naturally.`;
      
      // Add to memory
      await addToMemory(userInput, response);
      
      return {
        response,
        memoryUsed: promptContext.hasContext,
        contextQuality: promptContext.contextQuality,
        tokenCount: Math.ceil((userInput.length + response.length) / 4)
      };
      
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        response: "I'm having trouble accessing conversation memory. Please try again.",
        memoryUsed: false,
        contextQuality: "none"
      };
    }
  }, [buildContextualPrompt, addToMemory]);

  /**
   * Clear conversation memory
   */
  const clearMemory = useCallback(async () => {
    const clearedState: EnhancedConversationState = {
      memory: {
        history: [],
        maxTokens: 1500,
        windowSize: 6
      },
      stats: {
        messageCount: 0,
        tokensUsed: 0,
        memoryType: "buffer"
      },
      insights: {
        topics: [],
        contextAwareness: 0,
        needsSummarization: false,
        conversationFlow: "good"
      }
    };

    setConversationState(clearedState);
    await saveState(clearedState);
  }, [saveState]);

  /**
   * Get enhanced conversation insights for UI display
   */
  const getConversationInsights = useCallback(() => {
    const { insights, stats } = conversationState;
    
    return {
      ...insights,
      messageCount: stats.messageCount,
      tokensUsed: stats.tokensUsed,
      memoryType: stats.memoryType,
      suggestions: generateConversationSuggestions(conversationState)
    };
  }, [conversationState]);

  /**
   * Export conversation for analysis or backup
   */
  const exportConversation = useCallback(async () => {
    return {
      memoryType: conversationState.stats.memoryType,
      history: conversationState.memory.history.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n'),
      timestamp: Date.now(),
      insights: conversationState.insights
    };
  }, [conversationState]);

  return {
    conversationState,
    buildContextualPrompt,
    processMessage,
    addToMemory,
    clearMemory,
    getConversationInsights,
    exportConversation
  };
};

// Helper functions
function isLikelyFollowUpQuestion(input: string, history: Array<{content: string}>): boolean {
  const followUpIndicators = [
    'what about', 'tell me more', 'explain', 'why', 'how', 'can you',
    'what else', 'more details', 'expand on', 'clarify', 'also', 'and'
  ];
  
  const lowercaseInput = input.toLowerCase();
  const hasFollowUpWords = followUpIndicators.some(indicator => 
    lowercaseInput.includes(indicator)
  );
  
  // Check if recent conversation exists
  const recentConversation = history.slice(-4);
  const hasRecentContext = recentConversation.length >= 2;
  
  return hasFollowUpWords && hasRecentContext;
}

function manageMemorySize(memory: EnhancedConversationState['memory'], newTokens: number): EnhancedConversationState['memory'] {
  const totalTokens = estimateTokenUsage(memory.history) + newTokens;
  
  if (totalTokens > memory.maxTokens) {
    // Keep only the most recent messages within token limit
    const reducedHistory = [...memory.history];
    
    while (reducedHistory.length > 2 && estimateTokenUsage(reducedHistory) > memory.maxTokens) {
      // Remove oldest pair (human + ai message)
      reducedHistory.splice(0, 2);
    }
    
    return {
      ...memory,
      history: reducedHistory,
      summary: memory.summary || createSimpleSummary(memory.history.slice(0, memory.history.length - reducedHistory.length))
    };
  }
  
  return memory;
}

function estimateTokenUsage(history: Array<{ content: string }>): number {
  return history.reduce((total, msg) => total + Math.ceil(msg.content.length / 4), 0);
}

function createSimpleSummary(messages: Array<{ role: string; content: string }>): string {
  const topics = extractTopics(messages);
  return `Previous discussion covered: ${topics.join(', ')}`;
}

function extractTopics(messages: Array<{ content: string }>): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  const words = messages
    .flatMap(msg => msg.content.toLowerCase().split(/\s+/))
    .filter(word => word.length > 3 && !commonWords.has(word))
    .filter(word => /^[a-z]+$/.test(word));
  
  const wordCounts = words.reduce((counts, word) => {
    counts[word] = (counts[word] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

function analyzeConversationInsights(history: Array<{ role: string; content: string; timestamp: number }>): EnhancedConversationState['insights'] {
  const topics = extractTopics(history);
  const messageCount = history.filter(m => m.role === "human").length;
  
  // Calculate context awareness score
  const contextAwareness = Math.min(messageCount / 10, 1); // Max score at 10 exchanges
  
  // Determine if summarization is needed
  const needsSummarization = history.length > 20;
  
  // Analyze conversation flow
  let conversationFlow: "good" | "fragmented" | "needs_context" = "good";
  if (messageCount < 2) {
    conversationFlow = "needs_context";
  } else if (topics.length < messageCount / 3) {
    conversationFlow = "fragmented";
  }
  
  return {
    topics,
    contextAwareness,
    needsSummarization,
    conversationFlow
  };
}

function generateConversationSuggestions(state: EnhancedConversationState): string[] {
  const suggestions: string[] = [];
  
  if (state.insights.conversationFlow === "fragmented") {
    suggestions.push("Try asking follow-up questions to maintain topic continuity");
  }
  
  if (state.insights.needsSummarization) {
    suggestions.push("Consider starting a new conversation or clearing memory for better performance");
  }
  
  if (state.insights.contextAwareness < 0.3) {
    suggestions.push("Ask more detailed questions to help me understand your needs better");
  }
  
  if (state.insights.topics.length > 0) {
    suggestions.push(`Current topics: ${state.insights.topics.join(', ')}`);
  }
  
  return suggestions;
} 