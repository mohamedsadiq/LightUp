# Privacy & Data Handling

LightUp is designed to be privacy‑first. The extension keeps as much processing on-device as possible and limits persistence.

## Session-only memory

- Conversation context is kept **in memory only** (`src/services/conversation/SessionMemory.ts`).
- No conversation history is persisted to disk.
- Context is trimmed to a token budget and cleared when the session ends.

## Local vs cloud providers

- **Local LLM** keeps content on your machine.
- **Cloud providers** (OpenAI, Gemini, xAI/Grok) require sending content to their APIs.

## What is stored

- **Settings** (provider type, API keys, layout preferences) are stored via Chrome Storage.
- No content is stored by default beyond the current session.

## Transparency

For public-facing privacy claims, see:

- Chrome Web Store listing
- Official website privacy policy: https://www.boimaginations.com/lightup/privacy-policy
