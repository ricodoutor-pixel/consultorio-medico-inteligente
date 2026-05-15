import { ManyChatClient } from './client';
import { TAGS, FLOWS, CUSTOM_FIELDS, EBOOK_PDF_URL, SIGNUP_BASE_URL, CONSULTATION_PRICE, DOCTOR_SPLIT } from './constants';

export class B2BRecruitmentFlows {
  constructor(private client: ManyChatClient) {}

  /**
   * 1. Send medical e-book — only if subscriber has LEAD_MEDICO tag
   */
  async sendMedicalEbook(subscriberId: string): Promise<{ sent: boolean; reason?: string }> {
    const subscriber = await this.client.getSubscriberById(subscriberId);
    if (!subscriber) {
      return { sent: false, reason: 'Subscriber not found' };
    }

    const hasMedicoTag = subscriber.tags?.some(t => t.id === TAGS.LEAD_MEDICO);
    if (!hasMedicoTag) {
      return { sent: false, reason: 'Subscriber does not have LEAD_MEDICO tag' };
    }

    await this.client.addTag(subscriberId, TAGS.EBOOK_DOWNLOADED);
    await this.client.sendMessage(
      subscriberId,
      `📚 Aqui está seu E-book exclusivo de Medicina Canabinoide!\n\n` +
      `📥 Baixe agora: ${EBOOK_PDF_URL}\n\n` +
      `Este material é restrito a profissionais de saúde. ` +
      `Após a leitura, responda "QUERO SABER MAIS" para conhecer nossa plataforma de teleconsulta.`
    );
    await this.client.sendContent(subscriberId, FLOWS.MEDICAL_EBOOK_DELIVERY);

    return { sent: true };
  }

  /**
   * 2. Handle "QUERO SABER MAIS" keyword — apply recruitment tag and log in Supabase
   */
  async handleQueroSaberMais(subscriberId: string): Promise<void> {
    await this.client.addTag(subscriberId, TAGS.RECRUTAMENTO_MEDICO);
    await this.client.sendMessage(
      subscriberId,
      `🎯 Ótimo! Vou te apresentar a plataforma que está revolucionando a Cannabis Medicinal no Brasil.\n\n` +
      `Responda "COMEÇAR" para iniciar seu onboarding como médico parceiro!`
    );
    await this.client.sendContent(subscriberId, FLOWS.MEDICAL_ONBOARDING);
  }

  /**
   * 3. Start medical onboarding — qualification chatbot
   */
  async startMedicalOnboarding(
    subscriberId: string,
    answers: { specialty?: string; cbdExperience?: boolean; weeklyHours?: number }
  ): Promise<{ hotLead: boolean; estimatedEarnings?: number; signupLink: string }> {
    const signupLink = `${SIGNUP_BASE_URL}?source=ebook_campaign&ref=${subscriberId}`;

    // Store specialty
    if (answers.specialty) {
      await this.client.setCustomField(subscriberId, CUSTOM_FIELDS.SPECIALTY, answers.specialty);
    }

    // Store CBD experience
    if (answers.cbdExperience !== undefined) {
      await this.client.setCustomField(subscriberId, CUSTOM_FIELDS.CBD_EXPERIENCE, answers.cbdExperience ? 'sim' : 'nao');
    }

    const isHotLead = answers.cbdExperience === true;

    // Hot lead alert — doctor already has CBD experience
    if (isHotLead) {
      await this.client.addTag(subscriberId, TAGS.FAST_TRACK);
      await this.triggerHotLeadAlert(subscriberId, answers.specialty || 'Não informada');
    }

    // Earnings simulation
    let estimatedEarnings: number | undefined;
    if (answers.weeklyHours && answers.weeklyHours > 0) {
      await this.client.setCustomField(subscriberId, CUSTOM_FIELDS.WEEKLY_HOURS, String(answers.weeklyHours));
      estimatedEarnings = this.calculateEarnings(answers.weeklyHours);

      await this.client.sendMessage(
        subscriberId,
        `💰 *Simulação de Ganhos*\n\n` +
        `Com ${answers.weeklyHours}h semanais, sua estimativa é de:\n\n` +
        `💚 *R$ ${estimatedEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*/mês\n\n` +
        `Isso com nosso split de 92% para o médico (o melhor do mercado!).\n\n` +
        `👉 Cadastre-se agora: ${signupLink}`
      );
    }

    await this.client.sendContent(subscriberId, FLOWS.MEDICAL_EARNINGS_SIM);
    await this.client.setCustomField(subscriberId, CUSTOM_FIELDS.RECRUITMENT_SOURCE, 'ebook_campaign');

    return { hotLead: isHotLead, estimatedEarnings, signupLink };
  }

  /**
   * 4. Trigger hot lead alert to admin WhatsApp via ManyChat webhook
   */
  private async triggerHotLeadAlert(subscriberId: string, specialty: string): Promise<void> {
    const webhookUrl = process.env.MANYCHAT_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[B2B] MANYCHAT_WEBHOOK_URL not configured, skipping hot lead alert');
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'HOT_LEAD_MEDICO',
          title: '🔥 NOVO MÉDICO ESPECIALISTA INTERESSADO',
          subscriber_id: subscriberId,
          specialty,
          source: 'ebook_campaign',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('[B2B] Failed to send hot lead alert:', error);
    }
  }

  /**
   * Earnings calculator: weeklyHours → monthly estimate
   * Formula: hours/week × 4 weeks × 2.5 consultations/hour × avg price × 92%
   */
  private calculateEarnings(weeklyHours: number): number {
    const monthlyHours = weeklyHours * 4;
    const consultationsPerHour = 2.5; // 24-min average consultation
    const totalConsultations = monthlyHours * consultationsPerHour;
    const grossRevenue = totalConsultations * CONSULTATION_PRICE;
    return Math.round(grossRevenue * DOCTOR_SPLIT * 100) / 100;
  }

  /**
   * Generate tracked signup link
   */
  generateSignupLink(subscriberId: string, campaign = 'ebook_campaign'): string {
    return `${SIGNUP_BASE_URL}?source=${campaign}&ref=${subscriberId}`;
  }
}
