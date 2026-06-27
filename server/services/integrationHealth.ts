import { createLogger } from '../_core/logger';

const logger = createLogger('integrations');

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  details?: Record<string, unknown>;
}

export function getIntegrationHealth(): IntegrationStatus[] {
  const statuses: IntegrationStatus[] = [
    {
      name: 'mercadopago',
      configured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.MERCADO_PAGO_PUBLIC_KEY),
      details: {
        accessTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
        publicKeyConfigured: Boolean(process.env.MERCADO_PAGO_PUBLIC_KEY),
      },
    },
    {
      name: 'whatsapp',
      configured: Boolean(process.env.EVOLUTION_API_KEY || process.env.WHATSAPP_API_KEY),
      details: {
        evolutionApiKeyConfigured: Boolean(process.env.EVOLUTION_API_KEY),
      },
    },
    {
      name: 'auth',
      configured: Boolean(process.env.JWT_SECRET && process.env.OWNER_OPEN_ID),
      details: {
        jwtConfigured: Boolean(process.env.JWT_SECRET),
        ownerOpenIdConfigured: Boolean(process.env.OWNER_OPEN_ID),
      },
    },
  ];

  return statuses;
}

export function logIntegrationStatus() {
  const statuses = getIntegrationHealth();
  statuses.forEach((status) => {
    if (status.configured) {
      logger.info('integration configured', { integration: status.name, details: status.details });
    } else {
      logger.warn('integration missing configuration', { integration: status.name, details: status.details });
    }
  });
}
