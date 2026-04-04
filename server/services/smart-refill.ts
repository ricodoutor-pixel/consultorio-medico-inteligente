/**
 * SMART REFILL & ACOMPANHAMENTO PÓS-VENDA
 * Notificações automáticas D-5, D+7, D+30
 * Plantayraiz.com.br
 */

import { db } from '../db';
import { notifyOwner } from '../_core/notification';
import { sendWhatsAppMessage } from './whatsapp-service';
import { invokeLLM } from '../_core/llm';

interface RefillNotification {
  userId: string;
  orderId: string;
  productId: string;
  productName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  notificationType: 'REFILL_REMINDER' | 'FOLLOW_UP_7D' | 'FOLLOW_UP_30D';
  sent: boolean;
  sentAt?: Date;
}

/**
 * Verificar e enviar notificações de Smart-Refill (D-5)
 */
export async function checkAndSendSmartRefillNotifications(): Promise<void> {
  try {
    const today = new Date();
    const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

    // Buscar pedidos que expiram em 5 dias
    const expiringOrders = await db.query(
      `
      SELECT o.id, o.user_id, o.product_id, p.name, p.expiry_date, u.phone
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE DATE(p.expiry_date) = DATE(?)
      AND o.status = 'COMPLETED'
      AND o.refill_notified = FALSE
      `,
      [fiveDaysFromNow]
    );

    for (const order of expiringOrders) {
      await sendSmartRefillNotification(order);
    }

    console.log(`✅ Smart-Refill: ${expiringOrders.length} notificações enviadas`);
  } catch (error) {
    console.error('❌ Erro ao verificar Smart-Refill:', error);
  }
}

/**
 * Enviar notificação de Smart-Refill
 */
async function sendSmartRefillNotification(order: any): Promise<void> {
  try {
    const message = `
🔔 LEMBRETE DE REABASTECIMENTO

Seu produto "${order.name}" está próximo do vencimento!

📅 Data de Vencimento: ${new Date(order.expiry_date).toLocaleDateString('pt-BR')}
⏰ Faltam apenas 5 dias!

Clique aqui para renovar seu pedido:
https://plantayraiz.com.br/shop/reorder/${order.id}

Obrigado por confiar em nós!
    `;

    // Enviar via WhatsApp
    await sendWhatsAppMessage(order.phone, message);

    // Marcar como notificado
    await db.query(
      `
      UPDATE orders
      SET refill_notified = TRUE, refill_notified_at = NOW()
      WHERE id = ?
      `,
      [order.id]
    );

    console.log(`✅ Smart-Refill enviado para ${order.phone}`);
  } catch (error) {
    console.error('❌ Erro ao enviar Smart-Refill:', error);
  }
}

/**
 * Verificar e enviar acompanhamento D+7
 */
export async function checkAndSendFollowUp7Days(): Promise<void> {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Buscar pedidos completados há 7 dias
    const ordersForFollowUp = await db.query(
      `
      SELECT o.id, o.user_id, u.name, u.phone, p.name as product_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      WHERE DATE(o.completed_at) = DATE(?)
      AND o.status = 'COMPLETED'
      AND o.followup_7d_sent = FALSE
      `,
      [sevenDaysAgo]
    );

    for (const order of ordersForFollowUp) {
      await sendFollowUpNotification(order, 7);
    }

    console.log(`✅ Follow-up D+7: ${ordersForFollowUp.length} notificações enviadas`);
  } catch (error) {
    console.error('❌ Erro ao verificar Follow-up D+7:', error);
  }
}

/**
 * Verificar e enviar acompanhamento D+30
 */
export async function checkAndSendFollowUp30Days(): Promise<void> {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar pedidos completados há 30 dias
    const ordersForFollowUp = await db.query(
      `
      SELECT o.id, o.user_id, u.name, u.phone, p.name as product_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      WHERE DATE(o.completed_at) = DATE(?)
      AND o.status = 'COMPLETED'
      AND o.followup_30d_sent = FALSE
      `,
      [thirtyDaysAgo]
    );

    for (const order of ordersForFollowUp) {
      await sendFollowUpNotification(order, 30);
    }

    console.log(`✅ Follow-up D+30: ${ordersForFollowUp.length} notificações enviadas`);
  } catch (error) {
    console.error('❌ Erro ao verificar Follow-up D+30:', error);
  }
}

/**
 * Enviar notificação de acompanhamento
 */
async function sendFollowUpNotification(order: any, days: number): Promise<void> {
  try {
    let message = '';
    let updateField = '';

    if (days === 7) {
      message = `
👋 COMO VOCÊ ESTÁ?

Passaram 7 dias desde que você recebeu "${order.product_name}".

Como está sendo sua experiência? Alguma dúvida ou sugestão?

Responda esta mensagem ou acesse:
https://plantayraiz.com.br/feedback/${order.id}

Sua opinião é muito importante para nós!
      `;
      updateField = 'followup_7d_sent';
    } else if (days === 30) {
      message = `
📊 COMO ESTÁ INDO?

Já faz 30 dias que você está usando "${order.product_name}".

Gostaríamos de saber como está sendo sua experiência:
✅ Está ajudando?
✅ Tem alguma dúvida?
✅ Quer renovar?

Clique aqui para responder:
https://plantayraiz.com.br/survey/${order.id}

Obrigado por fazer parte da nossa comunidade!
      `;
      updateField = 'followup_30d_sent';
    }

    // Enviar via WhatsApp
    await sendWhatsAppMessage(order.phone, message);

    // Marcar como enviado
    await db.query(
      `
      UPDATE orders
      SET ${updateField} = TRUE, ${updateField}_at = NOW()
      WHERE id = ?
      `,
      [order.id]
    );

    // Usar IA para análise de sentimento se houver resposta
    await scheduleAISentimentAnalysis(order.id, days);

    console.log(`✅ Follow-up D+${days} enviado para ${order.phone}`);
  } catch (error) {
    console.error(`❌ Erro ao enviar Follow-up D+${days}:`, error);
  }
}

