import { supabase } from "@/integrations/supabase/client";

type LogLevel = 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'AUDIT' | 'FINANCIAL';

interface LogOptions {
  title?: string;
  description: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

export const logger = {
  async log(level: LogLevel, options: LogOptions) {
    try {
      console.log(`[${level}] ${options.description}`);
      await supabase.functions.invoke('sre-alert', {
        body: {
          level,
          title: options.title,
          description: options.description,
          fields: options.fields,
        },
      });
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
