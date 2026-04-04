#!/bin/bash

###############################################################################
# SCRIPT DE MONITORAMENTO COM ALERTAS WHATSAPP
# Plantayraiz.com.br - Notificações em Tempo Real
# Data: 04 de Abril de 2026
###############################################################################

set -e

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

SITE_URL="https://plantayraiz.com.br"
RESPONSE_THRESHOLD=3000  # 3 segundos
CHECK_INTERVAL=300       # 5 minutos
LOG_DIR="/tmp/whatsapp-alerts"
ALERT_COOLDOWN=600       # 10 minutos entre alertas iguais

# Credenciais Twilio (configure com suas credenciais)
TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-your_account_sid}"
TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-your_auth_token}"
TWILIO_WHATSAPP_FROM="${TWILIO_WHATSAPP_FROM:-whatsapp:+14155238886}"
OWNER_WHATSAPP="${OWNER_WHATSAPP:-whatsapp:+5511999999999}"

# Criar diretório de logs
mkdir -p "$LOG_DIR"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# FUNÇÕES DE LOG
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_DIR/monitoring.log"
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

log_alert() {
    echo "[ALERTA] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_DIR/alerts.log"
    echo -e "${RED}[ALERTA]${NC} $1"
}

log_success() {
    echo "[OK] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_DIR/monitoring.log"
    echo -e "${GREEN}[OK]${NC} $1"
}

# ============================================================================
# FUNÇÃO: Enviar Mensagem WhatsApp via Twilio
# ============================================================================

