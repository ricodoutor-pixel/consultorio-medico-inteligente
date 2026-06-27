#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://plantayraiz.com.br/health}"

response=$(curl -fsS "$URL" || true)
if [ -z "$response" ]; then
  echo "Health check falhou: $URL"
  exit 1
fi

echo "Health check OK: $URL"
echo "$response"
