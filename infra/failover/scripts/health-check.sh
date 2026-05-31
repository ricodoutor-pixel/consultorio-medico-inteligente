#!/usr/bin/env bash
# ============================================================
# 🩺 Planta y Raiz — Health Check Oracle (alerta Telegram)
# ============================================================
# Roda em QUALQUER servidor externo (Hostinger ou cron job
# remoto) a cada 5 min. Se Oracle não responder em 3 tentativas
# consecutivas, dispara alerta Telegram E sugere failover.
#
# CRON:
#   */5 * * * * /opt/planta-failover/health-check.sh
# ============================================================

set -uo pipefail

ORACLE_URL="${ORACLE_URL:-https://api.plantayraiz.com.br/health}"
ORACLE_IP="${ORACLE_IP:-147.15.63.175}"
STATE_FILE="/tmp/planta-oracle-state"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

alert() {
  local msg="$1"
  echo "[$(date)] ALERT: $msg"
  if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      -d parse_mode="Markdown" \
      -d text="🚨 *Planta y Raiz — Oracle DOWN*%0A${msg}%0A%0AAtive failover: \`sudo bash /opt/planta-failover/deploy-emergency.sh\`" \
      >/dev/null
  fi
  if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null; then
    echo -e "$msg\n\nAtive: sudo bash /opt/planta-failover/deploy-emergency.sh" \
      | mail -s "🚨 Planta y Raiz — Oracle DOWN" "$ALERT_EMAIL"
  fi
}

# 3 tentativas, 5s timeout cada
fails=0
for i in 1 2 3; do
  if curl -sf --max-time 5 "$ORACLE_URL" >/dev/null; then
    fails=0; break
  fi
  fails=$((fails+1))
  sleep 5
done

prev_state=$(cat "$STATE_FILE" 2>/dev/null || echo "UP")

if [ "$fails" -ge 3 ]; then
  if [ "$prev_state" = "UP" ]; then
    alert "Oracle ($ORACLE_IP) não responde há 3 tentativas (15s). Endpoint: $ORACLE_URL"
  fi
  echo "DOWN" > "$STATE_FILE"
else
  if [ "$prev_state" = "DOWN" ]; then
    alert "✅ Oracle ($ORACLE_IP) voltou ao normal."
  fi
  echo "UP" > "$STATE_FILE"
fi
