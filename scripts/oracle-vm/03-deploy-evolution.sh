#!/usr/bin/env bash
# Evolution API (Brisa Bot WhatsApp) via Docker
# Roda como 'deploy': bash scripts/oracle-vm/03-deploy-evolution.sh
set -euo pipefail

EVOLUTION_DIR="/home/deploy/evolution"
mkdir -p "$EVOLUTION_DIR/instances" "$EVOLUTION_DIR/store"

# Lê EVOLUTION_API_KEY do .env do backend (mesma chave)
source /home/deploy/plantayraiz/.env

docker rm -f evolution-api 2>/dev/null || true

docker run -d \
  --name evolution-api \
  --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  -e AUTHENTICATION_API_KEY="$EVOLUTION_API_KEY" \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=false \
  -e CACHE_REDIS_ENABLED=false \
  -e CACHE_LOCAL_ENABLED=true \
  -e LOG_LEVEL=ERROR,WARN,INFO \
  -e CONFIG_SESSION_PHONE_CLIENT="Brisa CEO" \
  -e WEBHOOK_GLOBAL_URL="https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/whatsapp-brisa-bot?token=$EVOLUTION_WEBHOOK_SECRET" \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -v "$EVOLUTION_DIR/instances":/evolution/instances \
  -v "$EVOLUTION_DIR/store":/evolution/store \
  atendai/evolution-api:latest

sleep 5
echo "==> Status:"
docker ps --filter name=evolution-api
echo ""
echo "✅ Evolution rodando em 127.0.0.1:8080 (Nginx faz proxy público)"
echo "👉 Após Nginx + TLS, acesse https://bot.plantayraiz.com.br/manager para escanear QR"
