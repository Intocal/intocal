#!/usr/bin/env bash
# Probes the public IntoCal API surface. Exits 0 if everything is healthy,
# 1 otherwise, and prints a summary suitable for pasting into an issue.
#
#   ./scripts/healthcheck.sh
#   BASE=https://intocal-api.intocal.deno.net ./scripts/healthcheck.sh
set -uo pipefail

BASE="${BASE:-https://api.intocal.com}"
ATTEMPTS="${ATTEMPTS:-3}"      # retries before calling a check failed
TIMEOUT="${TIMEOUT:-15}"
failures=0
report=""

# probe <name> <expected-status> <curl-args...>
probe() {
  local name="$1" want="$2"; shift 2
  local got="" time="" i
  for ((i = 1; i <= ATTEMPTS; i++)); do
    out=$(curl -s -o /dev/null -m "$TIMEOUT" -w "%{http_code}:%{time_total}" "$@" 2>/dev/null)
    got="${out%%:*}"; time="${out##*:}"
    [ "$got" = "$want" ] && break
    sleep $(( i * 2 ))          # 2s, 4s — ride out a transient blip
  done
  if [ "$got" = "$want" ]; then
    printf '  ok   %-22s %s in %ss\n' "$name" "$got" "$time"
  else
    printf '  FAIL %-22s got %s, want %s (after %s attempts)\n' "$name" "${got:-no-response}" "$want" "$ATTEMPTS"
    failures=$((failures + 1))
    report="${report}- \`${name}\`: got ${got:-no response}, expected ${want}"$'\n'
  fi
}

echo "IntoCal API health — $BASE — $(date -u '+%Y-%m-%d %H:%M:%SZ')"

probe "/health"            200 "$BASE/health"
probe "/v1 routing"        400 "$BASE/v1/event-types"          # 400 HOST_REQUIRED proves proxy -> edge function
probe "/mcp routing"       404 "$BASE/mcp/__healthcheck__"     # 404 from mcp-user proves the route forwards
probe "/connector routing" 400 -X POST -H "Content-Type: application/json" -d '{}' "$BASE/connector/start"
probe "unknown path 404"   404 "$BASE/__no_such_route__"

# /health must also report itself configured — a deploy without BACKEND_ORIGIN
# still answers 200 on the route but is useless for traffic.
body=$(curl -s -m "$TIMEOUT" "$BASE/health" 2>/dev/null | head -c 200 | tr -d '
')
if printf '%s' "$body" | grep -q '"configured":true'; then
  echo "  ok   configured flag       true"
else
  echo "  FAIL configured flag       body: ${body:-no response}"
  failures=$((failures + 1))
  report="${report}- \`configured\` flag is not true: \`${body:-no response}\`"$'\n'
fi

echo
if [ "$failures" -eq 0 ]; then
  echo "All checks passed."
else
  echo "$failures check(s) failed."
  { echo "FAILURES<<__EOF__"; printf '%s' "$report"; echo "__EOF__"; } >> "${GITHUB_OUTPUT:-/dev/null}"
fi
exit $(( failures > 0 ? 1 : 0 ))
