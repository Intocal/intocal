/**
 * IntoCal SDK — TypeScript client for the IntoCal booking API.
 *
 * @packageDocumentation
 *
 * @example Server-side (Node, Bun, Deno, Cloudflare Workers)
 * ```ts
 * import { IntoCal } from "@intocal/sdk";
 * const cal = new IntoCal({ apiKey: process.env.INTOCAL_API_KEY! });
 *
 * const types = await cal.eventTypes.list({ host_id });
 * const slots = await cal.slots.query({
 *   event_type_id: types.data[0].id,
 *   host_id,
 *   from: "2026-07-01T00:00:00Z",
 *   to:   "2026-07-08T00:00:00Z",
 *   timezone: "Europe/Tallinn",
 * });
 * const booking = await cal.bookings.create({
 *   event_type_id: types.data[0].id,
 *   host_id,
 *   slot_start: slots.data.slots[0].start,
 *   timezone: "Europe/Tallinn",
 *   invitee: { name: "Jane Doe", email: "jane@example.com" },
 * });
 * ```
 *
 * @example Browser (public key, scoped to one host)
 * ```ts
 * import { IntoCal } from "@intocal/sdk";
 * const cal = new IntoCal({ publicKey: "pk_live_...", host: "jane" });
 * await cal.bookings.create({ ... });
 * ```
 */

export const DEFAULT_BASE_URL = "https://api.intocal.com/v1";

export type ResponseEnvelope<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; suggested_action?: string };
    };

export interface IntoCalOptions {
  /** Server-side secret API key (sk_live_…). Never expose to browsers. */
  apiKey?: string;
  /** Browser-safe public key (pk_live_…), scoped to a single host. */
  publicKey?: string;
  /** Required when using `publicKey` — the host slug or id this key is scoped to. */
  host?: string;
  /** Override the API base URL. Defaults to IntoCal Cloud. */
  baseUrl?: string;
  /** Optional fetch implementation (Node 16, custom). Defaults to global fetch. */
  fetch?: typeof fetch;
}

export class IntoCalError extends Error {
  code: string;
  status: number;
  suggested_action?: string;
  constructor(message: string, code: string, status: number, suggested_action?: string) {
    super(message);
    this.name = "IntoCalError";
    this.code = code;
    this.status = status;
    this.suggested_action = suggested_action;
  }
}

export interface EventType {
  id: string;
  slug: string;
  /** Display name. The API returns this as `name` (not `title`). */
  name: string;
  duration_minutes: number;
  is_active: boolean;
  calendar_id?: string;
  description?: string | null;
  location_type?: string | null;
  location_value?: string | null;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  min_notice_minutes?: number;
  max_booking_days?: number;
  created_at?: string;
  updated_at?: string;
  /** Not present on the event-types listing — do not assume it is set. */
  host_id?: string;
  /** @deprecated The API field is `name`. Kept only so older callers still compile. */
  title?: string;
  /** Paid events: price in the smallest currency unit (e.g. cents). */
  price?: number | null;
  currency?: string | null;
  /** Two-step booking: guest must confirm by email before the slot is held. */
  requires_confirmation?: boolean;
  /** Team event scheduling strategy, when the event type is owned by a team. */
  team_scheduling?: "round_robin" | "collective" | "single_host" | null;
  team_id?: string | null;
}

export interface SlotHost {
  /** team_members.id */
  member_id: string;
  /** auth user id backing the team member */
  user_id: string;
  name?: string | null;
  tags?: string[];
}

export interface Slot {
  start: string;
  end: string;
  timezone: string;
  available: boolean;
  event_type_id: string;
  host_id: string;
  /** Team events: hosts free at this slot after merging their calendars. */
  hosts_available?: SlotHost[];
}

export interface SlotsTeamMeta {
  team_id: string;
  scheduling: "round_robin" | "collective" | "single_host";
  member_count: number;
}

