#!/usr/bin/env bash
# ============================================================
# 🟢 Planta y Raiz — Backup Oracle → Hostinger (Cold Standby)
# ============================================================
# Roda na VM Oracle (primário) via CRON diário às 03:00 BRT.
# Espelha volumes Docker + .env + docker-compose.yml para a
# VPS Hostinger via rsync sobre SSH.
#
# Pré-requisitos (uma única vez):
#   1. ssh-keygen -t ed25519 -f ~/.ssh/failover_key
#   2. ssh-copy-id -i ~/.ssh/failover_key.pub root@<IP_HOSTINGER>
#   3. chmod 700 backup.sh
#
# Instalar no CRON:
#   sudo crontab -e
#   0 3 * * * /opt/planta-infra/infra/failover/scripts/backup.sh >> /var/log/planta-backup.log 2>&1
# ============================================================

set -euo pipefail

# ---------- CONFIG ----------
HOSTINGER_IP="${HOSTINGER_IP:-2.24.69.154}"
HOSTINGER_USER="${HOSTINGER_USER:-root}"
SSH_KEY="${SSH_KEY:-/root/.ssh/failover_key}"
REMOTE_DIR="/opt/planta-failover"
LOCAL_INFRA="/opt/planta-infra"
DOCKER_VOLUMES_DIR="/var/lib/docker/volumes"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCK_FILE="/tmp/planta-backup.lock"

# Telegram alerts (opcional — exporte no /etc/environment)
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# ---------- LOCK ----------
exec 200>"$LOCK_FILE"
flock -n 200 || { echo "[$(date)] Backup já em execução, abortando."; exit 1; }

# ---------- HELPERS ----------
notify() {
  local status="$1"; local msg="$2"
  echo "[$(date)] [$status] $msg"
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      -d text="🟢 Planta y Raiz Backup [$status]: $msg" >/dev/null || true
  fi
}

trap 'notify "FAIL" "Backup interrompido na linha $LINENO"' ERR

# ---------- 1. SNAPSHOT VOLUMES DOCKER ----------
notify "START" "Iniciando backup Oracle → Hostinger ($TIMESTAMP)"

# Lista de volumes a sincronizar (alinhada com infra/vps-traefik/docker-compose.yml)
VOLUMES=(
  "n8n_data"
  "docuseal_data"
  "plausible_db_data"
  "plausible_event_data"
  "plausible_data"
  "postgres_evolution"
  "redis_evolution"
  "evolution_instances"
  "traefik_letsencrypt"
)

SNAPSHOT_DIR="/tmp/planta-snapshot-$TIMESTAMP"
mkdir -p "$SNAPSHOT_DIR"

for vol in "${VOLUMES[@]}"; do
  SRC="${DOCKER_VOLUMES_DIR}/${vol}/_data"
  if [ -d "$SRC" ]; then
    echo "📦 Snapshot $vol..."
    # Para DBs: dump consistente (em vez de copiar arquivo vivo)
    case "$vol" in
      plausible_db_data)
        docker exec plausible_db pg_dumpall -U postgres \
          | gzip > "$SNAPSHOT_DIR/${vol}.sql.gz" || true
        ;;
      postgres_evolution)
        docker exec evolution_postgres pg_dumpall -U evolution \
          | gzip > "$SNAPSHOT_DIR/${vol}.sql.gz" || true
        ;;
      *)
        tar -czf "$SNAPSHOT_DIR/${vol}.tar.gz" -C "$SRC" . 2>/dev/null || true
        ;;
    esac
  fi
done

# ---------- 2. COPIAR .env e docker-compose.yml ----------
cp "$LOCAL_INFRA/infra/vps-traefik/docker-compose.yml" "$SNAPSHOT_DIR/" 2>/dev/null || true
cp "$LOCAL_INFRA/infra/vps-traefik/.env"             "$SNAPSHOT_DIR/.env" 2>/dev/null || true

# ---------- 3. RSYNC PARA HOSTINGER ----------
notify "SYNC" "Enviando snapshot ($(du -sh $SNAPSHOT_DIR | cut -f1)) para Hostinger"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${HOSTINGER_USER}@${HOSTINGER_IP}" \
  "mkdir -p ${REMOTE_DIR}/snapshots ${REMOTE_DIR}/latest"

rsync -avz --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$SNAPSHOT_DIR/" \
  "${HOSTINGER_USER}@${HOSTINGER_IP}:${REMOTE_DIR}/latest/"

# Mantém histórico (últimos 7 dias) no destino
ssh -i "$SSH_KEY" "${HOSTINGER_USER}@${HOSTINGER_IP}" \
  "cp -r ${REMOTE_DIR}/latest ${REMOTE_DIR}/snapshots/${TIMESTAMP} && \
   ls -1t ${REMOTE_DIR}/snapshots | tail -n +8 | xargs -I{} rm -rf ${REMOTE_DIR}/snapshots/{}"

# ---------- 4. CLEANUP ----------
rm -rf "$SNAPSHOT_DIR"

notify "OK" "Backup concluído com sucesso ✅ ($TIMESTAMP)"
