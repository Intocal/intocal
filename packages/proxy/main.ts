/**
 * IntoCal API proxy — a stable public origin for https://api.intocal.com
 *
 * Why this exists: the npm SDK bakes its DEFAULT_BASE_URL into every installed
 * copy, permanently. Pointing that at the Supabase Functions hostname would
 * publish the project ref and lock hosting in place until a breaking release.
 * This proxy owns the public URL instead, so the backend can move freely.
 *
 * Routing:
 *   GET  /health          -> handled here
 *   ANY  /v1/<path>       -> ${BACKEND_ORIGIN}/functions/v1/api-v1/v1/<path>
 *   ANY  /mcp/<user>      -> ${BACKEND_ORIGIN}/functions/v1/mcp-user/<user>
 *   ANY  /connector/<path> -> ${BACKEND_ORIGIN}/functions/v1/connector-provision/<path>
 *   ANY  /booking-confirm    -> ${BACKEND_ORIGIN}/functions/v1/booking-confirm
 *
 * Env (Deno Deploy -> Settings -> Environment Variables):
 *   BACKEND_ORIGIN      required, e.g. https://<project-ref>.supabase.co
 *   BACKEND_PREFIX      optional, defaults to /functions/v1/api-v1
 *   SUPABASE_ANON_KEY   optional; sent as the `apikey` header if the edge
 *                       function gateway demands one
 */

const BACKEND_ORIGIN = Deno.env.get("BACKEND_ORIGIN");
const BACKEND_PREFIX = Deno.env.get("BACKEND_PREFIX") ?? "/functions/v1/api-v1";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// Deliberately not fatal: exiting here crash-loops the deployment before env
// vars can be attached, and takes /health down with it. Fail per-request instead.
if (!BACKEND_ORIGIN) {
  console.error("BACKEND_ORIGIN is not set — /v1/* will return 503 until it is.");
}

const ALLOWED_HEADERS = [
  "Authorization",
  "Content-Type",
  "Idempotency-Key",
  "X-IntoCal-Public-Key",
  "X-IntoCal-Host",
  "apikey",
].join(", ");

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  "Access-Control-Max-Age": "86400",
};

/** Headers that must not be forwarded verbatim to the backend. */
const STRIP = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "cf-connecting-ip",
  "x-forwarded-host",
]);

/** Maps a public path onto its backend edge function, or null if unroutable. */
function upstreamFor(url: URL, origin: string): URL | null {
  const path = url.pathname;
  if (path === "/v1" || path.startsWith("/v1/")) {
    return new URL(`${BACKEND_PREFIX}${path}${url.search}`, origin);
  }
  if (path.startsWith("/mcp/")) {
    const user = path.slice("/mcp/".length);
    return new URL(`/functions/v1/mcp-user/${user}${url.search}`, origin);
  }
  if (path.startsWith("/connector/")) {
    const rest = path.slice("/connector/".length);
    return new URL(`/functions/v1/connector-provision/${rest}${url.search}`, origin);
  }
  if (path === "/booking-confirm" || path.startsWith("/booking-confirm/")) {
    const rest = path.slice("/booking-confirm".length);
    return new URL(`/functions/v1/booking-confirm${rest}${url.search}`, origin);
  }
  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (url.pathname === "/health" || url.pathname === "/") {
    return json(
      { ok: !!BACKEND_ORIGIN, service: "intocal-api-proxy", configured: !!BACKEND_ORIGIN },
      BACKEND_ORIGIN ? 200 : 503,
    );
  }

  if (!BACKEND_ORIGIN) {
    return json(
      {
        ok: false,
        error: {
          code: "NOT_CONFIGURED",
          message: "BACKEND_ORIGIN is not set on this deployment.",
        },
      },
      503,
    );
  }

  const target = upstreamFor(url, BACKEND_ORIGIN);
  if (!target) {
    return json(
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message:
            `Unknown path ${url.pathname}. The IntoCal REST API lives under /v1, ` +
            `MCP under /mcp/<username>, and agent provisioning under /connector.`,
          suggested_action: "See https://intocal.com/docs",
        },
      },
      404,
    );
  }

  const headers = new Headers();
  for (const [k, v] of req.headers) {
    if (!STRIP.has(k.toLowerCase())) headers.set(k, v);
  }
  if (ANON_KEY && !headers.has("apikey")) headers.set("apikey", ANON_KEY);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch (err) {
    console.error("upstream fetch failed:", err);
    return json(
      {
        ok: false,
        error: { code: "UPSTREAM_UNAVAILABLE", message: "Backend unreachable." },
      },
      502,
    );
  }

  const out = new Headers(upstream.headers);
  for (const [k, v] of Object.entries(CORS)) out.set(k, v);
  out.delete("content-encoding");
  out.delete("content-length");

  return new Response(upstream.body, { status: upstream.status, headers: out });
});
