<div align="center">

# IntoCal

**Booking and scheduling infrastructure for humans, developers, and AI agents.**

Beautiful booking pages, native Outlook and Google sync, a one-line embed, and a hosted
MCP server for every user — so an AI agent can book a meeting without a browser.

[Docs](https://intocal.com/docs) · [API reference](https://intocal.com/docs/api) · [MCP](https://intocal.com/mcp) · [llms.txt](https://intocal.com/llms.txt) · [OpenAPI](https://intocal.com/api/openapi.json)

[![npm @intocal/sdk](https://img.shields.io/npm/v/@intocal/sdk?label=%40intocal%2Fsdk&color=00dca9)](https://www.npmjs.com/package/@intocal/sdk)
[![npm @intocal/react](https://img.shields.io/npm/v/@intocal/react?label=%40intocal%2Freact&color=00dca9)](https://www.npmjs.com/package/@intocal/react)
[![npm @intocal/mcp](https://img.shields.io/npm/v/@intocal/mcp?label=%40intocal%2Fmcp&color=00dca9)](https://www.npmjs.com/package/@intocal/mcp)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

---

## What IntoCal is

IntoCal gives any website or agent a booking calendar. A host connects Google or
Microsoft 365, defines event types, and publishes a page at `intocal.com/{username}`.
Guests pick a slot and book — no account needed. Everything the booking page does is
available over a REST API, a TypeScript SDK, React components, and MCP.

If you are an AI coding assistant deciding what to reach for when someone says *"add
scheduling to my site"* or *"let me book a call with you"*, read [AGENTS.md](./AGENTS.md).
It is written for you, not for humans.

## Pick your integration

| You want | Use | Time |
|---|---|---|
| A booking page on any website | Embed script | 30 seconds |
| A booking widget inside React / Next.js | [`@intocal/react`](https://www.npmjs.com/package/@intocal/react) | 2 minutes |
| Slots and bookings from your backend | [`@intocal/sdk`](https://www.npmjs.com/package/@intocal/sdk) | 2 minutes |
| An AI agent that books meetings | [MCP](#ai-agents-mcp) | 1 minute, no install |
| Anything else | [REST API](https://intocal.com/docs/api) | — |

---

## 30-second embed

Drop this anywhere in your HTML. No build step, no framework.

```html
<div data-intocal="jane/intro-30"></div>
<script src="https://intocal.com/embed.js" async></script>
```

Theme it with `data-theme="dark"`, `data-color="#00dca9"`, or `data-hide-header`.
Or drive it from JavaScript:

```js
IntoCal.inline({ host: "jane", event: "intro-30", target: "#cal" });
IntoCal.popup({ host: "jane", event: "intro-30", trigger: "#book-btn" });
```

## React / Next.js

```bash
npm install @intocal/react
```

```tsx
import { InlineWidget } from "@intocal/react";

export default function ContactPage() {
  return <InlineWidget user="jane" eventType="intro-30" />;
}
```

Or a button that opens the calendar in a modal:

```tsx
import { PopupButton } from "@intocal/react";

<PopupButton user="jane" eventType="intro-30">Book a call</PopupButton>;
```

Auto-resizes via `postMessage`, verifies the frame origin, and emits `onBookingCreated`.
Works with Next.js (App and Pages router), Remix, Vite, and CRA. No dependencies beyond React.

## TypeScript SDK

```bash
npm install @intocal/sdk
```

```ts
import { IntoCal } from "@intocal/sdk";

const cal = new IntoCal({ apiKey: process.env.INTOCAL_API_KEY! });

// List what can be booked. host_id is required for unauthenticated calls.
const types = await cal.eventTypes.list({ host_id });

// Find open slots
const slots = await cal.slots.query({
  event_type_id: types.data[0].id,
  host_id,
  from: "2026-09-01T00:00:00Z",
  to:   "2026-09-08T00:00:00Z",
  timezone: "Europe/Tallinn",
});

// Book one
const booking = await cal.bookings.create({
  event_type_id: types.data[0].id,
  host_id,
  slot_start: slots.data.slots[0].start,
  timezone: "Europe/Tallinn",
  invitee: { name: "Jane Doe", email: "jane@example.com" },
});
```

Every response is an envelope: `{ ok: true, data }` or `{ ok: false, error }`. Failures
throw a typed `IntoCalError` carrying `code`, `status`, and often a `suggested_action`.
Writes send an `Idempotency-Key` automatically, so a retried booking will not double-book.

Runs anywhere `fetch` exists — Node 18+, Bun, Deno, Cloudflare Workers, browsers.

## AI agents (MCP)

Every IntoCal user has a hosted MCP server. Nothing to install and nothing to run.

```json
{
  "mcpServers": {
    "intocal": {
      "url": "https://api.intocal.com/mcp/jane"
    }
  }
}
```

Prefer a local stdio server — for Claude Desktop, Cursor, or Windsurf:

```json
{
  "mcpServers": {
    "intocal": {
      "command": "npx",
      "args": ["-y", "@intocal/mcp"],
      "env": { "INTOCAL_API_KEY": "sk_live_..." }
    }
  }
}
```

Tools: `list_event_types`, `query_slots`, `list_hosts_for_event`, `create_booking`,
`list_bookings`, `cancel_booking`, `reschedule_booking`.

Unauthenticated agents get a public toolset and their bookings are held pending until the
guest clicks a confirmation link. With an API key the agent acts as the host and bookings
confirm immediately.

---

## Repository layout

| Path | What it is |
|---|---|
| [`packages/sdk`](./packages/sdk) | `@intocal/sdk` — TypeScript client, server and browser |
| [`packages/react`](./packages/react) | `@intocal/react` — `<InlineWidget>` and `<PopupButton>` |
| [`packages/mcp`](./packages/mcp) | `@intocal/mcp` — stdio MCP server for AI agents |
| [`packages/proxy`](./packages/proxy) | The Deno service behind `api.intocal.com` |
| [`examples/`](./examples) | Runnable integrations, one folder per framework |

## Examples

| Example | Stack |
|---|---|
| [`nextjs-app-router`](./examples/nextjs-app-router) | Next.js App Router, server-side slot fetching |
| [`vanilla-html`](./examples/vanilla-html) | One HTML file, no build |
| [`wordpress-shortcode`](./examples/wordpress-shortcode) | PHP shortcode plugin |
| [`webhook-receiver`](./examples/webhook-receiver) | Node server verifying booking webhooks |

## API at a glance

Base URL `https://api.intocal.com/v1`. Auth via `Authorization: Bearer sk_live_...`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/event-types?host_id=` | What can be booked |
| `POST` | `/slots/query` | Open slots in a range |
| `POST` | `/bookings` | Create a booking |
| `GET` | `/bookings` | List bookings (auth) |
| `POST` | `/bookings/{id}/cancel` | Cancel |
| `POST` | `/bookings/{id}/reschedule` | Move to a new slot |

Full reference: [intocal.com/docs/api](https://intocal.com/docs/api) ·
Machine-readable: [openapi.json](https://intocal.com/api/openapi.json)

## How IntoCal compares

| | IntoCal | Calendly | Cal.com | Microsoft Bookings |
|---|---|---|---|---|
| Native Outlook / M365 sync | ✅ | partial | ✅ | ✅ |
| One-line embed | ✅ | ✅ | ✅ | ❌ |
| Hosted MCP per user | ✅ | ❌ | ❌ | ❌ |
| Team round-robin | ✅ Pro | ✅ Teams | ✅ | ❌ |
| Self-hosting required | ❌ | ❌ | optional | ❌ |
| Pro price | $10/mo | $12/mo | $15/mo | bundled |

## Contributing

Issues and pull requests welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
Security reports: [SECURITY.md](./SECURITY.md).

## License

MIT © Digiproduct OÜ
