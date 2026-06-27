#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://plantayraiz.com.br/health}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

response=$(curl -fsS -o /tmp/health-response.json -w '%{http_code}' "$URL" || true)
if [ "$response" != "200" ]; then
  echo "[monitor] Health check falhou em $TIMESTAMP: $URL (HTTP $response)"
  exit 1
fi

echo "[monitor] Health check OK em $TIMESTAMP: $URL"
cat /tmp/health-response.json
