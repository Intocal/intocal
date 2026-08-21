// Verifies the X-IntoCal-Signature HMAC sent by IntoCal webhooks and logs events.
// HMAC = hex(HMAC_SHA256(secret, raw_request_body))
//
//   npm install
//   INTOCAL_WEBHOOK_SECRET=whsec_... node server.js
import express from "express";
import crypto from "node:crypto";

const SECRET = process.env.INTOCAL_WEBHOOK_SECRET;
if (!SECRET) {
  // Fail closed. With an empty secret every signature check would still "pass"
  // for anyone who knows the algorithm, which is worse than no endpoint at all.
  console.error("Missing INTOCAL_WEBHOOK_SECRET.");
  process.exit(1);
}

const app = express();

function signaturesMatch(received, expected) {
  const a = Buffer.from(received, "hex");
  const b = Buffer.from(expected, "hex");
  // timingSafeEqual throws on length mismatch, so compare lengths first.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.post(
  "/webhooks/intocal",
  // Must be the raw body: the HMAC is computed over the exact bytes sent.
  // express.json() would reserialize and break the signature.
  express.raw({ type: "application/json" }),
  (req, res) => {
    const received = req.header("x-intocal-signature") || "";
    const expected = crypto.createHmac("sha256", SECRET).update(req.body).digest("hex");

    if (!received || !signaturesMatch(received, expected)) {
      return res.status(401).send("bad signature");
    }

    const event = JSON.parse(req.body.toString("utf8"));
    console.log("[intocal]", event.type, event.data?.id);

    switch (event.type) {
      case "booking.created":
        // persist, notify Slack, push to your CRM…
        break;
      case "booking.canceled":
        break;
      case "booking.rescheduled":
        break;
    }

    // Reply 2xx quickly — IntoCal retries on non-2xx.
    res.json({ ok: true });
  },
);

app.listen(3001, () => console.log("intocal webhooks listening on :3001"));
