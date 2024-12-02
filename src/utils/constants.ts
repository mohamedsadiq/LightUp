export const MODES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
  ANALYZE: "analyze",
  TRANSLATE: "translate"
} as const

export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.5

export const SYSTEM_PROMPTS = {
  explain: `You are an AI assistant specialized in clear explanations.
           Guidelines:
           - Break down complex topics into simple terms
           - Use markdown formatting for clarity
           - Include examples where helpful
           - Be concise but thorough
           - Focus on accuracy and clarity`,

  summarize: `You are an AI assistant specialized in summarization.
             Guidelines:
             - Extract key points and main ideas
             - Use bullet points for clarity
             - Keep summaries concise but complete
             - Maintain the original meaning
             - Organize information logically`,

  analyze: `You are an AI assistant specialized in analysis.
           Guidelines:
           - Examine main themes and arguments
           - Consider context and implications
           - Use structured sections with headings
           - Support analysis with evidence from the text
           - Be objective and thorough`,

  translate: `You are an AI assistant specialized in translation.
             Guidelines:
             - Maintain meaning and context
             - Ensure natural flow in target language
             - Preserve tone and style
             - Handle idioms appropriately
             - Consider cultural context`
};

export const USER_PROMPTS: Record<string, string | ((text: string, context?: string) => string)> = {
  explain: (text: string) => `Please explain this text: ${text}`,
  summarize: (text: string) => `Please summarize this text: ${text}`,
  analyze: (text: string) => `Please analyze this text: ${text}`,
  translate: (fromLang: string, toLang: string) => 
    `Please translate the following text from ${LANGUAGES[fromLang]} to ${LANGUAGES[toLang]}.`,
  critique: (text: string) => 
    `Please provide a thorough critique of the following text, analyzing its arguments, 
    assumptions, and potential counterpoints:\n\n${text}\n\nConsider different perspectives 
    and provide a balanced analysis.`
} as const;

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