/**
 * Planta & Raiz — Configuração da Aplicação
 * Centraliza todas as configurações em um módulo TypeScript
 */

export const APP_CONFIG = {
  // API Endpoints
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://plantayraiz.com.br/api',

  // External Services
  MERCADO_PAGO: {
    PUBLIC_KEY: import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || '',
    WEBHOOK_URL: 'https://plantayraiz.com.br/api/webhooks/mercado-pago',
  },

  JITSI: {
    DOMAIN: 'meet.jitsi.si',
    ROOM_NAME_PREFIX: 'plantayraiz-',
    CONFIG: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      disableSimulcast: false,
      enableWelcomePage: false,
      enableClosePage: false,
    },
  },

  // Analytics
  GOOGLE_ANALYTICS_ID: 'G-QY3HFCG64L',
  GOOGLE_TAG_MANAGER_ID: 'GT-MRLXCRGK',

  // Company Info
  COMPANY: {
    NAME: 'Planta & Raiz',
    EMAIL: 'contato@plantayraiz.com.br',
    PHONE: '+55 11 99136-3154',
    WEBSITE: 'https://plantayraiz.com.br',
  },

  // Feature Flags
  FEATURES: {
    BLOCKCHAIN_ENABLED: true,
    ON_DEMAND_CHAT: true,
    CLINICAL_ANALYTICS: true,
    CONCIERGE_SERVICE: true,
    NATIVE_APP: true,
    SEO_LOCAL_SEARCH: true,
  },
} as const;
