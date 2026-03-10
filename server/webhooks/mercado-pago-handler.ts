/**
 * Mercado Pago Webhook Handler
 * Processes PIX payment confirmations and triggers automatic transfers
 */

import { Request, Response } from "express";
import financialAutomationService from "../services/financialAutomationService";
import { notifyOwner } from "../_core/notification";

// Mock Mercado Pago service for webhook handling
const mercadoPagoService = {
  getPaymentDetails: async (id: string) => ({
    id,
    status: "approved",
    transaction_amount: 100,
    external_reference: "consultation-123",
    payment_method_id: "pix",
  }),
};

interface MercadoPagoWebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
  };
  live_mode: boolean;
  api_version: string;
  user_id: string;
  action: string;
  sent_at: string;
}

/**
 * Handle Mercado Pago webhook
 */
async function handleMercadoPagoWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const payload = req.body as MercadoPagoWebhookPayload;

    console.log(`[WEBHOOK] Mercado Pago webhook received: ${payload.id}`);

    // Verify webhook signature
    const isValid = verifyWebhookSignature(req);
    if (!isValid) {
      console.error("[WEBHOOK] Invalid webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Handle different webhook types
    switch (payload.type) {
      case "payment":
        await handlePaymentWebhook(payload);
        break;
      case "plan":
        await handlePlanWebhook(payload);
        break;
      case "subscription":
        await handleSubscriptionWebhook(payload);
        break;
      case "invoice":
        await handleInvoiceWebhook(payload);
        break;
      default:
        console.log(`[WEBHOOK] Unknown webhook type: ${payload.type}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: "received" });
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle payment webhook
 */
async function handlePaymentWebhook(payload: MercadoPagoWebhookPayload): Promise<void> {
  try {
    const paymentId = payload.data.id;

    // Get payment details from Mercado Pago
    const payment = await mercadoPagoService.getPaymentDetails(paymentId);

    console.log(`[WEBHOOK] Payment webhook: ${paymentId} - Status: ${payment.status}`);

    // Handle different payment statuses
    switch (payment.status) {
      case "approved":
        await handlePaymentApproved(payment);
        break;
      case "pending":
        await handlePaymentPending(payment);
        break;
      case "rejected":
        await handlePaymentRejected(payment);
        break;
      case "cancelled":
        await handlePaymentCancelled(payment);
        break;
      case "refunded":
        await handlePaymentRefunded(payment);
        break;
      default:
        console.log(`[WEBHOOK] Unknown payment status: ${payment.status}`);
    }
  } catch (error) {
    console.error("[WEBHOOK] Error handling payment webhook:", error);
    throw error;
  }
}

/**
 * Handle approved payment
 */
async function handlePaymentApproved(payment: any): Promise<void> {
  try {
    console.log(`[WEBHOOK] Payment approved: ${payment.id}`);

    // Extract payment metadata
    const consultationId = payment.external_reference;
    const amount = payment.transaction_amount;
    const paymentMethod = payment.payment_method_id;

    // Calculate commission (10%)
    const commission = amount * 0.1;
    const specialistAmount = amount - commission;

    // Get consultation details
    const consultation = await getConsultationDetails(consultationId);
    if (!consultation) {
      console.error(`[WEBHOOK] Consultation not found: ${consultationId}`);
      return;
    }

    // Update consultation status
    await updateConsultationPaymentStatus(consultationId, "paid", payment.id);

    // Create financial record
    // TODO: Implement invoice creation
    console.log(
      `[WEBHOOK] Financial record created: Consultation ${consultationId}, Amount: R$ ${amount}`
    );

    // Trigger automatic transfer to specialist
    await transferToSpecialist(
      consultation.specialistId,
      specialistAmount,
      consultationId,
      payment.id
    );

    // Send notifications
    await notifySpecialist(consultation.specialistId, consultationId, amount);
    await notifyPatient(consultation.patientId, consultationId, "confirmed");

    // Log transaction
    console.log(
      `[WEBHOOK] Payment processed: Specialist: R$ ${specialistAmount.toFixed(2)}, Commission: R$ ${commission.toFixed(2)}`
    );
  } catch (error) {
    console.error("[WEBHOOK] Error handling approved payment:", error);
    throw error;
  }
}

/**
 * Handle pending payment
 */
async function handlePaymentPending(payment: any): Promise<void> {
  try {
    console.log(`[WEBHOOK] Payment pending: ${payment.id}`);

    const consultationId = payment.external_reference;

    // Update consultation status
    await updateConsultationPaymentStatus(consultationId, "pending", payment.id);

    // Notify patient
    const consultation = await getConsultationDetails(consultationId);
    if (consultation) {
      await notifyPatient(consultation.patientId, consultationId, "pending");
    }
  } catch (error) {
    console.error("[WEBHOOK] Error handling pending payment:", error);
    throw error;
  }
}

/**
 * Handle rejected payment
 */
async function handlePaymentRejected(payment: any): Promise<void> {
  try {
    console.log(`[WEBHOOK] Payment rejected: ${payment.id}`);

    const consultationId = payment.external_reference;

    // Update consultation status
    await updateConsultationPaymentStatus(consultationId, "rejected", payment.id);

    // Notify patient
    const consultation = await getConsultationDetails(consultationId);
    if (consultation) {
      await notifyPatient(consultation.patientId, consultationId, "rejected");
    }
  } catch (error) {
    console.error("[WEBHOOK] Error handling rejected payment:", error);
    throw error;
  }
}

/**
 * Handle cancelled payment
 */
async function handlePaymentCancelled(payment: any): Promise<void> {
  try {
    console.log(`[WEBHOOK] Payment cancelled: ${payment.id}`);

    const consultationId = payment.external_reference;

    // Update consultation status
    await updateConsultationPaymentStatus(consultationId, "cancelled", payment.id);

    // Notify patient
    const consultation = await getConsultationDetails(consultationId);
    if (consultation) {
      await notifyPatient(consultation.patientId, consultationId, "cancelled");
    }
  } catch (error) {
    console.error("[WEBHOOK] Error handling cancelled payment:", error);
    throw error;
  }
}

/**
 * Handle refunded payment
 */
async function handlePaymentRefunded(payment: any): Promise<void> {
  try {
    console.log(`[WEBHOOK] Payment refunded: ${payment.id}`);

    const consultationId = payment.external_reference;
    const refundAmount = payment.transaction_amount;

    // Update consultation status
    await updateConsultationPaymentStatus(consultationId, "refunded", payment.id);

    // Reverse specialist transfer
    const consultation = await getConsultationDetails(consultationId);
    if (consultation) {
      const commission = refundAmount * 0.1;
      const specialistAmount = refundAmount - commission;

      await reverseSpecialistTransfer(
        consultation.specialistId,
        specialistAmount,
        consultationId,
        payment.id
      );

      // Notify both parties
      await notifySpecialist(consultation.specialistId, consultationId, -specialistAmount);
      await notifyPatient(consultation.patientId, consultationId, "refunded");
    }
  } catch (error) {
    console.error("[WEBHOOK] Error handling refunded payment:", error);
    throw error;
  }
}

/**
 * Handle plan webhook
 */
async function handlePlanWebhook(payload: MercadoPagoWebhookPayload): Promise<void> {
  try {
    console.log(`[WEBHOOK] Plan webhook: ${payload.data.id}`);
    // TODO: Implement plan webhook handling
  } catch (error) {
    console.error("[WEBHOOK] Error handling plan webhook:", error);
    throw error;
  }
}

/**
 * Handle subscription webhook
 */
async function handleSubscriptionWebhook(payload: MercadoPagoWebhookPayload): Promise<void> {
  try {
    console.log(`[WEBHOOK] Subscription webhook: ${payload.data.id}`);
    // TODO: Implement subscription webhook handling
  } catch (error) {
    console.error("[WEBHOOK] Error handling subscription webhook:", error);
    throw error;
  }
}

/**
 * Handle invoice webhook
 */
async function handleInvoiceWebhook(payload: MercadoPagoWebhookPayload): Promise<void> {
  try {
    console.log(`[WEBHOOK] Invoice webhook: ${payload.data.id}`);
    // TODO: Implement invoice webhook handling
  } catch (error) {
    console.error("[WEBHOOK] Error handling invoice webhook:", error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(req: Request): boolean {
  try {
    // TODO: Implement signature verification using Mercado Pago's public key
    // For now, accept all webhooks (implement in production)
    return true;
  } catch (error) {
    console.error("[WEBHOOK] Signature verification error:", error);
    return false;
  }
}

/**
 * Get consultation details
 */
async function getConsultationDetails(consultationId: string): Promise<any> {
  try {
    // TODO: Query database for consultation details
    return {
      id: consultationId,
      patientId: "patient-123",
      specialistId: "specialist-456",
      amount: 100,
    };
  } catch (error) {
    console.error("[WEBHOOK] Error getting consultation details:", error);
    throw error;
  }
}

/**
 * Update consultation payment status
 */
async function updateConsultationPaymentStatus(
  consultationId: string,
  status: string,
  paymentId: string
): Promise<void> {
  try {
    // TODO: Update database with payment status
    console.log(
      `[WEBHOOK] Consultation ${consultationId} payment status updated to: ${status}`
    );
  } catch (error) {
    console.error("[WEBHOOK] Error updating consultation payment status:", error);
    throw error;
  }
}

/**
 * Transfer funds to specialist
 */
async function transferToSpecialist(
  specialistId: string,
  amount: number,
  consultationId: string,
  paymentId: string
): Promise<void> {
  try {
    // Get specialist PIX key
    const specialist = await getSpecialistDetails(specialistId);
    if (!specialist || !specialist.pixKey) {
      console.error(`[WEBHOOK] Specialist PIX key not found: ${specialistId}`);
      return;
    }

    // Create PIX transfer
    // Create PIX transfer
    const transfer = {
      id: `TRANSFER-${Date.now()}`,
      status: "pending",
    } as any;
    // TODO: Implement actual PIX transfer
    /*
    const transfer = await mercadoPagoService.createPixTransfer({
      amount,
      pixKey: specialist.pixKey,
      description: `Consultation payment - ${consultationId}`,
      externalReference: paymentId,
    });
    */

    console.log(`[WEBHOOK] PIX transfer created: ${transfer.id} - Amount: R$ ${amount}`);

    // Record transfer
    await recordSpecialistTransfer(specialistId, amount, consultationId, transfer.id);
  } catch (error) {
    console.error("[WEBHOOK] Error transferring to specialist:", error);
    // Notify admin of transfer failure
    await notifyOwner({
      title: "PIX Transfer Failed",
      content: `Failed to transfer R$ ${amount} to specialist ${specialistId}. Consultation: ${consultationId}`,
    });
  }
}

/**
 * Reverse specialist transfer
 */
async function reverseSpecialistTransfer(
  specialistId: string,
  amount: number,
  consultationId: string,
  paymentId: string
): Promise<void> {
  try {
    console.log(
      `[WEBHOOK] Reversing transfer to specialist: ${specialistId} - Amount: R$ ${amount}`
    );

    // TODO: Implement refund logic (may require manual processing)
    // For now, just log the reversal
    await recordSpecialistTransferReversal(specialistId, amount, consultationId, paymentId);
  } catch (error) {
    console.error("[WEBHOOK] Error reversing specialist transfer:", error);
    throw error;
  }
}

/**
 * Get specialist details
 */
async function getSpecialistDetails(specialistId: string): Promise<any> {
  try {
    // TODO: Query database for specialist details
    return {
      id: specialistId,
      name: "Dr. João Silva",
      pixKey: "joao@email.com",
    };
  } catch (error) {
    console.error("[WEBHOOK] Error getting specialist details:", error);
    throw error;
  }
}

/**
 * Record specialist transfer
 */
async function recordSpecialistTransfer(
  specialistId: string,
  amount: number,
  consultationId: string,
  transferId: string
): Promise<void> {
  try {
    // TODO: Save transfer record to database
    console.log(
      `[WEBHOOK] Specialist transfer recorded: ${transferId} - Specialist: ${specialistId}, Amount: R$ ${amount}`
    );
  } catch (error) {
    console.error("[WEBHOOK] Error recording specialist transfer:", error);
    throw error;
  }
}

/**
 * Record specialist transfer reversal
 */
async function recordSpecialistTransferReversal(
  specialistId: string,
  amount: number,
  consultationId: string,
  paymentId: string
): Promise<void> {
  try {
    // TODO: Save reversal record to database
    console.log(
      `[WEBHOOK] Specialist transfer reversal recorded: Specialist: ${specialistId}, Amount: R$ ${amount}`
    );
  } catch (error) {
    console.error("[WEBHOOK] Error recording specialist transfer reversal:", error);
    throw error;
  }
}

/**
 * Notify specialist of payment
 */
async function notifySpecialist(
  specialistId: string,
  consultationId: string,
  amount: number
): Promise<void> {
  try {
    // TODO: Send notification to specialist
    console.log(
      `[WEBHOOK] Specialist notified: ${specialistId} - Consultation: ${consultationId}, Amount: R$ ${amount}`
    );
  } catch (error) {
    console.error("[WEBHOOK] Error notifying specialist:", error);
  }
}

/**
 * Notify patient of payment status
 */
async function notifyPatient(
  patientId: string,
  consultationId: string,
  status: string
): Promise<void> {
  try {
    // TODO: Send notification to patient
    console.log(
      `[WEBHOOK] Patient notified: ${patientId} - Consultation: ${consultationId}, Status: ${status}`
    );
  } catch (error) {
    console.error("[WEBHOOK] Error notifying patient:", error);
  }
}

export default handleMercadoPagoWebhook;
