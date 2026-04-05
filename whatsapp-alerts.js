/**
 * SISTEMA DE ALERTA VIA WHATSAPP
 * Plantayraiz.com.br - Notificações em Tempo Real
 * Data: 04 de Abril de 2026
 */

const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Credenciais Twilio (configure com suas credenciais)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP || 'whatsapp:+5511999999999';

// Configurações do Site
const SITE_URL = 'https://plantayraiz.com.br';
const RESPONSE_TIME_THRESHOLD = 3000; // 3 segundos
const CHECK_INTERVAL = 300000; // 5 minutos
const ALERT_COOLDOWN = 600000; // 10 minutos entre alertas iguais

// Inicializar cliente Twilio
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ============================================================================
// LOGGER
// ============================================================================

const LOG_DIR = '/tmp/whatsapp-alerts';
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
  };

  console.log(`[${timestamp}] [${level}] ${message}`, data);

  // Salvar em arquivo
  const logFile = path.join(LOG_DIR, `alerts_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// ============================================================================
// GERENCIADOR DE ALERTAS
// ============================================================================

class AlertManager {
  constructor() {
    this.lastAlerts = {}; // Rastrear último alerta por tipo
    this.alertHistory = []; // Histórico de alertas
  }

  /**
   * Verificar se deve enviar alerta (evitar spam)
   */
  shouldSendAlert(alertType) {
    const now = Date.now();
    const lastAlert = this.lastAlerts[alertType];

    if (!lastAlert || now - lastAlert > ALERT_COOLDOWN) {
      this.lastAlerts[alertType] = now;
      return true;
    }

    return false;
  }

  /**
   * Registrar alerta no histórico
   */
  recordAlert(alertType, message, severity) {
    this.alertHistory.push({
      timestamp: new Date().toISOString(),
      type: alertType,
      message,
      severity,
    });

    // Manter apenas últimos 1000 alertas
    if (this.alertHistory.length > 1000) {
      this.alertHistory.shift();
    }
  }

  /**
   * Obter histórico de alertas
   */
  getHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }
}

const alertManager = new AlertManager();

// ============================================================================
// FUNÇÕES DE NOTIFICAÇÃO
// ============================================================================

/**
 * Enviar mensagem WhatsApp
 */
async function sendWhatsAppMessage(message) {
  try {
    const response = await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: OWNER_WHATSAPP,
      body: message,
    });

    log('INFO', 'Mensagem WhatsApp enviada', {
      messageId: response.sid,
      status: response.status,
    });

    return response.sid;
  } catch (error) {
    log('ERROR', 'Falha ao enviar mensagem WhatsApp', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Enviar alerta de indisponibilidade
 */
async function alertSiteDown(statusCode) {
  const alertType = 'SITE_DOWN';

  if (!alertManager.shouldSendAlert(alertType)) {
    log('DEBUG', 'Alerta de indisponibilidade já foi enviado recentemente');
    return;
  }

  const message = `🚨 ALERTA CRÍTICO - Plantayraiz.com.br INDISPONÍVEL

❌ Status HTTP: ${statusCode}
⏰ Horário: ${new Date().toLocaleString('pt-BR')}
🌐 URL: ${SITE_URL}

Ação recomendada:
1. Verificar status do servidor
2. Revisar logs de erro
3. Contactar suporte do Hostinger se necessário

Atualizações em tempo real: ${SITE_URL}/status`;

  try {
    await sendWhatsAppMessage(message);
    alertManager.recordAlert(alertType, message, 'CRITICAL');
  } catch (error) {
    log('ERROR', 'Falha ao enviar alerta de indisponibilidade', { error });
  }
}

/**
 * Enviar alerta de performance degradada
 */
async function alertSlowResponse(responseTime) {
  const alertType = 'SLOW_RESPONSE';

  if (!alertManager.shouldSendAlert(alertType)) {
    log('DEBUG', 'Alerta de performance já foi enviado recentemente');
    return;
  }

  const message = `⚠️ ALERTA - Performance Degradada

🐌 Tempo de resposta: ${responseTime}ms
⏰ Horário: ${new Date().toLocaleString('pt-BR')}
📊 Limite: ${RESPONSE_TIME_THRESHOLD}ms

Possíveis causas:
• Alto volume de acessos
• Banco de dados lento
• Servidor sobrecarregado

Ação: Verificar métricas de performance`;

  try {
    await sendWhatsAppMessage(message);
    alertManager.recordAlert(alertType, message, 'WARNING');
  } catch (error) {
    log('ERROR', 'Falha ao enviar alerta de performance', { error });
  }
}

/**
 * Enviar alerta de erro crítico
 */
async function alertCriticalError(errorType, errorMessage) {
  const alertType = `ERROR_${errorType}`;

  if (!alertManager.shouldSendAlert(alertType)) {
    log('DEBUG', `Alerta de ${errorType} já foi enviado recentemente`);
    return;
  }

  const message = `🔴 ERRO CRÍTICO - ${errorType}

📝 Mensagem: ${errorMessage.substring(0, 100)}...
⏰ Horário: ${new Date().toLocaleString('pt-BR')}
🌐 URL: ${SITE_URL}

Ação: Investigar logs de erro imediatamente`;

  try {
    await sendWhatsAppMessage(message);
    alertManager.recordAlert(alertType, message, 'CRITICAL');
  } catch (error) {
    log('ERROR', `Falha ao enviar alerta de ${errorType}`, { error });
  }
}

/**
 * Enviar alerta de SSL próximo do vencimento
 */
async function alertSSLExpiring(daysRemaining) {
  const alertType = 'SSL_EXPIRING';

  if (!alertManager.shouldSendAlert(alertType)) {
    log('DEBUG', 'Alerta de SSL já foi enviado recentemente');
    return;
  }

  const message = `🔐 AVISO - Certificado SSL Próximo do Vencimento

📅 Dias restantes: ${daysRemaining}
⏰ Horário: ${new Date().toLocaleString('pt-BR')}
🌐 Domínio: plantayraiz.com.br

Ação urgente: Renovar certificado SSL antes do vencimento`;

  try {
    await sendWhatsAppMessage(message);
    alertManager.recordAlert(alertType, message, 'WARNING');
  } catch (error) {
    log('ERROR', 'Falha ao enviar alerta de SSL', { error });
  }
}

/**
 * Enviar alerta de banco de dados indisponível
 */
async function alertDatabaseDown() {
  const alertType = 'DATABASE_DOWN';

  if (!alertManager.shouldSendAlert(alertType)) {
    log('DEBUG', 'Alerta de banco de dados já foi enviado recentemente');
    return;
  }

  const message = `💾 ALERTA CRÍTICO - Banco de Dados Indisponível

❌ Status: Sem conexão
⏰ Horário: ${new Date().toLocaleString('pt-BR')}
🌐 URL: ${SITE_URL}/api/health

Ação imediata:
1. Verificar status do banco de dados
2. Revisar logs do servidor
3. Reiniciar serviço se necessário`;

  try {
    await sendWhatsAppMessage(message);
    alertManager.recordAlert(alertType, message, 'CRITICAL');
  } catch (error) {
    log('ERROR', 'Falha ao enviar alerta de banco de dados', { error });
  }
}

/**
 * Enviar notificação de recuperação
 */
async function notifyRecovery(issueType) {
  const message = `✅ RECUPERAÇÃO - ${issueType} Restaurado

🟢 Status: Online
⏰ Horário: ${new Date().toLocaleString('pt-BR')}
🌐 URL: ${SITE_URL}

O serviço foi restaurado com sucesso.`;

  try {
    await sendWhatsAppMessage(message);
    log('INFO', `Notificação de recuperação enviada para ${issueType}`);
  } catch (error) {
    log('ERROR', 'Falha ao enviar notificação de recuperação', { error });
  }
}

// ============================================================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================================================

/**
 * Verificar disponibilidade do site
 */
async function checkSiteAvailability() {
  try {
    const response = await axios.get(SITE_URL, {
      timeout: 10000,
      validateStatus: () => true, // Aceitar qualquer status
    });

    if (response.status !== 200) {
      log('ERROR', 'Site retornou status diferente de 200', {
        status: response.status,
      });
      await alertSiteDown(response.status);
      return false;
    }

    log('INFO', 'Site disponível', { status: response.status });
    return true;
  } catch (error) {
    log('ERROR', 'Falha ao acessar site', { error: error.message });
    await alertSiteDown('TIMEOUT');
    return false;
  }
}

/**
 * Verificar tempo de resposta
 */
async function checkResponseTime() {
  try {
    const startTime = Date.now();
    const response = await axios.get(SITE_URL, {
      timeout: 10000,
    });
    const responseTime = Date.now() - startTime;

    log('INFO', 'Tempo de resposta', { responseTime });

    if (responseTime > RESPONSE_TIME_THRESHOLD) {
      await alertSlowResponse(responseTime);
      return false;
    }

    return true;
  } catch (error) {
    log('ERROR', 'Falha ao medir tempo de resposta', { error: error.message });
    return false;
  }
}

/**
 * Verificar saúde da API
 */
async function checkAPIHealth() {
  try {
    const response = await axios.get(`${SITE_URL}/api/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      log('INFO', 'API saudável');
      return true;
    } else {
      log('ERROR', 'API retornou status diferente de 200', {
        status: response.status,
      });
      await alertDatabaseDown();
      return false;
    }
  } catch (error) {
    log('ERROR', 'Falha ao verificar saúde da API', { error: error.message });
    await alertDatabaseDown();
    return false;
  }
}

