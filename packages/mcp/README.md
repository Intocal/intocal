# @intocal/mcp

Model Context Protocol server for [IntoCal](https://intocal.com). Lets AI agents (Claude Desktop, Cursor, Windsurf, ChatGPT MCP) query availability, create bookings, and manage your calendar.

## Install (Claude Desktop)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "intocal": {
      "command": "npx",
      "args": ["-y", "@intocal/mcp"],
      "env": { "INTOCAL_API_KEY": "sk_live_..." }
    }
  }
}
```

Generate a key at **Dashboard → Distribution → API Keys** on [intocal.com](https://intocal.com).

## Tools

- `list_event_types`
- `query_slots` — supports team `member_ids` and `filter.tag`
- `list_hosts_for_event` — team hosts + tags (language, skill, category)
- `create_booking` — returns `confirmation_url` when the calendar is two-step
- `list_bookings` — filter by `status`, `from`, `to`, `limit`
- `cancel_booking`

All times are ISO-8601 UTC. Bookings use idempotency keys automatically.

## Docs

- API reference: https://intocal.com/docs/api
- LLM-friendly: https://intocal.com/llms-full.txt
- OpenAPI: https://intocal.com/.well-known/openapi.json

MIT License.
