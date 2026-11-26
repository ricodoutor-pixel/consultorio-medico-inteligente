/**
 * scripts/brisa_onboarding_config.mjs
 * 
 * Diretrizes Oficiais do Dr. Edilson Bezerra da Silva para o Onboarding Médico
 * Ecossistema Enfermeira Brisa v2 — Planta y Raíz Ltda
 */

export const BRISA_CONFIG = {
  // 🛡️ MODO DE SEGURANÇA DRY-RUN
  // true = calcula e registra tudo, mas não dispara requisições reais de envio para o WhatsApp
  // Desligado apenas quando BRISA_DRY_RUN=false for explicitamente fornecido (getter dinâmico pós-dotenv)
  get DRY_RUN() {
    return process.env.BRISA_DRY_RUN !== 'false';
  },

  // 1. ORIGEM DO CONTATO (RESPOSTA PADRÃO LGPD)
  ORIGEM_CONTATO_LGPD: "Localizamos seu contato público profissional divulgado em diretórios médicos abertos e guias de saúde, em conformidade com as diretrizes de prospecção profissional da LGPD.",

  // 2. MODELO DE REPASSE E MONETIZAÇÃO
  POLITICA_COMERCIAL: {
    ofertaGancho: "Prioridade no rodízio de pacientes e ferramentas de IA com o Plano Premium (R$ 99/mês).",
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
  ],

  // IDENTIDADE OFICIAL PADRONIZADA (19/11/2026)
  EMPRESA: {
    nomeFantasia: "Planta y Raiz",
    razaoSocial: "Bezerra Med Soluções Integradas Ltda.",
    cnpj: "30.740.319/0001-14",
  },

  // CANAIS E URLS OFICIAIS VERIFICADOS
  URLS: {
    site: "https://www.plantayraiz.com.br",
    cadastroProfissional: "https://www.plantayraiz.com.br/cadastro-profissional",
    profissionais: "https://www.plantayraiz.com.br/profissionais",
    orientacaoTecnica: "https://www.plantayraiz.com.br/orientacao-tecnica",
    telemedicina: "https://www.plantayraiz.com.br/telemedicina",
    agendamento: "https://www.plantayraiz.com.br/agendamento",
    precos: "https://www.plantayraiz.com.br/precos",
    cadastroPaciente: "https://www.plantayraiz.com.br/cadastro",
    cadastroFarmacia: "https://www.plantayraiz.com.br/cadastro-farmacia",
    indicacoes: "https://www.plantayraiz.com.br/indicacoes",
    reembolso: "https://www.plantayraiz.com.br/reembolso",
    whatsappOficial: "https://wa.me/5511991363154"
  },

  // REGRA DE HORÁRIO COMERCIAL SEGURO (estritamente Seg–Sáb, 09h–19h BRT)
  HORARIO_COMERCIAL: {
    inicioHora: 9,
    fimHora: 19,
    diasPermitidos: [1, 2, 3, 4, 5, 6], // Segunda a Sábado (Domingo bloqueado)
    timeZone: "America/Sao_Paulo"
  }
};

import { formatDoctorAddressing } from '../supabase/functions/_shared/whatsapp-outreach-guard.mjs';

/**
 * Monta o texto de resposta sobre a origem do contato com saudação contextual
 */
export function buildLgpdOriginReply(contactName = '') {
  const saudacao = contactName ? `${contactName}, ` : '';
  return `${saudacao}${BRISA_CONFIG.ORIGEM_CONTATO_LGPD}\n\nNosso propósito é apresentar a profissionais com registro ativo em conselho a plataforma Planta y Raiz (${BRISA_CONFIG.EMPRESA.razaoSocial}, CNPJ ${BRISA_CONFIG.EMPRESA.cnpj}), com cadastro gratuito, prontuário CFM e repasse de 93% via PIX.`;
}

/**
 * Monta o texto de status do checklist de documentos KYC
 */
export function buildKycChecklistReply(contactName = '', docsRecebidos = []) {
  const saudacao = contactName ? `Olá, ${contactName}! ` : 'Olá! ';
  const recebidosSet = new Set(docsRecebidos.map(d => d.toLowerCase()));

  const linhas = BRISA_CONFIG.DOCUMENTOS_OBRIGATORIOS.map((doc, idx) => {
    const ok = recebidosSet.has(doc.tipo.toLowerCase());
    const icone = ok ? '✅' : '⏳';
    const status = ok ? '*[Recebido]*' : '*[Pendente]*';
    return `${icone} ${idx + 1}. ${doc.nome}: ${status}`;
  });

  const todosRecebidos = BRISA_CONFIG.DOCUMENTOS_OBRIGATORIOS.every(d => recebidosSet.has(d.tipo.toLowerCase()));

  let conclusao = '';
  if (todosRecebidos) {
    conclusao = `\n🎉 *Todos os documentos obrigatórios foram recebidos!*\nNossa equipe humana está analisando seu cadastro com prazo de *${BRISA_CONFIG.PRAZO_APROVACAO.textoOficial}*. Avisaremos por aqui assim que concluir.`;
  } else {
    conclusao = `\nVocê pode enviar os itens pendentes por aqui (foto ou PDF). Após o envio completo, a análise humana leva *${BRISA_CONFIG.PRAZO_APROVACAO.textoOficial}*.`;
  }

  return `${saudacao}Recebemos seus arquivos com segurança.\n\n📋 *Status do seu Credenciamento:*\n${linhas.join('\n')}\n${conclusao}`;
}

/**
 * Mensagem do convite oficial (exclusiva para envio manual do admin a médicos com CRM confirmado).
 * Bloqueia PJ/empresas/não-médicos e jamais prefixa "Dr(a)." sem CRM confirmado.
 */
export function buildOfficialInvitationMessage(contactName = '', options = {}) {
  const addressing = formatDoctorAddressing({
    name: contactName,
    crm: options?.crm || '',
    crmState: options?.crmState || options?.crm_state || '',
    councilType: options?.councilType || options?.council_type || '',
    crmConfirmed: Boolean(options?.crmConfirmed),
    email: options?.email || '',
    specialty: options?.specialty || '',
    company: options?.company || '',
  });
  if (!addressing.allowed) return '';
  const saudacao = addressing.salutation ? `Olá, ${addressing.salutation}!` : 'Olá!';
  return `${saudacao} Tudo bem? 🌿

Sou a Enfª Brisa, da plataforma Planta y Raíz (plantayraiz.com.br).

Estamos credenciando médicos prescritores para telemedicina integrativa em todo o Brasil:

• Autonomia clínica e controle total da sua agenda
• Emissor de receitas e prontuário integrado (ICP-Brasil / Gov.br)
• Pacientes pré-triados para atendimento em vídeo ou chat
• Repasse líquido de 93% direto via Pix (Mercado Pago)
• Sem taxa de adesão ou mensalidade fixa

👉 Conheça e ative seu consultório:
${BRISA_CONFIG.URLS.cadastroProfissional}

Caso prefira tirar dúvidas por aqui, basta responder esta mensagem. (Para não receber novos avisos, responda SAIR).`;
}
