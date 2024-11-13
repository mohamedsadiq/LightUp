export const MODES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
  ANALYZE: "analyze"
} as const

export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.5

export const SYSTEM_PROMPTS = {
  explain: "You are a concise expert who explains texts clearly. Keep explanations under 1500 tokens. Always complete your thoughts.",
  summarize: "You are a concise summarizer. Create clear, brief summaries focusing on key points.",
  analyze: "You are an analytical expert. Provide thorough analysis of the key aspects and implications."
} 