/**
 * Verificar certificado SSL
 */
async function checkSSLCertificate() {
  try {
    // Usar openssl para verificar certificado
    const { execSync } = require('child_process');
    const output = execSync(
      `echo | openssl s_client -servername plantayraiz.com.br -connect plantayraiz.com.br:443 2>/dev/null | openssl x509 -noout -dates`
    ).toString();

    const notAfterMatch = output.match(/notAfter=(.+)/);
    if (!notAfterMatch) {
      log('ERROR', 'Não foi possível extrair data de vencimento do certificado');
      return true;
    }

    const expiryDate = new Date(notAfterMatch[1]);
    const daysRemaining = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    log('INFO', 'Certificado SSL verificado', { daysRemaining });

    if (daysRemaining < 30) {
      await alertSSLExpiring(daysRemaining);
    }

    return true;
  } catch (error) {
    log('ERROR', 'Falha ao verificar certificado SSL', { error: error.message });
    return false;
  }
}

// ============================================================================
// LOOP DE MONITORAMENTO
// ============================================================================

/**
 * Executar todas as verificações
 */
async function runAllChecks() {
  log('INFO', 'Iniciando verificações de monitoramento');

  const results = {
    timestamp: new Date().toISOString(),
    availability: await checkSiteAvailability(),
    responseTime: await checkResponseTime(),
    apiHealth: await checkAPIHealth(),
    ssl: await checkSSLCertificate(),
  };

  log('INFO', 'Verificações concluídas', results);
  return results;
}

