# Security Policy

## Reporting a vulnerability

Email **security@intocal.com**. Please do not open a public issue for anything that
could affect users' calendars or bookings.

Include what you can: affected endpoint or package, reproduction steps, and impact.
We aim to acknowledge within 2 business days and to ship a fix or mitigation for
confirmed issues within 30 days. We will credit you unless you prefer otherwise.

## Supported versions

The latest minor of each published package receives security fixes.

## Handling API keys

- `sk_live_…` keys are server-side only. Never ship one to a browser, commit one to a
  repository, or place one in a URL query string.
- Browser code uses `X-IntoCal-Public-Key` with `X-IntoCal-Host`, which is scoped to a
  single host and safe to expose.
- Rotate immediately if a key is exposed — including in a screenshot, a log, or a chat
  transcript. Rotation is in Dashboard → Distribution → API Keys.

## Webhooks

Verify every delivery. The `X-IntoCal-Signature` header is
`hex(HMAC_SHA256(secret, raw_request_body))`. Compute it over the raw bytes — parsing
and reserializing the JSON will break the comparison — and compare in constant time.
See `examples/webhook-receiver`.
