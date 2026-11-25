export const DAY_MS = 24 * 60 * 60 * 1000;
export const normalizeText = (text = '') => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export const LOOPING_BOT_NUMBERS = new Set([
  '5511979977802',
  '53206709227635',
  '551153045378',
  '558381838356',
  '185405248905250',
  '551633572527',
  '1633572527',
  '54589755789473',
  '557591462018',
  '7591462018',
  '5575991462018',
  '75991462018',
  '212988065788005',
]);

const GENERIC_PROFILE_NAMES = /^(paciente|usuario|cliente|doutor|doutora|consultorio|clinica|recepcao|agendamento|equipe|secretaria|central|espaco|instituto|vital|global|cards|atendimento|odontologia|veterinaria|contato)$/i;

export function patientName(value = '') {
  if (/[\d@_]/.test(value)) return '';
  const normFull = normalizeText(value);
  if (/\b(consultorio|clinica|recepcao|agendamento|equipe|secretaria|central|espaco|instituto|vital apex|odontologia|veterinaria)\b/.test(normFull)) return '';
  const name = value.replace(/^(?:dr\(a\)\.?|dra?\.?|doutora?|paciente|usuario|user)\s+/i, '').trim();
  if (!/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u.test(name) || GENERIC_PROFILE_NAMES.test(name)) return '';
  const first = name.split(' ')[0];
  if (GENERIC_PROFILE_NAMES.test(normalizeText(first))) return '';
  return first;
}

export function sanitizeOutboundAnswer(answer = '') {
  let text = String(answer || '').trim();
  if (!text) return '';
  // Never claim to be a human agent
  if (/\bsou\s+(um\s+|uma\s+)?(agente\s+humano|atendente\s+humano|humano|pessoa\s+real|pessoa\s+de\s+verdade)\b/i.test(text)) {
    text = text.replace(/\b(oi,?\s*)?sou\s+(um\s+|uma\s+)?(agente\s+humano|atendente\s+humano|humano|pessoa\s+real|pessoa\s+de\s+verdade)\.?\s*/gi, 'Sou a Enfª Brisa, assistente virtual da Planta y Raiz. ');
  }
  // Never advertise forbidden claims: "taxa zero", "100% de repasse", "sócio", "participação nos lucros"
  text = text.replace(/\btaxa\s+(de\s+intermedia[cç][aã]o\s+|de\s+venda\s+)?zero(?:\s*\(0%\))?\b/gi, 'repasse de 93% (taxa de 7% da plataforma)');
  text = text.replace(/\b(repasse\s+(l[ií]quido\s+)?de\s+100%|100%\s+de\s+repasse)\b/gi, 'repasse de 93% de cada consulta');
  text = text.replace(/\bparticipa[cç][aã]o\s+(nos|dos)\s+lucros\b/gi, 'programa de indicações da plataforma');
  text = text.replace(/\bm[eé]dic[oa]s?\s+(prescritor(?:es|as)?\s+)?s[oó]ci[oa]s?\b/gi, 'médico parceiro credenciado');
  // Never send a bare URL without explanatory text
  if (/^https?:\/\/\S+$/i.test(text)) {
    text = `Acesse nossa plataforma oficial em: ${text}`;
  }
  return text.trim();
}

export function similarity(a, b) {
  a = normalizeText(a); b = normalizeText(b);
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const pairs = new Map();
  for (let i = 0; i < a.length - 1; i++) { const p = a.slice(i, i + 2); pairs.set(p, (pairs.get(p) || 0) + 1); }
  let overlap = 0;
  for (let i = 0; i < b.length - 1; i++) { const p = b.slice(i, i + 2); if (pairs.get(p) > 0) { overlap++; pairs.set(p, pairs.get(p) - 1); } }
  return 2 * overlap / (a.length + b.length - 2);
}

export function repeatedWithinDay(answer, history = [], now = Date.now()) {
  return history.some(h => {
    const time = Number(h.sentAt) || Date.parse(h.created_at || '');
    return Number.isFinite(time) && time <= now && now - time < DAY_MS && similarity(answer, h.text || h.content || '') > 0.8;
  });
}

