# @intocal/react

Drop-in React components for embedding [IntoCal](https://intocal.com) — the open booking platform for freelancers, agencies, and developers.

```bash
npm install @intocal/react
```

## Inline widget

```tsx
import { InlineWidget } from "@intocal/react";

export default function ContactPage() {
  return <InlineWidget user="jane" eventType="intro-30" />;
}
```

## Popup

```tsx
import { PopupButton } from "@intocal/react";

<PopupButton user="jane" eventType="intro-30" className="btn-primary">
  Book a call
</PopupButton>;
```

## Events

```tsx
<InlineWidget
  user="jane"
  eventType="intro-30"
  prefill={{ name: "Acme", email: "lead@acme.com" }}
  onBookingCreated={(b) => console.log("booked", b.id)}
/>
```

Auto-resizes via `postMessage`. Works with Next.js (App + Pages router), Remix, Vite, CRA. Zero dependencies beyond React.

## Server-side / API

For backend access (creating bookings, listing slots from a server) use [`@intocal/sdk`](https://www.npmjs.com/package/@intocal/sdk).

MIT License.
