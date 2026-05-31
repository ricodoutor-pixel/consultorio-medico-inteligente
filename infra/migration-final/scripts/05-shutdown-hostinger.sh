#!/usr/bin/env bash
# ============================================================
# 🔴 ETAPA 5 — DESLIGAMENTO + WIPE SEGURO DA HOSTINGER
# ============================================================
# ⚠️  IRREVERSÍVEL. Rode SOMENTE após 04-validate.sh OK na Oracle por 24h.
# Rode NA VPS HOSTINGER (root).
# ============================================================
set -euo pipefail

echo "⛔  Este script vai PARAR todos os serviços e APAGAR dados sensíveis."
read -rp "Digite EXATAMENTE 'DESLIGAR HOSTINGER' para continuar: " conf
[ "$conf" = "DESLIGAR HOSTINGER" ] || { echo "Abortado."; exit 1; }

echo ""
echo "🛑 [1/5] Parando stack Docker..."
cd /opt/planta-infra/infra/vps-traefik 2>/dev/null && docker compose down -v || true

echo "🧟 [2/5] Procurando processos zumbis (qualquer coisa ainda escutando portas web)..."
ss -tulpn | grep -E ':(80|443|3000|5432|6379|8080|5678)\b' || echo "  ✅ Nenhuma porta crítica ativa."
ps aux | grep -E 'node|docker|postgres|redis|nginx|n8n|evolution' | grep -v grep || echo "  ✅ Sem processos remanescentes."

echo "🧹 [3/5] Removendo containers, imagens, volumes e networks Docker..."
docker system prune -a --volumes -f || true
rm -rf /var/lib/docker/volumes/* 2>/dev/null || true

echo "🔥 [4/5] Sobrescrevendo arquivos sensíveis (.env, chaves, dumps) com shred..."
find / -type f \( -name ".env" -o -name "*.pem" -o -name "*.key" -o -name "*.sql.gz" -o -name "authorized_keys" \) \
  -not -path "/proc/*" -not -path "/sys/*" 2>/dev/null \
  | xargs -I{} shred -uzn 3 "{}" 2>/dev/null || true

rm -rf /opt/planta-infra /root/planta-migration-* /root/.cache /home/*/.cache 2>/dev/null || true

echo "🧽 [5/5] Limpando logs e histórico bash..."
journalctl --rotate && journalctl --vacuum-time=1s || true
truncate -s 0 /var/log/*.log 2>/dev/null || true
history -c; rm -f /root/.bash_history; ln -sf /dev/null /root/.bash_history

echo ""
echo "✅ HOSTINGER LIMPA. Agora vá no painel Hostinger → VPS → CANCELAR/DELETAR servidor."
echo "   (A reinstalação do OS pelo painel é a garantia final — peça 'Reinstall OS' antes de cancelar.)"
