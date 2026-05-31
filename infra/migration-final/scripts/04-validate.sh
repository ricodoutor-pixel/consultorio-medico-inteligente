#!/usr/bin/env bash
# ============================================================
# 🟢 ETAPA 4 — VALIDAÇÃO PÓS-MIGRAÇÃO (Oracle)
# ============================================================
set -euo pipefail

DOMAINS=(api.plantayraiz.com.br bot.plantayraiz.com.br n8n.plantayraiz.com.br assinaturas.plantayraiz.com.br analytics.plantayraiz.com.br)

echo "🔎 Containers ativos:"
docker compose -f /opt/planta-infra/infra/vps-traefik/docker-compose.yml ps

echo ""
echo "🔎 HTTPS health-check de cada subdomínio:"
for d in "${DOMAINS[@]}"; do
  code=$(curl -sko /dev/null -w "%{http_code}" "https://$d/" --max-time 8 || echo "ERR")
  printf "  %-40s → %s\n" "$d" "$code"
done

echo ""
echo "🔎 Postgres — contagem de tabelas:"
docker exec plausible_db       psql -U postgres -c "\dt" 2>/dev/null | tail -5 || true
docker exec evolution_postgres psql -U evolution -c "\dt" 2>/dev/null | tail -5 || true

echo ""
echo "🔎 N8N — workflows existentes (deve mostrar os mesmos da Hostinger):"
docker exec -it $(docker ps -qf name=n8n) n8n list:workflow 2>/dev/null | head -20 || \
  echo "  ⚠️  rode: docker exec -it <n8n_container> n8n list:workflow"

echo ""
echo "🔎 Evolution — instâncias:"
EVO_KEY=$(grep -E '^EVOLUTION_API_KEY=' /opt/planta-infra/infra/vps-traefik/.env | cut -d= -f2-)
curl -s -H "apikey: $EVO_KEY" https://bot.plantayraiz.com.br/instance/fetchInstances | head -c 500
echo ""

echo ""
echo "✅ Se tudo verde + WhatsApp Brisa respondendo + N8N abrindo fluxos → pode desligar Hostinger."
