import type { Settings } from "./settings"

export interface ProcessTextRequest {
  text: string;
  mode: "explain" | "summarize" | "analyze";
  settings: {
    serverUrl: string;
    maxTokens?: number;
  };
  signal?: AbortSignal;
}

export interface ProcessTextResponse {
  result?: string;
  error?: string;
} 