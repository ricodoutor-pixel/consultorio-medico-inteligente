
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1503041371391655946/N4Aw1XrxKAijq-hGOuxY9vouDJmYqCkhRJvLwsXNQRUJhIWdkUhcPd_5JVKUzrdela3G";

type LogLevel = 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'AUDIT' | 'FINANCIAL';

interface LogOptions {
  title?: string;
  description: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

const COLORS = {
  SUCCESS: 0x00FF00,   // Verde
  WARNING: 0xFFFF00,   // Amarelo
  CRITICAL: 0xFF0000,  // Vermelho
  AUDIT: 0xFFFF00,     // Amarelo (Alertas de Churn ou Avisos)
  FINANCIAL: 0x00FF00, // Verde (Pagamentos e Triagens)
};

export const logger = {
  async log(level: LogLevel, options: LogOptions) {
    const color = COLORS[level] || 0x3498DB;
    
    const payload = {
      username: "Planta y Raiz",
      embeds: [{
        title: options.title || `Log: ${level}`,
        description: options.description,
        color: color,
        fields: options.fields || [],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Torre de Controle - Planta y Raiz"
        }
      }]
    };

    try {
      // Enviar para o console local também
      console.log(`[${level}] ${options.description}`);

      // Enviar para o Discord
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Erro ao enviar log para o Discord:', await response.text());
      }
    } catch (error) {
      console.error('Erro na biblioteca de logger:', error);
    }
  },

  success(description: string, title = "✅ Sucesso") {
    return this.log('SUCCESS', { title, description });
  },

  warning(description: string, title = "🟡 Aviso") {
    return this.log('WARNING', { title, description });
  },

  critical(description: string, title = "🔴 Erro Crítico") {
    return this.log('CRITICAL', { title, description });
  },

  audit(description: string, title = "🟡 Auditoria / Churn") {
    return this.log('AUDIT', { title, description });
  },

  financial(description: string, title = "🟢 Financeiro / Triagem") {
    return this.log('FINANCIAL', { title, description });
  }
};
