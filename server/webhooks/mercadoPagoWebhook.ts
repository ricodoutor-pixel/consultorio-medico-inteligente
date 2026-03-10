// ============================================================================
// WEBHOOK HANDLER — MERCADO PAGO
// Planta & Raiz 3.0 — Sistema de Pagamentos Dinâmico
// ============================================================================

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { IntegratedPaymentService } from '../services/paymentService';

const router = Router();
const paymentService = new IntegratedPaymentService(
  process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
);

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

/**
 * Webhook do Mercado Pago
 * POST /api/webhooks/mercado-pago
 * 
 * Recebe notificações de pagamento do Mercado Pago
 */
router.post('/mercado-pago', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    console.log('[WEBHOOK] Mercado Pago webhook recebido:', {
      type,
      dataId: data?.id,
      timestamp: new Date().toISOString(),
    });

    // Validar tipo de webhook
    if (type !== 'payment') {
      console.log('[WEBHOOK] Tipo de webhook ignorado:', type);
      return res.json({ success: true, message: 'Webhook type ignored' });
    }

    // Validar dados
    if (!data || !data.id) {
      console.error('[WEBHOOK] Dados inválidos:', data);
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    const paymentId = data.id;

    // ========================================================================
    // PROCESSAR PAGAMENTO
    // ========================================================================

    try {
      // 1. Obter status do pagamento do Mercado Pago
      const paymentStatus = await paymentService.mercadoPagoService.getPaymentStatus(
        paymentId
      );

      console.log('[WEBHOOK] Status do pagamento:', {
        paymentId,
        status: paymentStatus.status,
        amount: paymentStatus.transaction_amount,
      });

      // 2. Verificar autenticidade
      const verification = await paymentService.verifyPaymentAfterWebhook(
        paymentId,
        paymentStatus
      );

      console.log('[WEBHOOK] Verificação de autenticidade:', {
        paymentId,
        isAuthentic: verification.authenticationVerified,
      });

      // 3. Atualizar banco de dados (mock)
      // Em produção, isso seria uma chamada ao banco de dados real
      const paymentRecord = {
        mercadoPagoId: paymentId,
        status: paymentStatus.status,
        amount: paymentStatus.transaction_amount,
        authenticationVerified: verification.authenticationVerified,
        authenticationToken: verification.authenticationToken,
        integrityHash: verification.integrityHash,
        updatedAt: new Date(),
      };

      console.log('[WEBHOOK] Registro de pagamento atualizado:', paymentRecord);

      // 4. Processar diferentes status
      switch (paymentStatus.status) {
        case 'approved':
          await handleApprovedPayment(paymentId, paymentStatus, verification);
          break;

        case 'pending':
          await handlePendingPayment(paymentId, paymentStatus);
          break;

        case 'rejected':
          await handleRejectedPayment(paymentId, paymentStatus);
          break;

        case 'cancelled':
          await handleCancelledPayment(paymentId, paymentStatus);
          break;

        default:
          console.warn('[WEBHOOK] Status desconhecido:', paymentStatus.status);
      }

      // 5. Responder ao Mercado Pago
      res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('[WEBHOOK] Erro ao processar pagamento:', error);
      res.status(500).json({ error: 'Error processing payment' });
    }
  } catch (error) {
    console.error('[WEBHOOK] Erro geral:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// HANDLERS DE STATUS
// ============================================================================

/**
 * Pagamento Aprovado
 */
async function handleApprovedPayment(
  paymentId: string,
  paymentStatus: any,
  verification: any
) {
  console.log('[WEBHOOK] Processando pagamento aprovado:', paymentId);

  try {
    // 1. Calcular comissões
    const commissions = paymentService.commissionService.calculateCommissions(
      paymentStatus.transaction_amount
    );

    console.log('[WEBHOOK] Comissões calculadas:', {
      totalAmount: commissions.totalAmount,
      platformFee: commissions.platformFee,
      doctorEarnings: commissions.doctorEarnings,
    });

    // 2. Registrar em audit log (mock)
    console.log('[WEBHOOK] Registrando em audit log:', {
      paymentId,
      action: 'PAYMENT_APPROVED',
      timestamp: new Date().toISOString(),
    });

    // 3. Notificar médico (mock)
    console.log('[WEBHOOK] Notificando médico:', {
      doctorId: paymentStatus.metadata?.doctorId,
      message: `Novo pagamento recebido: R$ ${commissions.doctorEarnings}`,
    });

    // 4. Notificar paciente (mock)
    console.log('[WEBHOOK] Notificando paciente:', {
      patientId: paymentStatus.metadata?.patientId,
      message: `Pagamento confirmado: R$ ${paymentStatus.transaction_amount}`,
    });

    // 5. Iniciar transferência para médico (em 5 dias úteis)
    console.log('[WEBHOOK] Agendando transferência para médico:', {
      doctorId: paymentStatus.metadata?.doctorId,
      amount: commissions.doctorEarnings,
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento aprovado:', error);
    throw error;
  }
}

/**
 * Pagamento Pendente
 */
async function handlePendingPayment(paymentId: string, paymentStatus: any) {
  console.log('[WEBHOOK] Processando pagamento pendente:', paymentId);

  try {
    // Notificar paciente que pagamento está pendente
    console.log('[WEBHOOK] Notificando paciente sobre pagamento pendente:', {
      patientId: paymentStatus.metadata?.patientId,
      message: 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
    });

    // Agendar verificação automática em 10 minutos
    console.log('[WEBHOOK] Agendando verificação automática:', {
      paymentId,
      checkIn: '10 minutes',
    });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento pendente:', error);
    throw error;
  }
}

/**
 * Pagamento Rejeitado
 */
async function handleRejectedPayment(paymentId: string, paymentStatus: any) {
  console.log('[WEBHOOK] Processando pagamento rejeitado:', paymentId);

  try {
    // Notificar paciente que pagamento foi rejeitado
    console.log('[WEBHOOK] Notificando paciente sobre pagamento rejeitado:', {
      patientId: paymentStatus.metadata?.patientId,
      reason: paymentStatus.status_detail,
      message: 'Seu pagamento foi rejeitado. Por favor, tente novamente.',
    });

    // Liberar slot de consulta
    console.log('[WEBHOOK] Liberando slot de consulta:', {
      consultationId: paymentStatus.metadata?.consultationId,
    });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento rejeitado:', error);
    throw error;
  }
}

/**
 * Pagamento Cancelado
 */
async function handleCancelledPayment(paymentId: string, paymentStatus: any) {
  console.log('[WEBHOOK] Processando pagamento cancelado:', paymentId);

  try {
    // Notificar paciente que pagamento foi cancelado
    console.log('[WEBHOOK] Notificando paciente sobre pagamento cancelado:', {
      patientId: paymentStatus.metadata?.patientId,
      message: 'Seu pagamento foi cancelado.',
    });

    // Liberar slot de consulta
    console.log('[WEBHOOK] Liberando slot de consulta:', {
      consultationId: paymentStatus.metadata?.consultationId,
    });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar pagamento cancelado:', error);
    throw error;
  }
}

// ============================================================================
// VALIDAÇÃO DE WEBHOOK (OPCIONAL)
// ============================================================================

/**
 * Validar assinatura do webhook (se Mercado Pago enviar)
 */
function validateWebhookSignature(
  req: Request,
  secret: string
): boolean {
  try {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    const body = JSON.stringify(req.body);

    if (!signature || !timestamp) {
      return false;
    }

    // Criar hash esperado
    const data = `${timestamp}.${body}`;
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');

    // Comparar com assinatura recebida
    return hash === signature;
  } catch (error) {
    console.error('[WEBHOOK] Erro ao validar assinatura:', error);
    return false;
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check do webhook
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Mercado Pago Webhook Handler',
  });
});

// ============================================================================
// EXPORT
// ============================================================================

export default router;
