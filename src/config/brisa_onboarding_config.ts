/**
 * src/config/brisa_onboarding_config.ts
 * 
 * Diretrizes Oficiais do Dr. Edilson Bezerra da Silva para o Onboarding Médico
 * Ecossistema Enfermeira Brisa v2 — Planta y Raíz Ltda
 */

export interface KycDocumentRequirement {
  tipo: "crm" | "comprovante_residencia" | "diploma_ou_rqe" | "chave_pix";
  nome: string;
  descricao: string;
  obrigatorio: boolean;
}

export const BRISA_CONFIG = {
  // 1. ORIGEM DO CONTATO (RESPOSTA PADRÃO LGPD)
  ORIGEM_CONTATO_LGPD: "Localizamos seu contato público profissional divulgado em diretórios médicos abertos e guias de saúde, em conformidade com as diretrizes de prospecção profissional da LGPD.",

  // 2. MODELO DE REPASSE E MONETIZAÇÃO
  POLITICA_COMERCIAL: {
    ofertaGancho: "Repasse de 100% da sua teleconsulta no primeiro mês (taxa zero da plataforma com adesão ao Plano VIP).",
    regraPadrao: "Repasse instantâneo via PIX com retenção de apenas 7% da plataforma (o médico retém 93% líquido de cada consulta).",
    percentualMedicoPadrao: 93,
    taxaPlataformaPadrao: 7,
    tipoRepasse: "PIX Instantâneo"
  },

  // 3. PRAZO OFICIAL DE APROVAÇÃO
  PRAZO_APROVACAO: {
    textoOficial: "Em até 24 a 48 horas úteis",
    horasMinimas: 24,
    horasMaximas: 48,
    diasUteis: true
  },

  // 4. DOCUMENTOS OBRIGATÓRIOS (KYC MÉDICO)
  DOCUMENTOS_OBRIGATORIOS: [
    {
      tipo: "crm",
      nome: "Foto do documento profissional (CRM ativo)",
      descricao: "Carteira profissional do CRM ou certidão do Conselho Regional de Medicina",
      obrigatorio: true
    },
    {
      tipo: "comprovante_residencia",
      nome: "Comprovante de endereço/residência recente",
      descricao: "Conta de consumo ou extrato recente emitido nos últimos 90 dias",
      obrigatorio: true
    },
    {
      tipo: "diploma_ou_rqe",
      nome: "Cópia do Diploma de Medicina ou Certificado de Especialidade/RQE",
      descricao: "Diploma de graduação em Medicina ou comprovante de Registro de Qualificação de Especialista (RQE)",
      obrigatorio: true
    },
    {
      tipo: "chave_pix",
      nome: "Chave PIX vinculada ao titular",
      descricao: "Chave PIX (CPF, e-mail, telefone ou aleatória) de mesma titularidade para liquidação imediata",
      obrigatorio: true
    }
  ] as KycDocumentRequirement[],

  URLS: {
    site: "https://plantayraiz.com.br",
    cadastroProfissional: "https://plantayraiz.com.br/cadastro-profissional",
    profissionais: "https://plantayraiz.com.br/profissionais",
    whatsappOficial: "https://wa.me/5511991363154"
  }
} as const;

export function buildLgpdOriginReply(doctorName = ''): string {
  const saudacao = doctorName ? `Dr(a). ${doctorName}, ` : '';
  return `${saudacao}${BRISA_CONFIG.ORIGEM_CONTATO_LGPD}\n\nNosso propósito é apresentar aos médicos prescritores uma plataforma independente, com prontuário CFM nativo, prescrição digital e total liberdade na definição de seus honorários.`;
}