/** Link curto do checkout expresso (sem login) da Orientação Técnica para contatos do WhatsApp. */
export const PATIENT_PAY_LINK = 'https://www.plantayraiz.com.br/pagar/orientacao-tecnica?utm_source=whatsapp';

/** Mensagem do paciente dizendo que pagou: nunca "recebemos", nunca alerta; só o Mercado Pago confirma. */
export const PAYMENT_CLAIM_ANSWER = `O pagamento é confirmado automaticamente pelo Mercado Pago, não por mensagem ou comprovante. Assim que ele aprovar, o acesso abre sozinho na mesma tela. Se ainda não pagou, o link é: ${PATIENT_PAY_LINK}`;

export const AUDIO_ANSWER = `Ainda não consigo ouvir áudios, pode me escrever? Se quiser começar pela Orientação Técnica (R$ 30): ${PATIENT_PAY_LINK}`;

/** Só emoji, figurinha ou pontuação: não há pedido a responder (e nunca é aviso de pagamento). */
export function isMediaOnlyText(text = '') {
  const t = String(text).replace(/[\s\p{P}\p{S}\p{Emoji_Presentation}\p{Extended_Pictographic}‍️]/gu, '');
  return t.length === 0;
}

/** A Brisa já se apresentou a este contato nas últimas 24 h? (evita saudação em loop) */
export function introducedWithinDay(history = [], now = Date.now()) {
  return history.some(h => {
    const time = Number(h.sentAt ?? h.time) || Date.parse(h.created_at || '');
    return Number.isFinite(time) && time <= now && now - time < DAY_MS && /assistente virtual/i.test(String(h.text || h.content || ''));
  });
}

export function patientGreeting(senderName = '', introducedRecently = false) {
  const name = patientName(senderName);
  if (introducedRecently) return `Pode me contar o que você precisa? Para começar o atendimento: ${PATIENT_PAY_LINK}`;
  return `Olá${name ? ', ' + name : ''}! Sou a Enfª Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha). Para começar seu atendimento pela Orientação Técnica (R$ 30): ${PATIENT_PAY_LINK}. Se preferir, me conte o que te trouxe até aqui.`;
}

