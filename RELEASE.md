# IntoCal npm release runbook

Three packages ship to npm; one Deno service must be live first.

| Package          | Path             | Publishes as     |
| ---------------- | ---------------- | ---------------- |
| `@intocal/sdk`   | `packages/sdk`   | `@intocal/sdk`   |
| `@intocal/react` | `packages/react` | `@intocal/react` |
| `@intocal/mcp`   | `packages/mcp`   | `@intocal/mcp`   |
| —                | `packages/proxy` | not published (Deno Deploy) |

All three are at **0.3.1**, and all three names are unclaimed on npm.

## Order matters

`@intocal/mcp` depends on `@intocal/sdk@^0.3.1`. Publish the SDK first, or the
MCP install will 404 for everyone. The local workspace symlink hides this during
development — it does not help consumers.

## Step 1 — proxy live (blocking)

See `packages/proxy/README.md`. Deploy with `deno deploy --org intocal --app intocal-api --prod`
(**not** `deployctl` — that targets classic Deno Deploy, a different product from
console.deno.com). Do not proceed until both return 200:

```bash
curl -s https://api.intocal.com/health
curl -s https://api.intocal.com/v1/event-types -H "Authorization: Bearer sk_live_..."
```

Status (2026-08-20): **both gates pass.**

- `https://api.intocal.com/health` -> 200 `{"ok":true,"service":"intocal-api-proxy","configured":true}`
- `https://api.intocal.com/v1/event-types` -> 200, payload byte-identical to the
  Supabase origin (proxy is transparent)
- TLS cert `CN=api.intocal.com` provisioned; domain attached to the Production timeline
- Built SDK with zero config resolves `https://api.intocal.com/v1` and returns
  correctly typed data

## Step 2 — npm org

```bash
npm login
npm org create intocal
```

## Step 3 — publish

### Locally

```bash
npm install
npm run build
cd packages/sdk   && npm publish --access public
cd ../react       && npm publish --access public
cd ../mcp         && npm publish --access public
```

### Or via GitHub Actions

Add repo secret `NPM_TOKEN` (npm → Access Tokens → **Automation**), push, then tag:

| Tag       | Publishes    |
| --------- | ------------ |
| `sdk-v*`  | sdk          |
| `react-v*`| react        |
| `mcp-v*`  | mcp          |
| `all-v*`  | all three    |

`.github/workflows/publish-packages.yml` publishes with `--provenance`.

## Step 4 — verify

```bash
npm view @intocal/sdk
npx -y @intocal/mcp    # exits 1 with "Missing INTOCAL_API_KEY" — that is success
```
