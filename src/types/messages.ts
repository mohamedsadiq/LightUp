import type { Settings } from "./settings"

export interface ProcessTextRequest {
  text: string;
  mode: "explain" | "summarize" | "analyze" | "translate";
  settings: {
    serverUrl: string;
    apiKey: string;
    maxTokens?: number;
    stream?: boolean;
    translationSettings?: {
      fromLanguage: string;
      toLanguage: string;
    };
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