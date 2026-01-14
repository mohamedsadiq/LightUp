# LightUp Extension Codebase Map

## Overview
LightUp is a privacy-first AI browser extension built with Plasmo framework that provides intelligent text analysis, conversation features, and content summarization across web pages.

## Directory Structure

```
src/
├── animations/           # Animation utilities and effects
├── assets/              # Static assets (fonts, images)
├── background/          # Service worker / background scripts
├── components/          # Reusable React components
├── config/              # Configuration files
├── contents/            # Content scripts (injected into web pages)
├── contexts/            # React context providers
├── docs/                # Documentation
├── evals/               # Evaluation and testing utilities
├── feedback/            # Feedback collection system
├── hooks/               # Custom React hooks
├── locales/             # Internationalization files
├── options/             # Extension options/settings page
├── popup/               # Extension popup UI
├── services/            # Core business logic services
├── settings/            # Settings management
├── shims/               # Browser API shims
├── styles/              # Global styles and themes
├── tabs/                # Tab management utilities
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── welcome/             # Welcome/onboarding experience
└── workers/             # Web workers
```

## Core Architecture

### 1. **Entry Points**

#### `/src/popup/`
- **Purpose**: Main extension popup interface
- **Key Files**:
  - `index.tsx` (113KB) - Main popup component with chat interface, settings, model selection
  - `popup-style.css` - Popup-specific styles
- **Features**: Chat interface, model selection, API key management, settings access

#### `/src/options/`
- **Purpose**: Extension settings and configuration page
- **Key Files**:
  - `index.tsx` (229KB) - Comprehensive settings interface
  - `options-style.css` - Settings page styles
- **Features**: Model configuration, API keys, custom actions, notifications, theme settings

#### `/src/contents/`
- **Purpose**: Content scripts injected into web pages
- **Key Files**:
  - `index.tsx` (111KB) - Main content script with UI injection
  - `loader.ts` - Content script loader
  - `content-style.css`, `styles.css` - Content script styles
- **Features**: Text selection detection, floating UI, follow-up questions, global actions

#### `/src/background/`
- **Purpose**: Service worker for background processing
- **Key Files**:
  - `index.ts` (16KB) - Background service worker
  - `messages/processText.ts` - Text processing message handler
- **Features**: API proxy, message routing, rate limiting, cross-origin requests

---

### 2. **Services Layer** (`/src/services/`)

#### `/services/llm/` - AI/LLM Integration
- **`UnifiedAIService.ts`** (13KB) - Single entry point for all AI providers
- **`ai-sdk-streaming.ts`** (11KB) - AI SDK streaming implementation
- **`openai.ts`** (8KB) - OpenAI API integration
- **`xai.ts`** (15KB) - xAI/Grok API integration
- **`gemini.ts`** (11KB) - Google Gemini API integration
- **`local.ts`** (7KB) - Local LLM support (Ollama, LM Studio)
- **`basic.ts`** (10KB) - Basic/free tier proxy integration
- **`EnhancedLLMProcessor.ts`** (15KB) - Enhanced LLM processing with streaming

#### `/services/conversation/`
- **`SessionMemory.ts`** (10KB) - Privacy-first session memory (in-memory only, no persistence)

#### `/services/knowledge-graph/`
- **`EntityExtractor.ts`** (7KB) - Entity extraction from text
- **`FileSystemManager.ts`** (3KB) - File system operations for knowledge graph
- **`MarkdownSerializer.ts`** (13KB) - Markdown serialization for knowledge graph

#### Other Services
- **`rateLimit.ts`** (4KB) - Rate limiting implementation
- **`feedback/`** - Feedback collection service
- **`integration/`** - Third-party integrations
- **`notifications/`** - Notification management
- **`prompts/`** - Prompt engineering and templates
- **`save/`** - Save/export functionality
- **`validation/`** - Input validation

---

### 3. **Components** (`/src/components/`)

#### Content Components (`/components/content/`)
- **`GlobalActionButton.tsx`** (8KB) - Global action button for page analysis
- **`TextSelectionButton.tsx`** (17KB) - Button for selected text actions
- **`MarkdownText.tsx`** (11KB) - Markdown rendering component
- **`WordByWordText.tsx`** (13KB) - Word-by-word streaming text display
- **`AnimatedText.tsx`** (2KB) - Animated text component
- **`CitationReference.tsx`** (1KB) - Citation/reference display
- **`LanguageSelector.tsx`**, **`LanguageSelectorOverlay.tsx`** (14KB) - Language selection UI
- **`PopupModeSelector.tsx`** (8KB) - Popup mode selection
- **`SpeedControl.tsx`** (1KB) - Streaming speed control
- **`WebsiteInfo.tsx`** (10KB) - Website information display
- **`PinButton.tsx`**, **`SelectionButton.tsx`** - UI buttons

