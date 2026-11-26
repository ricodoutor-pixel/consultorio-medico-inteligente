import { T, PATIENT_PAY_LINK } from './brisa-templates.mjs';
import { isCompanyOrNonDoctorContact } from './whatsapp-outreach-guard.mjs';
export { PATIENT_PAY_LINK };

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

const GENERIC_PROFILE_NAMES = /^(paciente|usuario|cliente|doutor|doutora|consultorio|clinica|recepcao|agendamento|equipe|secretaria|central|espaco|instituto|vital|global|cards|atendimento|odontologia|veterinaria|contato|contabil|contabilidade|assessoria|imobiliaria|financeira|psicologia|ltda|empresa|comercial)$/i;

export function isBusinessOrNonDoctorSender(senderName = '') {
  if (!senderName) return false;
  return isCompanyOrNonDoctorContact({ name: senderName }).blocked;
}

export function patientName(value = '') {
  if (!value || /[\d@_]/.test(value)) return '';
  if (isBusinessOrNonDoctorSender(value)) return '';
  const normFull = normalizeText(value);
  if (/\b(consultorio|clinica|recepcao|agendamento|equipe|secretaria|central|espaco|instituto|vital apex|odontologia|veterinaria)\b/.test(normFull)) return '';
  const name = value.replace(/^(?:dr\(a\)\.?|dra?\.?|doutora?|paciente|usuario|user)\s+/i, '').trim();
  if (!/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u.test(name) || GENERIC_PROFILE_NAMES.test(name)) return '';
  const first = name.split(' ')[0];
  if (GENERIC_PROFILE_NAMES.test(normalizeText(first))) return '';
  return first;
}

const AUTO_REPLY_AND_URA_PATTERNS = [
  // Mensagens automáticas / ausência / WhatsApp Business
  /\besta e uma resposta automatica\b/,
  /\bresposta automatica\b/,
  /\bmensagem automatica\b/,
  /\batendimento automatico\b/,
  /\batendimento automatizado\b/,
  /\bsistema automatizado\b/,
  /\batendimento eletronico\b/,
  /\bautoatendimento\b/,
  /\batendimento digital\b/,
  /\bsecretaria eletronica\b/,
  /\bsecretaria virtual\b/,
  /\bassistente virtual\b/,
  /\batendente (virtual|digital)\b/,
  /\bsou (o|a|um|uma)?\s*(chatbot|bot|robo|assistente virtual|inteligencia artificial|ia)\b/,
  /\bagradec(?:e|emos) (o seu |seu )?contato\b/,
  /\bobrigad[oa] (pela mensagem|pelo contato|por entrar em contato)\b/,
  /\bseja (muito )?bem[- ]?vind[oa]s?\b/,
  /\bbem[- ]?vind[oa]s?\s+(a|ao|as|aos)\s+/,
  /\b(nosso )?horario de atendimento\b/,
  /\bfora do horario\b/,
  /\bnao estamos disponiveis\b/,
  /\bno momento nao podemos atender\b/,
  /\bestou em atendimento\b/,
  /\bem (ferias|recesso)\b/,
  /\bdeixe sua mensagem\b/,
  /\b(retornaremos|responderemos) em breve\b/,
  /\blogo mais retornaremos\b/,
  /\bem breve (um de nossos|nossa equipe|retornaremos)\b/,
  /\bassim que possivel retornaremos\b/,
  /\beste canal e (da|do|de|exclusivo)\b/,
  /\beste numero e exclusivo\b/,
  /\bcanal exclusivo\b/,
  /\bexclusivo para urgencias\b/,
  /\bnao consigo verificar cadastro\b/,
  /\bnao agendamos consultas? por aqui\b/,
  /\bagendamento de consultas? (apenas|somente|pelo)\b/,
  /\bpara agendar (sua )?consulta (ligue|acesse|clique|envie)\b/,
  /\bcomo posso (te )?ajudar hoje\s*\?/,
  /\bem que posso (te )?ajudar\s*\?/,
  /\bqual o motivo do seu contato\s*\?/,
  /\bpara (iniciarmos|agilizar) (o|seu) atendimento\b/,
  /\b(informe|digite) seu (cpf|cnpj)\b/,
  /\bpowered by (ai|ia|chatgpt|openai|typebot|evolution|manychat|zenvia|blip|kommo|rd station|take blip|botmaker|octadesk|tallos|digisac|poli|huggy|whaticket|chatguru)\b/,
  /\btriello\b/,

  // URAs / IVRs / menus interativos comerciais
  /\bdigite (o numero( da opcao| do setor| correspondente)?|uma das opcoes|a opcao|[0-9]\s*(para|se|-|\)))\b/,
  /\bescolha (uma das |a )?opco/,
  /\bselecione (uma |a )?opca/,
  /\bresponda com (o numero|um numero|[1-9])\b/,
  /\benvie [1-9] para\b/,
  /\bpressione [1-9]\b/,
  /\bmenu principal\b/,
  /\bvoltar ao menu\b/,
  /\bpara encerrar digite\b/,
  /\bpara falar com (um )?atendente digite\b/,
  /\bopcao invalida\b/,
  /\bnao entendi,?\s*(escolha|digite|selecione|por favor)\b/,
  /\b(departamento|setor)\s+(fiscal|contabil|pessoal|financeiro|comercial|juridico|cobranca|administrativo|dp|rh)\b/,
  /\b(2a|segunda)\s+via\s+de\s+boleto\b/,
  /\bemissao de nota fiscal\b/,
];

