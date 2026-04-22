import { ManyChatClient } from './client';
import { TAGS, FLOWS, CUSTOM_FIELDS } from './constants';
import { B2BRecruitmentFlows } from './b2b-recruitment';
import { EnfBrisaProFlows } from './enf-brisa-pro';
import type { LeadQualification } from './types';

export class ManyChatFlows {
  public b2b: B2BRecruitmentFlows;
  public brisa: EnfBrisaProFlows;

  constructor(private client: ManyChatClient) {
    this.b2b = new B2BRecruitmentFlows(client);
    this.brisa = new EnfBrisaProFlows(client);
  }

  // ── Lead Qualification ──

  async qualifyLead(subscriberId: string, info: { crm?: string; userType?: string }): Promise<LeadQualification> {
    let qualification: LeadQualification;

    if (info.crm && info.crm.match(/^\d{4,7}$/)) {
      qualification = { type: 'doctor', crm: info.crm, fastTrack: true, tags: ['medico', 'fast_track'] };
      await this.client.addTag(subscriberId, TAGS.LEAD_MEDICO);
      await this.client.addTag(subscriberId, TAGS.FAST_TRACK);
      await this.client.sendContent(subscriberId, FLOWS.WELCOME_DOCTOR);
    } else if (info.userType === 'patient') {
      qualification = { type: 'patient', fastTrack: false, tags: ['paciente'] };
      await this.client.addTag(subscriberId, TAGS.LEAD_PACIENTE);
      await this.client.sendContent(subscriberId, FLOWS.WELCOME_PATIENT);
    } else {
      qualification = { type: 'curious', fastTrack: false, tags: ['curioso'] };
      await this.client.addTag(subscriberId, TAGS.LEAD_CURIOSO);
    }

    return qualification;
  }

  // ── Funnel & Retention ──

