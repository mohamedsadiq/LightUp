# LightUp Architecture

This document explains how LightUp processes content end‑to‑end in the browser extension.

## High-level flow

```
User selects text
  → Content Script UI (src/contents/index.tsx)
  → Background Service Worker (src/background/index.ts)
  → UnifiedAIService (src/services/llm/UnifiedAIService.ts)
  → Provider (OpenAI / Gemini / xAI / Local / Basic)
  → Streamed response back to UI
```

## Core entry points

- `src/contents/index.tsx` — Injected UI, text selection, layout rendering.
- `src/background/index.ts` — Message routing, settings initialization, validation, rate limiting.
- `src/services/llm/UnifiedAIService.ts` — Provider routing, streaming, context management.

## Content extraction

- `src/utils/contentExtractor.ts` uses Mozilla Readability + mode-aware filtering to extract usable text.
- `src/utils/contentProcessor.ts` and `src/utils/fastContentSanitizer.ts` clean and normalize content.

## Provider routing

`UnifiedAIService` chooses a processor based on `settings.modelType`:

- **OpenAI** → `processOpenAIWithAISDK`
- **Gemini** → `processGeminiWithAISDK` (AI SDK) or native Gemini handler
- **xAI/Grok** → `processXAIWithAISDK`
- **Local** → `processLocalText`
- **Basic** → `processBasicText`

All processors stream responses back to the UI with a shared `StreamChunk` format.

## Privacy-first session memory

LightUp uses **session-only memory**:

- `src/services/conversation/SessionMemory.ts` stores context in memory.
- No conversation data is persisted to disk.
- Context is trimmed to a token budget and cleared when the session ends.

## Settings & storage

- User settings are stored via Chrome Storage (`@plasmohq/storage`).
- Settings include provider type, API keys, layout preferences, and prompt customizations.

## UI layers

- Popup UI: `src/popup/`
- Options UI: `src/options/`
- Content script UI: `src/contents/` + `src/components/content/`

## Internationalization

- Locale strings: `/locales` (copied to `public/locales` by `pnpm copy-locales`).
- Runtime locale helpers: `src/utils/i18n.ts` and `src/utils/contentScriptI18n.ts`.
