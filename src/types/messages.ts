import type { Settings } from "./settings"

export interface ProcessTextRequest {
  text: string;
  mode: "explain" | "summarize" | "analyze" | "translate";
  settings: {
    serverUrl: string;
    apiKey: string;
    maxTokens?: number;
    translationSettings?: {
      fromLanguage: string;
      toLanguage: string;
    };
  };
  signal?: AbortSignal;
}

export interface ProcessTextResponse {
  result?: string;
  error?: string;
} 