  async triggerFunnelRecovery(subscriberId: string, doctorName: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `Dr. ${doctorName}, notei que você iniciou sua jornada mas não garantiu sua Taxa Zero. Ficou alguma dúvida sobre o bônus de 10%?`
    );
    await this.client.sendContent(subscriberId, FLOWS.FUNNEL_RECOVERY);
  }

  async requestNPS(subscriberId: string, consultationId: string): Promise<void> {
    await this.client.setCustomField(subscriberId, CUSTOM_FIELDS.CONSULTATION_ID, consultationId);
    await this.client.sendContent(subscriberId, FLOWS.NPS_REQUEST);
  }

  async requestSocialProof(subscriberId: string): Promise<void> {
    await this.client.addTag(subscriberId, TAGS.NPS_PROMOTER);
    await this.client.sendContent(subscriberId, FLOWS.SOCIAL_PROOF);
  }

  async triggerVIPUpgrade(subscriberId: string, revenue: number, savings: number): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `🏆 Você faturou R$ ${revenue.toFixed(2)}! Se fosse VIP, teria economizado R$ ${savings.toFixed(2)}. Mude para Taxa Zero agora!`
    );
    await this.client.sendContent(subscriberId, FLOWS.VIP_UPGRADE);
  }

  async reactivatePatient(subscriberId: string, patientName: string): Promise<void> {
    await this.client.addTag(subscriberId, TAGS.REATIVACAO);
    await this.client.sendMessage(
      subscriberId,
      `Olá ${patientName}! 🌿 Faz tempo que não nos vemos. Como está seu tratamento? Temos um cupom especial para sua próxima teleconsulta!`
    );
    await this.client.sendContent(subscriberId, FLOWS.REACTIVATION);
  }

  // ── Appointments & Payments ──

  async confirmAppointment(subscriberId: string, doctorName: string, dateTime: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `✅ Consulta confirmada com ${doctorName} em ${dateTime}. Você receberá o link 30 min antes.`
    );
    await this.client.sendContent(subscriberId, FLOWS.APPOINTMENT_CONFIRM);
  }

  async remindAppointment(subscriberId: string, _minutesBefore: number): Promise<void> {
    await this.client.sendContent(subscriberId, FLOWS.APPOINTMENT_REMINDER);
  }

  async notifyPaymentConfirmed(subscriberId: string, amount: number): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `💚 Pagamento de R$ ${amount.toFixed(2)} confirmado! Sua consulta está garantida.`
    );
    await this.client.sendContent(subscriberId, FLOWS.PAYMENT_CONFIRMED);
  }

  async notifyReferralBoost(subscriberId: string, referredName: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `🎉 ${referredName} se cadastrou com seu link! Seu bônus de 10% recebeu um boost temporário!`
    );
    await this.client.sendContent(subscriberId, FLOWS.REFERRAL_BOOST);
  }

  // ── Instagram Gamified ──

  async triggerInstagramWelcome(subscriberId: string, userName: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `🌿 Olá ${userName}! Bem-vindo(a) à Planta & Raiz! 🎮\n\nQuer descobrir qual tratamento natural combina com você? Responda "QUIZ" e ganhe um cupom exclusivo! 🎁`
    );
    await this.client.sendContent(subscriberId, FLOWS.IG_WELCOME_GAMIFIED);
    await this.client.addTag(subscriberId, TAGS.LEAD_CURIOSO);
  }

  async triggerInstagramQuiz(subscriberId: string): Promise<void> {
    await this.client.sendContent(subscriberId, FLOWS.IG_QUIZ_CANNABIS);
  }

  async sendInstagramReward(subscriberId: string, score: number): Promise<void> {
    const coupon = score >= 3 ? 'CANNAEXPERT20' : 'BEMVINDO10';
    const discount = score >= 3 ? '20%' : '10%';
    await this.client.sendMessage(
      subscriberId,
      `🏆 Parabéns! Você acertou ${score}/5!\n\n🎁 Seu cupom exclusivo: ${coupon}\n💚 ${discount} OFF na primeira teleconsulta!\n\n👉 Agende agora: plantayraiz.com.br/agendamento`
    );
    await this.client.sendContent(subscriberId, FLOWS.IG_REWARD_COUPON);
    if (score >= 3) {
      await this.client.addTag(subscriberId, TAGS.VIP);
    }
  }

  async handleStoryReply(subscriberId: string, _storyKeyword: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `💚 Que bom que você se interessou! Vou te mostrar como a cannabis medicinal pode te ajudar. Responda "QUERO" para começar!`
    );
    await this.client.sendContent(subscriberId, FLOWS.IG_STORY_REPLY_HOOK);
    await this.client.addTag(subscriberId, TAGS.LEAD_PACIENTE);
  }

  async startInstagramOnboarding(subscriberId: string, source: 'dm' | 'story' | 'comment' | 'ad'): Promise<void> {
    await this.client.setCustomField(subscriberId, CUSTOM_FIELDS.IG_SOURCE, source);
    await this.client.sendContent(subscriberId, FLOWS.IG_DM_ONBOARDING);
  }

  async handleProtocoloKeyword(subscriberId: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `🏛️ *Tudo 100% Legal e Regulamentado!*\n\n` +
      `A cannabis medicinal é autorizada pela ANVISA (RDC 660/2022). ` +
      `Na Planta & Raiz, o processo é simples:\n\n` +
      `1️⃣ Você faz a teleconsulta com um médico prescritor\n` +
      `2️⃣ O médico emite a receita digital com assinatura ICP-Brasil\n` +
      `3️⃣ No ato do pagamento, nosso sistema gera automaticamente o protocolo *ANV-XXXXXX* da ANVISA\n` +
      `4️⃣ Você recebe tudo no seu e-mail e WhatsApp\n\n` +
      `💚 Zero burocracia. Zero risco. Tudo rastreável.\n\n` +
      `👉 Quer agendar sua consulta agora? Responda "AGENDAR"!`
    );
    await this.client.sendContent(subscriberId, FLOWS.IG_PROTOCOLO_ANVISA);
    await this.client.addTag(subscriberId, TAGS.LEAD_PACIENTE);
  }
}

export { TAGS, FLOWS } from './constants';
