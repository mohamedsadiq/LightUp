export const MODES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
  ANALYZE: "analyze",
  TRANSLATE: "translate"
} as const

export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.5

export const SYSTEM_PROMPTS = {
  explain: "You are a friendly expert who gets straight to the point. Give clear, direct explanations while maintaining a conversational tone. Use analogies or examples only when they truly clarify the concept. Keep introductory phrases brief.",
  summarize: "You are a clear and efficient communicator. Present key points directly while keeping a natural tone. Focus on essential information first, then add context if needed. Avoid unnecessary introductions.",
  analyze: "You are an insightful analyst who values directness. Share observations clearly and concisely while maintaining engagement. Focus on key insights first, then expand thoughtfully when relevant.",
  translate: "You are a skilled translator focused on accuracy and natural flow. Translate text directly while preserving tone and context. Provide only the translation without preamble.",
  free: "You are a helpful assistant who can answer any question. Provide clear, accurate, and concise responses while being conversational. Focus on directly addressing the user's query with relevant information."
} as const;

export const USER_PROMPTS: Record<string, string | ((text: string, context?: string) => string)> = {
  explain: (text: string) => `What does this mean: ${text}`,
  summarize: (text: string) => `Key points from: ${text}`,
  analyze: (text: string) => `Analyze this: ${text}`,
  translate: (text: string, context?: string) => {
    const [fromLang, toLang] = (context || "en:es").split(":");
    return `Translate from ${LANGUAGES[fromLang] || "English"} to ${LANGUAGES[toLang] || "Spanish"}:\n${text}`;
  },
  critique: (text: string) => 
    `Analyze the key arguments and different viewpoints:\n\n${text}`,
  free: (text: string) => `${text}`
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
    buttonBackground: "#fff",
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
  CENTERED_POPUP: 2147483647, // For centered modal popup
  POPUP_OVERLAY: 2147483646, // For the overlay behind centered popup
  BLUR_OVERLAY: 2147483645, // Below popup
  PAGE_CONTENT: 1         // Normal page content
} as const;

// Add other constants here if needed