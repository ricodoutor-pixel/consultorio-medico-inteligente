import nodemailer from "nodemailer";

/**
 * Notification Service
 * Handles push notifications, email alerts, and SMS
 */

interface NotificationPayload {
  userId: string;
  type: "consultation" | "payment" | "referral" | "receipt" | "alert";
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: ("push" | "email" | "sms")[];
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send notification via multiple channels
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const channels = payload.channels || ["push", "email"];

      if (channels.includes("push")) {
        await this.sendPushNotification(payload);
      }

      if (channels.includes("email")) {
        await this.sendEmailNotification(payload);
      }

      if (channels.includes("sms")) {
        await this.sendSMSNotification(payload);
      }

      console.log(`[NOTIFICATION] Sent to user ${payload.userId}: ${payload.type}`);
      return true;
    } catch (error) {
      console.error("Notification error:", error);
      return false;
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(payload: NotificationPayload): Promise<void> {
    // TODO: Implement push notification service (Firebase Cloud Messaging, OneSignal, etc)
    console.log(`[PUSH] ${payload.title}: ${payload.message}`);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(payload: NotificationPayload): Promise<void> {
    try {
      // TODO: Get user email from database
      const userEmail = "user@example.com";

      const template = this.getEmailTemplate(payload.type, payload.data);

      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[EMAIL] Sent to ${userEmail}: ${payload.type}`);
    } catch (error) {
      console.error("Email notification error:", error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(payload: NotificationPayload): Promise<void> {
    // TODO: Implement SMS service (Evolution API)
    console.log(`[SMS] ${payload.title}: ${payload.message}`);
  }

  /**
   * Get email template based on notification type
   */
  private getEmailTemplate(type: string, data?: Record<string, any>): EmailTemplate {
    switch (type) {
      case "consultation":
        return {
          subject: "🎯 Sua Consulta foi Agendada!",
          html: `
            <h2>Consulta Confirmada</h2>
            <p>Olá ${data?.patientName},</p>
            <p>Sua consulta com <strong>${data?.specialistName}</strong> foi confirmada!</p>
            <p><strong>Data:</strong> ${data?.date}</p>
            <p><strong>Horário:</strong> ${data?.time}</p>
            <p><strong>Tipo:</strong> ${data?.type === "video" ? "📹 Vídeo" : "💬 Chat"}</p>
            <p><a href="${data?.consultationLink}">Acessar Consulta</a></p>
          `,
          text: `Sua consulta foi confirmada com ${data?.specialistName} em ${data?.date} às ${data?.time}`,
        };

      case "payment":
        return {
          subject: "✅ Pagamento Confirmado",
          html: `
            <h2>Pagamento Recebido</h2>
            <p>Olá ${data?.userName},</p>
            <p>Seu pagamento de <strong>R$ ${data?.amount}</strong> foi confirmado com sucesso!</p>
            <p><strong>ID da Transação:</strong> ${data?.transactionId}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
            <p>Sua consulta será iniciada em breve.</p>
          `,
          text: `Pagamento de R$ ${data?.amount} confirmado. ID: ${data?.transactionId}`,
        };

      case "referral":
        return {
          subject: "🎉 Você Ganhou uma Indicação Premiada!",
          html: `
            <h2>Nova Indicação Confirmada</h2>
            <p>Parabéns ${data?.referrerName}!</p>
            <p>Você ganhou uma comissão de <strong>R$ ${data?.commission}</strong> por indicar ${data?.referredName}!</p>
            <p><strong>Total de Indicações:</strong> ${data?.totalReferrals}</p>
            <p><strong>Ganhos Totais:</strong> R$ ${data?.totalEarnings}</p>
            <p><a href="${data?.leaderboardLink}">Ver Leaderboard</a></p>
          `,
          text: `Você ganhou R$ ${data?.commission} por uma indicação. Total: R$ ${data?.totalEarnings}`,
        };

      case "receipt":
        return {
          subject: "📋 Sua Receita Digital",
          html: `
            <h2>Receita Médica Digital</h2>
            <p>Olá ${data?.patientName},</p>
            <p>Sua receita foi emitida pelo Dr. ${data?.doctorName}</p>
            <p><strong>Medicamentos Prescritos:</strong></p>
            <ul>
              ${data?.medications?.map((m: any) => `<li>${m.name} - ${m.dosage}</li>`).join("")}
            </ul>
            <p><a href="${data?.receiptLink}">Baixar Receita (PDF)</a></p>
            <p>Você pode comprar os medicamentos em qualquer farmácia autorizada.</p>
          `,
          text: `Sua receita foi emitida. Medicamentos: ${data?.medications?.map((m: any) => m.name).join(", ")}`,
        };

      case "alert":
      default:
        return {
          subject: data?.subject || "Notificação da Planta & Raiz",
          html: `<p>${data?.message}</p>`,
          text: data?.message || "Você tem uma nova notificação",
        };
    }
  }

  /**
   * Send consultation reminder
   */
  async sendConsultationReminder(consultationId: string, patientEmail: string, specialistName: string, consultationTime: Date): Promise<void> {
    const timeUntilConsultation = consultationTime.getTime() - Date.now();
    const minutesUntil = Math.floor(timeUntilConsultation / (1000 * 60));

    if (minutesUntil > 0 && minutesUntil <= 15) {
      await this.sendNotification({
        userId: consultationId,
        type: "consultation",
        title: "🔔 Sua Consulta Começa em Breve!",
        message: `Sua consulta com ${specialistName} começa em ${minutesUntil} minutos`,
        channels: ["push", "email"],
      });
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(userId: string, amount: number, specialistName: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: "payment",
      title: "✅ Pagamento Confirmado",
      message: `Seu pagamento de R$ ${amount} foi confirmado. Consulta com ${specialistName} agendada!`,
      data: { amount, specialistName },
      channels: ["push", "email"],
    });
  }

  /**
   * Send referral bonus notification
   */
  async sendReferralBonus(userId: string, referredName: string, commission: number, totalEarnings: number): Promise<void> {
    await this.sendNotification({
      userId,
      type: "referral",
      title: "🎉 Ganho de Indicação",
      message: `Você ganhou R$ ${commission} por indicar ${referredName}. Total: R$ ${totalEarnings}`,
      data: { referredName, commission, totalEarnings },
      channels: ["push", "email"],
    });
  }

  /**
   * Send receipt notification
   */
  async sendReceiptNotification(userId: string, doctorName: string, medications: any[]): Promise<void> {
    await this.sendNotification({
      userId,
      type: "receipt",
      title: "📋 Sua Receita está Pronta",
      message: `Dr. ${doctorName} emitiu sua receita digital. Clique para visualizar.`,
      data: { doctorName, medications },
      channels: ["push", "email"],
    });
  }

  /**
   * Send specialist alert for new consultation
   */
  async sendSpecialistAlert(specialistId: string, patientName: string, consultationType: "video" | "chat", price: number): Promise<void> {
    await this.sendNotification({
      userId: specialistId,
      type: "alert",
      title: "🔴 Nova Solicitação de Consulta",
      message: `${patientName} solicitou uma consulta via ${consultationType === "video" ? "vídeo" : "chat"} - R$ ${price}`,
      data: { patientName, consultationType, price },
      channels: ["push", "email"],
    });
  }

  /**
   * Send pharmacy alert for new order
   */
  async sendPharmacyAlert(pharmacyId: string, orderValue: number, itemCount: number): Promise<void> {
    await this.sendNotification({
      userId: pharmacyId,
      type: "alert",
      title: "📦 Novo Pedido Recebido",
      message: `Você recebeu um pedido de R$ ${orderValue} com ${itemCount} item(ns)`,
      data: { orderValue, itemCount },
      channels: ["push", "email"],
    });
  }
}

export default new NotificationService();
