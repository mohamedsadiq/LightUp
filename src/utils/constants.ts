export const MODES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
  ANALYZE: "analyze",
  TRANSLATE: "translate"
} as const

export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.5

export const SYSTEM_PROMPTS = {
  explain: "You are a helpful assistant that explains text in a clear and concise way.",
  summarize: "You are a helpful assistant that summarizes text in a clear and concise way.",
  analyze: "You are a helpful assistant that analyzes text in detail.",
  translate: "You are a professional translator. Translate the text accurately while maintaining its original meaning and tone."
}

export const USER_PROMPTS = {
  explain: (text: string) => `Please explain this text: ${text}`,
  summarize: (text: string) => `Please summarize this text: ${text}`,
  analyze: (text: string) => `Please analyze this text: ${text}`,
  translate: (fromLang: string, toLang: string) => 
    `Please translate the following text from ${LANGUAGES[fromLang]} to ${LANGUAGES[toLang]}.`
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