send_whatsapp_alert() {
    local message=$1
    local alert_type=$2

    # Verificar cooldown
    local last_alert_file="$LOG_DIR/.last_alert_${alert_type}"
    local now=$(date +%s)
    
    if [ -f "$last_alert_file" ]; then
        local last_alert=$(cat "$last_alert_file")
        local time_diff=$((now - last_alert))
        
        if [ $time_diff -lt $ALERT_COOLDOWN ]; then
            log "Alerta de $alert_type já foi enviado recentemente (aguardando ${ALERT_COOLDOWN}s)"
            return 0
        fi
    fi

    # Enviar via Twilio
    local response=$(curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
        --data-urlencode "From=$TWILIO_WHATSAPP_FROM" \
        --data-urlencode "To=$OWNER_WHATSAPP" \
        --data-urlencode "Body=$message" \
        -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

    # Verificar se foi enviado com sucesso
    if echo "$response" | grep -q '"sid"'; then
        log_success "Alerta WhatsApp enviado: $alert_type"
        echo $now > "$last_alert_file"
        return 0
    else
        log_alert "Falha ao enviar alerta WhatsApp: $alert_type"
        log_alert "Resposta: $response"
        return 1
    fi
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
        
        local message="🚨 ALERTA CRÍTICO - Plantayraiz.com.br INDISPONÍVEL

❌ Status HTTP: $response_code
⏰ Horário: $(date '+%d/%m/%Y %H:%M:%S')
🌐 URL: $SITE_URL

Ação recomendada:
1. Verificar status do servidor
2. Revisar logs de erro
3. Contactar suporte do Hostinger"
        
        send_whatsapp_alert "$message" "SITE_DOWN"
        return 1
    fi
}

# ============================================================================
# FUNÇÃO: Verificar Tempo de Resposta
# ============================================================================

check_response_time() {
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SITE_URL" --max-time 10)
    local response_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
    
    log "Tempo de resposta: ${response_ms}ms"
    
    if [ "$response_ms" -gt "$RESPONSE_THRESHOLD" ]; then
        log_alert "Tempo de resposta acima do limite: ${response_ms}ms > ${RESPONSE_THRESHOLD}ms"
        
        local message="⚠️ ALERTA - Performance Degradada

🐌 Tempo de resposta: ${response_ms}ms
⏰ Horário: $(date '+%d/%m/%Y %H:%M:%S')
📊 Limite: ${RESPONSE_THRESHOLD}ms

Possíveis causas:
• Alto volume de acessos
• Banco de dados lento
• Servidor sobrecarregado"
        
        send_whatsapp_alert "$message" "SLOW_RESPONSE"
        return 1
    else
        log_success "Tempo de resposta OK: ${response_ms}ms"
        return 0
    fi
}

# ============================================================================
# FUNÇÃO: Verificar API Health
# ============================================================================

check_api_health() {
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/health" --max-time 5)
    
    if [ "$status" = "200" ]; then
        log_success "API saudável"
        return 0
    else
        log_alert "API indisponível (HTTP $status)"
        
        local message="💾 ALERTA CRÍTICO - Banco de Dados Indisponível

❌ Status: Sem conexão
⏰ Horário: $(date '+%d/%m/%Y %H:%M:%S')
🌐 URL: $SITE_URL/api/health

Ação imediata:
1. Verificar status do banco de dados
2. Revisar logs do servidor
3. Reiniciar serviço se necessário"
        
        send_whatsapp_alert "$message" "DATABASE_DOWN"
        return 1
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
    
    # Calcular dias restantes
    local expiry_timestamp=$(date -d "$ssl_expiry" +%s 2>/dev/null || date -jf "%b %d %T %Z %Y" "$ssl_expiry" +%s)
    local current_timestamp=$(date +%s)
    local days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    log_success "Certificado SSL válido por $days_remaining dias"
    
    if [ "$days_remaining" -lt 30 ]; then
        log_alert "Certificado SSL próximo do vencimento: $days_remaining dias"
        
        local message="🔐 AVISO - Certificado SSL Próximo do Vencimento

📅 Dias restantes: $days_remaining
⏰ Horário: $(date '+%d/%m/%Y %H:%M:%S')
🌐 Domínio: plantayraiz.com.br

Ação urgente: Renovar certificado SSL antes do vencimento"
        
        send_whatsapp_alert "$message" "SSL_EXPIRING"
        return 1
    fi
    
    return 0
}

# ============================================================================
# FUNÇÃO: Executar Todas as Verificações
# ============================================================================

run_all_checks() {
    echo ""
    echo "🔍 Executando verificações de monitoramento..."
    echo "=================================================="
    echo ""
    
    local check_count=0
    local success_count=0
    
    check_availability && ((success_count++))
    ((check_count++))
    
    check_response_time && ((success_count++))
    ((check_count++))
    
    check_api_health && ((success_count++))
    ((check_count++))
    
    check_ssl_certificate && ((success_count++))
    ((check_count++))
    
    echo ""
    echo "✓ Verificações concluídas: $success_count/$check_count OK"
    echo ""
}

# ============================================================================
# FUNÇÃO: Loop de Monitoramento
# ============================================================================

monitoring_loop() {
    local check_count=0
    
    echo "🚀 Iniciando monitoramento com alertas WhatsApp..."
    echo "Intervalo: ${CHECK_INTERVAL}s"
    echo "Threshold de resposta: ${RESPONSE_THRESHOLD}ms"
    echo ""
    
    # Enviar notificação de inicialização
    send_whatsapp_alert "✅ Sistema de monitoramento iniciado
⏰ $(date '+%d/%m/%Y %H:%M:%S')" "STARTUP"
    
    while true; do
        check_count=$((check_count + 1))
        
        echo "📊 Verificação #$check_count - $(date '+%H:%M:%S')"
        run_all_checks
        
        # Aguardar próxima verificação
        sleep "$CHECK_INTERVAL"
    done
}

# ============================================================================
# FUNÇÃO: Teste Rápido
# ============================================================================

quick_test() {
    echo "🧪 Executando teste rápido..."
    echo ""
    
    run_all_checks
    
    echo "✓ Teste rápido concluído"
    echo ""
    echo "📊 Resumo:"
    echo "  • Logs: $LOG_DIR/monitoring.log"
    echo "  • Alertas: $LOG_DIR/alerts.log"
}

# ============================================================================
# FUNÇÃO: Enviar Teste de Alerta
# ============================================================================

test_alert() {
    echo "🧪 Enviando teste de alerta WhatsApp..."
    echo ""
    
    local message="🧪 TESTE - Sistema de Alertas WhatsApp

✅ Conexão com Twilio: OK
⏰ Horário: $(date '+%d/%m/%Y %H:%M:%S')

Este é um teste do sistema de notificações.
Se você recebeu esta mensagem, o sistema está funcionando corretamente!"
    
    send_whatsapp_alert "$message" "TEST_ALERT"
    
    echo "✓ Teste de alerta enviado"
}

# ============================================================================
# MAIN
# ============================================================================

case "${1:-monitor}" in
    monitor)
        monitoring_loop
        ;;
    quick)
        quick_test
        ;;
    test)
        test_alert
        ;;
    *)
        echo "Uso: $0 [monitor|quick|test]"
        echo ""
        echo "Opções:"
        echo "  monitor - Monitorar continuamente com alertas"
        echo "  quick   - Executar verificações rápidas"
        echo "  test    - Enviar teste de alerta WhatsApp"
        exit 1
        ;;
esac