/**
 * Detects multi-option numbered URA menus (e.g. "1 - Agendamento 2 - Financeiro",
 * "1) Fiscal\n2) Contábil", "1️⃣ Setor A\n2️⃣ Setor B", "[1] ... [2] ...").
 */
function hasNumberedUraMenu(rawText = '') {
  const text = String(rawText || '');
  if (!text) return false;
  // Emoji keycap digits 1️⃣ and 2️⃣
  if (/[1][^\S\r\n]*\uFE0F?\u20E3/.test(text) && /[2][^\S\r\n]*\uFE0F?\u20E3/.test(text)) {
    return true;
  }
  // Numbered list with at least option 1 and option 2 separated by -, ), ., ], :, *
  const hasOpt1 = /(?:^|[\n\r\s])(?:\*?\s*1\s*\*?|\[\s*1\s*\])\s*[-–—).:]\s*[A-Za-zÀ-ÿ]/u.test(text);
  const hasOpt2 = /(?:^|[\n\r\s])(?:\*?\s*2\s*\*?|\[\s*2\s*\])\s*[-–—).:]\s*[A-Za-zÀ-ÿ]/u.test(text);
  if (hasOpt1 && hasOpt2) return true;
  // Bold numbered menu "*1* Fiscal ... *2* Contábil"
  if (/\*1\*\s+[A-Za-zÀ-ÿ]/u.test(text) && /\*2\*\s+[A-Za-zÀ-ÿ]/u.test(text)) return true;
  return false;
}

/**
 * Unified detector for auto-replies, WhatsApp Business away/greeting bots, URAs/IVRs,
 * and commercial bots. Must run BEFORE human-handoff, payment-claim, and greetings so
 * URAs mentioning "atendente", "comprovante", or "pagamento" receive TOTAL SILENCE.
 */
export function isAutoReplyOrCommercialBot(text = '', { senderName = '', senderJid = '' } = {}) {
  if (senderJid) {
    const jidStr = String(senderJid);
    if (
      jidStr.includes('status@') ||
      jidStr.includes('@newsletter') ||
      jidStr.includes('@g.us') ||
      jidStr === '0@s.whatsapp.net'
    ) {
      return true;
    }
    const digits = jidStr.split('@')[0].replace(/\D/g, '');
    if (digits && LOOPING_BOT_NUMBERS.has(digits)) {
      return true;
    }
  }

  const raw = String(text || '').trim();
  if (!raw) return false;

  if (hasNumberedUraMenu(raw)) return true;

  const q = normalizeText(raw);
  if (AUTO_REPLY_AND_URA_PATTERNS.some((re) => re.test(q))) {
    return true;
  }

  // Commercial / clinic sender sending a greeting with automated/protocol wording
  if (
    senderName &&
    isBusinessOrNonDoctorSender(senderName) &&
    /\b(protocolo|atendimento|setor|horario|digite|opcao|central|comercial|financeiro|agendamento)\b/.test(q)
  ) {
    return true;
  }

  return false;
}

/**
 * Detects whether a message explicitly claims a payment was made.
 * Excludes non-payment documents like "comprovante de residência/endereço".
 * IMPORTANT: Callers MUST gate payment-claim handling on real server-verified pending payment context!
 */
export function isPaymentClaimText(text = '') {
  const q = normalizeText(text);
  if (!q) return false;
  if (/\bcomprovante\s+de\s+(residencia|endereco|renda|escolaridade|vacin|matricula|crm)\b/.test(q)) {
    return false;
  }
  return /\b(paguei|ja paguei|fiz o pix|mandei o pix|pix pago|esta pago|pagamento (feito|realizado|efetuado|concluido)|transferencia feita)\b|\bcomprovante\b/.test(q);
}