#### Other Component Directories
- **`buttons/`** - Reusable button components
- **`common/`** - Common/shared components
- **`icons/`** - Icon components
- **`local/`** - Local model components
- **`memory/`** - Memory-related components
- **`notifications/`** - Notification components
- **`onboarding/`** - Onboarding components
- **`options/`** - Settings page components
- **`popup/`** - Popup-specific components
- **`providers/`** - Context providers
- **`updates/`** - Update-related components

---

### 4. **Content Script Components** (`/src/contents/components/`)

#### Layout Components (`/contents/components/layout/`)
- **`CenteredLayout.tsx`** (4KB) - Centered popup layout
- **`FloatingLayout.tsx`** (5KB) - Floating popup layout
- **`PopupLayoutContainer.tsx`** (4KB) - Layout container
- **`SidebarLayout.tsx`** (4KB) - Sidebar layout

#### Follow-up Components (`/contents/components/followup/`)
- **`FollowUpInput.tsx`** (19KB) - Follow-up question input
- **`FollowUpQAItem.tsx`** (21KB) - Q&A item display
- **`FollowUpSection.tsx`** (4KB) - Follow-up section container

#### Loading Components (`/contents/components/loading/`)
- **`DynamicSkeletonLines.tsx`** (5KB) - Dynamic skeleton loading
- **`LoadingSkeletonContainer.tsx`** (1KB) - Skeleton container
- **`LoadingThinkingText.tsx`** (6KB) - "Thinking" animation

#### Common Components (`/contents/components/common/`)
- **`PageContextWelcome.tsx`** (13KB) - Welcome message for page context
- **`SharingMenu.tsx`** (13KB) - Sharing functionality

#### Icons (`/contents/components/icons/`)
- Icon components for content script UI

---

### 5. **Custom Hooks** (`/src/hooks/`)

#### Core Hooks
- **`usePopup.ts`** (21KB) - Popup state and behavior management
- **`useEnhancedConversation.ts`** (10KB) - Enhanced conversation management
- **`useLangChainConversation.ts`** (14KB) - LangChain-based conversation
- **`useTextSelection.ts`** (11KB) - Text selection detection

#### UI Hooks
- **`usePopupTheme.ts`** (3KB) - Popup theme management
- **`useViewportPosition.ts`** (4KB) - Viewport positioning
- **`useResizable.ts`** (2KB) - Resizable components
- **`useKeyboardShortcuts.ts`** (3KB) - Keyboard shortcuts

#### Feature Hooks
- **`useConversation.ts`** (1KB) - Basic conversation
- **`useFollowUp.ts`** (2KB) - Follow-up questions
- **`useSpeech.ts`** (3KB) - Text-to-speech
- **`useCopy.ts`** (8KB) - Copy to clipboard
- **`useFeedback.ts`** (780B) - Feedback submission
- **`useRateLimit.ts`** (1KB) - Rate limiting
- **`useSettings.ts`** (4KB) - Settings management

#### Utility Hooks
- **`useCurrentModel.ts`** (2KB) - Current model selection
- **`useEnabled.ts`** (3KB) - Feature enablement
- **`useLastResult.ts`** (691B) - Last result tracking
- **`useLocale.ts`**, **`useLocaleStore.ts`** - Internationalization
- **`useMessage.ts`** (993B) - Message handling
- **`useMode.ts`** (3KB) - Mode selection
- **`usePerformance.ts`** (2KB) - Performance monitoring
- **`useReducedMotion.ts`** (1KB) - Reduced motion
- **`useReferences.ts`** (1KB) - Reference handling
- **`useToast.ts`** (906B) - Toast notifications
- **`useWordByWordStreaming.ts`** (4KB) - Word-by-word streaming

---

### 6. **Utilities** (`/src/utils/`)

#### Content Processing
- **`contentExtractor.ts`** (13KB) - Extract content from web pages
- **`contentProcessor.ts`** (11KB) - Process extracted content
- **`fastContentSanitizer.ts`** (2KB) - Fast content sanitization
- **`debugExtraction.ts`** (13KB) - Debug content extraction
- **`textProcessing.ts`** (5KB) - Text processing utilities
- **`textUtils.ts`** (360B) - Text utilities

#### UI/UX
- **`constants.ts`** (9KB) - Application constants
- **`position.ts`** (6KB) - Position calculations
- **`highlight.ts`** (2KB) - Text highlighting
- **`font.ts`** (6KB) - Font loading and management

#### Internationalization
- **`i18n.ts`** (6KB) - Internationalization utilities
- **`contentScriptI18n.ts`** (3KB) - Content script i18n
- **`rtl.ts`** (265B) - RTL support

#### Storage & Data
- **`storage.ts`** (5KB) - Chrome storage utilities
- **`modelRecommendations.ts`** (5KB) - Model recommendations

#### Other
- **`websiteInfo.ts`** (2KB) - Website information extraction
- **`themePreload.ts`** (1KB) - Theme preloading
- **`enhancementDemo.ts`** (10KB) - Enhancement demo

---

### 7. **Type Definitions** (`/src/types/`)

