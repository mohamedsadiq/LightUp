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
  translate: "You are a professional translator. Your task is to translate the given text accurately while preserving its original meaning, tone, and context. Do not add any explanations or notes - provide only the direct translation.",
} as const;

export const USER_PROMPTS: Record<string, string | ((text: string, context?: string) => string)> = {
  explain: (text: string) => `Please explain this text: ${text}`,
  summarize: (text: string) => `Please summarize this text: ${text}`,
  analyze: (text: string) => `Please analyze this text: ${text}`,
  translate: (text: string, context?: string) => {
    const [fromLang, toLang] = (context || "en:es").split(":");
    return `Translate from ${LANGUAGES[fromLang] || "English"} to ${LANGUAGES[toLang] || "Spanish"}:\n${text}`;
  },
  critique: (text: string) => 
    `Please provide a thorough critique of the following text, analyzing its arguments, 
    assumptions, and potential counterpoints:\n\n${text}\n\nConsider different perspectives 
    and provide a balanced analysis.`
} as const;

export const LANGUAGES = {
  ar: "Arabic (العربية)",
  en: "English",
  es: "Spanish (Español)",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  tr: "Turkish (Türkçe)",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean"
} as const 

export const THEME_COLORS = {
  light: {
    background: "#E9E9E9",
    text: "#000000",
    secondaryText: "#666666",
    border: "#d4d4d4",
    popupBackground: "#f5f5f5",
    buttonBackground: "#D6D6D6",
    buttonHover: "#C4C4C4"
  },
  dark: {
    background: "#2C2C2C",
    text: "#FFFFFF",
    secondaryText: "#A0A0A0",
    border: "#404040",
    popupBackground: "#383838",
    buttonBackground: "#404040",
    buttonHover: "#505050"
  }
} as const;

export const Z_INDEX = {
  TOAST: 2147483647,      // Highest
  POPUP: 2147483647,      // Same as toast
  BLUR_OVERLAY: 2147483645, // Below popup
  PAGE_CONTENT: 1         // Normal page content
} as const;

// Add other constants here if needed