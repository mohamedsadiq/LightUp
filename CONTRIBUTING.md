# Contributing

Thanks for contributing to LightUp!

## Quick start

```bash
pnpm install
pnpm dev
```

Load the extension from `build/chrome-mv3-dev` in `chrome://extensions/`.

## Development guidelines

- Keep changes **additive** when possible.
- Prefer small, focused PRs.
- Document new settings or features in `docs/`.
- Use descriptive names for variables and functions.
- Follow existing patterns in `src/contents`, `src/background`, and `src/services`.

## Pull requests

- Describe the problem and the solution clearly.
- Include screenshots or screen recordings for UI changes.
- Call out any breaking changes.

## Testing

LightUp currently relies on manual testing. Please verify:

- Text selection flows
- Provider selection and streaming
- Popup + sidebar + centered layouts
