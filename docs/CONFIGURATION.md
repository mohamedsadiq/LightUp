# Configuration & Providers

LightUp supports multiple AI providers and layouts. Configure everything from **Options** in the extension.

## Provider types

- **Local** — use a local LLM server URL (privacy-first, offline).
- **OpenAI** — requires an API key.
- **Google Gemini** — requires an API key + model selection.
- **xAI/Grok** — requires an API key.
- **Basic** — free/basic mode (no API key required).

## Required keys

Store keys in Options → Provider settings:

- OpenAI → `apiKey`
- Gemini → `geminiApiKey`
- xAI/Grok → `xaiApiKey`

## Local LLM configuration

Provide a `serverUrl` that exposes:

```
POST /v1/chat/completions
```

Example:

```
http://127.0.0.1:1234
```

## Layouts

- **Floating** — compact popup near selection
- **Sidebar** — persistent sidebar UI
- **Centered** — modal overlay

## Modes

- **Explain**
- **Summarize**
- **Analyze**
- **Translate**
- **Free / Ask Anything**

## Custom prompts

Options allow custom prompts per mode (system + user prompts). These override defaults in `src/utils/constants.ts`.

## Keyboard shortcuts

Shortcuts are documented in the README and can be changed in browser extension settings.
