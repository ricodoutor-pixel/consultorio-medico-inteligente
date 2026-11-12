#!/usr/bin/env bash
# Vigia do vídeo próprio (Jitsi) — roda pelo cron da VPS a cada 2 minutos.
# Mexe SOMENTE nos containers de /opt/jitsi: sobe os que pararam e reinicia o "web" após 3 falhas seguidas de HTTPS.
# Instalação (uma vez):  chmod +x /opt/jitsi/watchdog.sh
#   (crontab -l 2>/dev/null | grep -v jitsi/watchdog.sh; echo '*/2 * * * * /opt/jitsi/watchdog.sh') | crontab -
set -u
DIR="${JITSI_DIR:-/opt/jitsi}"
LOG="${JITSI_WATCHDOG_LOG:-/var/log/jitsi-watchdog.log}"
STATE="$DIR/.watchdog-fails"
cd "$DIR" || exit 0
DOMAIN=$(grep -E '^JITSI_DOMAIN=' .env 2>/dev/null | cut -d= -f2)
DOMAIN="${DOMAIN:-meet.plantayraiz.com.br}"
log() { echo "$(date -Is) $*" >> "$LOG"; }

# Mantém o log pequeno (últimas 2000 linhas).
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 4000 ]; then tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi

RUNNING=$(docker compose ps --status running --services 2>/dev/null | wc -l)
if [ "$RUNNING" -lt 4 ]; then
  log "apenas $RUNNING/4 serviços rodando; subindo os que pararam"
  docker compose up -d >> "$LOG" 2>&1
fi

if curl -fsS -o /dev/null --max-time 10 "https://$DOMAIN/"; then
  [ -f "$STATE" ] && log "HTTPS voltou ao normal" && rm -f "$STATE"
  exit 0
fi

FAILS=$(( $(cat "$STATE" 2>/dev/null || echo 0) + 1 ))
echo "$FAILS" > "$STATE"
log "HTTPS falhou ($FAILS seguida(s))"
if [ "$FAILS" -ge 3 ]; then
  log "reiniciando o serviço web do Jitsi"
  docker compose restart web >> "$LOG" 2>&1
  echo 0 > "$STATE"
fi
