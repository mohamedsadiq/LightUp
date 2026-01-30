## LightUp — AI-powered annotations for every page on the web

![LightUp Preview](https://pbs.twimg.com/media/GgxiXUPXoAAVQWP?format=jpg&name=medium)

<div align="center">
  <a href="https://boimaginations.com/lightup">🌐 Website</a> | <a href="https://x.com/sadiq_moo">𝕏 Follow us on X</a> | <a href="https://www.boimaginations.com/lightup/getting-started">🚀 Getting Started</a> | <a href="https://github.com/mohamedsadiq/LightUp/releases">📥 Release Page</a> |  <a href="https://chromewebstore.google.com/detail/lightup-ai-powered-web-an/pncapgeoeedlfppkohlbelelkkihikel?authuser=5&hl=en-GB">📥 Download on Chrome</a>
</div>

## ✨ Meet LightUp

LightUp is a privacy-focused browser extension that lets you highlight text on any page and get **instant AI explanations, summaries, analyses, and translations** in-place. No tab switching. No broken flow.

## ✅ Key features

- **Smart text analysis**: Explain, summarize, analyze, translate, or ask anything.
- **Multiple layouts**: Floating, sidebar, or centered modal UI.
- **Follow-up questions**: Keep the context and dig deeper.
- **Flexible AI backends**: OpenAI, Gemini, xAI/Grok, or local LLMs.
- **Keyboard shortcuts + theming**: Dark/light/system theme and fast actions.

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

## 🔧 Usage

1. Select any text on a webpage.
2. LightUp appears with your selected mode.
3. Ask follow‑up questions for deeper context.

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


