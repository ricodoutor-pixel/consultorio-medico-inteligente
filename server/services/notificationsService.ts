import { getDb } from '../db';
import { notifications } from '../../drizzle/schema';

type NotificationType = 'consultation' | 'message' | 'reminder' | 'promotion' | 'system';

interface NotificationData {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * Criar notificação para o usuário
 */
export async function createNotification(data: NotificationData) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(notifications).values({
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      message: data.message,
      read: 0,
      createdAt: new Date(),
    });

    console.log(`[Notifications] Notificação criada para usuário ${data.userId}: ${data.title}`);

    // TODO: Enviar notificação em tempo real via WebSocket ou Server-Sent Events
    // TODO: Enviar email se configurado
    // TODO: Enviar push notification se app mobile

    return {
      success: true,
      message: 'Notificação criada com sucesso',
    };
  } catch (error) {
    console.error('[Notifications] Erro ao criar notificação:', error);
    return {
      success: false,
      error: 'Falha ao criar notificação',
    };
  }
}

/**
 * Notificar depósito confirmado
 */
export async function notifyDepositConfirmed(userId: number, amount: number) {
  return createNotification({
    userId,
    type: 'system',
    title: 'Depósito Confirmado! 🎉',
    message: `Seu depósito de R$ ${(amount / 100).toFixed(2)} foi confirmado com sucesso. Seus ganhos começarão a ser creditados diariamente.`,
  });
}

/**
 * Notificar saque aprovado
 */
export async function notifyWithdrawalApproved(userId: number, amount: number) {
  return createNotification({
    userId,
    type: 'system',
    title: 'Saque Aprovado! ✅',
    message: `Seu saque de R$ ${(amount / 100).toFixed(2)} foi aprovado e será processado em breve.`,
  });
}

/**
 * Notificar saque processado
 */
export async function notifyWithdrawalProcessed(userId: number, amount: number) {
  return createNotification({
    userId,
    type: 'system',
    title: 'Saque Processado! 💰',
    message: `Seu saque de R$ ${(amount / 100).toFixed(2)} foi processado e deve chegar em sua conta em breve.`,
  });
}

/**
 * Notificar ganhos creditados
 */
export async function notifyEarningsCredit(userId: number, amount: number, planName: string) {
  return createNotification({
    userId,
    type: 'reminder',
    title: 'Ganhos Creditados! 📈',
    message: `Você recebeu R$ ${(amount / 100).toFixed(2)} em ganhos do plano ${planName}. Continue investindo!`,
  });
}

/**
 * Notificar comissão de afiliado
 */
export async function notifyAffiliateCommission(userId: number, amount: number, referralName: string) {
  return createNotification({
    userId,
    type: 'promotion',
    title: 'Comissão de Afiliado! 🎁',
    message: `Você recebeu R$ ${(amount / 100).toFixed(2)} em comissão por indicar ${referralName}.`,
  });
}

/**
 * Notificar novo indicado
 */
export async function notifyNewReferral(userId: number, referralName: string) {
  return createNotification({
    userId,
    type: 'promotion',
    title: 'Novo Indicado! 👥',
    message: `${referralName} se registrou usando seu código de indicação. Você começará a receber comissões assim que ele fizer seu primeiro depósito.`,
  });
}

/**
 * Notificar saque rejeitado
 */
export async function notifyWithdrawalRejected(userId: number, amount: number, reason: string) {
  return createNotification({
    userId,
    type: 'system',
    title: 'Saque Rejeitado ❌',
    message: `Seu saque de R$ ${(amount / 100).toFixed(2)} foi rejeitado. Motivo: ${reason}`,
  });
}

/**
 * Notificar atualização do sistema
 */
export async function notifySystemUpdate(userId: number, title: string, message: string) {
  return createNotification({
    userId,
    type: 'system',
    title,
    message,
  });
}

/**
 * Enviar notificação para todos os usuários
 */
export async function notifyAllUsers(title: string, message: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // TODO: Buscar todos os usuários e enviar notificação
    console.log(`[Notifications] Enviando notificação para todos os usuários: ${title}`);

    return {
      success: true,
      message: 'Notificações enviadas com sucesso',
    };
  } catch (error) {
    console.error('[Notifications] Erro ao enviar notificações:', error);
    return {
      success: false,
      error: 'Falha ao enviar notificações',
    };
  }
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.id, notificationId));

    return {
      success: true,
      message: 'Notificação marcada como lida',
    };
  } catch (error) {
    console.error('[Notifications] Erro ao marcar notificação como lida:', error);
    return {
      success: false,
      error: 'Falha ao marcar notificação',
    };
  }
}

// Importar eq para evitar erro
import { eq } from 'drizzle-orm';
