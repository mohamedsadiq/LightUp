# LightUp Documentation

Welcome to the LightUp documentation hub. This repo contains the **LightUp browser extension** built with Plasmo.

## Contents

- [Architecture](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Configuration & Providers](./CONFIGURATION.md)
- [Privacy & Data Handling](./PRIVACY.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Releasing](./RELEASING.md)

## Internal Design Notes

These are internal design audits and UI/animation guides:

- [Family Wallet Animation Guide](./animation-guide-family-wallet.md)
- [Radix UI Component Audit](./radix-ui-component-audit.md)
- [Radix UI Mapping](./radix-ui-mapping.md)
- [Radix UI Progress](./radix-ui-progress.md)

## Repo Quick Map

- `src/contents/` → Content scripts injected into pages
- `src/background/` → Service worker (message routing, validation, rate limits)
- `src/services/llm/` → Provider routing + streaming
- `src/popup/` → Toolbar popup UI
- `src/options/` → Settings/Options UI
- `src/utils/` → Extraction, highlighting, storage helpers
