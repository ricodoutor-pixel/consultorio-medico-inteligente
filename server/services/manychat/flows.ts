import { ManyChatClient } from './client';
import type { LeadQualification } from './types';

// Tag IDs - configure in ManyChat dashboard
const TAGS = {
  LEAD_MEDICO: 1001,
  LEAD_PACIENTE: 1002,
  LEAD_CURIOSO: 1003,
  FAST_TRACK: 1004,
  EBOOK_DOWNLOADED: 1005,
  CADASTRO_COMPLETO: 1006,
  NPS_PROMOTER: 1007,
  NPS_DETRACTOR: 1008,
  VIP: 1009,
  REATIVACAO: 1010,
} as const;

// Flow namespaces - configure in ManyChat dashboard
const FLOWS = {
  WELCOME_DOCTOR: 'content20250410_welcome_doctor',
  WELCOME_PATIENT: 'content20250410_welcome_patient',
  FUNNEL_RECOVERY: 'content20250410_funnel_recovery',
  NPS_REQUEST: 'content20250410_nps_request',
  SOCIAL_PROOF: 'content20250410_social_proof',
  VIP_UPGRADE: 'content20250410_vip_upgrade',
  REACTIVATION: 'content20250410_reactivation',
  WEEKLY_REPORT: 'content20250410_weekly_report',
  APPOINTMENT_CONFIRM: 'content20250410_appointment_confirm',
  APPOINTMENT_REMINDER: 'content20250410_appointment_reminder',
  PAYMENT_CONFIRMED: 'content20250410_payment_confirmed',
  REFERRAL_BOOST: 'content20250410_referral_boost',
  // Instagram Gamified Welcome Flows
  IG_WELCOME_GAMIFIED: 'content20250413_ig_welcome_gamified',
  IG_QUIZ_CANNABIS: 'content20250413_ig_quiz_cannabis',
  IG_REWARD_COUPON: 'content20250413_ig_reward_coupon',
  IG_STORY_REPLY_HOOK: 'content20250413_ig_story_reply_hook',
  IG_DM_ONBOARDING: 'content20250413_ig_dm_onboarding',
  IG_PROTOCOLO_ANVISA: 'content20250413_ig_protocolo_anvisa',
} as const;

export class ManyChatFlows {
  constructor(private client: ManyChatClient) {}

  /** Qualify a lead as doctor/patient/curious */
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

  /** Recover abandoned funnel (ebook downloaded but no signup in 24h) */
  async triggerFunnelRecovery(subscriberId: string, doctorName: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `Dr. ${doctorName}, notei que você iniciou sua jornada mas não garantiu sua Taxa Zero. Ficou alguma dúvida sobre o bônus de 10%?`
    );
    await this.client.sendContent(subscriberId, FLOWS.FUNNEL_RECOVERY);
  }

  /** Request NPS after consultation */
  async requestNPS(subscriberId: string, consultationId: string): Promise<void> {
    await this.client.setCustomField(subscriberId, 2001, consultationId);
    await this.client.sendContent(subscriberId, FLOWS.NPS_REQUEST);
  }

  /** Handle NPS promoter - request social proof */
  async requestSocialProof(subscriberId: string): Promise<void> {
    await this.client.addTag(subscriberId, TAGS.NPS_PROMOTER);
    await this.client.sendContent(subscriberId, FLOWS.SOCIAL_PROOF);
  }

  /** Trigger VIP upgrade offer */
  async triggerVIPUpgrade(subscriberId: string, revenue: number, savings: number): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `🏆 Você faturou R$ ${revenue.toFixed(2)}! Se fosse VIP, teria economizado R$ ${savings.toFixed(2)}. Mude para Taxa Zero agora!`
    );
    await this.client.sendContent(subscriberId, FLOWS.VIP_UPGRADE);
  }

  /** Reactivate inactive patient */
  async reactivatePatient(subscriberId: string, patientName: string): Promise<void> {
    await this.client.addTag(subscriberId, TAGS.REATIVACAO);
    await this.client.sendMessage(
      subscriberId,
      `Olá ${patientName}! 🌿 Faz tempo que não nos vemos. Como está seu tratamento? Temos um cupom especial para sua próxima teleconsulta!`
    );
    await this.client.sendContent(subscriberId, FLOWS.REACTIVATION);
  }

  /** Appointment confirmation */
  async confirmAppointment(subscriberId: string, doctorName: string, dateTime: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `✅ Consulta confirmada com ${doctorName} em ${dateTime}. Você receberá o link 30 min antes.`
    );
    await this.client.sendContent(subscriberId, FLOWS.APPOINTMENT_CONFIRM);
  }

  /** Appointment reminder */
  async remindAppointment(subscriberId: string, minutesBefore: number): Promise<void> {
    await this.client.sendContent(subscriberId, FLOWS.APPOINTMENT_REMINDER);
  }

  /** Payment confirmed notification */
  async notifyPaymentConfirmed(subscriberId: string, amount: number): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `💚 Pagamento de R$ ${amount.toFixed(2)} confirmado! Sua consulta está garantida.`
    );
    await this.client.sendContent(subscriberId, FLOWS.PAYMENT_CONFIRMED);
  }

  /** Referral boost notification */
  async notifyReferralBoost(subscriberId: string, referredName: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `🎉 ${referredName} se cadastrou com seu link! Seu bônus de 10% recebeu um boost temporário!`
    );
    await this.client.sendContent(subscriberId, FLOWS.REFERRAL_BOOST);
  }

  // ── Instagram Gamified Welcome ──

  /** Trigger gamified welcome for new Instagram follower/DM */
  async triggerInstagramWelcome(subscriberId: string, userName: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `🌿 Olá ${userName}! Bem-vindo(a) à Planta & Raiz! 🎮\n\nQuer descobrir qual tratamento natural combina com você? Responda "QUIZ" e ganhe um cupom exclusivo! 🎁`
    );
    await this.client.sendContent(subscriberId, FLOWS.IG_WELCOME_GAMIFIED);
    await this.client.addTag(subscriberId, TAGS.LEAD_CURIOSO);
  }

  /** Instagram quiz flow - cannabis knowledge */
  async triggerInstagramQuiz(subscriberId: string): Promise<void> {
    await this.client.sendContent(subscriberId, FLOWS.IG_QUIZ_CANNABIS);
  }

  /** Reward coupon after quiz completion */
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

  /** Story reply hook - auto-engage story repliers */
  async handleStoryReply(subscriberId: string, storyKeyword: string): Promise<void> {
    await this.client.sendMessage(
      subscriberId,
      `💚 Que bom que você se interessou! Vou te mostrar como a cannabis medicinal pode te ajudar. Responda "QUERO" para começar!`
    );
    await this.client.sendContent(subscriberId, FLOWS.IG_STORY_REPLY_HOOK);
    await this.client.addTag(subscriberId, TAGS.LEAD_PACIENTE);
  }

  /** Full Instagram DM onboarding sequence */
  async startInstagramOnboarding(subscriberId: string, source: 'dm' | 'story' | 'comment' | 'ad'): Promise<void> {
    await this.client.setCustomField(subscriberId, 2002, source);
    await this.client.sendContent(subscriberId, FLOWS.IG_DM_ONBOARDING);
  }

  /** Keyword "PROTOCOLO" — explica legalidade ANVISA e geração automática do código ANV- */
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

export { TAGS, FLOWS };
