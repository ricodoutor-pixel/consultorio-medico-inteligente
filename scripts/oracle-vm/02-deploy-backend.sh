#!/usr/bin/env bash
# Deploy do backend Node.js (tRPC) na Oracle VM
# Roda como usuário 'deploy': sudo -u deploy bash scripts/oracle-vm/02-deploy-backend.sh
set -euo pipefail

REPO="https://github.com/ricodoutor-pixel/consultorio-medico-inteligente.git"
APP_DIR="/home/deploy/plantayraiz"
BRANCH="${BRANCH:-main}"

echo "==> Clonando/atualizando repo"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git fetch && git reset --hard "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Instalando deps + build"
bun install --frozen-lockfile
bun run build

echo "==> .env do servidor (preencha manualmente em /home/deploy/plantayraiz/.env)"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=3000
VITE_SUPABASE_URL=https://shmbwdjuddvquszwkvuq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=__PREENCHER__
SUPABASE_SERVICE_ROLE_KEY=__PREENCHER__
MERCADO_PAGO_ACCESS_TOKEN=__PREENCHER__
EVOLUTION_API_KEY=__PREENCHER__
EVOLUTION_WEBHOOK_SECRET=__PREENCHER__
EOF
  echo "⚠️  Edite $APP_DIR/.env antes de continuar"
fi

echo "==> PM2 start"
pm2 delete plantayraiz-api 2>/dev/null || true
pm2 start "$APP_DIR/dist/server.js" \
  --name plantayraiz-api \
  --max-memory-restart 400M \
  --log-date-format 'YYYY-MM-DD HH:mm:ss' \
  --time
pm2 save

echo "✅ Backend rodando em :3000 — pm2 logs plantayraiz-api"
