# intocal-api-proxy

~100 lines of standalone Deno that own **https://api.intocal.com** — the stable
public origin baked into `@intocal/sdk`. Deployed to Deno Deploy, *outside* the
Lovable project (Lovable hosts the static React app and Cloud edge functions on
the backend domain; neither can own `api.intocal.com`).

```
https://api.intocal.com/v1/<path>
  -> ${BACKEND_ORIGIN}/functions/v1/api-v1/v1/<path>
```

`/health` is answered locally. Everything outside `/v1/*` returns a 404 envelope.

## Deploy

> **Use `deno deploy`, not `deployctl`.** `deployctl` targets *classic* Deno Deploy
> (dash.deno.com) and its `--project` flag creates a project there. The console at
> console.deno.com is the newer Deploy, which uses `--org` / `--app`.

Live at **https://intocal-api.intocal.deno.net** (org `intocal`, app `intocal-api`,
region `eu` — matching the backend's `eu-central-1`).

```bash
cd packages/proxy
deno deploy --org intocal --app intocal-api --prod
```

> Set `BACKEND_ORIGIN` **before** the first deploy. The revision runs the entrypoint
> during its warming step, so an unconfigured app that exits on startup fails the
> build. `main.ts` no longer exits — it serves 503 on `/v1/*` and reports
> `{"configured":false}` on `/health` — but the variable still has to be there for
> the deployment to be useful.

```bash
curl -s https://intocal-api.intocal.deno.net/health
# {"ok":true,"service":"intocal-api-proxy","configured":true}
```

## Environment variables

Set them from the CLI:

```bash
deno deploy env add BACKEND_ORIGIN https://<project-ref>.supabase.co --org intocal --app intocal-api
deno deploy env list --org intocal --app intocal-api
```

Or in the console → app → Settings → Environment Variables:

| Key                 | Value                                          | Required |
| ------------------- | ---------------------------------------------- | -------- |
| `BACKEND_ORIGIN`    | the backend origin, set in Deno Deploy only     | yes      |
| `BACKEND_PREFIX`    | `/functions/v1/api-v1` (default — omit to keep) | no       |
| `SUPABASE_ANON_KEY` | only if the edge gateway demands an `apikey`    | no       |

## Custom domain

No CLI for this one — console.deno.com → org `intocal` → app `intocal-api` →
Settings → Domains → Add Domain → `api.intocal.com`.
Then at the registrar where `intocal.com` lives today (no migration — just add records):

| Type  | Name                  | Value                                   | TTL  |
| ----- | --------------------- | --------------------------------------- | ---- |
| CNAME | `api`                 | the target shown on the Add Domain screen | 3600 |
| CNAME | `_acme-challenge.api` | the ACME target shown on the same screen  | 3600 |

Both values are generated per domain — copy them verbatim from that screen. (The
older `*.deno.dev` target belongs to classic Deno Deploy and does not apply here.)
Then Verify → Provision Certificate (1–5 min).

## Gate before `npm publish`

```bash
curl -s https://api.intocal.com/health
curl -s https://api.intocal.com/v1/event-types -H "Authorization: Bearer sk_live_..."
```

Both must succeed first. `https://api.intocal.com/v1` is baked into the SDK
permanently — a wrong value can only be corrected with a new release.
