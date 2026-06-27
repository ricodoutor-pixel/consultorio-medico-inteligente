#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ $# -lt 1 ]; then
  echo "Uso: bash scripts/rollback.sh <commit-or-tag>"
  exit 1
fi

TARGET="$1"
echo "[rollback] Revertendo para $TARGET"
git checkout "$TARGET" -- .

echo "[rollback] Revertido localmente. Revise e faça novo commit se necessário."
