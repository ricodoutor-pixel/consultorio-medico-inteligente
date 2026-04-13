// Tag IDs - configure in ManyChat dashboard
export const TAGS = {
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
  RECRUTAMENTO_MEDICO: 1010,
} as const;

// Flow namespaces - configure in ManyChat dashboard
export const FLOWS = {
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
  // B2B Medical Recruitment
  MEDICAL_EBOOK_DELIVERY: 'content20250413_medical_ebook_delivery',
  MEDICAL_ONBOARDING: 'content20250413_medical_onboarding',
  MEDICAL_EARNINGS_SIM: 'content20250413_medical_earnings_sim',
} as const;

// Custom field IDs
export const CUSTOM_FIELDS = {
  CONSULTATION_ID: 2001,
  IG_SOURCE: 2002,
  SPECIALTY: 2003,
  CBD_EXPERIENCE: 2004,
  WEEKLY_HOURS: 2005,
  RECRUITMENT_SOURCE: 2006,
} as const;

// Platform constants
export const EBOOK_PDF_URL = 'https://plantayraiz.com.br/biblioteca/ebook-medicina-canabinoide.pdf';
export const SIGNUP_BASE_URL = 'https://plantayraiz.com.br/cadastro-profissional';
export const CONSULTATION_PRICE = 150; // avg price per consultation
export const DOCTOR_SPLIT = 0.92; // 92% for doctors
