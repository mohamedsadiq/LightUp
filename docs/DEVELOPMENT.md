# Development Guide

This guide covers local development for the LightUp browser extension.

## Prerequisites

- **Node.js** 16+ (18+ recommended)
- **pnpm** (preferred), or npm/yarn

## Install

```bash
pnpm install
```

## Run in dev mode

```bash
pnpm dev
```

Plasmo will build a dev extension at:

```
build/chrome-mv3-dev
```

Load it in Chrome/Brave:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `build/chrome-mv3-dev`

## Build + package

```bash
pnpm build
pnpm package
```

Output:

- `build/chrome-mv3-prod.zip`

## Scripts

- `pnpm dev` — local development
- `pnpm build` — production build
- `pnpm package` — zipped artifact for Web Store
- `pnpm copy-locales` — copy `/locales` → `public/locales`

## Project structure (core)

- `src/contents/` — content script UI
- `src/background/` — service worker
- `src/services/` — LLM providers, session memory, feedback
- `src/options/` — settings UI
- `src/popup/` — toolbar popup
- `src/utils/` — extraction + helpers

## Notes

- This repo uses Plasmo’s **src directory** layout (see `tsconfig.json` paths).
- Keep entry points in `src/` (`contents/`, `popup/`, `options/`, `background/`).
