// Textos oficiais da Enfª Brisa: fonte única para as funções do servidor (Deno) e os robôs da VPS (Node).
// Decisões do Dr. Edilson (25/11/2026):
//  - a IA nunca usa nome de médico: é sempre "Enfª Brisa, assistente virtual";
//  - supervisão técnica: Dra. Suelen Naves Rodrigues (CRM 49354/PR), igual ao rodapé do site;
//  - Dr. Edilson só como fundador; sem promessa de renda; convite a médico só manual, a médico verificado, com SAIR.
// Regras de texto: verdade (nada que o sistema não confirmou), frases curtas, um próximo passo por mensagem,
// sem diagnóstico/prescrição/produto/dose, sem promessa de resultado ou de renda.

export const SITE = 'https://www.plantayraiz.com.br';
export const PATIENT_PAY_LINK = `${SITE}/pagar/orientacao-tecnica?utm_source=whatsapp`;
export const DOCTOR_SIGNUP_LINK = `${SITE}/cadastro-profissional`;
export const DOCTORS_LIST_LINK = `${SITE}/profissionais`;

export const BRISA_IDENTITY = 'Enfª Brisa, assistente virtual';
export const TECH_SUPERVISOR = 'Dra. Suelen Naves Rodrigues (CRM 49354/PR)';
export const SUPERVISION_LINE = `supervisão técnica da ${TECH_SUPERVISOR}`;
export const FOUNDER_LINE =
  'Dr. Edilson Bezerra, médico com mais de 10 anos de experiência em medicina integrativa, CEO e fundador da Planta y Raiz';

export const OT_PRICE_LABEL = 'R$ 30';
export const OT_DESCRIPTION =
  `A Orientação Técnica (${OT_PRICE_LABEL}) é com a ${BRISA_IDENTITY}, com ${SUPERVISION_LINE}. ` +
  'É educativa e é só o início do cuidado: não é consulta, não diagnostica e não prescreve.';

export const T = {
  identity: `Sou a ${BRISA_IDENTITY} da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.). A equipe humana acompanha. Como posso ajudar?`,
  patientGreeting: (name = '') =>
    `Olá${name ? ', ' + name : ''}! Sou a ${BRISA_IDENTITY} da Planta y Raiz (a equipe humana acompanha). ` +
    `Para começar seu atendimento pela Orientação Técnica (${OT_PRICE_LABEL}): ${PATIENT_PAY_LINK}. Se preferir, me conte o que te trouxe até aqui.`,
  patientGreetingAgain: `Pode me contar o que você precisa? Para começar o atendimento: ${PATIENT_PAY_LINK}`,
  doctorGreeting: (name = '') =>
    `Olá${name ? ', ' + name : ''}! Sou a ${BRISA_IDENTITY} da Planta y Raiz (a equipe humana acompanha). Como posso ajudar no seu cadastro profissional?`,
  doctorGreetingAgain: 'Como posso ajudar no seu cadastro profissional?',
  paymentClaim:
    'O pagamento é confirmado automaticamente pelo Mercado Pago, não por mensagem ou comprovante. ' +
    `Assim que ele aprovar, o acesso abre sozinho na mesma tela. Se ainda não pagou, o link é: ${PATIENT_PAY_LINK}`,
  documentsReceived: 'Obrigada! Nossa equipe confere os documentos e responde por aqui.',
  doctorDocuments:
    'Para ativar seu consultório: foto do CRM ativo, comprovante de endereço, diploma ou RQE (se tiver) e sua chave Pix. ' +
    `Pode enviar por aqui mesmo ou pelo cadastro: ${DOCTOR_SIGNUP_LINK}`,
  audio: `Ainda não consigo ouvir áudios, pode me escrever? Se quiser começar pela Orientação Técnica (${OT_PRICE_LABEL}): ${PATIENT_PAY_LINK}`,
  call: 'Por aqui não atendemos ligações. Pode escrever sua dúvida?',
  emergency: 'Ligue agora para 192 (SAMU) ou procure o pronto-socorro mais próximo. Não espere atendimento por aqui.',
  handoff: 'Vou passar para nossa equipe humana. Retornamos por aqui.',
  optOut: 'Entendido, removi seu número e não enviaremos novas mensagens. Obrigada pela atenção.',
  offTopic: 'Aqui falamos só de atendimento e serviços da Planta y Raiz.',
  noMedicationSale:
    `A Planta y Raiz não vende nem entrega medicamentos ou produtos derivados de cannabis. Você pode começar pela Orientação Técnica educativa (${OT_PRICE_LABEL}): ${PATIENT_PAY_LINK}`,
  medicalBoundary:
    `Quem avalia isso é o médico na consulta; não fazemos diagnóstico nem indicamos medicamento ou dose por aqui. Para começar pela Orientação Técnica educativa (${OT_PRICE_LABEL}): ${PATIENT_PAY_LINK}`,
  otExplained: OT_DESCRIPTION + ` Para começar: ${PATIENT_PAY_LINK}`,
  /** Profissional (fisioterapeuta etc.) perguntando se paga algo: verdade sobre custo, sem promessa. */
  professionalCost:
    'O cadastro profissional é gratuito. A plataforma fica com 7% de cada consulta paga (você recebe 93% via Pix) e o plano Médico VIP (R$ 99/mês) é opcional. ' +
    `Hoje a vitrine atende médicos com CRM ativo; o cadastro é em ${DOCTOR_SIGNUP_LINK}.`,
  /** Convite a médico: SÓ envio manual do admin, para médico com CRM verificado que já falou conosco. */
  doctorInvite: (name = '') =>
    `Olá${name ? ', Dr(a). ' + name : ', Dr(a).'}! Aqui é a ${BRISA_IDENTITY}, do marketing médico da Planta y Raiz. ` +
    `Temos consultório virtual com vídeo, prontuário e receita digital; repasse de 93% de cada consulta (taxa de 7%). Cadastro gratuito: ${DOCTOR_SIGNUP_LINK}\n` +
    'Se não quiser mais mensagens, responda SAIR.\n— Enfª Brisa, marketing médico',
};

/** Frases que nenhum texto do agente pode conter (verificado por teste automático). */
export const FORBIDDEN_PHRASES = [
  /recebemos sua mensagem sobre o pagamento/i,
  /recebemos\.? o acesso é liberado/i,
  /Edilson Bezerra ON/i,
  /você foi selecionad[oa]/i,
  /selecionado\(a\)/i,
  /participação nos lucros|distribuição de lucros/i,
  /medicina canabin[oó]ide/i,
  /rodando bem em todos os par[aâ]metros/i,
  /R\$ ?(15|45)\.000/i,
  /renda (mensal )?vital[ií]cia/i,
  /3ª gera[cç][aã]o|3 gera[cç][oõ]es/i,
  /persona do (Dr|\$\{DOCTOR)/i,
  /supervisionad[oa] pelo (médico )?Dr\.? Edilson/i,
  /melhor plataforma do planeta/i,
];