export function sanitizeOutboundAnswer(answer = '') {
  let text = String(answer || '').trim();
  if (!text) return '';
  // Never claim to be a human agent
  if (/\bsou\s+(um\s+|uma\s+)?(agente\s+humano|atendente\s+humano|humano|pessoa\s+real|pessoa\s+de\s+verdade)\b/i.test(text)) {
    text = text.replace(/\b(oi,?\s*)?sou\s+(um\s+|uma\s+)?(agente\s+humano|atendente\s+humano|humano|pessoa\s+real|pessoa\s+de\s+verdade)\.?\s*/gi, 'Sou a Enfª Brisa, assistente virtual da Planta y Raiz. ');
  }
  // Never emit legacy false payment alert phrases
  text = text.replace(/recebemos sua mensagem sobre o pagamento[^.!?\n]*[.!?]?/gi, '');
  text = text.replace(/🔔?\s*pagamento informado[^.!?\n]*[.!?]?/gi, '');
  // Never advertise forbidden claims: "taxa zero", "100% de repasse", "sócio", "participação/distribuição nos lucros", "selecionado(a)"
  text = text.replace(/\btaxa\s+(de\s+intermedia[cç][aã]o\s+|de\s+venda\s+)?zero(?:\s*\(0%\))?\b/gi, 'repasse de 93% (taxa de 7% da plataforma)');
  text = text.replace(/\b(repasse\s+(l[ií]quido\s+)?de\s+100%|100%\s+de\s+repasse)\b/gi, 'repasse de 93% de cada consulta');
  text = text.replace(/\b(participa[cç][aã]o|distribui[cç][aã]o)\s+(nos|dos|de)\s+lucros\b/gi, 'programa de indicações da plataforma');
  text = text.replace(/\bm[eé]dic[oa]s?\s+(?:prescritor(?:es|as|\(a\))?\s+)?s[oó]ci[oa](?:\(a\)|s)?\b/gi, 'médico parceiro credenciado');
  text = text.replace(/\bvoc[eê]\s+foi\s+(selecionad[oa]|escolhid[oa])(?:\(a\))?\b/gi, 'gostaríamos de apresentar a plataforma');
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

/** Mensagem do paciente dizendo que pagou: nunca "recebemos", nunca alerta; só o Mercado Pago confirma. */
export const PAYMENT_CLAIM_ANSWER = T.paymentClaim;

export const AUDIO_ANSWER = T.audio;

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
  return introducedRecently ? T.patientGreetingAgain : T.patientGreeting(name);
}

