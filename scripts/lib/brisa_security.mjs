/**
 * scripts/lib/brisa_security.mjs
 * 
 * Camada de Segurança e Blindagem Anti-Bloqueio (Fase 2 - S1 a S7)
 * Enfermeira Brisa v2 — Planta y Raíz Ltda
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BRISA_CONFIG, buildKycChecklistReply } from '../brisa_onboarding_config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.join(__dirname, '..');
const HUMAN_LOCK_FILE = path.join(STATE_DIR, 'evolution_human_mode_contacts.json');
const BLACKLIST_FILE = path.join(STATE_DIR, 'evolution_optout_blacklist.json');
const CONTACTS_MAP_FILE = path.join(STATE_DIR, 'whatsapp_contacts_map.json');

// Memória de debounce (8 segundos) por contato
const pendingDebounceMap = new Map();

// Memória de histórico recente para anti-repetição
const recentRepliesMap = new Map();

// ============================================================================
// S1. IDENTIFICADOR ÚNICO (normalizeJid)
// ============================================================================
export function normalizeJid(rawJid, additionalData = {}) {
  if (!rawJid) return { normalizedJid: '', aliases: [], phone: '', isLid: false };

  let raw = String(rawJid).trim().toLowerCase();
  const isLid = raw.endsWith('@lid');
  const isGroup = raw.endsWith('@g.us');

  // Remove sufixos comuns do WhatsApp
  let cleanId = raw.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '');
  let phone = '';
  let normalizedJid = '';
  const aliases = new Set([raw]);

  if (isLid) {
    // É um Linked Identity (ID opaco do WhatsApp)
    normalizedJid = `${cleanId}@lid`;
    
    // Tenta resolver para telefone real se o mapa em disco ou additionalData tiver o vínculo
    const knownPhone = additionalData.phone || lookupPhoneFromLid(normalizedJid);
    if (knownPhone) {
      phone = normalizePhoneDigits(knownPhone);
      aliases.add(`${phone}@s.whatsapp.net`);
      aliases.add(phone);
    }
  } else if (!isGroup) {
    phone = normalizePhoneDigits(cleanId);
    normalizedJid = `${phone}@s.whatsapp.net`;
    aliases.add(phone);
    aliases.add(`${phone}@c.us`);

    if (additionalData.lid) {
      const lidClean = String(additionalData.lid).replace(/@.*/, '');
      aliases.add(`${lidClean}@lid`);
    }
  } else {
    normalizedJid = raw;
  }

  return {
    normalizedJid,
    aliases: Array.from(aliases),
    phone,
    isLid,
    isGroup
  };
}

export function normalizePhoneDigits(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits;
}

function lookupPhoneFromLid(lidJid) {
  try {
    if (fs.existsSync(CONTACTS_MAP_FILE)) {
      const map = JSON.parse(fs.readFileSync(CONTACTS_MAP_FILE, 'utf8'));
      return map[lidJid] || null;
    }
  } catch (e) {}
  return null;
}

export function saveContactLidMapping(lidJid, phoneDigits) {
  try {
    let map = {};
    if (fs.existsSync(CONTACTS_MAP_FILE)) {
      map = JSON.parse(fs.readFileSync(CONTACTS_MAP_FILE, 'utf8'));
    }
    map[lidJid] = phoneDigits;
    map[phoneDigits] = lidJid;
    fs.writeFileSync(CONTACTS_MAP_FILE, JSON.stringify(map, null, 2));
  } catch (e) {}
}

// ============================================================================
// S2. PAUSA QUE FUNCIONA & DETECÇÃO DE ATENDENTE HUMANO (24h)
// ============================================================================
export function loadHumanLocked() {
  try {
    if (fs.existsSync(HUMAN_LOCK_FILE)) {
      const raw = JSON.parse(fs.readFileSync(HUMAN_LOCK_FILE, 'utf8'));
      if (Array.isArray(raw)) return new Map(raw.map(item => typeof item === 'string' ? [item, { expiresAt: Date.now() + 24 * 3600 * 1000 }] : [item.jid, item]));
      if (typeof raw === 'object') return new Map(Object.entries(raw));
    }
  } catch (e) {}
  return new Map();
}

