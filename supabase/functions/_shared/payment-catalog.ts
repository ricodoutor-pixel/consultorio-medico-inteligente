// Catálogo único de nomes de pagamento (tabela public.payment_services).
// Toda função que cria pagamento lê o nome exibido ao pagador, o valor e o
// descritor da fatura desta tabela. Se a leitura falhar, usa o espelho
// embutido abaixo (mantido em sincronia com a tabela) para nunca bloquear
// uma cobrança. Serviço sem cadastro usa "Serviço Planta y Raiz" e gera
// aviso no log para o administrador cadastrar o nome.

export interface PaymentService {
  code: string;
  display_name: string;
  amount_brl: number;
  descriptor: string;
  recurring: boolean;
  active: boolean;
}

/** Nome da conta recebedora conforme cadastro no provedor (Mercado Pago).
 *  Atualizado após consulta em /users/me — ver docs/NOME_PAGAMENTO_2026-11-08.md. */
export const PAYMENT_RECEIVER_NAME = "Planta y Raiz";

export const FALLBACK_DESCRIPTOR = "PLANTAYRAIZ";

/** Espelho da tabela payment_services (fallback se o banco estiver indisponível). */
export const FALLBACK_SERVICES: Record<string, PaymentService> = {
  orientacao_tecnica: { code: "orientacao_tecnica", display_name: "Orientação Técnica — Planta y Raiz", amount_brl: 30, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  orientacao: { code: "orientacao", display_name: "Orientação Técnica — Planta y Raiz", amount_brl: 30, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  retorno_consulta: { code: "retorno_consulta", display_name: "Retorno — Planta y Raiz", amount_brl: 90, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  consulta_chat: { code: "consulta_chat", display_name: "Consulta por Chat — Planta y Raiz", amount_brl: 100, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  consulta_video: { code: "consulta_video", display_name: "Consulta por Vídeo — Planta y Raiz", amount_brl: 150, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  consulta_premium: { code: "consulta_premium", display_name: "Consulta Premium — Planta y Raiz", amount_brl: 180, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  consulta_canabinoide: { code: "consulta_canabinoide", display_name: "Consulta Especializada — Planta y Raiz", amount_brl: 250, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  plano_paciente: { code: "plano_paciente", display_name: "Plano Paciente — Planta y Raiz", amount_brl: 99, descriptor: FALLBACK_DESCRIPTOR, recurring: true, active: true },
  plano_medico: { code: "plano_medico", display_name: "Plano Médico — Planta y Raiz", amount_brl: 99, descriptor: FALLBACK_DESCRIPTOR, recurring: true, active: true },
  plano_lojista: { code: "plano_lojista", display_name: "Plano Lojista — Planta y Raiz", amount_brl: 99, descriptor: FALLBACK_DESCRIPTOR, recurring: true, active: true },
  plano_basic: { code: "plano_basic", display_name: "Plano Individual Básico — Planta y Raiz", amount_brl: 49.9, descriptor: FALLBACK_DESCRIPTOR, recurring: true, active: true },
  plano_professional: { code: "plano_professional", display_name: "Plano Médico Profissional — Planta y Raiz", amount_brl: 99.9, descriptor: FALLBACK_DESCRIPTOR, recurring: true, active: true },
  plano_premium: { code: "plano_premium", display_name: "Plano Saúde Verde Família — Planta y Raiz", amount_brl: 199.9, descriptor: FALLBACK_DESCRIPTOR, recurring: true, active: true },
  plano_enterprise: { code: "plano_enterprise", display_name: "Plano Empresa & Parceiros — Planta y Raiz", amount_brl: 499.9, descriptor: FALLBACK_DESCRIPTOR, recurring: true, active: true },
  tool_combo_tools: { code: "tool_combo_tools", display_name: "Combo 11 Módulos Consultório Digital — Planta y Raiz", amount_brl: 97, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_cardiaco: { code: "tool_cardiaco", display_name: "Módulo Monitor Cardíaco — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_fundoscopia: { code: "tool_fundoscopia", display_name: "Módulo Fundo de Olho — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_oximetria: { code: "tool_oximetria", display_name: "Módulo Oximetria Óptica — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_dermatoscopia: { code: "tool_dermatoscopia", display_name: "Módulo Dermatoscopia Digital — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_mobilidade: { code: "tool_mobilidade", display_name: "Módulo Mobilidade Articular — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_estetoscopio: { code: "tool_estetoscopio", display_name: "Módulo Estetoscópio Digital IA — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_pulmonar: { code: "tool_pulmonar", display_name: "Módulo Ausculta Pulmonar IA — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_tremor: { code: "tool_tremor", display_name: "Módulo Tremorometria IA — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_urine: { code: "tool_urine", display_name: "Módulo Urinálise IA — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_acuity: { code: "tool_acuity", display_name: "Módulo Acuidade Visual — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
  tool_gps: { code: "tool_gps", display_name: "Módulo Rastreador GPS Cardíaco — Planta y Raiz", amount_brl: 29.9, descriptor: FALLBACK_DESCRIPTOR, recurring: false, active: true },
};

type Sb = { from: (t: string) => any };

/** Lê a tabela payment_services; em falha, devolve o espelho embutido. */
export async function getPaymentServices(sb: Sb): Promise<Record<string, PaymentService>> {
  try {
    const { data, error } = await sb.from("payment_services").select("code, display_name, amount_brl, descriptor, recurring, active");
    if (error || !data || data.length === 0) {
      console.warn("[payment-catalog] tabela indisponível, usando espelho embutido:", error?.message ?? "vazia");
      return { ...FALLBACK_SERVICES };
    }
    const map: Record<string, PaymentService> = {};
    for (const row of data as any[]) {
      map[row.code] = {
        code: row.code,
        display_name: String(row.display_name),
        amount_brl: Number(row.amount_brl),
        descriptor: sanitizeDescriptor(String(row.descriptor || FALLBACK_DESCRIPTOR)),
        recurring: Boolean(row.recurring),
        active: Boolean(row.active),
      };
    }
    return map;
  } catch (e) {
    console.warn("[payment-catalog] erro ao ler tabela, usando espelho:", (e as Error).message);
    return { ...FALLBACK_SERVICES };
  }
}

/** Descritor da fatura: maiúsculas, sem acentos, até 16 caracteres. */
export function sanitizeDescriptor(raw: string): string {
  const clean = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .slice(0, 16);
  return clean || FALLBACK_DESCRIPTOR;
}

/**
 * Nome exibido ao pagador para um código de serviço. Serviço sem cadastro
 * usa "Serviço Planta y Raiz" e registra aviso para o administrador.
 */
export function resolveDisplayName(catalog: Record<string, PaymentService>, code: string): string {
  const svc = catalog[code];
  if (svc?.active && svc.display_name) return svc.display_name;
  console.warn(`[payment-catalog] ATENÇÃO ADMIN: serviço sem nome cadastrado na tabela payment_services: "${code}" — usando nome genérico.`);
  return "Serviço Planta y Raiz";
}
