# Webhook receiver

Verifies the `X-IntoCal-Signature` HMAC on incoming booking events.

```bash
npm install
INTOCAL_WEBHOOK_SECRET=whsec_... npm start
```

Listens on `:3001` at `POST /webhooks/intocal`. Point a webhook endpoint at it from
Dashboard → Distribution → Webhooks (use a tunnel such as ngrok in development).

## How verification works

`X-IntoCal-Signature` is `hex(HMAC_SHA256(secret, raw_request_body))`.

Two details matter:

1. **Use the raw body.** `express.raw()` here, not `express.json()` — parsing and
   reserializing changes the bytes and the signature will never match.
2. **Compare in constant time.** `crypto.timingSafeEqual` throws on length mismatch, so
   lengths are checked first.

The server exits if `INTOCAL_WEBHOOK_SECRET` is unset. An empty secret would still
produce a valid-looking HMAC for anyone who knows the algorithm.

Reply `2xx` promptly — non-2xx responses are retried.
