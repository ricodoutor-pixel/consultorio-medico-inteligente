/**
 * scripts/brisa_onboarding_config.mjs
 * 
 * Diretrizes Oficiais do Dr. Edilson Bezerra da Silva para o Onboarding Médico
 * Ecossistema Enfermeira Brisa v2 — Planta y Raíz Ltda
 */

export const BRISA_CONFIG = {
  // 🛡️ MODO DE SEGURANÇA DRY-RUN
  // true = calcula e registra tudo, mas não dispara requisições reais de envio para o WhatsApp
  // Desligado apenas quando BRISA_DRY_RUN=false for explicitamente fornecido
  DRY_RUN: process.env.BRISA_DRY_RUN !== 'false',

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
  ],

  // CANAIS E URLS OFICIAIS
  URLS: {
    site: "https://plantayraiz.com.br",
    cadastroProfissional: "https://plantayraiz.com.br/cadastro-profissional",
    profissionais: "https://plantayraiz.com.br/profissionais",
    whatsappOficial: "https://wa.me/5511991363154"
  },

  // REGRA DE HORÁRIO COMERCIAL SEGURO
  HORARIO_COMERCIAL: {
    inicioHora: 8,
    fimHora: 18,
    diasPermitidos: [1, 2, 3, 4, 5], // Segunda a Sexta
    timeZone: "America/Sao_Paulo"
  }
};

/**
 * Monta o texto de resposta sobre a origem do contato com saudação contextual
 */
export function buildLgpdOriginReply(doctorName = '') {
  const saudacao = doctorName ? `Dr(a). ${doctorName}, ` : '';
  return `${saudacao}${BRISA_CONFIG.ORIGEM_CONTATO_LGPD}\n\nNosso propósito é apresentar aos médicos prescritores uma plataforma independente, com prontuário CFM nativo, prescrição digital e total liberdade na definição de seus honorários.`;
}

/**
 * Monta o texto de status do checklist de documentos KYC
 */
export function buildKycChecklistReply(doctorName = '', docsRecebidos = []) {
  const saudacao = doctorName ? `Olá, Dr(a). ${doctorName}! ` : 'Olá, Dr(a)! ';
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
    conclusao = `\n🎉 *Todos os documentos obrigatórios foram recolhidos com sucesso!*\nNossa diretoria técnica e médica está analisando seu dossiê com o prazo oficial de liberação da sua agenda *${BRISA_CONFIG.PRAZO_APROVACAO.textoOficial}*. Qualquer novidade você receberá diretamente por aqui! 🙏🌿`;
  } else {
    conclusao = `\nVocê pode enviar os itens pendentes diretamente por aqui pelo WhatsApp (em foto ou PDF). Assim que completarmos a lista, a liberação ocorre *${BRISA_CONFIG.PRAZO_APROVACAO.textoOficial}*! 🩺✨`;
  }

  return `${saudacao}Recebemos seus arquivos com total sigilo médico e proteção jurídica.\n\n📋 *Status do seu Credenciamento Médico:*\n${linhas.join('\n')}\n${conclusao}`;
}

/**
 * Mensagem do convite oficial Brevo / Campanha
 */
export function buildOfficialInvitationMessage(doctorName = '') {
  const nomeFormatado = doctorName ? `Dr(a). ${doctorName}` : 'Doutor(a)';
  return `Olá, ${nomeFormatado}! Tudo bem? 🌿🩺

Aqui é a Enfermeira Brisa, coordenadora de credenciamento clínico da Planta y Raíz (${BRISA_CONFIG.URLS.site}).

Gostaria de estender um convite oficial do Dr. Edilson Bezerra da Silva para integrar nosso corpo de médicos prescritores parceiros:

• 💰 *Repasse Integral (Plano VIP)*: ${BRISA_CONFIG.POLITICA_COMERCIAL.ofertaGancho}
• ⚡ *Repasse Instantâneo*: ${BRISA_CONFIG.POLITICA_COMERCIAL.regraPadrao}
• 🛡️ *Segurança Jurídica Total*: Prontuário eletrônico em conformidade com o CFM (Resolução 2.314/2022) e ANVISA (RDCs 660 e 327) com assinatura ICP-Brasil / Gov.br nativa.
• 🩺 *Demanda Ativa de Pacientes*: Pacientes direcionados por triagem clínica e perfil público na nossa vitrine oficial.
• 🏪 *Farmácia Digital Integrada*: Facilidade de acesso aos fitocanabinoides prescritos para os seus pacientes.

Gostaria de ativar seu cadastro gratuito e liberar seu consultório digital?

👉 *Link direto para credenciamento*: ${BRISA_CONFIG.URLS.cadastroProfissional}

Se preferir, pode me responder por aqui mesmo no WhatsApp enviando seus documentos que nossa equipe cuida de tudo para você! 🙏✨`;
}
