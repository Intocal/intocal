# IntoCal examples

Each folder is a complete, runnable integration. Every snippet here is checked against
the live API — if one stops working, that is a bug, please open an issue.

| Example | Stack | Shows |
|---|---|---|
| [`nextjs-app-router`](./nextjs-app-router) | Next.js 15, App Router | `@intocal/react` widget + server-side slot fetching with `@intocal/sdk` |
| [`vanilla-html`](./vanilla-html) | One HTML file | The embed script, inline and popup |
| [`wordpress-shortcode`](./wordpress-shortcode) | PHP plugin | `[intocal user="jane" event="intro-30"]` |
| [`webhook-receiver`](./webhook-receiver) | Node + Express | HMAC signature verification |

Replace `jane` and `intro-30` with your own IntoCal username and event slug throughout.

## Two things that trip people up

**In the Next.js App Router, `@intocal/react` components need `"use client"`.** They use
hooks, and `onBookingCreated` is a function prop — passing one from a Server Component
throws at render time.

**`embed.js` has no popup attribute.** It reads `data-intocal`, `data-theme`,
`data-color`, and `data-hide-header`. Popups are wired with
`IntoCal.popup({ host, event, trigger })`.
