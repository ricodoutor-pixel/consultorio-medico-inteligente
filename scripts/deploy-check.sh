#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[deploy] Validando ambiente..."
node scripts/validate-env.mjs

echo "[deploy] Verificando alterações..."
git status --short

echo "[deploy] Build local..."
npm run build

echo "[deploy] Deploy pronto para commit/push."
