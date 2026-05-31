#!/usr/bin/env bash
# ============================================================
# 🟢 ETAPA 3 — IMPORTAR DADOS NA ORACLE
# ============================================================
# Rode NA VM ORACLE (sudo). Restaura volumes + dumps recebidos da Hostinger.
# Pré-requisito: stack já provisionada em /opt/planta-infra/infra/vps-traefik
#   (docker-compose.yml + .env já presentes) — basta SUBIR depois.
# ============================================================
set -euo pipefail

INCOMING_DIR="${INCOMING_DIR:-/opt/planta-migration-incoming}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/planta-infra/infra/vps-traefik}"
VOLUMES_DIR="/var/lib/docker/volumes"

LATEST_TGZ=$(ls -1t ${INCOMING_DIR}/planta-migration-FINAL-*.tar.gz | head -1)
[ -n "$LATEST_TGZ" ] || { echo "❌ Pacote não encontrado em ${INCOMING_DIR}"; exit 1; }

echo "🧯 [1/6] Garantindo que stack está PARADA na Oracle (evita corromper volume)..."
( cd "$COMPOSE_DIR" && docker compose down || true )

WORK="/tmp/planta-restore-$$"
mkdir -p "$WORK"
echo "📂 [2/6] Extraindo $LATEST_TGZ..."
tar -xzf "$LATEST_TGZ" -C "$WORK"
INNER=$(ls -1d "$WORK"/planta-migration-* | head -1)

echo "📦 [3/6] Restaurando volumes Docker..."
for f in "$INNER"/volumes/*.tar.gz; do
  vol=$(basename "$f" .tar.gz)
  echo "  ↩️  $vol"
  docker volume create "$vol" >/dev/null
  DEST="${VOLUMES_DIR}/${vol}/_data"
  rm -rf "${DEST:?}"/* "${DEST:?}"/.[!.]* 2>/dev/null || true
  tar --numeric-owner -xzpf "$f" -C "$DEST"
done

echo "🔐 [4/6] Comparando .env (Hostinger vs Oracle) — diferenças (se houver):"
if [ -f "$INNER/config/.env" ] && [ -f "$COMPOSE_DIR/.env" ]; then
  diff <(sort "$INNER/config/.env") <(sort "$COMPOSE_DIR/.env") || true
  echo ""
  read -rp "↪️  Deseja SUBSTITUIR o .env da Oracle pelo da Hostinger? (s/N) " ans
  if [[ "$ans" =~ ^[sS]$ ]]; then
    cp "$INNER/config/.env" "$COMPOSE_DIR/.env"
    chmod 600 "$COMPOSE_DIR/.env"
    echo "  ✅ .env sincronizado."
  fi
fi

echo "🚀 [5/6] Subindo stack na Oracle..."
( cd "$COMPOSE_DIR" && docker compose pull && docker compose up -d )
sleep 15

echo "🩺 [6/6] Restaurando dumps Postgres dentro dos containers vivos..."
if [ -f "$INNER/dumps/plausible_db.sql.gz" ]; then
  gunzip -c "$INNER/dumps/plausible_db.sql.gz" | docker exec -i plausible_db psql -U postgres || true
fi
if [ -f "$INNER/dumps/evolution_db.sql.gz" ]; then
  gunzip -c "$INNER/dumps/evolution_db.sql.gz" | docker exec -i evolution_postgres psql -U evolution || true
fi

rm -rf "$WORK"
echo ""
echo "✅ IMPORT CONCLUÍDO. Valide com 04-validate.sh"
