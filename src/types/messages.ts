import type { Settings } from "./settings"

export interface ProcessTextRequest {
  text: string;
  mode: string;
  maxTokens: number;
  settings: Settings;
}

export interface ProcessTextResponse {
  result?: string;
  error?: string;
} 