import type { Settings } from "./settings"

export interface ProcessTextRequest {
  text: string;
  mode: "explain" | "summarize" | "analyze" | "translate";
  settings: {
    serverUrl: string;
    apiKey: string;
    geminiApiKey?: string;
    xaiApiKey?: string;
    geminiModel?: "gemini-pro" | "gemini-1.5-flash-8b" | "gemini-1.5-pro" | string;
    maxTokens?: number;
    stream?: boolean;
    translationSettings?: {
      fromLanguage: string;
      toLanguage: string;
    };
    modelType?: "local" | "openai" | "gemini" | "xai";
  };
  aborted?: boolean;
  isFollowUp?: boolean;
  context?: string;
}

export interface ProcessTextResponse {
  result?: string;
  error?: string;
  done?: boolean;
}

export interface StreamChunk {
  type: 'chunk' | 'error' | 'done';
  content?: string;
  error?: string;
} 