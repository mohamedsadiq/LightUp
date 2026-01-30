# Troubleshooting

## LightUp doesn’t appear on selection

- Ensure the extension is **enabled**.
- Check the **activation mode** in Options.
- Confirm the page isn’t a restricted URL (Chrome Web Store, internal browser pages).

## Popup or layout feels wrong

- Switch layouts in Options (Floating / Sidebar / Centered).
- Verify zoom level is standard (100%).

## Local LLM not responding

- Confirm `serverUrl` is set and reachable.
- Ensure the server supports `POST /v1/chat/completions`.
- Try `http://127.0.0.1:1234` if you’re using LM Studio/Ollama proxy.

## API key errors

- Re-check keys in Options.
- OpenAI keys often start with `sk-`.
- xAI keys must start with `xai-`.

## Build loads but UI is empty

- Verify entry files are in `src/` (`popup/`, `options/`, `contents/`, `background/`).
- Ensure `pnpm copy-locales` ran (included in `pnpm dev/build/package`).

## Slow or partial responses

- Reduce `maxTokens` in Options.
- Check rate limits or provider outages.
