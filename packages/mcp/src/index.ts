#!/usr/bin/env node
/**
 * IntoCal MCP Server
 *
 * Exposes IntoCal scheduling primitives as MCP tools so AI agents
 * (Claude Desktop, Cursor, Windsurf, ChatGPT MCP clients) can:
 *   - list event types
 *   - query available slots
 *   - create / cancel / reschedule bookings
 *   - read upcoming bookings
 *
 * Configure with env vars:
 *   INTOCAL_API_KEY  — server-side secret key (sk_live_...)
 *   INTOCAL_BASE_URL — optional, defaults to https://api.intocal.com/v1
 *
 * Usage (stdio transport):
 *   npx -y @intocal/mcp
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { IntoCal } from "@intocal/sdk";
import { z } from "zod";

const apiKey = process.env.INTOCAL_API_KEY;
if (!apiKey) {
  console.error("Missing INTOCAL_API_KEY environment variable.");
  process.exit(1);
}
const client = new IntoCal({
  apiKey,
  baseUrl: process.env.INTOCAL_BASE_URL,
});

const server = new Server(
  { name: "intocal", version: "0.3.0" },
  { capabilities: { tools: {} } },
);

const tools = [
  {
    name: "list_event_types",
    description: "List all bookable event types for the authenticated host.",
    inputSchema: { type: "object", properties: {} },
    schema: z.object({}),
    run: async () => client.eventTypes.list(),
  },
  {
    name: "query_slots",
    description:
      "Return available booking slots for an event type within a date range. Times are ISO-8601 UTC. For team event types, pass `member_ids` to scope hosts and/or `filter.tag` to select hosts by tag (language, skill). Slots include `hosts_available[]` for team events.",
    inputSchema: {
      type: "object",
      required: ["event_type_id", "from", "to"],
      properties: {
        event_type_id: { type: "string" },
        host_id: { type: "string", description: "Single-host event only. Ignored when member_ids is provided." },
        from: { type: "string", description: "ISO-8601 UTC start" },
        to: { type: "string", description: "ISO-8601 UTC end" },
        timezone: { type: "string", description: "IANA TZ, e.g. America/New_York" },
        member_ids: {
          type: "array",
          items: { type: "string" },
          description: "Team events: restrict merged availability to these team_members.id values.",
        },
        filter: {
          type: "object",
          description: "Team events: filter hosts by attributes.",
          properties: {
            tag: { type: "string", description: "Only include hosts with this tag (e.g. 'de', 'design')." },
          },
        },
      },
    },
    schema: z.object({
      event_type_id: z.string(),
      host_id: z.string().optional(),
      from: z.string(),
      to: z.string(),
      timezone: z.string().optional(),
      member_ids: z.array(z.string()).optional(),
      filter: z.object({ tag: z.string().optional() }).optional(),
    }),
    run: (a: any) => client.slots.query(a),
  },
  {
    name: "list_hosts_for_event",
    description:
      "List hosts assigned to a team event type, including their tags. Use before query_slots when the user asks to pick a host by language, skill, or team.",
    inputSchema: {
      type: "object",
      required: ["event_type_id"],
      properties: {
        event_type_id: { type: "string" },
        tag: { type: "string", description: "Only return hosts carrying this tag (language, skill, category)." },
      },
    },
    schema: z.object({ event_type_id: z.string(), tag: z.string().optional() }),
    run: (a: any) => client.teams.hostsForEvent(a.event_type_id, { tag: a.tag }),
  },
  {
    name: "create_booking",
    description:
      "Create a booking. If the host's calendar requires confirmation, the response includes `confirmation_url` and the slot is only held once the guest clicks it. Uses an idempotency key to prevent duplicates. For team events, optionally pass `assigned_host_id` to pin a specific team member.",
    inputSchema: {
      type: "object",
      required: ["event_type_id", "start", "guest_name", "guest_email"],
      properties: {
        event_type_id: { type: "string" },
        host_id: { type: "string", description: "Optional — derived from the event type when omitted." },
        start: { type: "string", description: "ISO-8601 UTC start time" },
        guest_name: { type: "string" },
        guest_email: { type: "string" },
        timezone: { type: "string" },
        notes: { type: "string" },
        assigned_host_id: {
          type: "string",
          description: "Team events: pin the booking to a specific team_members.id.",
        },
      },
    },
    schema: z.object({
      event_type_id: z.string(),
      host_id: z.string().optional(),
      start: z.string(),
      guest_name: z.string(),
      guest_email: z.string().email(),
      timezone: z.string().optional(),
      notes: z.string().optional(),
      assigned_host_id: z.string().optional(),
    }),
    run: (a: any) =>
      client.bookings.create(
        {
          event_type_id: a.event_type_id,
          host_id: a.host_id,
          slot_start: a.start,
          timezone: a.timezone || "UTC",
          invitee: { name: a.guest_name, email: a.guest_email },
          metadata: a.notes ? { notes: a.notes } : undefined,
          assigned_host_id: a.assigned_host_id,
        } as any,
        { idempotencyKey: crypto.randomUUID() },
      ),
  },
  {
    name: "list_bookings",
    description: "List upcoming bookings for the authenticated host.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["confirmed", "canceled", "all"] },
        from: { type: "string", description: "ISO-8601 UTC lower bound on start time." },
        to: { type: "string", description: "ISO-8601 UTC upper bound on start time." },
        limit: { type: "number" },
      },
    },
    schema: z.object({
      status: z.enum(["confirmed", "canceled", "all"]).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    run: (a: any) => client.bookings.list(a),
  },
  {
    name: "cancel_booking",
    description: "Cancel a booking by id.",
    inputSchema: {
      type: "object",
      required: ["booking_id"],
      properties: {
        booking_id: { type: "string" },
        reason: { type: "string" },
      },
    },
    schema: z.object({
      booking_id: z.string(),
      reason: z.string().optional(),
    }),
    run: (a: any) => client.bookings.cancel(a.booking_id, { reason: a.reason }),
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = tools.find((t) => t.name === req.params.name);
  if (!tool) throw new Error(`Unknown tool: ${req.params.name}`);
  const args = tool.schema.parse(req.params.arguments ?? {});
  const result = await tool.run(args);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
