export const DAY_MS = 24 * 60 * 60 * 1000;
export const normalizeText = (text = '') => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export function patientName(value = '') {
  if (/[\d@_]/.test(value)) return '';
  const name = value.replace(/^(?:dr\(a\)\.?|dra?\.?|doutora?|paciente|usuario|user)\s+/i, '').trim();
  if (!/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u.test(name) || /^(paciente|usuario|cliente|doutor|doutora)$/i.test(name)) return '';
  return name.split(' ')[0];
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
  if (/atendente|humano|pessoa real|pessoa de verdade|falar com (alguem|uma pessoa|a equipe|o suporte|o dr|a dra|o edilson)|nao quero (falar com )?(robo|bot|ia)|reclamacao|absurdo|estou irritad/.test(q)) return { answer: 'Vou passar para nossa equipe. Retornamos por aqui.', handoff: true, model: 'human-handoff' };
  if (/voce e.*(robo|ia|enfermeira|medica)|quem e voce/.test(q)) return { answer: 'Sou a assistente virtual da Planta y Raiz. A equipe humana acompanha o atendimento. Como posso ajudar?', model: 'identity' };
  if (isAudio || q === 'audio' || q === '[audio recebido]') return { answer: 'Recebi seu áudio, mas aqui só consigo ler texto. Pode escrever em poucas palavras o que você precisa?', model: 'audio-response' };
  if (isCall) return { answer: 'Por aqui não atendemos ligações. Pode escrever sua dúvida?', model: 'call-response' };
  if (/paguei|comprovante|pagamento (feito|realizado)|fiz o pix|mandei o pix|enviei.*(document|anexo)|mandei.*document/.test(q)) return { answer: 'Recebemos. Nossa equipe está conferindo e avisamos por aqui assim que confirmar.', model: 'receipt-notice' };
  if (/secretaria virtual|aumente suas vendas|servico de marketing|venda de seguidores|disparador em massa/.test(q)) return { answer: '', suppressed: true, model: 'service-offer' };
  if (/\b(corrente de oracao|compartilhe com 10|partido politico|bolsonaro|lula|versiculo|oracao de hoje)\b/.test(q)) return { answer: 'Aqui falamos só de atendimento e cadastro na Planta y Raiz.', model: 'off-topic' };
  if (/^(oi|ola|bom dia|boa tarde|boa noite|ok|qk|opa|oie|blz|tudo bem)[\s!?.\p{Emoji_Presentation}]*$/u.test(q)) {
    const name = patientName(senderName);
    return { answer: `Olá${name ? ', ' + name : ''}! Como posso ajudar? ${role === 'doctor' ? 'Em qual etapa do cadastro profissional você precisa de ajuda?' : 'Você já tem cadastro na plataforma?'}`, model: 'greeting-response' };
  }
  if (role !== 'doctor' && /\b(remedios?|dormir|insonia|ansiedade|sintomas?|dosagem|posologia|diagnostico|cura)\b/.test(q)) return { answer: 'Quem avalia isso é o médico na consulta. O primeiro passo é o cadastro gratuito. A prescrição depende da avaliação individual.', model: 'medical-boundary' };
  return null;
}