#!/usr/bin/env bash

set -euo pipefail

TARGET="/opt/planta-infra/infra/vps-traefik"
VOLUME_NAME="vps-traefik_evolution_instances"

echo "🛠️ [1/6] Verificando stack local..."
if [ ! -d "${TARGET}" ]; then
  echo "❌ Stack não encontrada em ${TARGET}. Rode o bootstrap primeiro."
  exit 1
fi

cd "${TARGET}"

echo "🔄 [2/6] Atualizando arquivos do repositório..."
git pull --ff-only || true

echo "⏹️ [3/6] Parando somente o Evolution..."
docker compose stop evolution || true

echo "🧹 [4/6] Limpando estado corrompido do Baileys..."
docker volume rm "${VOLUME_NAME}" 2>/dev/null || true
docker volume create "${VOLUME_NAME}" >/dev/null

echo "📦 [5/6] Baixando e subindo a versão estável com fix de QR..."
docker compose pull evolution
docker compose up -d evolution

echo "📜 [6/6] Logs do boot do Evolution (Ctrl+C para sair)..."
docker compose logs -f evolution | grep -i -E "server is running|database connected|qr|ready|error|baileys"