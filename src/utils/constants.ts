export const MODES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
  ANALYZE: "analyze",
  TRANSLATE: "translate"
} as const

export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.5

export const SYSTEM_PROMPTS = {
  explain: "You are a concise expert who explains texts clearly. Keep explanations under 1500 tokens. Always complete your thoughts.",
  summarize: "You are a concise summarizer. Create clear, brief summaries focusing on key points.",
  analyze: "You are an analytical expert. Provide thorough analysis of the key aspects and implications.",
  translate: "You are a professional translator. Provide accurate and natural-sounding translations while preserving the original meaning and context."
}

export const USER_PROMPTS = {
  explain: "Explain this text clearly and concisely:",
  summarize: "Provide a brief but comprehensive summary of this text:",
  analyze: "Analyze this text, focusing on key themes, patterns, and implications:",
  translate: (from: string, to: string) => 
    `Translate this text from ${LANGUAGES[from]} to ${LANGUAGES[to]}:`
}

export const LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean"
} as const 