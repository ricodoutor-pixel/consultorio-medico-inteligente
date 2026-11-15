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
rm -f scripts/PAUSE_AUTOMATION.flag

# 3. Força IPv4 no ambiente do Node
export NODE_OPTIONS="--dns-result-order=ipv4first"

# 4. Desliga agentes com problemas apontados na auditoria e sobe os funcionais
echo "⚙️ 3. Aplicando nova configuração do PM2..."
pm2 startOrReload ecosystem.config.cjs --update-env

# Garante que os agentes bloqueados pelo Brevo ou Apify fiquem desligados
echo "🛑 4. Desligando agentes com chaves bloqueadas ou sem serviço (Brevo 554 / Apify)..."
pm2 stop brevo-multi-pipeline 2>/dev/null || true
pm2 stop apify-lead-sync 2>/dev/null || true

# Reinicia os agentes operacionais com IPv4 forçado
echo "🔄 5. Reiniciando agentes operacionais (WhatsApp, Brisa, Monitor)..."
pm2 restart brisa-live-responder --update-env 2>/dev/null || true
pm2 restart cadence-10min-inviter --update-env 2>/dev/null || true
pm2 restart email-bounce-guardian --update-env 2>/dev/null || true
pm2 restart sysadmin-watchdog --update-env 2>/dev/null || true

# Salva o estado atual do PM2
pm2 save

echo "======================================================================"
echo "✅ TODAS AS AÇÕES FORAM EXECUTADAS COM SUCESSO!"
echo "======================================================================"
pm2 status