export function saveHumanLocked(map) {
  try {
    const obj = {};
    for (const [k, v] of map.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(HUMAN_LOCK_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {}
}

/**
 * Checagem de pausa da IA para um contato
 */
export function checkAiPause(jid, options = {}) {
  const norm = normalizeJid(jid);
  const locked = loadHumanLocked();
  const now = Date.now();

  for (const alias of norm.aliases) {
    if (locked.has(alias)) {
      const record = locked.get(alias);
      if (record.expiresAt && now > record.expiresAt) {
        // Expirou a pausa de 24h
        locked.delete(alias);
        saveHumanLocked(locked);
        continue;
      }
      return {
        paused: true,
        reason: record.reason || 'pausa_solicitada',
        pausedAt: record.pausedAt,
        expiresAt: record.expiresAt,
        pausedBy: record.pausedBy || 'operador'
      };
    }
  }

  return { paused: false };
}

/**
 * Registra intervenção humana (WhatsApp Web ou app móvel) silenciando a IA por 24h
 */
export function registerHumanTakeover(jid, fromMe, isBrisaBot = false) {
  if (!fromMe || isBrisaBot) return false;

  const norm = normalizeJid(jid);
  const locked = loadHumanLocked();
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000); // 24 horas

  const record = {
    jid: norm.normalizedJid,
    paused: true,
    reason: 'atendimento_humano_whatsapp_web',
    pausedAt: new Date(now).toISOString(),
    pausedBy: 'equipe_humana',
    expiresAt
  };

  for (const alias of norm.aliases) {
    locked.set(alias, record);
  }

  saveHumanLocked(locked);
  return true;
}

/**
 * Reativa a IA para um contato (comando REATIVAR_IA <numero>)
 */
export function unpauseAi(jid) {
  const norm = normalizeJid(jid);
  const locked = loadHumanLocked();

  for (const alias of norm.aliases) {
    locked.delete(alias);
  }

  saveHumanLocked(locked);
  return true;
}

// ============================================================================
// S3. PARAR (OPT-OUT COM ZERO TOLERÂNCIA)
// ============================================================================
const OPT_OUT_REGEX = /^\s*(0|pare|parar|sair|remova|remover|descadastrar|nao\s+quero|não\s+quero|nao\s+enviem\s+mais|não\s+enviem\s+mais|bloquear|cancela|cancelar|chega|stop)\b/i;

export function loadBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
      if (Array.isArray(data)) return new Set(data);
      if (typeof data === 'object') return new Set(Object.keys(data));
    }
  } catch (e) {}
  return new Set();
}

export function saveBlacklist(set) {
  try {
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(Array.from(set), null, 2));
  } catch (e) {}
}

export function isOptOutRequested(text = '') {
  if (!text) return false;
  const clean = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return OPT_OUT_REGEX.test(clean) || clean === '0' || clean.includes('este numero ja pediu o encerramento') || clean.includes('este número já pediu o encerramento');
}

export function registerOptOut(jid, text = '') {
  const norm = normalizeJid(jid);
  const blacklist = loadBlacklist();
  const locked = loadHumanLocked();

  for (const alias of norm.aliases) {
    blacklist.add(alias);
    locked.delete(alias); // Opt-out tem precedência permanente sobre pausa temporária
  }

  saveBlacklist(blacklist);
  saveHumanLocked(locked);

  return {
    success: true,
    confirmationReply: "Entendido, removi seu número. Obrigada pela atenção."
  };
}

export function isBlacklisted(jid) {
  const norm = normalizeJid(jid);
  const blacklist = loadBlacklist();
  return norm.aliases.some(alias => blacklist.has(alias));
}

