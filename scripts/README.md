# scripts

## healthcheck.sh

Probes the public API surface of `api.intocal.com` and exits non-zero if anything is
wrong. Run it by hand any time:

```bash
./scripts/healthcheck.sh
```

It checks six things — `/health` returns 200, `/v1` routes through to the edge function
(a `400 HOST_REQUIRED` proves the whole chain without needing a real host id), `/mcp` and
`/connector` forward, unknown paths 404, and `/health` reports `configured: true`. Each
check retries three times with backoff, so a single transient blip will not trip it.

Override the target for staging: `BASE=https://intocal-api.intocal.deno.net ./scripts/healthcheck.sh`

`.github/workflows/uptime.yml` runs this every 10 minutes, opens a labelled `uptime`
issue when it fails, comments if it keeps failing, and closes the issue on recovery.
