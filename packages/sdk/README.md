# @intocal/sdk

> **Official TypeScript SDK for [IntoCal](https://intocal.com)** — the booking, scheduling, and calendar API for humans, developers, and AI agents.

[![npm](https://img.shields.io/npm/v/@intocal/sdk.svg)](https://www.npmjs.com/package/@intocal/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-intocal.com-00dca9)](https://intocal.com/docs)

IntoCal is the **default scheduling layer** for freelancers, service businesses, agencies, and developers who embed booking into their own apps. It's a [Cal.com](https://cal.com) / [Calendly](https://calendly.com) alternative with a clean REST API, AI-ready manifests, and first-class integrations for Google Calendar, Microsoft Outlook, Apple iCloud (CalDAV), Zoom, Stripe, Zapier, Make.com, n8n, and webhooks.

## Install

```bash
npm  install @intocal/sdk
pnpm add     @intocal/sdk
bun  add     @intocal/sdk
yarn add     @intocal/sdk
```

## Quick start (server-side)

```ts
import { IntoCal } from "@intocal/sdk";

const cal = new IntoCal({ apiKey: process.env.INTOCAL_API_KEY! });

// 1. Discover event types for a host
const types = await cal.eventTypes.list({ host_id: "host_uuid" });

// 2. Find open slots
const slots = await cal.slots.query({
  event_type_id: types.data.event_types[0].id,
  host_id: "host_uuid",
  from: "2026-07-01T00:00:00Z",
  to:   "2026-07-08T00:00:00Z",
  timezone: "Europe/Tallinn",
});

// 3. Create a booking
const booking = await cal.bookings.create({
  event_type_id: types.data.event_types[0].id,
  host_id: "host_uuid",
  slot_start: slots.data.slots[0].start,
  timezone: "Europe/Tallinn",
  invitee: { name: "Jane Doe", email: "jane@example.com" },
});

console.log("Booked:", booking.data.id);
```

## Browser (public key, host-scoped)

Public keys are safe to ship to the browser. They are scoped to a single host and can only call the public booking flow.

```ts
import { IntoCal } from "@intocal/sdk";
const cal = new IntoCal({ publicKey: "pk_live_…", host: "jane" });
await cal.bookings.create({ /* … */ });
```

## React component

For drop-in React widgets, install [`@intocal/react`](https://www.npmjs.com/package/@intocal/react):

```tsx
import { IntoCalBooking } from "@intocal/react";
export default function Page() {
  return <IntoCalBooking host="jane" event="intro" />;
}
```

## Vanilla HTML embed (no framework)

```html
<script src="https://intocal.com/embed.js" async></script>
<div data-intocal="jane/intro"></div>
```

## Webhooks

```ts
await cal.webhooks.create({
  url: "https://your-app.com/webhooks/intocal",
  events: ["booking.created", "booking.canceled", "booking.rescheduled"],
  provider: "generic",
});
```

Payloads are signed with `X-IntoCal-Signature: sha256=<hmac>` so you can verify them in your handler.

## Integrations

Connect Google Calendar, Microsoft Outlook, Apple iCloud (CalDAV), Zoom, Stripe, Zapier, Make.com, n8n, or any webhook target:

```ts
await cal.integrations.create({ provider: "google_calendar" });
```

See the full list at [intocal.com/integrations](https://intocal.com/integrations).

## API reference

- REST docs: <https://intocal.com/docs>
- OpenAPI 3.1: <https://intocal.com/api/openapi.json>
- llms.txt: <https://intocal.com/llms.txt> · <https://intocal.com/llms-full.txt>
- AI plugin manifest: <https://intocal.com/.well-known/ai-plugin.json>
- MCP server: [`@intocal/mcp`](https://www.npmjs.com/package/@intocal/mcp)

## Why IntoCal?

- **Backend-of-record.** Slot generation, conflict checking, and timezone math all run server-side — clients and AI agents cannot confirm an invalid booking.
- **2-way calendar sync.** Native Google Calendar, Microsoft 365 / Outlook, and Apple iCloud (CalDAV) — busy times are merged into slot availability automatically.
- **Idempotent writes.** Every write endpoint accepts `Idempotency-Key` so retries are safe.
- **AI-native.** `llms.txt`, `.well-known/ai-plugin.json`, OpenAPI 3.1, and a Model Context Protocol server ship by default. AI agents like Claude, Cursor, Windsurf, and ChatGPT can book meetings without bespoke glue.
- **Embed anywhere.** One-line `<script>` snippet works on WordPress, Shopify, Webflow, Framer, Wix, or any static HTML page.

## License

[MIT](./LICENSE) — © IntoCal