- **`settings.ts`** (7KB) - Settings type definitions
- **`messages.ts`** (2KB) - Message types
- **`knowledge-graph.ts`** (2KB) - Knowledge graph types
- **`followup.ts`** (107B) - Follow-up types
- **`theme.ts`** (639B) - Theme types
- **`file-system.d.ts`** (1KB) - File system types
- **`images.d.ts`** (82B) - Image types
- **`rehype-raw.d.ts`** (82B) - Rehype types

---

### 8. **Configuration** (`/src/config/`)

- **`localModels.ts`** (17KB) - Local model configurations (Ollama, LM Studio)

---

### 9. **Evaluation** (`/src/evals/`)

- **`prompt-evals.ts`** (13KB) - Prompt evaluation utilities
- **`run-evals.ts`**, **`run-evals.cjs`** - Evaluation runners

---

### 10. **Welcome/Onboarding** (`/src/welcome/`)

- **`index.tsx`** (14KB) - Welcome/onboarding page
- **`welcome-styles.css`** (6KB) - Welcome page styles

---

### 11. **Styles** (`/src/styles/`)

- **`popupTheme.ts`** (5KB) - Popup theme definitions
- **`motionStyles.ts`** (2KB) - Motion/animation styles
- **`MarkdownText.ts`** (2KB) - Markdown text styles
- **`options.css`** (2KB) - Options page styles

---

## Key Architectural Patterns

### 1. **Privacy-First Design**
- SessionMemory: In-memory only, cleared on popup close/page navigation
- No persistent conversation history
- Last 10 messages with 2K token budget

### 2. **Multi-Provider AI Support**
- UnifiedAIService: Single entry point for all AI providers
- Provider routing: OpenAI, xAI/Grok, Gemini, Local (Ollama/LM Studio), Basic (proxy)
- AI SDK streaming for modern providers
- Native implementations for local/basic

### 3. **Content Injection**
- Shadow DOM encapsulation (Plasmo CSUI)
- Smart content extraction (filters navbar, UI chrome)
- Multiple layout modes: floating, centered, sidebar
- Text selection detection and action buttons

### 4. **Internationalization**
- 40+ language support
- RTL support
- Content script i18n
- Locale store management

### 5. **Streaming & UX**
- Word-by-word streaming display
- Skeleton loading states
- "Thinking" animations
- Speed control for streaming

### 6. **Follow-up System**
- Context-aware follow-up questions
- Q&A display
- Follow-up input with suggestions

## Data Flow

```
User Action (Text Selection/Global Button)
    ↓
Content Script (contents/index.tsx)
    ↓
Content Extraction (utils/contentExtractor.ts)
    ↓
Service Worker (background/index.ts)
    ↓
UnifiedAIService (services/llm/UnifiedAIService.ts)
    ↓
Provider-specific Service (openai.ts, xai.ts, gemini.ts, local.ts, basic.ts)
    ↓
AI SDK Streaming / Native Processing
    ↓
Response → Content Script → UI Display
```

## Key Technologies

- **Framework**: Plasmo (Browser Extension Framework)
- **UI**: React, TypeScript, TailwindCSS
- **AI**: AI SDK (Vercel), LangChain (deprecated)
- **Streaming**: AI SDK streaming, word-by-word display
- **Styling**: TailwindCSS, CSS modules, Shadow DOM
- **Internationalization**: Chrome i18n API
- **Storage**: Chrome Storage API

## File Sizes (Notable Large Files)

1. `options/index.tsx` (229KB) - Settings page
2. `popup/index.tsx` (113KB) - Popup interface
3. `contents/index.tsx` (111KB) - Content script
4. `contents/components/followup/FollowUpQAItem.tsx` (21KB) - Q&A display
5. `contents/components/followup/FollowUpInput.tsx` (19KB) - Follow-up input
6. `hooks/usePopup.ts` (21KB) - Popup management
7. `hooks/useLangChainConversation.ts` (14KB) - LangChain conversation
8. `services/llm/xai.ts` (15KB) - xAI integration
9. `services/llm/EnhancedLLMProcessor.ts` (15KB) - Enhanced LLM processing
10. `config/localModels.ts` (17KB) - Local model configs

## Integration Points

1. **Content Script ↔ Background**: Chrome runtime messages
2. **Popup ↔ Background**: Chrome runtime messages
3. **Options ↔ Storage**: Chrome storage API
4. **Content Script ↔ Web Page**: DOM manipulation, Shadow DOM
5. **All ↔ AI Providers**: HTTP requests (via background proxy for CORS)

## Extension Permissions & Capabilities

- Content script injection
- Background service worker
- Chrome storage access
- Cross-origin requests (via background proxy)
- Text selection API
- Clipboard access
- Tabs API
- Notifications API

## Development Notes

- Uses Plasmo framework for extension development
- TypeScript for type safety
- TailwindCSS for styling
- Shadow DOM for style isolation
- Multiple backup files indicate active refactoring
- Deprecated LangChain code still present (safe to remove)
- SessionMemory replaced persistent ConversationStore

## Future Considerations

- Remove deprecated LangChain code
- Clean up backup files
- Consider splitting large components
- Further optimize content extraction
- Enhance error handling and user feedback
