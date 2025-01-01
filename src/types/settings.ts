// Model types available in the extension
export type ModelType = "local" | "openai" | "gemini" | "xai"

// Available modes for text processing
export type Mode = "explain" | "summarize" | "analyze" | "translate"

// Feedback types
export type FeedbackType = "like" | "dislike"

// Main settings interface
export interface Settings {
  // Required fields
  modelType: ModelType
  maxTokens: number
  
  // Optional fields depending on model type
  serverUrl?: string    // Required for local model
  apiKey?: string      // Required for OpenAI
  geminiApiKey?: string // Required for Gemini
  xaiApiKey?: string   // Required for xAI
  geminiModel?: GeminiModel
  
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

export type GeminiModel = "gemini-pro" | "gemini-pro-vision" | "gemini-1.0-pro" | "gemini-1.5-pro" | "gemini-1.5-flash-8b"; 