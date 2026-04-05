import axios from 'axios';

// Tipos de alertas
export type AlertLevel = 'info' | 'warning' | 'critical';
export type AlertChannel = 'slack' | 'discord' | 'teams';

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: Date;
  channel: AlertChannel;
  metadata?: Record<string, any>;
}

// Configuração de webhooks
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const TEAMS_WEBHOOK = process.env.TEAMS_WEBHOOK_URL;

// Cores para alertas
const ALERT_COLORS = {
  info: '#0099FF',
  warning: '#FFAA00',
  critical: '#FF0000',
};

// Emojis para alertas
const ALERT_EMOJIS = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨',
};

/**
 * Enviar alerta para Slack
 */
export async function sendSlackAlert(alert: Alert): Promise<void> {
  if (!SLACK_WEBHOOK) {
    console.warn('⚠️ SLACK_WEBHOOK_URL não configurado');
    return;
  }

  try {
    const color = ALERT_COLORS[alert.level];
    const emoji = ALERT_EMOJIS[alert.level];

    await axios.post(SLACK_WEBHOOK, {
      text: `${emoji} ${alert.title}`,
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Nível',
              value: alert.level.toUpperCase(),
              short: true,
            },
            {
              title: 'Timestamp',
              value: alert.timestamp.toISOString(),
              short: true,
            },
            ...(alert.metadata
              ? Object.entries(alert.metadata).map(([key, value]) => ({
                  title: key,
                  value: JSON.stringify(value),
                  short: true,
                }))
              : []),
          ],
          footer: 'Planta y Raiz - Monitoring System',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    });

    console.log(`✅ Alerta enviado para Slack: ${alert.title}`);
  } catch (error) {
    console.error('❌ Erro ao enviar alerta para Slack:', error);
  }
}

/**
 * Enviar alerta para Discord
 */
export async function sendDiscordAlert(alert: Alert): Promise<void> {
  if (!DISCORD_WEBHOOK) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL não configurado');
    return;
  }

  try {
    const color = parseInt(ALERT_COLORS[alert.level].replace('#', ''), 16);
    const emoji = ALERT_EMOJIS[alert.level];

    await axios.post(DISCORD_WEBHOOK, {
      content: `${emoji} **${alert.title}**`,
      embeds: [
        {
          title: alert.title,
          description: alert.message,
          color,
          fields: [
            {
              name: 'Nível',
              value: alert.level.toUpperCase(),
              inline: true,
            },
            {
              name: 'Timestamp',
              value: alert.timestamp.toISOString(),
              inline: true,
            },
            ...(alert.metadata
              ? Object.entries(alert.metadata).map(([key, value]) => ({
                  name: key,
                  value: JSON.stringify(value),
                  inline: true,
                }))
              : []),
          ],
          footer: {
            text: 'Planta y Raiz - Monitoring System',
          },
          timestamp: alert.timestamp.toISOString(),
        },
      ],
    });

    console.log(`✅ Alerta enviado para Discord: ${alert.title}`);
  } catch (error) {
    console.error('❌ Erro ao enviar alerta para Discord:', error);
  }
}

/**
 * Enviar alerta para Microsoft Teams
 */
export async function sendTeamsAlert(alert: Alert): Promise<void> {
  if (!TEAMS_WEBHOOK) {
    console.warn('⚠️ TEAMS_WEBHOOK_URL não configurado');
    return;
  }

  try {
    const themeColor = ALERT_COLORS[alert.level];

    await axios.post(TEAMS_WEBHOOK, {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: alert.title,
      themeColor,
      sections: [
        {
          activityTitle: alert.title,
          activitySubtitle: `${ALERT_EMOJIS[alert.level]} ${alert.level.toUpperCase()}`,
          text: alert.message,
          facts: [
            {
              name: 'Nível',
              value: alert.level.toUpperCase(),
            },
            {
              name: 'Timestamp',
              value: alert.timestamp.toISOString(),
            },
            ...(alert.metadata
              ? Object.entries(alert.metadata).map(([key, value]) => ({
                  name: key,
                  value: JSON.stringify(value),
                }))
              : []),
          ],
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Ver Dashboard',
          targets: [
            {
              os: 'default',
              uri: `${process.env.APP_URL}/admin/monitoring`,
            },
          ],
        },
      ],
    });

    console.log(`✅ Alerta enviado para Teams: ${alert.title}`);
  } catch (error) {
    console.error('❌ Erro ao enviar alerta para Teams:', error);
  }
}

/**
 * Enviar alerta para múltiplos canais
 */
export async function sendAlert(alert: Alert, channels?: AlertChannel[]): Promise<void> {
  const targetChannels = channels || ['slack', 'discord', 'teams'];

  const promises = targetChannels.map((channel) => {
    switch (channel) {
      case 'slack':
        return sendSlackAlert(alert);
      case 'discord':
        return sendDiscordAlert(alert);
      case 'teams':
        return sendTeamsAlert(alert);
      default:
        return Promise.resolve();
    }
  });

  await Promise.all(promises);
}

