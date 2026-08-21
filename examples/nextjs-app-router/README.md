# Next.js App Router

Booking widget on a page, plus a server route that lists open slots with your secret key.

```bash
npm install
INTOCAL_API_KEY=sk_live_... npm run dev
```

- `app/page.tsx` — `<InlineWidget>` and `<PopupButton>`. Note `"use client"` at the top:
  these components use hooks and take a function prop, so they cannot render as a
  Server Component.
- `app/api/slots/route.ts` — server-side slot lookup. The SDK throws `IntoCalError`
  rather than returning `{ ok: false }`, so errors are handled with try/catch and the
  error's own `status` is passed through.

The secret key stays on the server. The widget itself needs no key — it renders your
public booking page in an iframe.
