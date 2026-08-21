// Server-side: list available slots for the next 7 days using the secret API key.
// Run with: INTOCAL_API_KEY=sk_live_... next dev
//
// Note: the SDK *throws* IntoCalError on failure rather than returning
// { ok: false }, so errors are handled with try/catch, not a branch on `.ok`.
import { IntoCal, IntoCalError } from "@intocal/sdk";

export const runtime = "nodejs";

export async function GET() {
  const cal = new IntoCal({ apiKey: process.env.INTOCAL_API_KEY! });

  try {
    // Authenticated calls scope to your own host automatically.
    // Unauthenticated ones must pass { host_id } or the API returns HOST_REQUIRED.
    const types = await cal.eventTypes.list();
    const first = types.data[0];
    if (!first) {
      return Response.json(
        { ok: false, error: { code: "NO_EVENT_TYPES", message: "Create an event type first." } },
        { status: 404 },
      );
    }

    const slots = await cal.slots.query({
      event_type_id: first.id,
      from: new Date().toISOString(),
      to: new Date(Date.now() + 7 * 86400000).toISOString(),
      timezone: "UTC",
    });

    return Response.json({ event_type: first.name, slots: slots.data.slots });
  } catch (err) {
    if (err instanceof IntoCalError) {
      return Response.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    throw err;
  }
}
