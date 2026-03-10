import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

/**
 * Mercado Pago Webhook Handler
 * Confirms PIX payments and triggers automatic commission distribution
 */

// Webhook signature verification
const verifyMercadoPagoSignature = (req: Request): boolean => {
  const signature = req.headers["x-signature"] as string;
  const timestamp = req.headers["x-timestamp"] as string;
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || "";

  if (!signature || !timestamp) return false;

  const data = `${timestamp}.${JSON.stringify(req.body)}`;
  const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");

  return hash === signature;
};

/**
 * POST /webhooks/mercado-pago
 * Receives payment notifications from Mercado Pago
 */
router.post("/mercado-pago", async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    if (!verifyMercadoPagoSignature(req)) {
      console.error("Invalid Mercado Pago webhook signature");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { action, data } = req.body;

    // Handle payment.completed event
    if (action === "payment.completed") {
      const paymentId = data.id;
      const externalReference = data.external_reference; // Our consultation ID

      console.log(`[PIX] Payment confirmed: ${paymentId} - Consultation: ${externalReference}`);

      // TODO: Implement in production
      // 1. Query database for consultation record
      // 2. Update consultation status to "PAYMENT_CONFIRMED"
      // 3. Calculate commission (10% for platform)
      // 4. Trigger automatic PIX transfer to specialist
      // 5. Send notification to specialist
      // 6. Send notification to patient
      // 7. Trigger automatic interview IA

      return res.json({ success: true, message: "Payment processed" });
    }

    // Handle payment.failed event
    if (action === "payment.failed") {
      const paymentId = data.id;
      const externalReference = data.external_reference;

      console.log(`[PIX] Payment failed: ${paymentId} - Consultation: ${externalReference}`);

      // TODO: Implement in production
      // 1. Update consultation status to "PAYMENT_FAILED"
      // 2. Send notification to patient with retry option
      // 3. Release specialist slot

      return res.json({ success: true, message: "Payment failure processed" });
    }

    // Handle payment.refunded event
    if (action === "payment.refunded") {
      const paymentId = data.id;
      const externalReference = data.external_reference;

      console.log(`[PIX] Payment refunded: ${paymentId} - Consultation: ${externalReference}`);

      // TODO: Implement in production
      // 1. Update consultation status to "REFUNDED"
      // 2. Reverse commission transfer
      // 3. Send notification to specialist
      // 4. Send notification to patient

      return res.json({ success: true, message: "Refund processed" });
    }

    return res.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Automatic PIX Transfer to Specialist
 * Triggered after payment confirmation
 */
export const transferToSpecialist = async (specialistId: string, amount: number, reason: string) => {
  try {
    // TODO: Implement in production
    // 1. Query specialist PIX key from database
    // 2. Use Mercado Pago Transfer API to send PIX
    // 3. Log transaction
    // 4. Send confirmation email to specialist

    console.log(`[PIX TRANSFER] Transferring R$ ${amount} to specialist ${specialistId} - Reason: ${reason}`);

    return {
      success: true,
      transferId: `TRF-${Date.now()}`,
      amount,
      specialist: specialistId,
      status: "PENDING",
    };
  } catch (error) {
    console.error("Transfer error:", error);
    throw error;
  }
};

/**
 * Calculate Commission
 * Platform takes 10%, specialist receives 90%
 */
export const calculateCommission = (consultationPrice: number) => {
  const platformCommission = consultationPrice * 0.1;
  const specialistAmount = consultationPrice - platformCommission;

  return {
    consultationPrice,
    platformCommission,
    specialistAmount,
    platformPercentage: 10,
    specialistPercentage: 90,
  };
};

/**
 * Batch PIX Transfers
 * Daily settlement for multiple consultations
 */
export const batchTransferSpecialists = async (specialists: any[]) => {
  try {
    const transfers = [];

    for (const specialist of specialists) {
      const { id, totalAmount, consultations } = specialist;

      const transfer = await transferToSpecialist(id, totalAmount, `Settlement for ${consultations} consultations`);
      transfers.push(transfer);
    }

    console.log(`[BATCH TRANSFER] Processed ${transfers.length} transfers`);
    return transfers;
  } catch (error) {
    console.error("Batch transfer error:", error);
    throw error;
  }
};

export default router;