export function quickResponse({
  question = '',
  senderName = '',
  senderJid = '',
  role = 'patient',
  isAudio = false,
  isCall = false,
  isSticker = false,
  introducedRecently = false,
  hasPendingPaymentContext = false,
  isColdContact = false,
}) {
  const q = normalizeText(question);

  // 1. Stickers / emoji-only / punctuation-only -> total silence
  if (isSticker || (!isAudio && !isCall && question && isMediaOnlyText(question))) {
    return { answer: '', suppressed: true, model: 'media-no-text' };
  }

  // 2. Opt-out is ALWAYS honored immediately (before any suppression)
  if (/^(0|pare|parar|sair|stop|chega|descadastrar)$|\b(nao quero receber|nao tenho interesse|sem interesse|pare de enviar|parar de enviar|nao me mande mais|nao envie mais|remover da lista|remover meu numero)\b/.test(q)) {
    return { answer: T.optOut, optOut: true, model: 'opt-out' };
  }

  // 3. Service-offer spam and auto-replies / URAs / commercial bots -> TOTAL SILENCE
  // MUST run BEFORE emergency, human-handoff, payment-claim, and greeting so URAs
  // mentioning "atendente", "comprovante", "pagamento", or "urgência" never trigger replies.
  if (/secretaria virtual|aumente suas vendas|servico de marketing|venda de seguidores|disparador em massa/.test(q)) {
    return { answer: '', suppressed: true, model: 'service-offer' };
  }
  if (isAutoReplyOrCommercialBot(question, { senderName, senderJid })) {
    return { answer: '', suppressed: true, model: 'auto-reply-suppressed' };
  }

  // 4. PJ / companies / clinics / non-medical businesses -> TOTAL SILENCE
  // Never offer patient Orientação Técnica or fire payment alerts to companies/clinics.
  if (role !== 'doctor' && isBusinessOrNonDoctorSender(senderName)) {
    return { answer: '', suppressed: true, model: 'business-contact-suppressed' };
  }

  // 5. Real human emergency takes priority over sales, media and human handoff.
  if (/suicid|me matar|tirar minha vida|me machucar|infarto|falta de ar|dor forte|dor.*peito|socorro urgente|\bsamu\b|\b192\b/.test(q)) {
    return { answer: T.emergency, model: 'safety-emergency' };
  }

  // 6. Explicit human handoff / complaint / refund / minor / legal
  if (/\b(atendente|humano|pessoa real|pessoa de verdade)\b|preciso falar com|quero falar com|falar com (humano|atendente|alguem|uma pessoa|a equipe|o suporte|o dr|a dra|o edilson)|vou pausar|pausar a automa[cç]|pausar automa[cç]|silenciar automa[cç]|pausar esta conversa|pausa esta conversa|pausar conversa|pause esta conversa|vou pausar para esta conversa|parar automa[cç]|nao quero (falar com )?(robo|bot|ia)|reclamacao|absurdo|estou irritad|\b(reembolso|estorno|devolucao do dinheiro|quero meu dinheiro de volta)\b|\b(menor de idade|crianca de \d+ anos|meu filho de \d+ anos|minha filha de \d+ anos)\b|\b(processo juridico|advogado|juridico|procon)\b/.test(q)) {
    return { answer: T.handoff, handoff: true, model: 'human-handoff' };
  }

  // 7. Identity honesty
  if (/voce e.*(robo|ia|enfermeira|medica)|quem e voce|e um robo|eh um robo/.test(q)) {
    return { answer: T.identity, model: 'identity' };
  }

  // 8. Audio & call handling (never pitch patient OT link to doctors or cold contacts)
  if (isAudio || q === 'audio' || q === '[audio recebido]') {
    return {
      answer: role === 'doctor' || isColdContact ? T.audioNeutral : AUDIO_ANSWER,
      model: 'audio-response',
    };
  }
  if (isCall) return { answer: T.call, model: 'call-response' };

  // 9. Professional onboarding / documents
  if (role !== 'patient' && /\b(nao pago nada|preciso pagar|tem (algum )?custo|e pago|e gratis|cobram|quanto custa (para|pra) (me )?cadastrar)\b/.test(q)) {
    return { answer: T.professionalCost, model: 'professional-cost' };
  }
  if (role === 'doctor' && /\b(quais|que) documentos\b|documentos (preciso|necessarios|que faltam)|o que (preciso|falta) enviar/.test(q)) {
    return { answer: T.doctorDocuments, model: 'doctor-documents' };
  }

  // 10. Payment claim ONLY when server confirms a real pending charge/order for THIS contact (fail-closed)
  if (hasPendingPaymentContext === true && isPaymentClaimText(question)) {
    return { answer: PAYMENT_CLAIM_ANSWER, model: 'payment-claim' };
  }

  // 11. Document submission receipt (without claiming payment approval)
  if (/enviei.*(document|anexo)|mandei.*document/.test(q)) {
    return { answer: T.documentsReceived, model: 'receipt-notice' };
  }

  // 12. Off-topic spam
  if (/\b(corrente de oracao|compartilhe com 10|partido politico|bolsonaro|lula|versiculo|oracao de hoje)\b/.test(q)) {
    return { answer: T.offTopic, model: 'off-topic' };
  }

  // 13. Pure greeting (never pitch patient Orientação Técnica to doctors or cold contacts)
  if (/^(oi|ola|bom dia|boa tarde|boa noite|ok|qk|opa|oie|blz|tudo bem)[\s!?.\p{Emoji_Presentation}]*$/u.test(q)) {
    const name = patientName(senderName);
    if (role === 'doctor') {
      return {
        answer: introducedRecently ? T.doctorGreetingAgain : T.doctorGreeting(name),
        model: 'greeting-response',
      };
    }
    if (isColdContact) {
      return {
        answer: T.coldContactGreeting,
        model: 'cold-contact-greeting',
      };
    }
    return {
      answer: patientGreeting(senderName, introducedRecently),
      model: 'greeting-response',
    };
  }

  // 14. Patient clinical/commercial boundaries (never pitch OT to doctors or cold contacts)
  if (role !== 'doctor' && !isColdContact && /\b(comprar|vender|voces vendem|onde compro|entrega.*(oleo|cbd|canabidiol|cannabis|produto|medicamento)|vender.*(oleo|cbd|canabidiol|cannabis|produto|medicamento))\b/.test(q)) {
    return {
      answer: T.noMedicationSale,
      model: 'no-medication-sale',
    };
  }
  if (role !== 'doctor' && !isColdContact && /\b(remedios?|dormir|insonia|ansiedade|sintomas?|dosagem|posologia|diagnostico|cura)\b/.test(q)) {
    return {
      answer: T.medicalBoundary,
      model: 'medical-boundary',
    };
  }
  return null;
}