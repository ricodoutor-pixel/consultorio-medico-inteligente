#!/bin/bash

###############################################################################
# SCRIPT DE MONITORAMENTO 24/7 - PERFORMANCE
# Plantayraiz.com.br - Auditoria Contínua
# Data: 04 de Abril de 2026
###############################################################################

set -e

SITE_URL="https://plantayraiz.com.br"
LOG_DIR="/tmp/monitoring"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ALERT_THRESHOLD_MS=3000  # 3 segundos
CHECK_INTERVAL=300       # 5 minutos

# Criar diretório de logs
mkdir -p "$LOG_DIR"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para log
log_check() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_DIR/monitoring_${TIMESTAMP}.log"
}

log_alert() {
    echo "[ALERTA] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_DIR/alerts_${TIMESTAMP}.log"
    echo -e "${RED}[ALERTA]${NC} $1"
}

log_success() {
    echo "[OK] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_DIR/monitoring_${TIMESTAMP}.log"
    echo -e "${GREEN}[OK]${NC} $1"
}

# ============================================================================
# FUNÇÃO: Verificar Disponibilidade
# ============================================================================

check_availability() {
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" --max-time 10)
    
    if [ "$response_code" = "200" ]; then
        log_success "Site disponível (HTTP $response_code)"
        return 0
    else
        log_alert "Site indisponível (HTTP $response_code)"
        return 1
    fi
}

# ============================================================================
# FUNÇÃO: Medir Tempo de Resposta
# ============================================================================

check_response_time() {
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SITE_URL" --max-time 10)
    local response_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
    
    log_check "Tempo de resposta: ${response_ms}ms"
    
    if [ "$response_ms" -gt "$ALERT_THRESHOLD_MS" ]; then
        log_alert "Tempo de resposta acima do limite: ${response_ms}ms > ${ALERT_THRESHOLD_MS}ms"
        return 1
    else
        log_success "Tempo de resposta OK: ${response_ms}ms"
        return 0
    fi
}

# ============================================================================
# FUNÇÃO: Verificar Certificado SSL
# ============================================================================

check_ssl_certificate() {
    local ssl_expiry=$(echo | openssl s_client -servername plantayraiz.com.br -connect plantayraiz.com.br:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2)
    
    if [ -z "$ssl_expiry" ]; then
        log_alert "Não foi possível verificar certificado SSL"
        return 1
    fi
    
    log_success "Certificado SSL válido até: $ssl_expiry"
    return 0
}

# ============================================================================
# FUNÇÃO: Verificar Recursos Críticos
# ============================================================================

check_critical_resources() {
    local resources=("index.html" "assets/index" "favicon.ico")
    
    for resource in "${resources[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/$resource" --max-time 5)
        
        if [ "$status" = "200" ] || [ "$status" = "304" ]; then
            log_success "Recurso disponível: $resource (HTTP $status)"
        else
            log_alert "Recurso indisponível: $resource (HTTP $status)"
        fi
    done
}

# ============================================================================
# FUNÇÃO: Verificar Banco de Dados
# ============================================================================

check_database() {
    # Verificar se a API de health check responde
    local db_status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/health" --max-time 5)
    
    if [ "$db_status" = "200" ]; then
        log_success "Banco de dados OK"
        return 0
    else
        log_alert "Banco de dados pode estar indisponível (HTTP $db_status)"
        return 1
    fi
}

# ============================================================================
# FUNÇÃO: Gerar Relatório
# ============================================================================

generate_report() {
    local report_file="$LOG_DIR/report_${TIMESTAMP}.txt"
    
    cat > "$report_file" << EOF
================================================================================
RELATÓRIO DE MONITORAMENTO 24/7
Data: $(date '+%d de %B de %Y às %H:%M:%S')
Site: $SITE_URL
================================================================================

RESUMO:
  • Verificações realizadas: $(wc -l < "$LOG_DIR/monitoring_${TIMESTAMP}.log" 2>/dev/null || echo "0")
  • Alertas gerados: $(wc -l < "$LOG_DIR/alerts_${TIMESTAMP}.log" 2>/dev/null || echo "0")
  • Threshold de resposta: ${ALERT_THRESHOLD_MS}ms
  • Intervalo de verificação: ${CHECK_INTERVAL}s

LOGS DE MONITORAMENTO:
$(cat "$LOG_DIR/monitoring_${TIMESTAMP}.log" 2>/dev/null || echo "Nenhum log disponível")

ALERTAS:
$(cat "$LOG_DIR/alerts_${TIMESTAMP}.log" 2>/dev/null || echo "Nenhum alerta gerado")

================================================================================
EOF
    
    echo -e "${GREEN}Relatório gerado: $report_file${NC}"
}

# ============================================================================
# FUNÇÃO: Enviar Notificação
# ============================================================================

send_notification() {
    local message=$1
    
    # Aqui você pode adicionar integração com WhatsApp, Email, Slack, etc.
    # Por enquanto, apenas registramos no log
    
    log_alert "NOTIFICAÇÃO: $message"
}

# ============================================================================
# FUNÇÃO: Executar Todas as Verificações
# ============================================================================

run_all_checks() {
    echo ""
    echo "🔍 Executando verificações de monitoramento..."
    echo "=================================================="
    echo ""
    
    check_availability
    check_response_time
    check_ssl_certificate
    check_critical_resources
    check_database
    
    echo ""
    echo "✓ Verificações concluídas"
    echo ""
}

# ============================================================================
# FUNÇÃO: Loop de Monitoramento 24h
# ============================================================================

monitoring_loop_24h() {
    local end_time=$(($(date +%s) + 86400))  # 24 horas
    local check_count=0
    
    echo "🚀 Iniciando monitoramento 24/7..."
    echo "Duração: 24 horas"
    echo "Intervalo: ${CHECK_INTERVAL}s"
    echo ""
    
    while [ $(date +%s) -lt $end_time ]; do
        check_count=$((check_count + 1))
        
        echo "📊 Verificação #$check_count - $(date '+%H:%M:%S')"
        run_all_checks
        
        # Aguardar próxima verificação
        sleep "$CHECK_INTERVAL"
    done
    
    echo "✓ Monitoramento 24h concluído"
    generate_report
}

# ============================================================================
# FUNÇÃO: Monitoramento Contínuo (Daemon)
# ============================================================================

monitoring_daemon() {
    echo "🚀 Iniciando monitoramento contínuo (daemon)..."
    echo "Intervalo: ${CHECK_INTERVAL}s"
    echo ""
    
    local check_count=0
    
    while true; do
        check_count=$((check_count + 1))
        
        echo "📊 Verificação #$check_count - $(date '+%H:%M:%S')"
        run_all_checks
        
        # Gerar relatório a cada 288 verificações (24 horas)
        if [ $((check_count % 288)) -eq 0 ]; then
            generate_report
        fi
        
        # Aguardar próxima verificação
        sleep "$CHECK_INTERVAL"
    done
}

# ============================================================================
# MAIN
# ============================================================================

if [ "$1" = "24h" ]; then
    monitoring_loop_24h
elif [ "$1" = "daemon" ]; then
    monitoring_daemon
elif [ "$1" = "quick" ]; then
    run_all_checks
    generate_report
else
    echo "Uso: $0 [24h|daemon|quick]"
    echo ""
    echo "Opções:"
    echo "  24h   - Monitorar por 24 horas"
    echo "  daemon - Monitorar continuamente (daemon)"
    echo "  quick - Executar verificações rápidas"
    exit 1
fi
