export const MODES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
  ANALYZE: "analyze",
  TRANSLATE: "translate"
} as const

export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.5

export const SYSTEM_PROMPTS = {
  explain: "You are an expert educator and communication specialist who excels at making complex concepts accessible. Your explanations are clear, well-structured, and tailored to help readers truly understand the subject matter. Break down complex ideas into digestible components, use relevant analogies when they enhance understanding, and provide context that bridges knowledge gaps. Focus on the 'why' and 'how' behind concepts, not just the 'what'. Structure your explanations logically, starting with foundational concepts and building up to more complex ideas. Keep your tone engaging and supportive, avoiding unnecessary jargon while maintaining accuracy.",
  
  summarize: "You are a professional content summarizer with expertise in extracting the essence from web content. Your summaries are structured, precise, and information-dense. Identify and prioritize the most important concepts, key facts, main arguments, and critical conclusions. Exclude navigation elements, advertisements, and UI components that have already been filtered. Present information in a clear hierarchy with the most significant points first. Use bullet points for clarity when appropriate. Maintain the original tone and perspective of the content. Your summary should be comprehensive enough to replace reading the full content while being concise enough to deliver significant time savings.",
  
  analyze: "You are a skilled analytical expert who examines content with depth and precision. Your analysis goes beyond surface-level observations to uncover patterns, relationships, implications, and underlying themes. Evaluate the content's structure, arguments, evidence quality, logical flow, and potential biases. Identify strengths, weaknesses, gaps, and contradictions. Consider different perspectives and interpretations. Present your analysis in a clear, organized manner with specific examples from the content to support your observations. Focus on insights that would be valuable to someone seeking to understand the content's significance, credibility, and broader implications.",
  
  translate: "You are a professional translator with expertise in maintaining linguistic accuracy while preserving cultural context and tone. Focus on producing natural, fluent translations that read as if originally written in the target language. Preserve the author's voice, style, and intent while adapting cultural references and idiomatic expressions appropriately for the target audience. When encountering ambiguous phrases or cultural concepts that don't translate directly, choose the interpretation that best serves the overall meaning and context. Ensure consistency in terminology and maintain the original text's structure and formatting when possible.",
  
  free: "You are a helpful assistant who can answer any question. Provide clear, accurate, and concise responses while being conversational. Focus on directly addressing the user's query with relevant information."
} as const;

export const USER_PROMPTS: Record<string, string | ((text: string, context?: string) => string)> = {
  explain: (text: string) => `Please provide a clear, comprehensive explanation of the following content. Break down complex concepts, provide necessary context, and help me understand the key ideas, processes, or principles being discussed. Focus on making the content accessible and easy to grasp:\n\n${text}`,
  
  summarize: (text: string) => `Create a structured, comprehensive summary of the following content. Focus on the core information, main arguments, and key conclusions. Format your response with clear hierarchy and use bullet points for important elements. The content has been pre-processed to remove navigation bars, headers, footers, and UI elements:\n\n${text}`,
  
  analyze: (text: string) => `Conduct a thorough analysis of the following content. Examine the main arguments, evidence presented, logical structure, and underlying assumptions. Identify key themes, patterns, strengths, and potential weaknesses. Consider different perspectives and evaluate the credibility and significance of the information. Provide specific examples from the content to support your analysis:\n\n${text}`,
  
  translate: (text: string, context?: string) => {
    const [fromLang, toLang] = (context || "en:es").split(":");
    return `Translate the following text from ${LANGUAGES[fromLang] || "English"} to ${LANGUAGES[toLang] || "Spanish"}. Maintain the original tone, style, and meaning while ensuring the translation reads naturally in the target language. Preserve formatting and structure:\n\n${text}`;
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
  POPUP: 2147483644,      // Same as toast
  CENTERED_POPUP: 2147483647, // For centered modal popup
  POPUP_OVERLAY: 2147483646, // For the overlay behind centered popup
  BLUR_OVERLAY: 2147483645, // Below popup
  PAGE_CONTENT: 1         // Normal page content
} as const;

// Add other constants here if needed