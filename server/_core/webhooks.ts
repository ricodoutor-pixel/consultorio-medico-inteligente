/**
 * Sistema de Webhooks para Integrações Externas
 * Suporta Slack, Discord, Microsoft Teams e webhooks customizados
 */

import fetch from 'node-fetch';

/**
 * Tipos de eventos para webhooks
 */
export enum WebhookEventType {
  SCHEDULE_FAILED = 'schedule.failed',
  SCHEDULE_SUCCESS = 'schedule.success',
  SCHEDULE_RETRY = 'schedule.retry',
  EMAIL_SENT = 'email.sent',
  EMAIL_FAILED = 'email.failed',
  SYSTEM_ALERT = 'system.alert',
  CRITICAL_ERROR = 'critical.error',
  HEALTH_CHECK = 'health.check',
}

/**
 * Interface de webhook
 */
export interface Webhook {
  id: string;
  name: string;
  url: string;
  type: 'slack' | 'discord' | 'teams' | 'custom';
  events: WebhookEventType[];
  active: boolean;
  createdAt: Date;
}

/**
 * Interface de payload de evento
 */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: Date;
  data: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Map de webhooks registrados
 */
const registeredWebhooks = new Map<string, Webhook>();

/**
 * Registrar novo webhook
 */
export function registerWebhook(webhook: Webhook): void {
  registeredWebhooks.set(webhook.id, webhook);
  console.log(`[WEBHOOKS] Webhook registrado: ${webhook.name} (${webhook.type})`);
}

/**
 * Remover webhook
 */
export function unregisterWebhook(webhookId: string): boolean {
  return registeredWebhooks.delete(webhookId);
}

/**
 * Listar webhooks
 */
export function listWebhooks(): Webhook[] {
  return Array.from(registeredWebhooks.values());
}

/**
 * Obter webhook por ID
 */
export function getWebhook(webhookId: string): Webhook | undefined {
  return registeredWebhooks.get(webhookId);
}

/**
 * Formatar mensagem para Slack
 */
function formatSlackMessage(payload: WebhookPayload): Record<string, any> {
  const colorMap = {
    info: '#36a64f',
    warning: '#ff9900',
    error: '#ff0000',
    critical: '#8b0000',
  };

  const color = colorMap[payload.severity || 'info'];

  return {
    attachments: [
      {
        color,
        title: payload.event,
        text: JSON.stringify(payload.data, null, 2),
        ts: Math.floor(payload.timestamp.getTime() / 1000),
        footer: 'Planta & Raiz - Sistema de Alertas',
      },
    ],
  };
}

/**
 * Formatar mensagem para Discord
 */
function formatDiscordMessage(payload: WebhookPayload): Record<string, any> {
  const colorMap = {
    info: 0x36a64f,
    warning: 0xff9900,
    error: 0xff0000,
    critical: 0x8b0000,
  };

  const color = colorMap[payload.severity || 'info'];

  return {
    embeds: [
      {
        title: payload.event,
        description: JSON.stringify(payload.data, null, 2),
        color,
        timestamp: payload.timestamp.toISOString(),
        footer: {
          text: 'Planta & Raiz - Sistema de Alertas',
        },
      },
    ],
  };
}

/**
 * Formatar mensagem para Microsoft Teams
 */
function formatTeamsMessage(payload: WebhookPayload): Record<string, any> {
  const themeColorMap = {
    info: '0078D4',
    warning: 'FFB900',
    error: 'E81123',
    critical: '750B1C',
  };

  const themeColor = themeColorMap[payload.severity || 'info'];

  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: payload.event,
    themeColor,
    sections: [
      {
        activityTitle: payload.event,
        activitySubtitle: new Date().toLocaleString('pt-BR'),
        facts: Object.entries(payload.data).map(([key, value]) => ({
          name: key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        })),
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'Ver Detalhes',
        targets: [
          {
            os: 'default',
            uri: 'https://plantayraiz.com.br/admin/monitoring',
          },
        ],
      },
    ],
  };
}

/**
 * Enviar evento para webhooks
 */
export async function sendWebhookEvent(payload: WebhookPayload): Promise<void> {
  const webhooks = Array.from(registeredWebhooks.values()).filter(
    (w) => w.active && w.events.includes(payload.event)
  );

  if (webhooks.length === 0) {
    console.log(`[WEBHOOKS] Nenhum webhook registrado para o evento: ${payload.event}`);
    return;
  }

  console.log(`[WEBHOOKS] Enviando evento ${payload.event} para ${webhooks.length} webhook(s)`);

  for (const webhook of webhooks) {
    try {
      let body: Record<string, any>;

      switch (webhook.type) {
        case 'slack':
          body = formatSlackMessage(payload);
          break;
        case 'discord':
          body = formatDiscordMessage(payload);
          break;
        case 'teams':
          body = formatTeamsMessage(payload);
          break;
        default:
          body = payload;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        console.log(`[WEBHOOKS] Evento enviado com sucesso para: ${webhook.name}`);
      } else {
        console.error(`[WEBHOOKS] Erro ao enviar evento para ${webhook.name}: ${response.status}`);
      }
    } catch (error) {
      console.error(`[WEBHOOKS] Erro ao enviar webhook para ${webhook.name}:`, error);
    }
  }
}