/**
 * Alertas predefinidos
 */
export const PredefinedAlerts = {
  // Agendamento
  scheduleExecutionFailed: (scheduleId: string, error: string) => ({
    level: 'critical' as AlertLevel,
    title: '❌ Falha na Execução de Agendamento',
    message: `Agendamento ${scheduleId} falhou: ${error}`,
    metadata: { scheduleId, error },
  }),

  scheduleExecutionSuccess: (scheduleId: string, recipientCount: number) => ({
    level: 'info' as AlertLevel,
    title: '✅ Agendamento Executado com Sucesso',
    message: `Agendamento ${scheduleId} executado para ${recipientCount} destinatários`,
    metadata: { scheduleId, recipientCount },
  }),

  // Email
  emailSendFailed: (email: string, reason: string) => ({
    level: 'warning' as AlertLevel,
    title: '⚠️ Falha ao Enviar Email',
    message: `Falha ao enviar email para ${email}: ${reason}`,
    metadata: { email, reason },
  }),

  emailSendSuccess: (email: string) => ({
    level: 'info' as AlertLevel,
    title: '✅ Email Enviado com Sucesso',
    message: `Email enviado com sucesso para ${email}`,
    metadata: { email },
  }),

  // Performance
  performanceWarning: (metric: string, value: number, threshold: number) => ({
    level: 'warning' as AlertLevel,
    title: '⚠️ Aviso de Performance',
    message: `${metric} atingiu ${value}ms (limite: ${threshold}ms)`,
    metadata: { metric, value, threshold },
  }),

  performanceCritical: (metric: string, value: number, threshold: number) => ({
    level: 'critical' as AlertLevel,
    title: '🚨 Performance Crítica',
    message: `${metric} atingiu ${value}ms (limite crítico: ${threshold}ms)`,
    metadata: { metric, value, threshold },
  }),

  // Disponibilidade
  serviceDown: (service: string) => ({
    level: 'critical' as AlertLevel,
    title: '🚨 Serviço Indisponível',
    message: `${service} está indisponível`,
    metadata: { service },
  }),

  serviceUp: (service: string) => ({
    level: 'info' as AlertLevel,
    title: '✅ Serviço Recuperado',
    message: `${service} está novamente disponível`,
    metadata: { service },
  }),

  // Segurança
  securityAlert: (type: string, details: string) => ({
    level: 'critical' as AlertLevel,
    title: '🚨 Alerta de Segurança',
    message: `${type}: ${details}`,
    metadata: { type, details },
  }),

  // Taxa de sucesso
  failureRateHigh: (rate: number, threshold: number) => ({
    level: 'warning' as AlertLevel,
    title: '⚠️ Taxa de Falha Elevada',
    message: `Taxa de falha: ${rate}% (limite: ${threshold}%)`,
    metadata: { rate, threshold },
  }),

  failureRateCritical: (rate: number, threshold: number) => ({
    level: 'critical' as AlertLevel,
    title: '🚨 Taxa de Falha Crítica',
    message: `Taxa de falha: ${rate}% (limite crítico: ${threshold}%)`,
    metadata: { rate, threshold },
  }),
};

/**
 * Monitor de saúde do sistema
 */
export class HealthMonitor {
  private lastCheck: Date = new Date();
  private failureCount: number = 0;
  private successCount: number = 0;

  async checkHealth(): Promise<boolean> {
    try {
      // Verificar banco de dados
      // Verificar cache
      // Verificar APIs externas
      this.successCount++;
      return true;
    } catch (error) {
      this.failureCount++;
      return false;
    }
  }

  getFailureRate(): number {
    const total = this.failureCount + this.successCount;
    if (total === 0) return 0;
    return (this.failureCount / total) * 100;
  }

  async monitorContinuously(interval: number = 60000): Promise<void> {
    setInterval(async () => {
      const isHealthy = await this.checkHealth();
      const failureRate = this.getFailureRate();

      if (!isHealthy) {
        await sendAlert({
          id: `health-check-${Date.now()}`,
          level: 'warning',
          title: '⚠️ Verificação de Saúde Falhou',
          message: `Taxa de falha: ${failureRate.toFixed(2)}%`,
          timestamp: new Date(),
          channel: 'slack',
          metadata: { failureRate },
        });
      }

      if (failureRate > 50) {
        await sendAlert({
          id: `health-critical-${Date.now()}`,
          level: 'critical',
          title: '🚨 Sistema em Risco',
          message: `Taxa de falha crítica: ${failureRate.toFixed(2)}%`,
          timestamp: new Date(),
          channel: 'slack',
          metadata: { failureRate },
        });
      }
    }, interval);
  }
}

export default {
  sendAlert,
  sendSlackAlert,
  sendDiscordAlert,
  sendTeamsAlert,
  PredefinedAlerts,
  HealthMonitor,
};