// ============================================================================
// S4. ANTI-ROBÔ DE CONSULTÓRIO & LIMITE DE MENSAGENS SEGUIDAS
// ============================================================================
const AUTO_REPLY_PATTERNS = [
  /agradece\s+(o\s+seu|seu)?\s*contato/i,
  /mensagem\s+autom[aá]tica/i,
  /hor[aá]rio\s+de\s+atendimento/i,
  /n[aã]o\s+estamos\s+dispon[ií]veis/i,
  /estou\s+em\s+atendimento/i,
  /em\s+f[eé]rias/i,
  /n[aã]o\s+ou[çc]o\s+[aá]udios/i,
  /deixe\s+sua\s+mensagem/i,
  /retornaremos\s+em\s+breve/i,
  /atendimento\s+eletr[oô]nico/i,
  /an[uú]ncios\s+interrompidos/i,
  /esta\s+[eé]\s+uma\s+resposta\s+autom[aá]tica/i,
  /canal\s+exclusivo\s+de\s+agendamento/i
];

export function isAutoReplyBot(text = '', senderJid = '') {
  // Avisos de sistema da Meta ou WhatsApp
  if (senderJid && (senderJid.includes('status@') || senderJid.includes('@newsletter') || senderJid === '0@s.whatsapp.net')) {
    return true;
  }

  if (!text) return false;

  const clean = text.trim();
  return AUTO_REPLY_PATTERNS.some(regex => regex.test(clean));
}

/**
 * Garante o limite estrito de no máximo 2 mensagens da Brisa seguidas
 * sem que o contato tenha respondido no meio.
 */
export function checkConsecutiveBrisaLimit(recentMessages = []) {
  if (!Array.isArray(recentMessages) || recentMessages.length === 0) return { allowed: true, count: 0 };

  let consecutiveBrisaCount = 0;
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i];
    if (msg.fromMe) {
      consecutiveBrisaCount++;
    } else {
      break; // O contato falou! Reseta o contador
    }
  }

  return {
    allowed: consecutiveBrisaCount < 2,
    count: consecutiveBrisaCount
  };
}

// ============================================================================
// S5. ANTI-REPETIÇÃO & AGRUPAMENTO (DEBOUNCE 8s)
// ============================================================================
export function debounceIncomingMessage(jid, text, onFlushCallback, delayMs = 8000) {
  const norm = normalizeJid(jid);
  const key = norm.normalizedJid;

  if (pendingDebounceMap.has(key)) {
    const entry = pendingDebounceMap.get(key);
    clearTimeout(entry.timer);
    entry.texts.push(text);
    entry.timer = setTimeout(() => {
      pendingDebounceMap.delete(key);
      const combined = entry.texts.join('\n');
      onFlushCallback(key, combined);
    }, delayMs);
  } else {
    const entry = {
      texts: [text],
      timer: setTimeout(() => {
        pendingDebounceMap.delete(key);
        const combined = entry.texts.join('\n');
        onFlushCallback(key, combined);
      }, delayMs)
    };
    pendingDebounceMap.set(key, entry);
  }
}

/**
 * Verifica se a resposta proposta é muito similar às últimas 3 mensagens enviadas
 */
export function checkSemanticRepetition(proposedText, jid) {
  if (!proposedText) return false;

  const norm = normalizeJid(jid);
  const key = norm.normalizedJid;
  const history = recentRepliesMap.get(key) || [];

  const normProposed = proposedText.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);

  for (const past of history) {
    const normPast = past.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
    if (normProposed === normPast) {
      return true; // Repetição idêntica detectada!
    }
  }

  // Registra no histórico mantendo no máximo 3
  history.push(proposedText);
  if (history.length > 3) history.shift();
  recentRepliesMap.set(key, history);

  return false;
}

// ============================================================================
// S6. DOCUMENTO DE MÉDICO NUNCA É PAGAMENTO
// ============================================================================
export function isDoctorKycMedia(messageObject, contactType = 'medico', isRecruitmentConversation = true) {
  const m = messageObject?.message || messageObject;
  const hasMedia = Boolean(
    m?.documentMessage ||
    m?.imageMessage ||
    m?.documentWithCaptionMessage ||
    m?.pdfMessage
  );

  if (!hasMedia) return false;

  // Se o contato for médico, ou se a conversa for de credenciamento, É KYC! NUNCA PAGAMENTO!
  if (contactType === 'medico' || isRecruitmentConversation) {
    return true;
  }

  return false;
}

