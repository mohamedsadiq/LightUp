import type { Mode, ModelType, LocalModel } from "./settings"

export interface Entity {
  name: string;
  type: string;
  mentions: number;
  lastMentionedIndex: number;
  description?: string;
  relationships?: { [key: string]: string };
}

export interface ConversationContext {
  topic?: string;
  lastQuestion?: string;
  lastAnswer?: string;
  entities: Entity[];
  activeEntity: Entity | null;
  currentTopic: Entity | null;
  history: {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }[];
}

export interface ProcessTextRequest {
  text: string;
  context?: string;
  conversationContext?: ConversationContext;
  mode: Mode;
  settings: {
    serverUrl: string;
    apiKey: string;
    geminiApiKey?: string;
    xaiApiKey?: string;
    openaiApiKey?: string;
    geminiModel?: 
      | "gemini-1.5-pro" 
      | "gemini-1.5-flash" 
      | "gemini-1.5-flash-8b"
      | "gemini-2.0-flash"
      | "gemini-2.0-flash-lite-preview-02-05"
      | "gemini-2.0-flash-thinking-exp-01-21";
    grokModel?:
      | "grok-3"
      | "grok-3-mini"
      | "grok-3-fast"
      | "grok-3-mini-fast"
      | "grok-2-1212";
    localModel?: LocalModel;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    translationSettings?: {
      fromLanguage: string;
      toLanguage: string;
    };
    modelType: ModelType;
    customPrompts?: {
      systemPrompts: {
        [key in Mode]?: string;
      };
      userPrompts: {
        [key in Mode]?: string;
      };
    };
  };
  aborted?: boolean;
  isFollowUp?: boolean;
  id?: string;
  connectionId?: string;
}

export interface ProcessTextResponse {
  result?: string;
  error?: string;
  done?: boolean;
}

export interface StreamChunk {
  type: 'chunk' | 'error' | 'done' | 'aborted';
  content?: string;
  error?: string;
  isFollowUp?: boolean;
  id?: number;
} 