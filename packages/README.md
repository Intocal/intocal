# IntoCal npm packages

This folder contains the three publishable npm packages:

| Package          | Path             | Description                                   |
| ---------------- | ---------------- | --------------------------------------------- |
| `@intocal/sdk`   | `packages/sdk`   | TypeScript SDK (server + browser)             |
| `@intocal/react` | `packages/react` | React `<InlineWidget>` / `<PopupButton>`      |
| `@intocal/mcp`   | `packages/mcp`   | Model Context Protocol server for AI agents   |

## One-time setup

1. **Create the npm org** (once): `npm org create intocal` — or make sure you own the `@intocal` scope.
2. **Generate an npm automation token** at <https://www.npmjs.com/settings/YOUR_USER/tokens> → *Generate New Token → Automation*.
3. **Add it to GitHub** → repo *Settings → Secrets and variables → Actions → New repository secret*:
   - Name: `NPM_TOKEN`
   - Value: the token from step 2
4. Push this repo to GitHub if it isn't already.

## Publishing

### Option A — GitHub Actions (recommended)

Bump the `version` field in the package(s) you want to release, commit, and tag:

```bash
# release a new SDK version
cd packages/sdk && npm version patch --no-git-tag-version && cd ../..
git commit -am "release: @intocal/sdk"
git tag sdk-v$(node -p "require('./packages/sdk/package.json').version")
git push --follow-tags
```

Tag prefixes that trigger the workflow:

| Tag prefix | Publishes             |
| ---------- | --------------------- |
| `sdk-v*`   | `@intocal/sdk`        |
| `react-v*` | `@intocal/react`      |
| `mcp-v*`   | `@intocal/mcp`        |
| `all-v*`   | all three, same version |

### Option B — publish locally

```bash
npm login                     # once
cd packages/sdk   && npm install && npm run build && npm publish --access public
cd ../react       && npm install && npm run build && npm publish --access public
cd ../mcp         && npm install && npm run build && npm publish --access public
```

`@intocal/mcp` depends on `@intocal/sdk`, so publish SDK first on the initial release.

### Option C — hand it to Claude / another agent

Share this folder and `.github/workflows/publish-packages.yml`. Everything is self-contained; no environment variables beyond `NPM_TOKEN` are required.

## Verifying after publish

```bash
npm view @intocal/sdk
npm view @intocal/react
npm view @intocal/mcp
```

Then flip `soon: true` off for the SDK / React / MCP entries in `src/pages/Distribution.tsx` (currently none — the Distribution page already shows the install snippets live).
