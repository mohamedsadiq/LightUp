// Model types available in the extension
export type ModelType = "local" | "openai"

// Available modes for text processing
export type Mode = "explain" | "summarize" | "analyze"

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
  
  // User preferences
  mode?: Mode
  temperature?: number
  customPrompt?: string
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