/**
 * Enviar alerta de falha de agendamento
 */
export async function sendScheduleFailureAlert(
  scheduleId: string,
  email: string,
  error: string,
  retryCount: number,
  maxRetries: number
): Promise<void> {
  await sendWebhookEvent({
    event: WebhookEventType.SCHEDULE_FAILED,
    timestamp: new Date(),
    severity: retryCount >= maxRetries ? 'critical' : 'error',
    data: {
      scheduleId,
      email,
      error,
      retryCount,
      maxRetries,
      message: `Agendamento ${scheduleId} falhou ao enviar para ${email}. Tentativa ${retryCount}/${maxRetries}`,
    },
  });
}

/**
 * Enviar alerta de sucesso de agendamento
 */
export async function sendScheduleSuccessAlert(
  scheduleId: string,
  email: string,
  recipients: number
): Promise<void> {
  await sendWebhookEvent({
    event: WebhookEventType.SCHEDULE_SUCCESS,
    timestamp: new Date(),
    severity: 'info',
    data: {
      scheduleId,
      email,
      recipients,
      message: `Agendamento ${scheduleId} executado com sucesso. ${recipients} relatório(s) enviado(s)`,
    },
  });
}

/**
 * Enviar alerta de retry
 */
export async function sendScheduleRetryAlert(
  scheduleId: string,
  email: string,
  retryCount: number,
  delayMinutes: number
): Promise<void> {
  await sendWebhookEvent({
    event: WebhookEventType.SCHEDULE_RETRY,
    timestamp: new Date(),
    severity: 'warning',
    data: {
      scheduleId,
      email,
      retryCount,
      delayMinutes,
      message: `Retry agendado para ${scheduleId}. Próxima tentativa em ${delayMinutes} minutos (tentativa ${retryCount})`,
    },
  });
}

/**
 * Enviar alerta crítico do sistema
 */
export async function sendCriticalSystemAlert(
  title: string,
  description: string,
  details: Record<string, any>
): Promise<void> {
  await sendWebhookEvent({
    event: WebhookEventType.CRITICAL_ERROR,
    timestamp: new Date(),
    severity: 'critical',
    data: {
      title,
      description,
      ...details,
    },
  });
}

/**
 * Enviar relatório de saúde do sistema
 */
export async function sendHealthCheckAlert(
  healthy: boolean,
  failureCount: number,
  criticalFailures: number
): Promise<void> {
  await sendWebhookEvent({
    event: WebhookEventType.HEALTH_CHECK,
    timestamp: new Date(),
    severity: healthy ? 'info' : criticalFailures > 0 ? 'critical' : 'warning',
    data: {
      healthy,
      failureCount,
      criticalFailures,
      message: healthy
        ? 'Sistema operacional - Nenhuma falha detectada'
        : `Sistema com problemas - ${failureCount} falha(s) ativa(s), ${criticalFailures} crítica(s)`,
    },
  });
}

/**
 * Inicializar webhooks padrão (exemplo)
 */
export function initializeDefaultWebhooks(): void {
  // Exemplo de webhook para Slack (descomente e configure com sua URL)
  // registerWebhook({
  //   id: 'slack-alerts',
  //   name: 'Slack Alerts',
  //   url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  //   type: 'slack',
  //   events: [
  //     WebhookEventType.SCHEDULE_FAILED,
  //     WebhookEventType.CRITICAL_ERROR,
  //     WebhookEventType.SYSTEM_ALERT,
  //   ],
  //   active: true,
  //   createdAt: new Date(),
  // });

  // Exemplo de webhook para Discord (descomente e configure com sua URL)
  // registerWebhook({
  //   id: 'discord-alerts',
  //   name: 'Discord Alerts',
  //   url: 'https://discordapp.com/api/webhooks/YOUR/WEBHOOK/URL',
  //   type: 'discord',
  //   events: [
  //     WebhookEventType.SCHEDULE_FAILED,
  //     WebhookEventType.CRITICAL_ERROR,
  //   ],
  //   active: true,
  //   createdAt: new Date(),
  // });

  console.log('[WEBHOOKS] Sistema de webhooks inicializado');
}