export function quickResponse({ question = '', senderName = '', role = 'patient', isAudio = false, isCall = false, isSticker = false, introducedRecently = false }) {
  const q = normalizeText(question);
  if (isSticker || (!isAudio && !isCall && question && isMediaOnlyText(question))) return { answer: '', suppressed: true, model: 'media-no-text' };
  // Emergency takes priority over sales, media and human handoff.
  if (/suicid|me matar|tirar minha vida|me machucar|infarto|falta de ar|dor forte|dor.*peito|socorro urgente|\bsamu\b|\b192\b/.test(q)) return { answer: 'Ligue agora para 192 (SAMU) ou procure o pronto-socorro mais próximo. Não espere atendimento por aqui.', model: 'safety-emergency' };
  if (/\b(atendente|humano|pessoa real|pessoa de verdade)\b|preciso falar com|quero falar com|falar com (humano|atendente|alguem|uma pessoa|a equipe|o suporte|o dr|a dra|o edilson)|vou pausar|pausar a automa[cç]|pausar automa[cç]|silenciar automa[cç]|pausar esta conversa|pausa esta conversa|pausar conversa|pause esta conversa|vou pausar para esta conversa|parar automa[cç]|nao quero (falar com )?(robo|bot|ia)|reclamacao|absurdo|estou irritad|\b(reembolso|estorno|devolucao do dinheiro|quero meu dinheiro de volta)\b|\b(menor de idade|crianca de \d+ anos|meu filho de \d+ anos|minha filha de \d+ anos)\b|\b(processo juridico|advogado|juridico|procon)\b/.test(q)) return { answer: 'Vou passar para nossa equipe humana. Retornamos por aqui.', handoff: true, model: 'human-handoff' };
  if (/voce e.*(robo|ia|enfermeira|medica)|quem e voce|e um robo|eh um robo/.test(q)) return { answer: 'Sou a Enfª Brisa, assistente virtual da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.). A equipe humana acompanha o atendimento. Como posso ajudar?', model: 'identity' };
  if (isAudio || q === 'audio' || q === '[audio recebido]') return { answer: AUDIO_ANSWER, model: 'audio-response' };
  if (isCall) return { answer: 'Por aqui não atendemos ligações. Pode escrever sua dúvida?', model: 'call-response' };
  if (/paguei|comprovante|pagamento (feito|realizado|efetuado)|fiz o pix|mandei o pix|ja pague|pix pago|esta pago/.test(q)) return { answer: PAYMENT_CLAIM_ANSWER, model: 'payment-claim' };
  if (/enviei.*(document|anexo)|mandei.*document/.test(q)) return { answer: 'Obrigada! Nossa equipe confere os documentos e responde por aqui.', model: 'receipt-notice' };
  if (/secretaria virtual|aumente suas vendas|servico de marketing|venda de seguidores|disparador em massa/.test(q)) return { answer: '', suppressed: true, model: 'service-offer' };
  if (/este canal e (da|do|de|exclusivo)|nao consigo verificar cadastro|nao agendamos consultas? por aqui|esta e uma resposta automatica|mensagem automatica|atendimento automatico|secretaria eletronica|assistente virtual de|sou o assistente virtual|nao entendi,?\s*escolha uma das opco|escolha uma das opco|digite o numero da opca|seja muito bem vindo.*atendimento digital|triello/.test(q)) return { answer: '', suppressed: true, model: 'auto-reply-suppressed' };
  if (/^(0|pare|parar|sair|stop|chega|descadastrar)$|\b(nao quero receber|nao tenho interesse|sem interesse|pare de enviar|parar de enviar|nao me mande mais|nao envie mais|remover da lista|remover meu numero)\b/.test(q)) return { answer: 'Entendido, removi seu número e não enviaremos novas mensagens. Obrigada pela atenção.', optOut: true, model: 'opt-out' };
  if (/\b(corrente de oracao|compartilhe com 10|partido politico|bolsonaro|lula|versiculo|oracao de hoje)\b/.test(q)) return { answer: 'Aqui falamos só de atendimento e serviços da Planta y Raiz.', model: 'off-topic' };
  if (/^(oi|ola|bom dia|boa tarde|boa noite|ok|qk|opa|oie|blz|tudo bem)[\s!?.\p{Emoji_Presentation}]*$/u.test(q)) {
    const name = patientName(senderName);
    return {
      answer: role === 'doctor'
        ? (introducedRecently
          ? 'Como posso ajudar no seu cadastro profissional?'
          : `Olá${name ? ', ' + name : ''}! Sou a Enfª Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha). Como posso ajudar no seu cadastro profissional?`)
        : patientGreeting(senderName, introducedRecently),
      model: 'greeting-response',
    };
  }
  if (role !== 'doctor' && /\b(comprar|vender|voces vendem|onde compro|entrega.*(oleo|cbd|canabidiol|cannabis|produto|medicamento)|vender.*(oleo|cbd|canabidiol|cannabis|medicamento))\b/.test(q)) {
    return {
      answer: `A Planta y Raiz não vende nem entrega medicamentos ou produtos derivados de cannabis. Você pode começar pela Orientação Técnica educativa (R$ 30): ${PATIENT_PAY_LINK}`,
      model: 'no-medication-sale',
    };
  }
  if (role !== 'doctor' && /\b(remedios?|dormir|insonia|ansiedade|sintomas?|dosagem|posologia|diagnostico|cura)\b/.test(q)) {
    return {
      answer: `Quem avalia isso é o médico na consulta; não fazemos diagnóstico nem indicamos medicamento ou dose por aqui. Para começar pela Orientação Técnica educativa (R$ 30): ${PATIENT_PAY_LINK}`,
      model: 'medical-boundary',
    };
  }
  return null;
}