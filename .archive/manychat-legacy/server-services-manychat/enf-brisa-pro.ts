import { ManyChatClient } from './client';
import { TAGS, FLOWS, CUSTOM_FIELDS, LINKEDIN_DR_EDILSON, WHATSAPP_SUPPORT } from './constants';

type Language = 'pt' | 'en' | 'es';

const MESSAGES: Record<Language, {
  welcome: string;
  doctorCTA: string;
  patientCTA: string;
  scheduling: string;
  whatsappCTA: string;
}> = {
  pt: {
    welcome:
      `🌿 Olá! Eu sou a *Enf. Brisa*, sua assistente virtual da Planta & Raiz.\n\n` +
      `Estou aqui para te ajudar com:\n` +
      `🩺 Teleconsultas com médicos especialistas\n` +
      `📋 Prescrições de cannabis medicinal\n` +
      `💊 Informações sobre tratamentos\n\n` +
      `Escolha uma opção abaixo para começar! 👇`,
    doctorCTA:
      `🩺 *Para Médicos Prescritores*\n\n` +
      `Junte-se à maior rede de telemedicina canabinoide do Brasil.\n\n` +
      `✅ Split de 92% — o melhor do mercado\n` +
      `✅ Prescrição digital com assinatura ICP-Brasil\n` +
      `✅ Protocolo ANVISA automático\n\n` +
      `👨‍⚕️ Conheça o Dr. Edilson Bezerra, nosso diretor clínico:\n` +
      `🔗 ${LINKEDIN_DR_EDILSON}\n\n` +
      `Responda "QUERO PRESCREVER" para iniciar seu cadastro!`,
    patientCTA:
      `🌱 *Para Pacientes*\n\n` +
      `Agende sua teleconsulta em minutos:\n\n` +
      `1️⃣ Responda nossas perguntas de triagem\n` +
      `2️⃣ Escolha o melhor horário\n` +
      `3️⃣ Receba sua prescrição digital\n\n` +
      `💚 Primeira consulta a partir de R$ 150\n` +
      `🎁 Cupom BEMVINDO10 para 10% OFF\n\n` +
      `Responda "AGENDAR" para começar!`,
    scheduling:
      `📅 Vamos agendar sua consulta!\n\n` +
      `Para falar com um atendente humano ou agendar pelo WhatsApp:\n` +
      `👉 ${WHATSAPP_SUPPORT}\n\n` +
      `Nosso time está disponível 24/7! 💚`,
    whatsappCTA:
      `💬 Prefere falar com uma pessoa? Sem problema!\n\n` +
      `👉 Clique aqui para WhatsApp: ${WHATSAPP_SUPPORT}\n\n` +
      `Atendimento humanizado, 24 horas. 🌿`,
  },
  en: {
    welcome:
      `🌿 Hello! I'm *Nurse Brisa*, your virtual assistant at Planta & Raiz.\n\n` +
      `I'm here to help you with:\n` +
      `🩺 Teleconsultations with specialist doctors\n` +
      `📋 Medical cannabis prescriptions\n` +
      `💊 Treatment information\n\n` +
      `Choose an option below to get started! 👇`,
    doctorCTA:
      `🩺 *For Prescribing Physicians*\n\n` +
      `Join Brazil's largest cannabinoid telemedicine network.\n\n` +
      `✅ 92% revenue split — the best in the market\n` +
      `✅ Digital prescription with ICP-Brasil signature\n` +
      `✅ Automated ANVISA protocol\n\n` +
      `👨‍⚕️ Meet Dr. Edilson Bezerra, our clinical director:\n` +
      `🔗 ${LINKEDIN_DR_EDILSON}\n\n` +
      `Reply "I WANT TO PRESCRIBE" to start your registration!`,
    patientCTA:
      `🌱 *For Patients*\n\n` +
      `Schedule your teleconsultation in minutes:\n\n` +
      `1️⃣ Answer our triage questions\n` +
      `2️⃣ Choose the best time\n` +
      `3️⃣ Receive your digital prescription\n\n` +
      `💚 First consultation starting at R$ 150\n` +
      `🎁 Coupon WELCOME10 for 10% OFF\n\n` +
      `Reply "SCHEDULE" to get started!`,
    scheduling:
      `📅 Let's schedule your consultation!\n\n` +
      `To speak with a human agent or schedule via WhatsApp:\n` +
      `👉 ${WHATSAPP_SUPPORT}\n\n` +
      `Our team is available 24/7! 💚`,
    whatsappCTA:
      `💬 Prefer to talk to a person? No problem!\n\n` +
      `👉 Click here for WhatsApp: ${WHATSAPP_SUPPORT}\n\n` +
      `Humanized support, 24 hours. 🌿`,
  },
  es: {
    welcome:
      `🌿 ¡Hola! Soy la *Enf. Brisa*, tu asistente virtual de Planta & Raiz.\n\n` +
      `Estoy aquí para ayudarte con:\n` +
      `🩺 Teleconsultas con médicos especialistas\n` +
      `📋 Prescripciones de cannabis medicinal\n` +
      `💊 Información sobre tratamientos\n\n` +
      `¡Elige una opción abajo para comenzar! 👇`,
    doctorCTA:
      `🩺 *Para Médicos Prescriptores*\n\n` +
      `Únete a la mayor red de telemedicina cannabinoide de Brasil.\n\n` +
      `✅ Split del 92% — el mejor del mercado\n` +
      `✅ Prescripción digital con firma ICP-Brasil\n` +
      `✅ Protocolo ANVISA automático\n\n` +
      `👨‍⚕️ Conoce al Dr. Edilson Bezerra, nuestro director clínico:\n` +
      `🔗 ${LINKEDIN_DR_EDILSON}\n\n` +
      `¡Responde "QUIERO PRESCRIBIR" para iniciar tu registro!`,
    patientCTA:
      `🌱 *Para Pacientes*\n\n` +
      `Agenda tu teleconsulta en minutos:\n\n` +
      `1️⃣ Responde nuestras preguntas de triaje\n` +
      `2️⃣ Elige el mejor horario\n` +
      `3️⃣ Recibe tu prescripción digital\n\n` +
      `💚 Primera consulta desde R$ 150\n` +
      `🎁 Cupón BIENVENIDO10 para 10% OFF\n\n` +
      `¡Responde "AGENDAR" para comenzar!`,
    scheduling:
      `📅 ¡Vamos a agendar tu consulta!\n\n` +
      `Para hablar con un agente humano o agendar por WhatsApp:\n` +
      `👉 ${WHATSAPP_SUPPORT}\n\n` +
      `¡Nuestro equipo está disponible 24/7! 💚`,
    whatsappCTA:
      `💬 ¿Prefieres hablar con una persona? ¡Sin problema!\n\n` +
      `👉 Haz clic aquí para WhatsApp: ${WHATSAPP_SUPPORT}\n\n` +
      `Atención humanizada, 24 horas. 🌿`,
  },
};

