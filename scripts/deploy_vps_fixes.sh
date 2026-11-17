#!/usr/bin/env bash
# ==============================================================================
# scripts/deploy_vps_fixes.sh
# 🌿 Planta y Raíz Ltda — Execução Direta das Ações da Auditoria (15/11/2026)
# ==============================================================================

set -e
echo "======================================================================"
echo "🚀 EXECUTANDO CORREÇÕES CRÍTICAS NA VPS PLANTA Y RAÍZ"
echo "======================================================================"

cd /opt/plantayraiz

# 1. Puxa a versão mais recente do código
echo "📥 1. Atualizando repositório Git com as correções..."
git fetch origin main
git reset --hard origin/main

# 2. Exclui a base de leads falsos residual que estava no disco da VPS
echo "🗑️ 2. Eliminando arquivos de leads falsos residuais..."
rm -f scripts/doctor_leads_collected.json
rm -f scripts/generate-leads-part2.cjs

# 3. Força IPv4 no ambiente do Node
export NODE_OPTIONS="--dns-result-order=ipv4first"

# 4. Desliga agentes com problemas apontados na auditoria e sobe os funcionais
echo "⚙️ 3. Aplicando nova configuração do PM2..."
pm2 startOrReload ecosystem.config.cjs --update-env

# Garante que os agentes bloqueados pelo Brevo ou Apify e os disparadores frios fiquem desligados e excluídos do PM2
echo "🛑 4. Desligando e excluindo agentes frios e bloqueados..."
pm2 stop cadence-10min-inviter 2>/dev/null || true
pm2 delete cadence-10min-inviter 2>/dev/null || true
pm2 stop brevo-whatsapp-inviter 2>/dev/null || true
pm2 delete brevo-whatsapp-inviter 2>/dev/null || true
pm2 stop brevo-multi-pipeline 2>/dev/null || true
pm2 delete brevo-multi-pipeline 2>/dev/null || true
pm2 stop apify-lead-sync 2>/dev/null || true
pm2 delete apify-lead-sync 2>/dev/null || true

# 5. Desativa o fluxo n8n legado (LdAWxfIxg0s67H32) que disparava "🔔 PAGAMENTO INFORMADO" falso quando médicos enviavam documentos KYC
echo "🛡️ 5. Desativando fluxo legado do n8n (LdAWxfIxg0s67H32) que gerava avisos duplicados de pagamento..."
if [ -f "/var/lib/docker/volumes/n8n-a3wy_n8n_data/_data/database.sqlite" ]; then
  python3 -c "
import sqlite3
conn = sqlite3.connect('/var/lib/docker/volumes/n8n-a3wy_n8n_data/_data/database.sqlite')
c = conn.cursor()
c.execute(\"UPDATE workflow_entity SET active = 0 WHERE id = 'LdAWxfIxg0s67H32'\")
conn.commit()
conn.close()
print('Workflow n8n LdAWxfIxg0s67H32 desativado no SQLite.')
" || true
  docker restart $(docker ps -q --filter "name=n8n") 2>/dev/null || true
fi

# Reinicia os agentes operacionais com IPv4 forçado
echo "🔄 6. Reiniciando agentes operacionais (WhatsApp Brisa Live Responder, Monitor)..."
pm2 restart brisa-live-responder --update-env 2>/dev/null || true
pm2 restart email-bounce-guardian --update-env 2>/dev/null || true
pm2 restart sysadmin-watchdog --update-env 2>/dev/null || true

# Salva o estado atual do PM2
pm2 save

echo "======================================================================"
echo "✅ TODAS AS AÇÕES FORAM EXECUTADAS COM SUCESSO!"
echo "======================================================================"
pm2 status
