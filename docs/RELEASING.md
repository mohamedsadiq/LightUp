# Releasing LightUp

This repo uses Plasmo to build and package the extension.

## Update version

- Update `package.json` version.
- Ensure manifest version is aligned (Plasmo reads from `package.json`).

## Build + package

```bash
pnpm build
pnpm package
```

Artifacts:

- `build/chrome-mv3-prod.zip`

## Submit workflow

A GitHub Actions workflow is available:

- `.github/workflows/submit.yml`

It uses `PlasmoHQ/bpp` to publish the `build/chrome-mv3-prod.zip` artifact.

## Release checklist

- [ ] Update version
- [ ] Run `pnpm build` and `pnpm package`
- [ ] Test on Chrome/Brave
- [ ] Publish via GitHub Actions or manual upload to Web Store
