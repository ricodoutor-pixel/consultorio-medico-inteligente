#!/usr/bin/env bash
# ============================================================
# 🚨 Planta y Raiz — Deploy de Emergência (Hostinger Standby)
# ============================================================
# Roda NA VPS HOSTINGER quando a Oracle Cloud cair.
# Restaura o último snapshot e sobe a stack Docker completa.
#
# Uso:
#   ssh root@<IP_HOSTINGER>
#   sudo bash /opt/planta-failover/deploy-emergency.sh
# ============================================================

set -euo pipefail

FAILOVER_DIR="/opt/planta-failover"
INFRA_DIR="/opt/planta-infra/infra/vps-traefik"
LATEST="${FAILOVER_DIR}/latest"
DOCKER_VOLUMES_DIR="/var/lib/docker/volumes"

echo "🚨 [EMERGENCY] Ativando failover Hostinger..."
date

# ---------- 1. VALIDAÇÕES ----------
[ -d "$LATEST" ] || { echo "❌ Snapshot ausente em $LATEST"; exit 1; }
[ -f "$LATEST/.env" ] || { echo "❌ .env ausente no snapshot"; exit 1; }

# ---------- 2. CLONAR/ATUALIZAR REPO ----------
if [ ! -d "$INFRA_DIR/.git" ] && [ ! -d "/opt/planta-infra/.git" ]; then
  git clone --depth=1 https://github.com/ricodoutor-pixel/consultorio-medico-inteligente.git /opt/planta-infra
fi
git -C /opt/planta-infra pull --ff-only || true

# ---------- 3. RESTAURAR .env (já contém chaves atualizadas) ----------
cp "$LATEST/.env" "$INFRA_DIR/.env"
chmod 600 "$INFRA_DIR/.env"

# ---------- 4. PARAR STACK SE ESTIVER RODANDO ----------
cd "$INFRA_DIR"
docker compose down 2>/dev/null || true

# ---------- 5. RESTAURAR VOLUMES ----------
echo "📦 Restaurando volumes Docker..."
for archive in "$LATEST"/*.tar.gz; do
  [ -f "$archive" ] || continue
  vol=$(basename "$archive" .tar.gz)
  echo "  → $vol"
  docker volume create "$vol" >/dev/null
  TARGET="${DOCKER_VOLUMES_DIR}/${vol}/_data"
  mkdir -p "$TARGET"
  tar -xzf "$archive" -C "$TARGET"
done

# ---------- 6. SUBIR STACK ----------
echo "🚀 Subindo stack..."
docker compose pull
docker compose up -d

# ---------- 7. RESTAURAR DUMPS POSTGRES (após containers de pé) ----------
sleep 15

for dump in "$LATEST"/*.sql.gz; do
  [ -f "$dump" ] || continue
  vol=$(basename "$dump" .sql.gz)
  case "$vol" in
    plausible_db_data)
      echo "🐘 Restaurando Plausible DB..."
      gunzip -c "$dump" | docker exec -i plausible_db psql -U postgres || true
      ;;
    postgres_evolution)
      echo "🐘 Restaurando Evolution DB..."
      gunzip -c "$dump" | docker exec -i evolution_postgres psql -U evolution || true
      ;;
  esac
done

# ---------- 8. HEALTH CHECK ----------
sleep 10
echo ""
echo "✅ Stack de emergência ativa. Status:"
docker compose ps

echo ""
echo "⚠️  PRÓXIMO PASSO MANUAL:"
echo "   1. Cloudflare DNS → trocar registros A de api/bot/n8n/assinaturas/analytics"
echo "      para o IP da Hostinger ($(curl -s ifconfig.me))"
echo "   2. Aguardar propagação (TTL 60s recomendado)"
echo "   3. Reescanear QR do WhatsApp em https://api.<dominio>/manager"
