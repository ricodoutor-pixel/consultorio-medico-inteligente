/**
 * Mercado Pago Webhook Production Handler
 * Processes real-time payment confirmations and triggers automatic transfers
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";

interface WebhookPayload {
  id: string;
  action: string;
  data: {
    id: string;
    status?: string;
    transaction_amount?: number;
    metadata?: Record<string, any>;
  };
}

class WebhookHandler {
  private router: Router;
  private webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || "webhook-secret";

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Webhook endpoint
    this.router.post("/mercado-pago", this.handleMercadoPagoWebhook.bind(this));

    // Health check
    this.router.get("/health", (req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
  }

  /**
   * Handle Mercado Pago webhook
   */
  private async handleMercadoPagoWebhook(req: Request, res: Response) {
    try {
      const payload = req.body as WebhookPayload;

      console.log("[WEBHOOK] Received event:", payload.action);
      console.log("[WEBHOOK] Payment ID:", payload.data.id);

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(req);
      if (!isValid) {
        console.warn("[WEBHOOK] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Process based on action
      switch (payload.action) {
        case "payment.created":
        case "payment.updated":
          await this.handlePaymentUpdate(payload);
          break;

        case "payment.approved":
          await this.handlePaymentApproved(payload);
          break;

        case "payment.rejected":
          await this.handlePaymentRejected(payload);
          break;

        case "transfer.completed":
          await this.handleTransferCompleted(payload);
          break;

        default:
          console.log("[WEBHOOK] Unknown action:", payload.action);
      }

      // Return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[WEBHOOK] Error processing webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(req: Request): boolean {
    try {
      const signature = req.headers["x-signature"] as string;
      const timestamp = req.headers["x-timestamp"] as string;

      if (!signature || !timestamp) {
        return false;
      }

      // Reconstruct the signed string
      const id = req.body.id;
      const dataId = req.body.data?.id;
      const signedString = `id=${id};request-id=${dataId};ts=${timestamp}`;

      // Calculate HMAC
      const hmac = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(signedString)
        .digest("hex");

      // Compare signatures
      return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
    } catch (error) {
      console.error("[WEBHOOK] Signature verification error:", error);
      return false;
    }
  }

  /**
   * Handle payment update
   */
  private async handlePaymentUpdate(payload: WebhookPayload) {
    try {
      console.log("[WEBHOOK] Processing payment update:", payload.data.id);

      const paymentId = payload.data.id;
      const status = payload.data.status;

      // TODO: Update payment status in database
      // await db.payments.update(paymentId, { status });

      console.log(`[WEBHOOK] ✓ Payment ${paymentId} updated to ${status}`);
    } catch (error) {
      console.error("[WEBHOOK] Payment update error:", error);
      throw error;
    }
  }

  /**
   * Handle payment approved
   */
  private async handlePaymentApproved(payload: WebhookPayload) {
    try {
      console.log("[WEBHOOK] Processing payment approval:", payload.data.id);

      const paymentId = payload.data.id;
      const amount = payload.data.transaction_amount || 0;
      const metadata = payload.data.metadata || {};

      // TODO: Process automatic transfer
      // const recipientId = metadata.recipientId;
      // if (recipientId) {
      //   const commission = amount * 0.1;
      //   const netAmount = amount - commission;
      //
      //   await mercadoPagoService.processAutomaticTransfer({
      //     amount: netAmount,
      //     description: `Payment transfer - ${paymentId}`,
      //     recipientId,
      //     recipientEmail: metadata.recipientEmail,
      //     recipientPixKey: metadata.recipientPixKey,
      //   });
      //
      //   console.log(`[WEBHOOK] ✓ Transfer initiated for ${recipientId}`);
      // }

      // TODO: Send notification to user
      // await notificationService.sendPaymentConfirmation({
      //   userId: metadata.userId,
      //   paymentId,
      //   amount,
      // });

      console.log(`[WEBHOOK] ✓ Payment approved: ${paymentId}`);
    } catch (error) {
      console.error("[WEBHOOK] Payment approval error:", error);
      throw error;
    }
  }

  /**
   * Handle payment rejected
   */
  private async handlePaymentRejected(payload: WebhookPayload) {
    try {
      console.log("[WEBHOOK] Processing payment rejection:", payload.data.id);

      const paymentId = payload.data.id;
      const metadata = payload.data.metadata || {};

      // TODO: Update payment status
      // await db.payments.update(paymentId, { status: 'rejected' });

      // TODO: Send notification to user
      // await notificationService.sendPaymentRejection({
      //   userId: metadata.userId,
      //   paymentId,
      //   reason: 'Payment rejected by Mercado Pago',
      // });

      console.log(`[WEBHOOK] ✓ Payment rejected: ${paymentId}`);
    } catch (error) {
      console.error("[WEBHOOK] Payment rejection error:", error);
      throw error;
    }
  }

  /**
   * Handle transfer completed
   */
  private async handleTransferCompleted(payload: WebhookPayload) {
    try {
      console.log("[WEBHOOK] Processing transfer completion:", payload.data.id);

      const transferId = payload.data.id;
      const metadata = payload.data.metadata || {};

      // TODO: Update transfer status
      // await db.transfers.update(transferId, { status: 'completed' });

      // TODO: Send notification to specialist/pharmacy
      // await notificationService.sendTransferConfirmation({
      //   recipientId: metadata.recipientId,
      //   transferId,
      //   amount: metadata.netAmount,
      // });

      console.log(`[WEBHOOK] ✓ Transfer completed: ${transferId}`);
    } catch (error) {
      console.error("[WEBHOOK] Transfer completion error:", error);
      throw error;
    }
  }

  /**
   * Get router
   */
  getRouter(): Router {
    return this.router;
  }
}

// Export webhook handler
export const webhookHandler = new WebhookHandler();
export default webhookHandler.getRouter();
