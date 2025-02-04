import type { Mode, ModelType, LocalModel } from "./settings"

export interface ProcessTextRequest {
  text: string;
  context?: string;
  mode: Mode;
  settings: {
    serverUrl: string;
    apiKey: string;
    geminiApiKey?: string;
    xaiApiKey?: string;
    openaiApiKey?: string;
    geminiModel?: "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-1.5-flash-8b";
    grokModel?: "grok-2" | "grok-2-latest" | "grok-beta";
    localModel?: LocalModel;
    maxTokens?: number;
    stream?: boolean;
    translationSettings?: {
      fromLanguage: string;
      toLanguage: string;
    };
    modelType: ModelType;
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