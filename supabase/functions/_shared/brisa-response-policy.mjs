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
    text = text.replace(/\b(oi,?\s*)?sou\s+(um\s+|uma\s+)?(agente\s+humano|atendente\s+humano|humano|pessoa\s+real|pessoa\s+de\s+verdade)\.?\s*/gi, 'Sou a Enf. Brisa, assistente virtual da Planta y Raiz. ');
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

export function quickResponse({ question = '', senderName = '', role = 'patient', isAudio = false, isCall = false }) {
  const q = normalizeText(question);
  // Emergency takes priority over sales, media and human handoff.
  if (/suicid|me matar|tirar minha vida|me machucar|infarto|falta de ar|dor forte|dor.*peito|socorro urgente|\bsamu\b|\b192\b/.test(q)) return { answer: 'Ligue agora para 192 (SAMU) ou procure o pronto-socorro mais próximo. Não espere atendimento por aqui.', model: 'safety-emergency' };
  if (/\b(atendente|humano|pessoa real|pessoa de verdade)\b|preciso falar com|quero falar com|falar com (humano|atendente|alguem|uma pessoa|a equipe|o suporte|o dr|a dra|o edilson)|vou pausar|pausar a automa[cç]|pausar automa[cç]|silenciar automa[cç]|pausar esta conversa|pausa esta conversa|pausar conversa|pause esta conversa|vou pausar para esta conversa|parar automa[cç]|nao quero (falar com )?(robo|bot|ia)|reclamacao|absurdo|estou irritad|\b(reembolso|estorno|devolucao do dinheiro|quero meu dinheiro de volta)\b|\b(menor de idade|crianca de \d+ anos|meu filho de \d+ anos|minha filha de \d+ anos)\b|\b(processo juridico|advogado|juridico|procon)\b/.test(q)) return { answer: 'Vou passar para nossa equipe humana. Retornamos por aqui.', handoff: true, model: 'human-handoff' };
  if (/voce e.*(robo|ia|enfermeira|medica)|quem e voce|e um robo|eh um robo/.test(q)) return { answer: 'Sou a Enf. Brisa, assistente virtual da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.). A equipe humana acompanha o atendimento. Como posso ajudar?', model: 'identity' };
  if (isAudio || q === 'audio' || q === '[audio recebido]') return { answer: 'Recebi seu áudio, mas aqui só consigo ler texto. Pode escrever em poucas palavras o que você precisa?', model: 'audio-response' };
  if (isCall) return { answer: 'Por aqui não atendemos ligações. Pode escrever sua dúvida?', model: 'call-response' };
  if (/paguei|comprovante|pagamento (feito|realizado)|fiz o pix|mandei o pix|enviei.*(document|anexo)|mandei.*document/.test(q)) return { answer: 'Recebemos. O acesso é liberado automaticamente assim que o sistema confirmar o pagamento. Nossa equipe acompanha por aqui.', model: 'receipt-notice' };
  if (/secretaria virtual|aumente suas vendas|servico de marketing|venda de seguidores|disparador em massa/.test(q)) return { answer: '', suppressed: true, model: 'service-offer' };
  if (/este canal e (da|do|de|exclusivo)|nao consigo verificar cadastro|nao agendamos consultas? por aqui|esta e uma resposta automatica|mensagem automatica|atendimento automatico|secretaria eletronica|assistente virtual de|sou o assistente virtual|nao entendi,?\s*escolha uma das opco|escolha uma das opco|digite o numero da opca|seja muito bem vindo.*atendimento digital|triello/.test(q)) return { answer: '', suppressed: true, model: 'auto-reply-suppressed' };
  if (/^(0|pare|parar|sair|stop|chega|descadastrar)$|\b(nao quero receber|nao tenho interesse|sem interesse|pare de enviar|parar de enviar|nao me mande mais|nao envie mais|remover da lista|remover meu numero)\b/.test(q)) return { answer: 'Entendido, removi seu número e não enviaremos novas mensagens. Obrigada pela atenção.', optOut: true, model: 'opt-out' };
  if (/\b(corrente de oracao|compartilhe com 10|partido politico|bolsonaro|lula|versiculo|oracao de hoje)\b/.test(q)) return { answer: 'Aqui falamos só de atendimento e serviços da Planta y Raiz.', model: 'off-topic' };
  if (/^(oi|ola|bom dia|boa tarde|boa noite|ok|qk|opa|oie|blz|tudo bem)[\s!?.\p{Emoji_Presentation}]*$/u.test(q)) {
    const name = patientName(senderName);
    return {
      answer: role === 'doctor'
        ? `Olá${name ? ', ' + name : ''}! Sou a Enf. Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha). Como posso ajudar no seu cadastro profissional?`
        : `Olá${name ? ', ' + name : ''}! Sou a Enf. Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha). O que te trouxe até a Planta y Raiz hoje?`,
      model: 'greeting-response',
    };
  }
  if (role !== 'doctor' && /\b(comprar|vender|voces vendem|onde compro|entrega.*(oleo|cbd|canabidiol|cannabis|produto|medicamento)|vender.*(oleo|cbd|canabidiol|cannabis|medicamento))\b/.test(q)) {
    return {
      answer: 'A Planta y Raiz não vende nem entrega medicamentos ou produtos derivados de cannabis. Conectamos você à Orientação Técnica educativa (R$ 30) em https://www.plantayraiz.com.br/orientacao-tecnica ou a médicos prescritores em https://www.plantayraiz.com.br/profissionais. Quer saber como funciona?',
      model: 'no-medication-sale',
    };
  }
  if (role !== 'doctor' && /\b(remedios?|dormir|insonia|ansiedade|sintomas?|dosagem|posologia|diagnostico|cura)\b/.test(q)) {
    return {
      answer: 'Quem avalia isso é o médico na consulta — não fazemos diagnóstico nem indicamos medicamento ou dose por aqui. Você pode começar pela Orientação Técnica educativa (R$ 30) em https://www.plantayraiz.com.br/orientacao-tecnica ou escolher um médico em https://www.plantayraiz.com.br/profissionais. Qual prefere?',
      model: 'medical-boundary',
    };
  }
  return null;
}