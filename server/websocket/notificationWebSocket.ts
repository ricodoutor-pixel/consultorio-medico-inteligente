import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { notifyOwner } from '../_core/notification';

interface Notification {
  id: string;
  type: 'payment_anomaly' | 'churn_critical' | 'profit_opportunity' | 'security_alert' | 'system_alert';
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  data?: any;
}

interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
  role?: string;
  connectedAt: number;
}

class NotificationWebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private notificationQueue: Notification[] = [];
  private maxQueueSize = 1000;

  /**
   * Inicializar WebSocket server
   */
  public initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/api/ws/notifications' });

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        ws,
        connectedAt: Date.now(),
      });

      console.log(`[WebSocket] Client ${clientId} connected. Total: ${this.clients.size}`);

      // Enviar notificações pendentes
      this.sendPendingNotifications(ws);

      // Listener para mensagens do cliente
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error);
        }
      });

      // Listener para desconexão
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`[WebSocket] Client ${clientId} disconnected. Total: ${this.clients.size}`);
      });

      // Listener para erros
      ws.on('error', (error) => {
        console.error(`[WebSocket] Client ${clientId} error:`, error);
      });
    });

    console.log('[WebSocket] Server initialized on /api/ws/notifications');
  }

  /**
   * Enviar notificação de anomalia de pagamento
   */
  public async notifyPaymentAnomaly(data: {
    userId: string;
    amount: number;
    expectedAmount: number;
    reason: string;
  }): Promise<void> {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type: 'payment_anomaly',
      title: '⚠️ Anomalia de Pagamento Detectada',
      content: `Pagamento anômalo: R$ ${data.amount} (esperado: R$ ${data.expectedAmount}). Motivo: ${data.reason}`,
      severity: 'critical',
      timestamp: Date.now(),
      data,
    };

    this.broadcastNotification(notification);
    await notifyOwner({
      title: notification.title,
      content: notification.content,
    });
  }

  /**
   * Enviar notificação de churn crítico
   */
  public async notifyChurnCritical(data: {
    doctorId: string;
    doctorName: string;
    riskScore: number;
    reason: string;
  }): Promise<void> {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type: 'churn_critical',
      title: '🚨 Risco Crítico de Churn',
      content: `Dr. ${data.doctorName} em risco crítico (score: ${data.riskScore}). Motivo: ${data.reason}`,
      severity: 'critical',
      timestamp: Date.now(),
      data,
    };

    this.broadcastNotification(notification);
    await notifyOwner({
      title: notification.title,
      content: notification.content,
    });
  }

  /**
   * Enviar notificação de oportunidade de lucro
   */
  public async notifyProfitOpportunity(data: {
    opportunity: string;
    potentialRevenue: number;
    timeframe: string;
    action: string;
  }): Promise<void> {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type: 'profit_opportunity',
      title: '💰 Oportunidade de Lucro Identificada',
      content: `${data.opportunity} | Receita potencial: R$ ${data.potentialRevenue} em ${data.timeframe} | Ação: ${data.action}`,
      severity: 'info',
      timestamp: Date.now(),
      data,
    };

    this.broadcastNotification(notification);
    await notifyOwner({
      title: notification.title,
      content: notification.content,
    });
  }

  /**
   * Enviar notificação de alerta de segurança
   */
  public async notifySecurityAlert(data: {
    type: string;
    severity: string;
    description: string;
    action: string;
  }): Promise<void> {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type: 'security_alert',
      title: '🔐 Alerta de Segurança',
      content: `${data.type} (${data.severity}) | ${data.description} | Ação: ${data.action}`,
      severity: data.severity === 'critical' ? 'critical' : 'warning',
      timestamp: Date.now(),
      data,
    };

    this.broadcastNotification(notification);
    await notifyOwner({
      title: notification.title,
      content: notification.content,
    });
  }

  /**
   * Enviar notificação de alerta do sistema
   */
  public async notifySystemAlert(data: {
    component: string;
    status: string;
    message: string;
    action?: string;
  }): Promise<void> {
    const notification: Notification = {
      id: this.generateNotificationId(),
      type: 'system_alert',
      title: '⚙️ Alerta do Sistema',
      content: `${data.component}: ${data.status} | ${data.message}${data.action ? ` | Ação: ${data.action}` : ''}`,
      severity: 'warning',
      timestamp: Date.now(),
      data,
    };

    this.broadcastNotification(notification);
  }

  /**
   * Broadcast notificação para todos os clientes
   */
  private broadcastNotification(notification: Notification): void {
    const message = JSON.stringify({
      type: 'notification',
      notification,
    });

    let sentCount = 0;
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message, (error) => {
          if (error) {
            console.error('[WebSocket] Send error:', error);
          } else {
            sentCount++;
          }
        });
      }
    }

    // Adicionar à fila se nenhum cliente recebeu
    if (sentCount === 0) {
      this.addToQueue(notification);
    }

    console.log(`[WebSocket] Notification sent to ${sentCount} clients`);
  }

  /**
   * Enviar notificações pendentes para novo cliente
   */
  private sendPendingNotifications(ws: WebSocket): void {
    if (this.notificationQueue.length === 0) return;

    const message = JSON.stringify({
      type: 'pending_notifications',
      notifications: this.notificationQueue.slice(-10), // Últimas 10
    });

    ws.send(message, (error) => {
      if (error) {
        console.error('[WebSocket] Send pending error:', error);
      }
    });
  }

  /**
   * Adicionar notificação à fila
   */
  private addToQueue(notification: Notification): void {
    this.notificationQueue.push(notification);

    // Manter tamanho máximo da fila
    if (this.notificationQueue.length > this.maxQueueSize) {
      this.notificationQueue.shift();
    }
  }

  /**
   * Processar mensagem do cliente
   */
  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'auth':
        client.userId = message.userId;
        client.role = message.role;
        console.log(`[WebSocket] Client ${clientId} authenticated as ${message.userId}`);
        break;

      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'acknowledge':
        console.log(`[WebSocket] Client ${clientId} acknowledged notification ${message.notificationId}`);
        break;

      default:
        console.log(`[WebSocket] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Gerar ID único para cliente
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gerar ID único para notificação
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obter estatísticas do WebSocket
   */
  public getStats(): {
    connectedClients: number;
    queuedNotifications: number;
    uptime: number;
  } {
    return {
      connectedClients: this.clients.size,
      queuedNotifications: this.notificationQueue.length,
      uptime: Date.now(),
    };
  }

  /**
   * Fechar servidor WebSocket
   */
  public close(): void {
    if (this.wss) {
      this.wss.close();
      console.log('[WebSocket] Server closed');
    }
  }
}

// Exportar instância singleton
export const notificationWebSocketService = new NotificationWebSocketService();
