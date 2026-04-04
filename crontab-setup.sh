#!/bin/bash

###############################################################################
# SCRIPT DE CONFIGURAÇÃO DE CRON JOBS
# Plantayraiz.com.br - Automação de Tarefas
# Data: 04 de Abril de 2026
###############################################################################

set -e

echo "🔧 Configurando Cron Jobs para Automação"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para log
log() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# CRON JOB 1: Backup Automático Diário (02:00 AM)
# ============================================================================

echo "📋 Cron Job 1: Backup Automático Diário"
echo ""

BACKUP_CRON="0 2 * * * /tmp/consultorio-audit/backup-daily.sh >> /tmp/backups/cron_backup.log 2>&1"

# Adicionar ao crontab se não existir
if ! crontab -l 2>/dev/null | grep -q "backup-daily.sh"; then
    (crontab -l 2>/dev/null; echo "$BACKUP_CRON") | crontab -
    log "Backup automático agendado para 02:00 AM diariamente"
else
    log "Backup automático já está agendado"
fi

# ============================================================================
# CRON JOB 2: Monitoramento de Performance (A cada 5 minutos)
# ============================================================================

echo ""
echo "📋 Cron Job 2: Monitoramento de Performance"
echo ""

MONITORING_CRON="*/5 * * * * /tmp/consultorio-audit/monitoring-24h.sh quick >> /tmp/monitoring/cron_monitoring.log 2>&1"

# Adicionar ao crontab se não existir
if ! crontab -l 2>/dev/null | grep -q "monitoring-24h.sh"; then
    (crontab -l 2>/dev/null; echo "$MONITORING_CRON") | crontab -
    log "Monitoramento agendado a cada 5 minutos"
else
    log "Monitoramento já está agendado"
fi

# ============================================================================
# CRON JOB 3: Verificação de Saúde (A cada hora)
# ============================================================================

echo ""
echo "📋 Cron Job 3: Verificação de Saúde"
echo ""

HEALTH_CRON="0 * * * * curl -s https://plantayraiz.com.br/api/health >> /tmp/monitoring/health_check.log 2>&1"

# Adicionar ao crontab se não existir
if ! crontab -l 2>/dev/null | grep -q "api/health"; then
    (crontab -l 2>/dev/null; echo "$HEALTH_CRON") | crontab -
    log "Verificação de saúde agendada a cada hora"
else
    log "Verificação de saúde já está agendada"
fi

# ============================================================================
# CRON JOB 4: Limpeza de Logs Antigos (Semanalmente)
# ============================================================================

echo ""
echo "📋 Cron Job 4: Limpeza de Logs Antigos"
echo ""

CLEANUP_CRON="0 3 * * 0 find /tmp/monitoring -name '*.log' -mtime +7 -delete && find /tmp/backups -name '*.log' -mtime +7 -delete"

# Adicionar ao crontab se não existir
if ! crontab -l 2>/dev/null | grep -q "find /tmp/monitoring"; then
    (crontab -l 2>/dev/null; echo "$CLEANUP_CRON") | crontab -
    log "Limpeza de logs agendada para domingos às 03:00 AM"
else
    log "Limpeza de logs já está agendada"
fi

# ============================================================================
# CRON JOB 5: Sincronização com GitHub (Diariamente)
# ============================================================================

echo ""
echo "📋 Cron Job 5: Sincronização com GitHub"
echo ""

SYNC_CRON="0 1 * * * cd /tmp/consultorio-audit && git pull origin main >> /tmp/monitoring/git_sync.log 2>&1"

# Adicionar ao crontab se não existir
if ! crontab -l 2>/dev/null | grep -q "git pull origin main"; then
    (crontab -l 2>/dev/null; echo "$SYNC_CRON") | crontab -
    log "Sincronização com GitHub agendada para 01:00 AM diariamente"
else
    log "Sincronização com GitHub já está agendada"
fi

# ============================================================================
# RESUMO DE CRON JOBS
# ============================================================================

echo ""
echo "=========================================="
echo "✓ CRON JOBS CONFIGURADOS COM SUCESSO"
echo "=========================================="
echo ""

echo "📅 Cronograma de Tarefas Automáticas:"
echo ""
echo "  01:00 AM - Sincronização com GitHub"
echo "  02:00 AM - Backup Automático Diário"
echo "  03:00 AM (Dom) - Limpeza de Logs Antigos"
echo "  A cada 5 min - Monitoramento de Performance"
echo "  A cada hora - Verificação de Saúde"
echo ""

echo "📊 Visualizar Cron Jobs:"
echo "  crontab -l"
echo ""

echo "📝 Editar Cron Jobs:"
echo "  crontab -e"
echo ""

echo "📂 Logs de Cron Jobs:"
echo "  /tmp/monitoring/cron_monitoring.log"
echo "  /tmp/backups/cron_backup.log"
echo "  /tmp/monitoring/git_sync.log"
echo ""

exit 0
