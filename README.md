## LightUp — AI annotations without leaving the page

![LightUp Preview](https://pbs.twimg.com/media/GgxiXUPXoAAVQWP?format=jpg&name=medium)

<div align="center">
  <a href="https://boimaginations.com/lightup">🌐 Website</a> | <a href="https://x.com/sadiq_moo">𝕏 Follow us on X</a> | <a href="https://www.boimaginations.com/lightup/getting-started">🚀 Getting Started</a> | <a href="https://github.com/mohamedsadiq/LightUp/releases">📥 Release Page</a> |  <a href="https://chromewebstore.google.com/detail/lightup-ai-powered-web-an/pncapgeoeedlfppkohlbelelkkihikel?authuser=5&hl=en-GB">📥 Download on Chrome</a>
</div>

**LightUp lets you highlight any text and get instant AI explanations, summaries, translations, and more—right on the page. No tab switching, no broken flow.**

- 🧠 **Smart analysis**: Explain, summarize, analyze, translate, or ask anything
- 🔒 **Privacy-first**: Optional local LLM support; session-only memory
- 🎨 **Flexible UI**: Floating, sidebar, or centered layouts
- ⚡ **Fast**: Keyboard shortcuts and instant follow-up questions
- 🌐 **Multi-provider**: OpenAI, Gemini, xAI/Grok, or local models

**Featured on Chrome Web Store** • 4.2/5 stars • 40+ languages

---

## ✅ Key features

- **Smart text analysis**: Explain, summarize, analyze, translate, or ask anything.
- **Multiple layouts**: Floating, sidebar, or centered modal UI.
- **Follow-up questions**: Keep the context and dig deeper.
- **Flexible AI backends**: OpenAI, Gemini, xAI/Grok, or local LLMs.
- **Keyboard shortcuts + theming**: Dark/light/system theme and fast actions.
- **Privacy-first**: Session-only memory; optional local processing.

![Dark Mode Preview](https://github.com/user-attachments/assets/c596a963-fab3-4908-a0f9-5ffe993a07a8)

## 📥 Install (users)

1. **Chrome Web Store**: [Install LightUp](https://chromewebstore.google.com/detail/lightup-ai-powered-web-an/pncapgeoeedlfppkohlbelelkkihikel?authuser=5&hl=en-GB)
2. **GitHub Releases**: [Download the latest release](https://github.com/mohamedsadiq/LightUp/releases)
3. **Manual install** (if you downloaded a ZIP):
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the unzipped folder

## ⚙️ Configure

1. Pin LightUp in your browser toolbar.
2. Right‑click the LightUp icon → **Options**.
3. Choose your provider:
   - **Local LLM** (requires a local server URL)
   - **OpenAI** (API key)
   - **Google Gemini** (API key + model)
   - **xAI/Grok** (API key)

> ⚠️ Using cloud providers sends content to their APIs. Local LLM keeps processing on your machine.

### Supported providers

- **OpenAI**: GPT models (requires API key)
- **Google Gemini**: 1.0 Pro, 1.5 Pro/Flash (requires API key)
- **xAI/Grok**: Grok models (requires API key starting with `xai-`)
- **Local LLM**: Ollama/LM Studio/Text Generation WebUI via `http://127.0.0.1:1234` or custom URL
- **Basic**: Free tier (no API key)

### Local LLM setup

- Run a local server exposing `POST /v1/chat/completions`
- Set the server URL in Options → Local LLM
- Example URLs:
  - Ollama: `http://127.0.0.1:11434`
  - LM Studio: `http://127.0.0.1:1234`

### UI layouts

- **Floating**: Compact popup near your selection
- **Sidebar**: Persistent sidebar (access via right edge)
- **Centered**: Modal overlay with blurred background

### Privacy details

- Session-only memory (no persistent conversation history)
- Optional local processing keeps data on-device
- API keys are encrypted in storage
- See [PRIVACY.md](./docs/PRIVACY.md) for details

## 🔧 Usage

1. Select any text on a webpage.
2. LightUp appears with your selected mode.
3. Ask follow‑up questions for deeper context.

### Modes

- **Explain**: Detailed explanations
- **Summarize**: Quick summaries
- **Analyze**: Deep analysis
- **Translate**: Translate to another language
- **Free**: Ask anything

## ⌨️ Keyboard shortcuts

- `Ctrl+Shift+Z`: Explain
- `Ctrl+Shift+S`: Summarize
- `Ctrl+Shift+A`: Analyze
- `Ctrl+Shift+T`: Translate
- `Ctrl+Shift+F` / `Command+Shift+F`: Free mode popup
- `Ctrl+Shift+X`: Toggle LightUp on/off
- `Ctrl+Shift+R`: Toggle Radically Focus mode
- `Ctrl+Shift+D`: Toggle theme

## 🧭 How it works (high level)

```
Selection → Content Script → Background Service Worker → UnifiedAIService → Provider → UI
```

Key entry points:

- `src/contents/index.tsx` (content script UI)
- `src/background/index.ts` (service worker + routing)
- `src/services/llm/UnifiedAIService.ts` (provider selection + streaming)

## 🛠️ Developer quickstart

```bash
pnpm install
pnpm dev
```

Load the dev build from `build/chrome-mv3-dev` in `chrome://extensions/`.

## 📚 Documentation

Start here: [docs/README.md](./docs/README.md)

- [Architecture](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Configuration & Providers](./docs/CONFIGURATION.md)
- [Privacy & Data Handling](./docs/PRIVACY.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Releasing](./docs/RELEASING.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## 🔐 Security

See [SECURITY.md](./SECURITY.md).