/**
 * Agendar análise de sentimento com IA
 */
async function scheduleAISentimentAnalysis(orderId: string, days: number): Promise<void> {
  try {
    // Aguardar resposta do usuário por 24 horas
    setTimeout(async () => {
      const response = await db.query(
        `
        SELECT feedback FROM order_feedback
        WHERE order_id = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `,
        [orderId]
      );

      if (response.length > 0) {
        const sentiment = await analyzeSentiment(response[0].feedback);

        // Armazenar análise
        await db.query(
          `
          UPDATE order_feedback
          SET sentiment = ?, sentiment_score = ?
          WHERE order_id = ?
          `,
          [sentiment.sentiment, sentiment.score, orderId]
        );

        // Notificar se sentimento negativo
        if (sentiment.sentiment === 'NEGATIVE') {
          await notifyOwner({
            title: `⚠️ Feedback Negativo - Pedido ${orderId}`,
            content: `Usuário deixou feedback negativo: "${response[0].feedback}"`,
          });
        }
      }
    }, 24 * 60 * 60 * 1000);
  } catch (error) {
    console.error('Erro ao agendar análise de sentimento:', error);
  }
}

/**
 * Analisar sentimento com IA
 */
async function analyzeSentiment(feedback: string): Promise<{ sentiment: string; score: number }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de sentimento. Analise o feedback do usuário e retorne POSITIVE, NEUTRAL ou NEGATIVE.',
        },
        {
          role: 'user',
          content: `Analise o sentimento deste feedback: "${feedback}"`,
        },
      ],
    });

    const content = response.choices[0].message.content.toLowerCase();

    let sentiment = 'NEUTRAL';
    let score = 0.5;

    if (content.includes('positive')) {
      sentiment = 'POSITIVE';
      score = 0.8;
    } else if (content.includes('negative')) {
      sentiment = 'NEGATIVE';
      score = 0.2;
    }

    return { sentiment, score };
  } catch (error) {
    console.error('Erro ao analisar sentimento:', error);
    return { sentiment: 'NEUTRAL', score: 0.5 };
  }
}

/**
 * Gerar relatório de satisfação
 */
export async function generateSatisfactionReport(): Promise<any> {
  try {
    const report = await db.query(`
      SELECT
        COUNT(*) as total_feedback,
        SUM(CASE WHEN sentiment = 'POSITIVE' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'NEGATIVE' THEN 1 ELSE 0 END) as negative_count,
        SUM(CASE WHEN sentiment = 'NEUTRAL' THEN 1 ELSE 0 END) as neutral_count,
        AVG(sentiment_score) as average_score
      FROM order_feedback
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const data = report[0];

    return {
      totalFeedback: data.total_feedback,
      positivePercentage: (data.positive_count / data.total_feedback) * 100,
      negativePercentage: (data.negative_count / data.total_feedback) * 100,
      neutralPercentage: (data.neutral_count / data.total_feedback) * 100,
      averageSatisfaction: data.average_score,
      recommendation: generateRecommendation(data.average_score),
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return null;
  }
}

/**
 * Gerar recomendação baseada em satisfação
 */
function generateRecommendation(score: number): string {
  if (score >= 0.8) {
    return '✅ Satisfação excelente - Manter estratégia atual';
  } else if (score >= 0.6) {
    return '⚠️ Satisfação boa - Revisar pontos de melhoria';
  } else if (score >= 0.4) {
    return '❌ Satisfação baixa - Ação urgente necessária';
  } else {
    return '🚨 Satisfação crítica - Intervenção imediata';
  }
}

/**
 * Configurar cron jobs
 */
export function setupSmartRefillCrons(): void {
  // Smart-Refill D-5 - Diariamente às 9:00
  const refillCron = setInterval(() => {
    checkAndSendSmartRefillNotifications();
  }, 24 * 60 * 60 * 1000);

  // Follow-up D+7 - Diariamente às 10:00
  const followUp7Cron = setInterval(() => {
    checkAndSendFollowUp7Days();
  }, 24 * 60 * 60 * 1000);

  // Follow-up D+30 - Diariamente às 11:00
  const followUp30Cron = setInterval(() => {
    checkAndSendFollowUp30Days();
  }, 24 * 60 * 60 * 1000);

  console.log('✅ Smart-Refill crons configurados');

  return () => {
    clearInterval(refillCron);
    clearInterval(followUp7Cron);
    clearInterval(followUp30Cron);
  };
}