export interface Booking {
  id: string;
  event_type_id: string;
  host_id: string;
  start: string;
  end: string;
  timezone: string;
  status: "confirmed" | "canceled" | "rescheduled";
  /** Two-step booking: "pending_confirmation" until the guest clicks the confirmation link. */
  confirmation_status?: "confirmed" | "pending_confirmation" | "expired";
  /** True when the host's calendar requires guest confirmation before the slot is held. */
  requires_confirmation?: boolean;
  /** Present when `requires_confirmation` — send this to the guest. */
  confirmation_url?: string | null;
  confirmation_expires_at?: string | null;
  invitee: { name: string; email: string; phone?: string };
  location?: { type: string; value?: string | null };
  metadata?: Record<string, unknown>;
  /** Team events: team member assigned to run this booking. */
  assigned_host_id?: string | null;
  /** Team events: auth user id of the assigned host. */
  assigned_host_user_id?: string | null;
  created_at?: string;
}

export interface SlotsQueryParams {
  event_type_id: string;
  /** Single-host events. Ignored when `member_ids` is provided. */
  host_id?: string;
  from: string;
  to: string;
  timezone: string;
  /** Team events: restrict merged availability to these team members. */
  member_ids?: string[];
  /** Team events: filter hosts by tag (e.g. language, skill). */
  filter?: { tag?: string };
}

export interface ListBookingsParams {
  /** "confirmed" | "canceled" | "all". Defaults to all. */
  status?: "confirmed" | "canceled" | "all";
  /** ISO-8601 UTC lower bound on start time. */
  from?: string;
  /** ISO-8601 UTC upper bound on start time. */
  to?: string;
  /** 1–100, default 50. */
  limit?: number;
}

export interface RequestOptions {
  /** Override the auto-generated Idempotency-Key on write calls. */
  idempotencyKey?: string;
}

export interface CreateBookingParams {
  event_type_id: string;
  host_id: string;
  slot_start: string;
  timezone: string;
  invitee: { name: string; email: string; phone?: string };
  metadata?: Record<string, unknown>;
  /** Team events: pin the booking to a specific team member. */
  assigned_host_id?: string;
}

export interface CancelBookingParams {
  reason?: string;
  guest_email?: string;
}

export interface RescheduleBookingParams {
  new_slot_start: string;
  timezone: string;
  guest_email?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  provider: "generic" | "zapier" | "make" | "n8n" | "automateo";
  is_active: boolean;
}

function randomKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class IntoCal {
  private readonly opts: Required<Pick<IntoCalOptions, "baseUrl">> & IntoCalOptions;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: IntoCalOptions = {}) {
    if (!opts.apiKey && !opts.publicKey) {
      // Anonymous mode is allowed for public read endpoints.
    }
    this.opts = { ...opts, baseUrl: opts.baseUrl || DEFAULT_BASE_URL };
    this.fetchImpl = opts.fetch || (globalThis as any).fetch;
    if (!this.fetchImpl) {
      throw new Error(
        "fetch is not available; pass `fetch` in IntoCalOptions (e.g. node-fetch).",
      );
    }
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.opts.apiKey) h["Authorization"] = `Bearer ${this.opts.apiKey}`;
    if (this.opts.publicKey) h["X-IntoCal-Public-Key"] = this.opts.publicKey;
    if (this.opts.host) h["X-IntoCal-Host"] = this.opts.host;
    return { ...h, ...(extra || {}) };
  }

  private async request<T>(
    path: string,
    init: RequestInit & { idempotent?: boolean } = {},
  ): Promise<ResponseEnvelope<T>> {
    const headers = this.headers(init.headers as Record<string, string>);
    if (init.idempotent && !headers["Idempotency-Key"]) {
      headers["Idempotency-Key"] = randomKey();
    }
    const res = await this.fetchImpl(`${this.opts.baseUrl}${path}`, {
      ...init,
      headers,
    });
    const json = (await res.json().catch(() => ({}))) as ResponseEnvelope<T>;
    if (!res.ok || (json && "ok" in json && !json.ok)) {
      const err = (json as any)?.error || { code: "HTTP_ERROR", message: res.statusText };
      throw new IntoCalError(err.message, err.code, res.status, err.suggested_action);
    }
    return json;
  }

  // ─── Resources ──────────────────────────────────────────────────────────

  eventTypes = {
    list: (params: { host_id?: string } = {}) => {
      const qs = params.host_id ? `?host_id=${encodeURIComponent(params.host_id)}` : "";
      // The API returns the array directly as `data`, not wrapped in
      // `{ event_types }` — verified against the live endpoint.
      return this.request<EventType[]>(`/event-types${qs}`);
    },
  };

  hosts = {
    availability: (host_id: string) =>
      this.request<{ weekly: unknown[]; overrides: unknown[] }>(
        `/hosts/${encodeURIComponent(host_id)}/availability`,
      ),
  };

  slots = {
    query: (params: SlotsQueryParams) =>
      this.request<{ slots: Slot[]; team?: SlotsTeamMeta }>(`/slots/query`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  };

  teams = {
    /** List hosts assigned to a team event type, including their tags. Optionally filter by tag. */
    hostsForEvent: (event_type_id: string, params: { tag?: string } = {}) => {
      const qs = params.tag ? `?tag=${encodeURIComponent(params.tag)}` : "";
      return this.request<{ hosts: SlotHost[] }>(
        `/event-types/${encodeURIComponent(event_type_id)}/hosts${qs}`,
      );
    },
  };

  bookings = {
    list: (params: ListBookingsParams = {}) => {
      const qs = new URLSearchParams();
      if (params.status) qs.set("status", params.status);
      if (params.from) qs.set("from", params.from);
      if (params.to) qs.set("to", params.to);
      if (params.limit) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return this.request<{ bookings: Booking[] }>(`/bookings${q ? `?${q}` : ""}`);
    },
    create: (params: CreateBookingParams, opts: RequestOptions = {}) =>
      this.request<Booking>(`/bookings`, {
        method: "POST",
        body: JSON.stringify(params),
        idempotent: true,
        headers: opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
      }),
    get: (id: string) => this.request<Booking>(`/bookings/${encodeURIComponent(id)}`),
    cancel: (id: string, params: CancelBookingParams = {}) =>
      this.request<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
        body: JSON.stringify(params),
        idempotent: true,
      }),
    reschedule: (id: string, params: RescheduleBookingParams) =>
      this.request<Booking>(`/bookings/${encodeURIComponent(id)}/reschedule`, {
        method: "POST",
        body: JSON.stringify(params),
        idempotent: true,
      }),
  };

  webhooks = {
    list: () => this.request<{ webhooks: WebhookEndpoint[] }>(`/webhooks`),
    create: (params: Omit<WebhookEndpoint, "id" | "is_active"> & { is_active?: boolean }) =>
      this.request<WebhookEndpoint>(`/webhooks`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    update: (id: string, params: Partial<Omit<WebhookEndpoint, "id">>) =>
      this.request<WebhookEndpoint>(`/webhooks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(params),
      }),
    delete: (id: string) =>
      this.request<{ deleted: boolean }>(`/webhooks/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    logs: (id: string) =>
      this.request<{ logs: unknown[] }>(`/webhooks/${encodeURIComponent(id)}/logs`),
    test: (id: string) =>
      this.request<{ delivered: boolean }>(`/webhooks/${encodeURIComponent(id)}/test`, {
        method: "POST",
      }),
  };

  integrations = {
    list: () => this.request<{ integrations: unknown[] }>(`/integrations`),
    create: (params: { provider: string; config?: Record<string, unknown> }) =>
      this.request<unknown>(`/integrations`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    delete: (id: string) =>
      this.request<{ deleted: boolean }>(`/integrations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  };
}

export default IntoCal;
