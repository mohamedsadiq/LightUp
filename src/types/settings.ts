// Model types available in the extension
export type ModelType = "local" | "openai" | "gemini" | "xai" | "basic" | "grok"

// Available modes for text processing
export type Mode =
  | "explain"
  | "summarize"
  | "analyze"
  | "challenge"
  | "translate"
  | "free"

// Feedback types
export type FeedbackType = "like" | "dislike"

// Grok model types
export type GrokModel =
  | "grok-4-1-fast-reasoning"
  | "grok-4-1-fast-non-reasoning"
  | "grok-4-fast-reasoning"
  | "grok-4-fast-non-reasoning"
  | "grok-4"
  | "grok-4-0709"
  | "grok-code-fast-1"
  | "grok-3"
  | "grok-3-mini"
  | "grok-3-fast"
  | "grok-3-mini-fast"
  | "grok-2-image-1212"
  | "grok-2-vision"
  | "grok-2-1212"

// Local model types
export type LocalModel =
  | "llama-4-70b"
  | "llama-4-40b"
  | "llama-3.3-70b"
  | "llama-3.3-8b"
  | "llama-3.2-3b-instruct"
  | "llama-3.2-1b"
  | "llama-3.1-405b"
  | "llama-3.1-70b"
  | "llama-3.1-8b"
  | "llama-2-70b-chat"
  | "llama-2-13b-chat"
  | "deepseek-r1-distill-llama-70b"
  | "deepseek-r1-distill-llama-8b"
  | "deepseek-r1-distill-qwen-32b"
  | "deepseek-r1-distill-qwen-14b"
  | "deepseek-r1-distill-qwen-7b"
  | "deepseek-r1-distill-qwen-1.5b"
  | "deepseek-v3.1"
  | "deepseek-v3"
  | "deepseek-v3-base"
  | "deepseek-coder-v2"
  | "deepseek-coder-33b"
  | "deepseek-coder-6.7b"
  | "qwen3-32b"
  | "qwen3-14b"
  | "qwen2.5-72b"
  | "qwen2.5-32b"
  | "qwen2.5-14b"
  | "qwen2.5-7b"
  | "qwen2.5-3b"
  | "qwen2.5-coder-32b"
  | "qwen2.5-coder-7b"
  | "qwen2.5-math-72b"
  | "qwen2.5-math-7b"
  | "mistral-large-240b"
  | "mixtral-8x22b"
  | "mixtral-8x7b-instruct"
  | "mistral-7b-instruct-v0.3"
  | "codestral-22b"
  | "phi-3-mini-4k"
  | "phi-3-mini-128k"
  | "phi-3-medium-128k"
  | "phi-4"
  | "gemma3-27b"
  | "gemma3-9b"
  | "gemma3-4b"
  | "gemma2-27b"
  | "gemma2-9b"
  | "neural-chat-7b-v3-1"
  | "openchat-3.5"

// OpenAI model types
export type OpenAIModel =
  | "gpt-5.2"
  | "gpt-5.2-pro"
  | "gpt-5.2-codex"
  | "gpt-5.1"
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-4.1"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "o4-mini"
  | "o3"
  | "o3-pro"
  | "o3-mini"
  | "o3-deep-research"
  | "o1"
  | "o1-pro"
  | "o1-mini"
  | "gpt-oss-120b"
  | "gpt-oss-20b"
  | "gpt-4-turbo"

// Rate limit interface
export interface RateLimit {
  actionsRemaining: number // Number of actions remaining for the day
  lastResetDate: string // ISO string of when the count was last reset
  dailyLimit: number // Maximum number of actions per day (default 80)
}

// Add a new interface for custom prompts
export interface CustomPrompts {
  systemPrompts: {
    [key in Mode]?: string
  }
  userPrompts: {
    [key in Mode]?: string
  }
}

// Main settings interface
export interface Settings {
  // Required fields
  modelType: ModelType
  maxTokens?: number
  rateLimit?: RateLimit

  // Optional fields depending on model type
  serverUrl?: string // Required for local model
  apiKey?: string // Required for OpenAI
  geminiApiKey?: string // Required for Gemini
  xaiApiKey?: string // Required for xAI
  geminiModel?: GeminiModel
  grokModel?: GrokModel // Add Grok model selection
  openaiModel?: OpenAIModel
  localModel?: string
  basicModel?: "grok-4-1-fast-non-reasoning" // xAI Grok 4.1 Fast - fastest and cheapest for basic version

  // User preferences
  mode?: Mode
  temperature?: number
  customPrompt?: string
  preferredModes?: Mode[] // Array of modes to display in the mode selector (max 3)
  customPrompts?: CustomPrompts // Custom prompt templates for each mode
  /** @deprecated Extended conversations are now enabled by default */
  extendedConversations?: boolean
  customization: {
    showSelectedText: boolean
    theme: "light" | "dark" | "system"
    radicallyFocus: boolean
    fontSize:
      | "13px"
      | "14px"
      | "16px"
      | "18px"
      | "19px"
      | "21px"
      | "small"
      | "medium"
      | "large"
      | "x-large"
      | "xx-small"
      | "x-small"
      | "xx-large"
    highlightColor:
      | "default"
      | "yellow"
      | "orange"
      | "blue"
      | "green"
      | "purple"
      | "pink"
    popupAnimation: "none" | "scale" | "fade" | "slide"
    persistHighlight: boolean
    layoutMode: "floating" | "sidebar" | "centered"
    popupMargin?: number // Distance from viewport edges in floating mode (default: 8px)
    showGlobalActionButton?: boolean // Controls visibility of the Quick View button
    quickView?: boolean // Controls visibility of floating button for instant page content processing
    automaticActivation?: boolean // Show popup automatically when text is selected
    contextAwareness?: boolean // New setting for context awareness
    activationMode?: "automatic" | "manual" // Controls whether popup shows automatically or requires context menu
    enablePDFSupport: boolean
    showTextSelectionButton: boolean // Controls visibility of the text selection button
    showWebsiteInfo?: boolean // Controls visibility of website info (favicon and title)
    sidebarPinned?: boolean // Controls whether sidebar is pinned to the page (embedded) or overlay
    // Word-by-word streaming settings
    enableWordByWordStreaming?: boolean // Enable/disable Perplexity-style word-by-word streaming
    streamingSpeed?: "slow" | "medium" | "fast" | "custom" // Predefined speed settings
    customWordsPerSecond?: number // Custom words per second (used when streamingSpeed is "custom")
  }
  translationSettings?: {
    fromLanguage: string
    toLanguage: string
  }

  // AI response language
  aiResponseLanguage?: string // Language for AI responses (default: 'en')

  // Debug settings
  debug?: {
    enableContentExtractionDebug?: boolean // Enables debug visualization of content extraction
    verboseLogging?: boolean // Enables more detailed logging
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
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash-image"
  | "gemini-2.5-flash-live"
  | "gemini-3-pro-preview"
  | "gemini-3-flash-preview"
  | "gemini-3-pro-image-preview"
  | "gemini-3-flash"
