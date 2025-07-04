// Model types available in the extension
export type ModelType = "local" | "openai" | "gemini" | "xai" | "basic" | "grok"

// Available modes for text processing
export type Mode = "explain" | "summarize" | "analyze" | "translate" | "free"

// Feedback types
export type FeedbackType = "like" | "dislike"

// Grok model types
export type GrokModel =
  | "grok-3"            // Standard Grok-3 model
  | "grok-3-mini"       // Lightweight variant
  | "grok-3-fast"       // Latency-optimised Grok-3
  | "grok-3-mini-fast" // Mini + fast variant
  | "grok-2-1212";     // Latest Grok-2 build

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

// Rate limit interface
export interface RateLimit {
  actionsRemaining: number;  // Number of actions remaining for the day
  lastResetDate: string;     // ISO string of when the count was last reset
  dailyLimit: number;        // Maximum number of actions per day (default 10)
}

// Add a new interface for custom prompts
export interface CustomPrompts {
  systemPrompts: {
    [key in Mode]?: string;
  };
  userPrompts: {
    [key in Mode]?: string;
  };
}

// Main settings interface
export interface Settings {
  // Required fields
  modelType: ModelType
  maxTokens?: number
  rateLimit?: RateLimit
  
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
  preferredModes?: Mode[]  // Array of modes to display in the mode selector (max 4)
  customPrompts?: CustomPrompts // Custom prompt templates for each mode
  /** @deprecated Extended conversations are now enabled by default */
  extendedConversations?: boolean
  customization: {
    showSelectedText: boolean
    theme: "light" | "dark" | "system"
    radicallyFocus: boolean
    fontSize: "13px" | "14px" | "16px" | "18px" | "19px" | "21px" | "small" | "medium" | "large" | "x-large" | "xx-small" | "x-small" | "xx-large"
    highlightColor: "default" | "yellow" | "orange" | "blue" | "green" | "purple" | "pink"
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
  | "gemini-1.5-pro" 
  | "gemini-1.5-flash" 
  | "gemini-1.5-flash-8b"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite-preview-02-05"
  | "gemini-2.0-flash-thinking-exp-01-21"; 