export function classifyDoctorDocumentType(filename = '', caption = '', mimeType = '') {
  const combined = `${filename} ${caption} ${mimeType}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/\b(pix|chave)\b|chave_pix|comprovante_pix/i.test(combined)) {
    return 'chave_pix';
  }
  if (/crm|conselho|carteira|registro|medico|medica/i.test(combined)) {
    return 'crm';
  }
  if (/diploma|rqe|especialista|especializa[çc][aã]o|pos|gradua/i.test(combined)) {
    return 'diploma_ou_rqe';
  }
  if (/resid[eê]ncia|endere[çc]o|luz|agua|comprovante|iptu/i.test(combined)) {
    return 'comprovante_residencia';
  }

  return 'crm'; // Default seguro para documento médico
}

// ============================================================================
// S7. HIGIENIZAÇÃO E SANITIZAÇÃO DE NOMES
// ============================================================================
const PREPOSITIONS = new Set(['da', 'de', 'do', 'dos', 'das', 'e', 'del', 'd', 'von', 'van']);

export function sanitizeDoctorName(rawName) {
  if (!rawName) return 'Doutor(a)';

  let n = String(rawName).trim();

  // Se o nome for puramente numérico (ex.: "129076786409510"), descarta
  if (/^\d{8,}$/.test(n)) {
    return 'Doutor(a)';
  }

  // Remove títulos repetidos no início (ex.: "Dr(a). Dr. Geilson", "Dra. A Verônica")
  n = n.replace(/^(dr\(a\)\.?|dr\.|dra\.|dr|dra|doutor\(a\)|doutor|doutora|médico|médica)\s*/gi, '');
  n = n.replace(/^(dr\(a\)\.?|dr\.|dra\.|dr|dra|doutor\(a\)|doutor|doutora|médico|médica)\s*/gi, '');
  
  // Corrige "A Verônica" para "Verônica" quando "A" ou "O" for prefixo isolado
  n = n.replace(/^[aAoO]\s+([A-ZÁ-Ú])/g, '$1');
  n = n.replace(/[–—\-_/\\|]/g, ' ').trim();

  const words = n.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Doutor(a)';

  // Preserva o primeiro nome e sobrenome respeitando preposições
  const cleanWords = [words[0]];
  let i = 1;
  while (i < words.length) {
    const w = words[i].toLowerCase();
    if (PREPOSITIONS.has(w)) {
      cleanWords.push(words[i]);
      i++;
      if (i < words.length) {
        cleanWords.push(words[i]);
        i++;
      }
      break;
    } else {
      cleanWords.push(words[i]);
      break;
    }
  }

  const result = cleanWords.map((w, idx) => {
    const low = w.toLowerCase();
    if (idx > 0 && PREPOSITIONS.has(low)) return low;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');

  return result || 'Doutor(a)';
}

// ============================================================================
// GUARDA DE PRÉ-ENVIO (PRE-SEND GUARD)
// Executado imediatamente antes do disparo na Evolution API
// ============================================================================
export function preSendGuard(jid, text, options = {}) {
  // 1. Está no modo DRY-RUN?
  if (BRISA_CONFIG.DRY_RUN && !options.bypassDryRun) {
    return {
      canSend: false,
      reason: 'DRY_RUN_ACTIVE',
      log: `[DRY-RUN] Simulação de envio para ${jid}: "${text.slice(0, 60)}..." (Disparo cancelado com sucesso)`
    };
  }

  // 2. Contato está na blacklist de opt-out?
  if (isBlacklisted(jid)) {
    return {
      canSend: false,
      reason: 'OPTOUT_BLACKLIST',
      log: `[BLOQUEIO OPT-OUT] Contato ${jid} solicitou exclusão. Disparo barrado na camada de envio.`
    };
  }

  // 3. IA está pausada ou assumiu humano?
  const pauseState = checkAiPause(jid);
  if (pauseState.paused) {
    return {
      canSend: false,
      reason: 'AI_PAUSED',
      log: `[BLOQUEIO PAUSA] IA pausada para ${jid} (${pauseState.reason}). Disparo barrado na camada de envio.`
    };
  }

  return { canSend: true };
}
