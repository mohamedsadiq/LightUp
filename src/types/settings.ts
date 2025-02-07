// Model types available in the extension
export type ModelType = "local" | "openai" | "gemini" | "xai" | "basic"

// Available modes for text processing
export type Mode = "explain" | "summarize" | "analyze" | "translate"

// Feedback types
export type FeedbackType = "like" | "dislike"

// Grok model types
export type GrokModel = "grok-2" | "grok-2-latest" | "grok-beta";

// Local model types
export type LocalModel = 
  | "llama-3.2-3b-instruct"
  | "deepseek-v3"
  | "deepseek-v3-base"
  | "llama-2-70b-chat"
  | "llama-2-13b-chat"
  | "mistral-7b-instruct"
  | "mixtral-8x7b-instruct"
  | "phi-2"
  | "neural-chat-7b-v3-1"
  | "openchat-3.5";

// Main settings interface
export interface Settings {
  // Required fields
  modelType: ModelType
  maxTokens?: number
  
  // Optional fields depending on model type
  serverUrl?: string    // Required for local model
  apiKey?: string      // Required for OpenAI
  geminiApiKey?: string // Required for Gemini
  xaiApiKey?: string   // Required for xAI
  geminiModel?: string
  grokModel?: string  // Add Grok model selection
  localModel?: string
  basicModel?: "gemini-2.0-flash-lite-preview-02-05" // Only one model for basic version
  
  // User preferences
  mode?: Mode
  temperature?: number
  customPrompt?: string
  customization: {
    showSelectedText: boolean
    theme: "light" | "dark"
    radicallyFocus: boolean
    fontSize: "0.8rem" | "0.9rem" | "1rem"
    highlightColor: "default" | "orange" | "blue" | "green" | "purple" | "pink"
    popupAnimation: "none" | "scale" | "fade"
    persistHighlight: boolean
  }
  translationSettings?: {
    fromLanguage: string
    toLanguage: string
  }
}

// Extended settings state with additional properties
export interface SettingsState extends Settings {
  isConfigured: boolean
  error?: string
}

// Feedback data structure
export interface Feedback {
  id: string
  text: string
  feedback: FeedbackType
  context: string
  timestamp: number
}

// Response structure from LLM
export interface LLMResponse {
  result?: string
  error?: string
}

// Configuration status
export interface ConfigStatus {
  isValid: boolean
  error?: string
}

// Theme settings (if you want to add theming later)
export interface ThemeSettings {
  isDarkMode?: boolean
  primaryColor?: string
  fontSize?: number
}

// Combined settings for storage
export interface StorageSettings {
  settings: Settings
  theme?: ThemeSettings
  feedbacks?: Feedback[]
}

// Add to existing types
export interface FeedbackPattern {
  pattern: string
  frequency: number
  lastUsed: number
}

export interface FeedbackContext {
  positivePatterns: FeedbackPattern[]
  negativePatterns: FeedbackPattern[]
}

// Add a new interface for translation settings
export interface TranslationSettings {
  fromLanguage: string
  toLanguage: string
}

export type GeminiModel = 
  | "gemini-1.5-pro" 
  | "gemini-1.5-flash" 
  | "gemini-1.5-flash-8b"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite-preview-02-05"
  | "gemini-2.0-flash-thinking-exp-01-21"; 