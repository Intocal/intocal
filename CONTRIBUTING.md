# Contributing

## Layout

This is an npm workspace. `packages/sdk`, `packages/react`, and `packages/mcp` are
published to npm; `packages/proxy` is the Deno service behind `api.intocal.com` and is
deployed, not published.

```bash
npm install      # install all workspaces
npm run build    # build all three published packages
```

## Ground rules for snippets

Every code sample in this repo — README, AGENTS.md, or examples — must run as written
against the live API. AI assistants reproduce these verbatim, so a stale snippet becomes
thousands of broken integrations. If you change an API shape, update every snippet that
shows it, and `intocal.com/llms-full.txt` too.

Things that are easy to get wrong:

- `GET /v1/event-types` needs `host_id` unless authenticated.
- The event type display field is `name`. `title` is deprecated and not returned.
- The SDK throws `IntoCalError`; it does not return `{ ok: false }` to the caller.
- `embed.js` reads `data-intocal`, `data-theme`, `data-color`, `data-hide-header` — and
  nothing else. Popups go through `IntoCal.popup()`.
- `@intocal/react` components need `"use client"` in the Next.js App Router.

## Pull requests

Branch from `main`, keep the change focused, and say in the description what you ran to
verify it. For SDK changes, include the actual request and response you tested against.

## Releasing

Tag-triggered via `.github/workflows/publish-packages.yml`: `sdk-v*`, `react-v*`,
`mcp-v*`, or `all-v*`. Publish `@intocal/sdk` before `@intocal/mcp` — mcp depends on it.
