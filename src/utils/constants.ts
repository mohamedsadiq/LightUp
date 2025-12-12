export const MODES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
  ANALYZE: "analyze",
  TRANSLATE: "translate"
} as const

export const DEFAULT_MAX_TOKENS = 1024
export const DEFAULT_TEMPERATURE = 0.5

// Helper function to extract word limit from a prompt string
// Looks for patterns like "200 words", "no more than 150 words", "max 300 words"
export const extractWordLimitFromPrompt = (prompt: string): number | null => {
  if (!prompt) return null;
  
  // Match patterns like "200 words", "no more than 200 words", "max 200 words", "~200 words"
  const patterns = [
    /no more than\s+(\d+)\s*words?/i,
    /max(?:imum)?\s+(\d+)\s*words?/i,
    /~(\d+)\s*words?/i,
    /(\d+)\s*words?\s+(?:or less|max|limit)/i,
    /(\d+)\s*words?/i
  ];
  
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const wordLimit = parseInt(match[1], 10);
      if (wordLimit > 0 && wordLimit < 10000) {
        return wordLimit;
      }
    }
  }
  
  return null;
}

// Convert word limit to approximate token limit (1 word ≈ 1.5 tokens on average)
export const wordLimitToTokens = (wordLimit: number): number => {
  return Math.ceil(wordLimit * 1.5) + 50; // Add buffer for formatting
}

// Get max tokens by checking prompt first, then falling back to response length setting
export const getMaxTokensFromPromptOrSetting = (
  _mode: string, 
  systemPrompt?: string
): number | undefined => {
  // First, try to extract word limit from the system prompt
  if (systemPrompt) {
    const wordLimit = extractWordLimitFromPrompt(systemPrompt);
    if (wordLimit) {
      return wordLimitToTokens(wordLimit);
    }
  }

  // No explicit limit detected – let downstream fall back to provider defaults
  return undefined;
}

export const SYSTEM_PROMPTS = {
  explain: "You are an expert educator who makes complex concepts accessible. Deliver explanations that are clear, structured, and concise. Use short paragraphs or bullet points where helpful, focus on the 'why' and 'how', and avoid unnecessary jargon.",
  
  summarize: "You are a professional content summarizer. Produce a concise summary in bullet points prioritizing the most important concepts, key facts, and conclusions. Exclude already-filtered UI elements. Maintain the original tone.",
  
  analyze: "You are an analytical expert. Provide a focused analysis highlighting patterns, implications, strengths, weaknesses, and notable insights. Use concise paragraphs or bullet points, citing brief examples where necessary. Avoid restating obvious points.",
  
  translate: "You are a professional translator with expertise in maintaining linguistic accuracy while preserving cultural context and tone. Focus on producing natural, fluent translations that read as if originally written in the target language. Preserve the author's voice, style, and intent while adapting cultural references and idiomatic expressions appropriately for the target audience. When encountering ambiguous phrases or cultural concepts that don't translate directly, choose the interpretation that best serves the overall meaning and context. Ensure consistency in terminology and maintain the original text's structure and formatting when possible.",
  
  free: "You are a helpful assistant who can answer any question. Provide clear, accurate, and concise responses while being conversational. Focus on directly addressing the user's query with relevant information."
} as const;

export const USER_PROMPTS: Record<string, string | ((text: string, context?: string) => string)> = {
  explain: (text: string) => `Explain the following content clearly and concisely. Break down complex ideas and provide essential context:\n\n${text}`,
  
  summarize: (text: string) => `Summarize the following content in bullet points, capturing main ideas and conclusions:\n\n${text}`,
  
  analyze: (text: string) => `Provide a concise analysis of the following content, highlighting patterns, strengths, weaknesses, and key insights:\n\n${text}`,
  
  translate: (text: string, context?: string) => {
    const [fromLang, toLang] = (context || "en:es").split(":");
    return `Translate the following text from ${LANGUAGES[fromLang] || "English"} to ${LANGUAGES[toLang] || "Spanish"}. Maintain the original tone, style, and meaning while ensuring the translation reads naturally in the target language. Preserve formatting and structure:\n\n${text}`;
  },
  
  critique: (text: string) => 
    `Analyze the key arguments and different viewpoints:\n\n${text}`,
  free: (text: string) => `${text}`
} as const;

export const LANGUAGES = {
  // Major Global Languages
  en: "English",
  es: "Spanish",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)", 
  hi: "Hindi",
  ar: "Arabic",
  pt: "Portuguese",
  bn: "Bengali",
  ru: "Russian",
  ja: "Japanese",
  
  // European Languages
  fr: "French",
  de: "German",
  it: "Italian",
  pl: "Polish",
  uk: "Ukrainian",
  nl: "Dutch",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  cs: "Czech",
  sk: "Slovak",
  hu: "Hungarian",
  ro: "Romanian",
  bg: "Bulgarian",
  hr: "Croatian",
  sl: "Slovenian",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  el: "Greek",
  tr: "Turkish",
  
  // Asian Languages
  ko: "Korean",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  tl: "Filipino",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
  fa: "Persian",
  he: "Hebrew",
  
  // Americas
  "pt-BR": "Portuguese (Brazil)",
  "es-MX": "Spanish (Mexico)",
  
  // African Languages
  sw: "Swahili",
  am: "Amharic",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
  zu: "Zulu",
  af: "Afrikaans"
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
  TOAST: 2147483647,          // Highest - System notifications
  CENTERED_POPUP: 2147483647, // Same as toast for modal popups
  POPUP_OVERLAY: 2147483646,  // For the overlay behind centered popup
  POPUP: 2147483645,          // Main popup content - Above blur overlay
  BLUR_OVERLAY: 2147483644,   // Below popup - Fixed z-index order
  GLOBAL_BUTTON: 2147483644,  // Global action button (same level as blur)
  SELECTION_BUTTON: 2147483643, // Text selection button (below popup)
  PAGE_CONTENT: 1             // Normal page content
} as const;

// Enhanced follow-up prompts that maintain context and analytical depth
export const FOLLOW_UP_SYSTEM_PROMPTS = {
  explain: "You are an expert educator maintaining your explanatory expertise from the previous interaction. Continue to provide clear, comprehensive explanations while building on the established context. Address follow-up questions with the same depth and educational approach, avoiding unnecessary repetition of already-covered basics.",
  
  summarize: "You are maintaining your role as a professional content summarizer. For follow-up questions, provide additional insights, clarifications, or deeper analysis of the content you've already summarized. Focus on aspects that weren't covered in the initial summary or that need further elaboration.",
  
  analyze: "You are continuing your analytical examination of the content. Maintain your critical, in-depth analytical perspective. For follow-up questions about 'strange', 'unusual', or 'problematic' aspects, dig deeper into genuinely noteworthy issues: technical contradictions, market positioning oddities, design choices that conflict with stated goals, claims that seem exaggerated or inconsistent with industry norms, or strategic decisions that appear counterintuitive. Avoid retreading the same obvious points - provide fresh, insightful observations.",
  
  translate: "You are maintaining your role as a professional translator. For follow-up questions, provide additional context about translation choices, cultural nuances, or alternative interpretations while maintaining your expertise in cross-cultural communication.",
  
  free: "You are continuing as a helpful assistant. Build on the previous conversation context while addressing the new question directly and thoughtfully."
} as const;

// Add other constants here if needed