export class EnfBrisaProFlows {
  constructor(private client: ManyChatClient) {}

  /** Detect language from subscriber or default to PT */
  private detectLanguage(langHint?: string): Language {
    if (!langHint) return 'pt';
    const l = langHint.toLowerCase().trim();
    if (l.startsWith('en')) return 'en';
    if (l.startsWith('es')) return 'es';
    return 'pt';
  }

  /** 1. Welcome — trilingual entry point */
  async sendWelcome(subscriberId: string, langHint?: string): Promise<Language> {
    const lang = this.detectLanguage(langHint);
    const msgs = MESSAGES[lang];

    await this.client.sendMessage(subscriberId, msgs.welcome);
    await this.client.sendContent(subscriberId, FLOWS.ENF_BRISA_WELCOME);
    await this.client.addTag(subscriberId, TAGS.LEAD_CURIOSO);

    const flowKey = lang === 'en'
      ? FLOWS.ENF_BRISA_LANG_EN
      : lang === 'es'
        ? FLOWS.ENF_BRISA_LANG_ES
        : FLOWS.ENF_BRISA_LANG_PT;
    await this.client.sendContent(subscriberId, flowKey);

    return lang;
  }

  /** 2. Doctor CTA — LinkedIn + recruitment */
  async sendDoctorCTA(subscriberId: string, langHint?: string): Promise<void> {
    const lang = this.detectLanguage(langHint);
    await this.client.sendMessage(subscriberId, MESSAGES[lang].doctorCTA);
    await this.client.addTag(subscriberId, TAGS.LEAD_MEDICO);
    await this.client.addTag(subscriberId, TAGS.RECRUTAMENTO_MEDICO);
    await this.client.sendContent(subscriberId, FLOWS.ENF_BRISA_MEDICO_CTA);
  }

  /** 3. Patient CTA — triage + coupon */
  async sendPatientCTA(subscriberId: string, langHint?: string): Promise<void> {
    const lang = this.detectLanguage(langHint);
    await this.client.sendMessage(subscriberId, MESSAGES[lang].patientCTA);
    await this.client.addTag(subscriberId, TAGS.LEAD_PACIENTE);
    await this.client.sendContent(subscriberId, FLOWS.ENF_BRISA_PACIENTE_CTA);
  }

  /** 4. Scheduling — redirect to WhatsApp human support */
  async sendScheduling(subscriberId: string, langHint?: string): Promise<void> {
    const lang = this.detectLanguage(langHint);
    await this.client.sendMessage(subscriberId, MESSAGES[lang].scheduling);
    await this.client.sendContent(subscriberId, FLOWS.ENF_BRISA_AGENDAMENTO);
  }

  /** 5. WhatsApp fallback — always available */
  async sendWhatsAppCTA(subscriberId: string, langHint?: string): Promise<void> {
    const lang = this.detectLanguage(langHint);
    await this.client.sendMessage(subscriberId, MESSAGES[lang].whatsappCTA);
  }

  /** Full flow orchestration — keyword-based routing */
  async handleKeyword(subscriberId: string, keyword: string, langHint?: string): Promise<string> {
    const kw = keyword.toUpperCase().trim();

    if (['QUERO PRESCREVER', 'I WANT TO PRESCRIBE', 'QUIERO PRESCRIBIR', 'MEDICO', 'DOCTOR'].includes(kw)) {
      await this.sendDoctorCTA(subscriberId, langHint);
      return 'doctor_cta';
    }

    if (['AGENDAR', 'SCHEDULE', 'CONSULTA', 'PACIENTE', 'PATIENT'].includes(kw)) {
      await this.sendPatientCTA(subscriberId, langHint);
      return 'patient_cta';
    }

    if (['WHATSAPP', 'HUMANO', 'HUMAN', 'ATENDENTE', 'SUPORTE'].includes(kw)) {
      await this.sendWhatsAppCTA(subscriberId, langHint);
      return 'whatsapp_redirect';
    }

    // Default: welcome
    await this.sendWelcome(subscriberId, langHint);
    return 'welcome';
  }
}