/**
 * Iniciar monitoramento contínuo
 */
function startMonitoring() {
  log('INFO', 'Iniciando monitoramento contínuo com alertas WhatsApp');

  // Executar verificações imediatamente
  runAllChecks();

  // Executar verificações periodicamente
  setInterval(runAllChecks, CHECK_INTERVAL);

  // Enviar notificação de inicialização
  sendWhatsAppMessage(`✅ Sistema de monitoramento iniciado\n⏰ ${new Date().toLocaleString('pt-BR')}`);
}

/**
 * Obter status atual
 */
function getStatus() {
  return {
    lastAlerts: alertManager.lastAlerts,
    alertHistory: alertManager.getHistory(10),
    uptime: process.uptime(),
  };
}

// ============================================================================
// EXPORTAR FUNÇÕES
// ============================================================================

module.exports = {
  startMonitoring,
  getStatus,
  sendWhatsAppMessage,
  alertSiteDown,
  alertSlowResponse,
  alertCriticalError,
  alertSSLExpiring,
  alertDatabaseDown,
  notifyRecovery,
  checkSiteAvailability,
  checkResponseTime,
  checkAPIHealth,
  checkSSLCertificate,
  runAllChecks,
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

if (require.main === module) {
  // Executar se chamado diretamente
  startMonitoring();

  // Manter processo ativo
  process.on('SIGINT', () => {
    log('INFO', 'Monitoramento interrompido');
    process.exit(0);
  });
}
