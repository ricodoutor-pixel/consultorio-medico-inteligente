#!/usr/bin/env bash
# ============================================================
# 🟠 ETAPA 1 — EXPORTAÇÃO TOTAL DA HOSTINGER
# ============================================================
# Rode NA VPS HOSTINGER (root).
# Gera /root/planta-migration-FINAL-<timestamp>.tar.gz contendo:
#   • Dumps Postgres (Plausible + Evolution) consistentes
#   • Snapshot Redis (RDB)
#   • Volumes Docker (n8n_data, docuseal_data, evolution_instances, traefik_letsencrypt etc.)
#   • .env e docker-compose.yml
#   • Hash SHA-256 para verificar integridade no destino
# ============================================================
set -euo pipefail

TS=$(date +%Y%m%d_%H%M%S)
WORK="/root/planta-migration-${TS}"
OUT="/root/planta-migration-FINAL-${TS}.tar.gz"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/planta-infra/infra/vps-traefik}"
VOLUMES_DIR="/var/lib/docker/volumes"

VOLUMES=(
  n8n_data docuseal_data evolution_instances traefik_letsencrypt
  plausible_data plausible_db_data plausible_event_data
  postgres_evolution redis_evolution
)

mkdir -p "$WORK"/{dumps,volumes,config}

echo "🩺 [1/5] Dumps Postgres consistentes..."
docker exec plausible_db        pg_dumpall -U postgres  | gzip > "$WORK/dumps/plausible_db.sql.gz"  || true
docker exec evolution_postgres  pg_dumpall -U evolution | gzip > "$WORK/dumps/evolution_db.sql.gz" || true

echo "🩺 [2/5] Snapshot Redis..."
docker exec evolution_redis redis-cli SAVE >/dev/null 2>&1 || true

echo "📦 [3/5] Tar dos volumes Docker (preservando permissões)..."
for v in "${VOLUMES[@]}"; do
  SRC="${VOLUMES_DIR}/${v}/_data"
  [ -d "$SRC" ] || { echo "  ⏭  $v não existe — pulando"; continue; }
  # --numeric-owner + -p preservam uid/gid e modos exatos
  tar --numeric-owner -czpf "$WORK/volumes/${v}.tar.gz" -C "$SRC" . 2>/dev/null
  echo "  ✅ $v"
done

echo "🔐 [4/5] Copiando .env e docker-compose.yml..."
cp "$COMPOSE_DIR/.env"               "$WORK/config/.env"                2>/dev/null || true
cp "$COMPOSE_DIR/docker-compose.yml" "$WORK/config/docker-compose.yml"  2>/dev/null || true
chmod 600 "$WORK/config/.env" 2>/dev/null || true

echo "🧮 [5/5] Empacotando + hash SHA-256..."
tar -czf "$OUT" -C "$(dirname "$WORK")" "$(basename "$WORK")"
sha256sum "$OUT" > "${OUT}.sha256"
rm -rf "$WORK"

echo ""
echo "✅ EXPORT PRONTO: $OUT"
echo "   SHA256: $(cat ${OUT}.sha256)"
echo "   Tamanho: $(du -sh $OUT | cut -f1)"
echo ""
echo "👉 Próximo passo: rode 02-transfer-to-oracle.sh"
