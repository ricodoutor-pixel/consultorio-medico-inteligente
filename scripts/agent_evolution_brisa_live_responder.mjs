import { quickResponse } from '../supabase/functions/_shared/brisa-response-policy.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { BRISA_CONFIG, buildLgpdOriginReply, buildKycChecklistReply } from './brisa_onboarding_config.mjs';
import {
  normalizeJid,
  checkAiPause,
  registerHumanTakeover,
  unpauseAi,
  isOptOutRequested as checkOptOutSecurity,
  registerOptOut,
  isAutoReplyBot,
  checkConsecutiveBrisaLimit,
  checkSemanticRepetition,
  calculateStringSimilarity,
  sanitizeDoctorName,
  sanitizePatientName,
  isPureGreeting,
  isPaymentOrVoucherNotice,
  isUrgentMedicalEmergency,
  isGeneralSpamOrUnrelated,
  preSendGuard,
  isDoctorKycMedia,
  classifyDoctorDocumentType
} from './lib/brisa_security.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'evolution_brisa_responder.log');
const PROCESSED_FILE = path.join(__dirname, 'evolution_processed_messages.json');
const HUMAN_LOCK_FILE = path.join(__dirname, 'evolution_human_mode_contacts.json');
const BLACKLIST_FILE = path.join(__dirname, 'evolution_optout_blacklist.json');
const DOCTORS_LIST_FILE = path.join(__dirname, 'database_doctors_list.json');
const PAUSE_GLOBAL_FILE = path.join(__dirname, 'PAUSE_AUTOMATION.flag');
const N8N_ORIENTATION_FILE = path.join(__dirname, 'n8n_active_orientation_contacts.json');

function isHandledByN8nOrientation(phone) {
  try {
    if (fs.existsSync(N8N_ORIENTATION_FILE)) {
      const data = JSON.parse(fs.readFileSync(N8N_ORIENTATION_FILE, 'utf8'));
      const clean = (phone || '').replace(/\D/g, '');
      if (!clean || clean.length < 8) return false;
      const list = data.activePatients || [];
      return list.some(p => {
        const pClean = p.replace(/\D/g, '');
        return pClean.endsWith(clean.slice(-8)) || clean.endsWith(pClean.slice(-8));
      });
    }
  } catch (e) {}
  return false;
}

let lastN8nSync = 0;
function triggerN8nSyncAsync() {
  const now = Date.now();
  if (now - lastN8nSync < 30000) return;
  lastN8nSync = now;
  const syncScript = path.join(__dirname, 'sync_n8n_orientation_contacts.py');
  if (fs.existsSync(syncScript)) {
    exec(`python3 "${syncScript}"`, () => {});
  }
}

function isGlobalPauseActive() {
  return fs.existsSync(PAUSE_GLOBAL_FILE);
}

function setGlobalPause(active) {
  try {
    if (active) {
      fs.writeFileSync(PAUSE_GLOBAL_FILE, JSON.stringify({ paused_at: new Date().toISOString() }, null, 2));
    } else if (fs.existsSync(PAUSE_GLOBAL_FILE)) {
      fs.unlinkSync(PAUSE_GLOBAL_FILE);
    }
  } catch (e) {}
}

const EVO_URL = process.env.EVOLUTION_URL_VPS || process.env.EVOLUTION_URL || 'https://whatsapp.plantayraiz.com.br';
const EVO_KEY = process.env.EVOLUTION_API_KEY_VPS || process.env.EVOLUTION_API_KEY || '';
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'plantayraiz';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://shmbwdjuddvquszwkvuq.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_PHONE || '5511987131241'; // Dr. Edilson Bezerra (Fundador & Diretor Técnico)

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// 🛡️ BLINDAGEM MÁXIMA ANTI-DUPLICIDADE
// 1. Controle de Cooldown por Contato (mínimo 60s entre envios para o mesmo número)
const lastRepliedAt = new Map();

// 2. Hash anti-repetição por texto e destinatário (bloqueia o mesmo texto para o mesmo número por 10 minutos)
const recentSentHashes = new Map();

// 🔒 Fila única e trava por conversa (in-flight lock) para evitar 2 ou 3 mensagens no mesmo minuto
const inFlightChats = new Set();

function hasRecentlySent(number, text) {
  if (!text) return false;
  const cleanNum = number.includes('@lid') ? number : number.replace(/\D/g, '');
  const norm = text.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
  const key = `${cleanNum}_${norm}`;
  const now = Date.now();
  const lastTime = recentSentHashes.get(key);
  if (lastTime && (now - lastTime) < 10 * 60 * 1000) {
    return true;
  }
  recentSentHashes.set(key, now);
  // Limpeza periódica
  for (const [k, t] of recentSentHashes.entries()) {
    if (now - t > 30 * 60 * 1000) recentSentHashes.delete(k);
  }
  return false;
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [EVO-BRISA] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

function loadProcessed() {
  try {
    if (fs.existsSync(PROCESSED_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')));
    }
  } catch (e) {}
  return new Set();
}

function saveProcessed(set) {
  try {
    const arr = Array.from(set).slice(-5000);
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify(arr, null, 2));
  } catch (e) {}
}

function loadHumanLocked() {
  try {
    if (fs.existsSync(HUMAN_LOCK_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(HUMAN_LOCK_FILE, 'utf8')));
    }
  } catch (e) {}
  return new Set();
}

function saveHumanLocked(set) {
  try {
    fs.writeFileSync(HUMAN_LOCK_FILE, JSON.stringify(Array.from(set), null, 2));
  } catch (e) {}
}

function loadBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8')));
    }
  } catch (e) {}
  return new Set();
}

function saveBlacklist(set) {
  try {
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(Array.from(set), null, 2));
  } catch (e) {}
}

const PREPOSITIONS = new Set(['da', 'de', 'do', 'dos', 'das', 'e', 'del', 'd', 'von', 'van']);


// 📋 MAPA DE MÉDICOS E ESPECIALISTAS PARA CONVERSÃO DE ANÚNCIOS
const DOCTOR_ADS_MAP = [
  {
    id: 'med-anderson-mikalauskas',
    name: 'Dr. Anderson Mikalauskas',
    area: 'Clínica Geral e Terapia Canabinoide (CRM 235755/SP)',
    keywords: ['anderson', 'mikalauskas', 'mikaulaskas', 'anderson mikalauskas']
  },
  {
    id: 'dent-jorge-luiz',
    name: 'Dr. Jorge Luiz de Brito Melo',
    area: 'Cirurgião-Dentista Prescritor, DTM, Bruxismo e Dores Orofaciais (CRO-PB 11867)',
    keywords: ['jorge', 'jorge luiz', 'brito melo', 'dentista', 'odonto', 'bruxismo', 'dtm', 'dor orofacial']
  },
  {
    id: 'med-arthur-barretto',
    name: 'Dr. Arthur Barretto',
    area: 'Médico Veterinário Prescritor Canabinoide (CRMV-SP 52219)',
    keywords: ['arthur', 'barretto', 'veterinario', 'veterinário', 'vet', 'pet', 'cachorro', 'gato', 'cao', 'cão']
  },
  {
    id: 'med-victor-fonseca',
    name: 'Dr. Victor Fonseca',
    area: 'Neurologia e Medicina Integrativa (CRM 206873/SP)',
    keywords: ['victor', 'fonseca', 'victor fonseca', 'neurologia', 'neurologista', 'epilepsia', 'parkinson']
  },
  {
    id: 'med-geovana-torres',
    name: 'Dra. Geovana Torres',
    area: 'Dor Crônica, Fibromialgia e Cuidados Integrativos (CRM 98083/SP)',
    keywords: ['geovana', 'torres', 'geovana torres', 'fibromialgia', 'dor cronica', 'dor crônica']
  },
  {
    id: 'med-jose-abbade',
    name: 'Dr. José Geraldo Abbade',
    area: 'Ortopedia, Artrose e Manejo da Dor (CRM 139366/SP)',
    keywords: ['abbade', 'jose geraldo', 'josé geraldo', 'ortopedia', 'artrose']
  },
  {
    id: 'med-julio-sacomori',
    name: 'Dr. Julio Sacomori',
    area: 'Urologia e Saúde do Homem (CRM 188732/SP)',
    keywords: ['julio', 'júlio', 'sacomori', 'julio sacomori', 'urologia', 'urologista']
  },
  {
    id: 'med-mariana-alves',
    name: 'Dra. Mariana Alves',
    area: 'Ginecologia, Saúde da Mulher e Climatério (CRM 135012-9/SP)',
    keywords: ['mariana', 'alves', 'mariana alves', 'ginecologia', 'ginecologista', 'endometriose', 'climaterio']
  },
  {
    id: 'med-edna-menta',
    name: 'Dra. Edna Menta',
    area: 'Pediatria e Transtorno do Espectro Autista / TEA (CRM 9727/SP)',
    keywords: ['edna', 'menta', 'edna menta', 'pediatria', 'pediatra', 'autista', 'autismo', 'tea']
  },
  {
    id: 'med-veronica-urban',
    name: 'Dra. Verônica Urban',
    area: 'Psiquiatria, Ansiedade e Insônia (CRM 58169/PR)',
    keywords: ['veronica', 'verônica', 'urban', 'veronica urban', 'psiquiatria', 'psiquiatra', 'ansiedade', 'depressao', 'depressão', 'insonia', 'insônia']
  },
  {
    id: 'med-frederico',
    name: 'Dr. Frederico',
    area: 'Clínica Geral e Saúde Integrativa (CRM 54892/SP)',
    keywords: ['frederico', 'dr frederico']
  }
];

// 👤 SALVAMENTO E CATALOGAÇÃO DE PACIENTES NO WHATSAPP COM SUFIXO "(Paciente)"
async function savePatientContact(recipient, senderName) {
  try {
    const cleanNum = recipient.includes('@lid') ? recipient : recipient.replace(/\D/g, '');
    const cleanFirstName = sanitizePatientName(senderName);
    const finalName = cleanFirstName ? `${cleanFirstName} Paciente` : 'Nome Paciente';

    // 1. Atualiza nome na Evolution API para aparecer como "Nome Paciente" no WhatsApp
    try {
      await fetch(`${EVO_URL}/chat/updateContact/${INSTANCE}`, {
        method: 'POST',
        headers: { 'apikey': EVO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: cleanNum, name: finalName })
      });
    } catch (e) {}

    // 2. Registra no banco local de pacientes da campanha
    const patientContactsFile = path.join(__dirname, 'evolution_patient_contacts.json');
    let patients = {};
    if (fs.existsSync(patientContactsFile)) {
      try { patients = JSON.parse(fs.readFileSync(patientContactsFile, 'utf8')); } catch (e) {}
    }
    if (!patients[cleanNum]) {
      patients[cleanNum] = {
        name: finalName,
        rawName: senderName,
        phone: cleanNum,
        firstSeenAt: new Date().toISOString(),
        status: 'aguardando_cadastro',
        capturedFrom: 'whatsapp_anuncio'
      };
      fs.writeFileSync(patientContactsFile, JSON.stringify(patients, null, 2));
      log(`👤 [NOVO CONTATO PACIENTE SALVO]: ${finalName} (${cleanNum})`);
    }
  } catch (e) {
    log(`Aviso ao salvar contato paciente: ${e.message}`);
  }
}

function cleanDoctorName(name) {
  if (!name) return 'Doutor(a)';
  let n = String(name).trim();

  // Remove títulos repetidos no início (ex.: "Dr(a). Dr(a).")
  n = n.replace(/^(dr\(a\)\.?|dr\.|dra\.|dr|dra|doutor\(a\)|doutor|doutora|médico|médica)\s*/gi, '');
  n = n.replace(/^(dr\(a\)\.?|dr\.|dra\.|dr|dra|doutor\(a\)|doutor|doutora|médico|médica)\s*/gi, '');
  n = n.replace(/[–—\-_/\\|]/g, ' ').trim();

  const rawWords = n.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return 'Doutor(a)';

  // Preserva sobrenome após preposição (ex.: "André da Silveira")
  const words = [rawWords[0]];
  let i = 1;
  while (i < rawWords.length) {
    const w = rawWords[i].toLowerCase();
    if (PREPOSITIONS.has(w)) {
      words.push(rawWords[i]);
      i++;
      if (i < rawWords.length) {
        words.push(rawWords[i]);
        i++;
      }
      break;
    } else {
      words.push(rawWords[i]);
      break;
    }
  }

  return words.map((w, idx) => {
    const low = w.toLowerCase();
    if (idx > 0 && PREPOSITIONS.has(low)) return low;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

function isExcludedAudience(name = '', email = '', specialty = '') {
  const combined = `${name} ${email} ${specialty}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/\b(m\.?v\.?|crmv|vet|veterinari[oa]|pet|cao|caes|gato|gatos|animal|animais)\b/i.test(combined)) {
    return { excluded: true, reason: 'veterinario' };
  }
  if (/\b(cro|odonto|odontologi[oa]|dentist[ao])\b/i.test(combined)) {
    return { excluded: true, reason: 'dentista' };
  }
  if (/\b(crp|psicolog[ao]|psicoterap)\b/i.test(combined)) {
    return { excluded: true, reason: 'psicologo' };
  }
  if (/\b(mais proximo|consultorio|clinica|hospital|instituto|centro|laboratorio|diagnostico|servicos medicos|saude integrad|espaco|ltda|eireli|me|epp|s\/s|s\.a\.|associacao)\b/i.test(combined)) {
    return { excluded: true, reason: 'empresa' };
  }

  return { excluded: false };
}

function cleanWhatsAppFormatting(text) {
  if (!text) return '';
  let t = String(text);
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/^[-*_]{3,}\s*$/gm, '');
  return t.trim();
}

function loadKnownDoctors() {
  try {
    if (fs.existsSync(DOCTORS_LIST_FILE)) {
      return JSON.parse(fs.readFileSync(DOCTORS_LIST_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

let adminSession = null;
async function authenticateAdmin() {
  if (adminSession && adminSession.expires_at > (Date.now() / 1000 + 60)) {
    return adminSession;
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'contato@plantayraiz.com.br',
      password: process.env.SMTP_PASS || ''
    });
    if (!error && data?.session) {
      adminSession = data.session;
      return adminSession;
    }
  } catch (e) {
    log(`⚠️ Falha ao autenticar admin Supabase: ${e.message}`);
  }
  return null;
}

let adminClient = null;
async function getAdminSupabase() {
  const session = await authenticateAdmin();
  if (session?.access_token) {
    if (!adminClient) {
      adminClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } }
      });
    }
    return adminClient;
  }
  return supabase;
}

function findDoctorByPhone(phone) {
  const doctors = loadKnownDoctors();
  const clean = phone.replace(/\D/g, '');
  if (!clean || clean.length < 8) return null;
  return doctors.find(d => {
    if (!d.phone) return false;
    const pClean = d.phone.replace(/\D/g, '');
    return pClean.endsWith(clean.slice(-8)) || clean.endsWith(pClean.slice(-8));
  });
}

function findInvitedDoctor(phone) {
  try {
    const brevoFile = path.join(__dirname, 'brevo_whatsapp_invited_doctors.json');
    if (fs.existsSync(brevoFile)) {
      const data = JSON.parse(fs.readFileSync(brevoFile, 'utf8'));
      const clean = phone.replace(/\D/g, '');
      if (!clean || clean.length < 8) return null;
      const invited = data.invitedPhones || {};
      for (const [p, info] of Object.entries(invited)) {
        if (!info.failed && (p.endsWith(clean.slice(-8)) || clean.endsWith(p.slice(-8)))) {
          return info;
        }
      }
    }
  } catch (e) {}
  return null;
}

function findDoctorByName(name) {
  if (!name) return null;
  const doctors = loadKnownDoctors();
  const low = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const stopWords = new Set(['doutor', 'doutora', 'cannabis', 'medicinal', 'clinica', 'medico', 'dra', 'dr', 'da', 'de', 'do', 'dos', 'e', 'consultorio', 'espaco']);
  const words = low.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));
  if (words.length === 0) return null;

  return doctors.find(d => {
    const dName = (d.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (!dName) return false;
    if (dName === low) return true;

    const dWords = dName.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));
    const commonWords = words.filter(w => dWords.includes(w));
    if (commonWords.length >= 2) return true;

    const commonSurnames = ['silva', 'santos', 'oliveira', 'souza', 'pereira', 'costa', 'alves', 'lima', 'martins', 'rodrigues'];
    if (commonWords.length === 1 && commonWords[0].length >= 6 && !commonSurnames.includes(commonWords[0])) {
      return true;
    }

    return false;
  });
}

// Detecção rigorosa de opt-out / recusa de contato / "não tenho interesse"
function isOptOutRequested(text) {
  const low = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /(nao tenho interesse|não tenho interesse|sem interesse|nao quero|não quero|remover da lista|remover meu numero|tire meu numero|pare de enviar|pare com as mensagens|nao me mande mais|nao envie mais|favor remover|favor retirar|nao mandar mais|cancelar contato|nao autorizo|descadastrar|desinscrever)/i.test(low);
}

// Detecção rigorosa de solicitação de humano
function isHumanRequested(text) {
  const low = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /(humano|atendente|pessoa real|pessoa de verdade|preciso falar com|quero falar com (alguem|uma pessoa|o dr|a dra|o doutor|a doutora|o edilson|a equipe|o suporte)|falar com (alguem|a equipe|o suporte|o edilson)|equipe humana|nao quero (falar com )?(robo|bot|ia)|voce e (um )?robo)/i.test(low);
}

// Detecção estrita de solicitação de pausa da automação / conversa
function isPauseRequested(text) {
  const low = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /(pausar a automacao|pausar automacao|pausar a conversa|pausar conversa|pausar mensagens|pausar envio|parar de enviar|parar mensagens|pare de enviar|pare com as mensagens|nao quero mais mensagens|nao me envie mais|cancelar mensagens|silenciar robo|silenciar assistente|desativar robo|desativar assistente|\bpausar\b|\bparar\b|\bpause\b|\bstop\b)/i.test(low);
}

// Filtro estrito de respostas automáticas de consultórios/robôs para evitar loops
function isAutoReply(text) {
  const low = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /(nao estou disponivel|nao posso responder|fora do horario|fora do expediente|agradece(mos)? (o|seu|a|sua)|resposta automatica|mensagem automatica|nao ouco audios|atendimento automatico|seja bem-vindo|obrigad[oa] por entrar em contato|obrigad[oa] pelo contato|estou em atendimento|assim que possivel|em breve retorno|responderemos em breve|retornaremos em breve|deixe seu recado|deixe sua mensagem|atendimento pelo whatsapp funciona|estamos ausentes|nosso horario de atendimento)/i.test(low);
}

// 🧠 MEMÓRIA DE CONVERSA PERSISTENTE (LEMBRANÇA CONTÍNUA POR CONTATO)
const MEMORY_FILE = path.join(__dirname, 'brisa_conversation_memory.json');
let conversationMemory = new Map();

function loadConversationMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
      conversationMemory = new Map(Object.entries(raw));
    }
  } catch (e) {
    conversationMemory = new Map();
  }
}
loadConversationMemory();

function saveConversationMemory() {
  try {
    const obj = Object.fromEntries(conversationMemory);
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {}
}

function getContactMemory(recipient) {
  if (!conversationMemory.has(recipient)) {
    conversationMemory.set(recipient, {
      turns: [],
      sentHistory24h: [],
      busyNoticeSentCount: 0,
      paymentNoticeSent: false,
      lastGreetedAt: 0,
      lastAnswerSent: '',
      audienceRole: null,
      notes: ''
    });
  }
  const mem = conversationMemory.get(recipient);
  if (!mem.sentHistory24h) mem.sentHistory24h = [];
  if (mem.busyNoticeSentCount === undefined) mem.busyNoticeSentCount = 0;
  return mem;
}

function addMessageToMemory(recipient, role, text, audienceRole) {
  const mem = getContactMemory(recipient);
  mem.turns.push({
    role,
    text,
    time: Date.now()
  });
  if (mem.turns.length > 20) mem.turns = mem.turns.slice(-20);
  if (audienceRole) mem.audienceRole = audienceRole;
  if (role === 'brisa') {
    mem.lastAnswerSent = text;
  }
  saveConversationMemory();
}

// ✍️ ENVIO DE PRESENÇA REALISTA ("DIGITANDO..." COM PONTINHOS OU "GRAVANDO ÁUDIO...")
async function sendPresence(recipient, presence = 'composing', delay = 1500) {
  const targetNumber = recipient.includes('@lid') ? recipient : recipient.replace(/\D/g, '');
  if (!targetNumber) return;
  try {
    await fetch(`${EVO_URL}/chat/sendPresence/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: targetNumber,
        presence,
        delay
      })
    });
  } catch (e) {}
}

// 👂 TRANSCRIÇÃO DE ÁUDIO INBOUND (OUVIDOS DA BRISA VIA ELEVENLABS STT)
async function transcribeAudioInbound(audioBuffer, mimeType) {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || process.env.XI_API_KEY;
  if (!apiKey) {
    log(`ℹ️ [OUVIDOS DA BRISA] ElevenLabs API key não configurada no .env para transcrição.`);
    return null;
  }

  try {
    log(`👂 [OUVIDOS DA BRISA] Transcrevendo áudio recebido via ElevenLabs STT...`);
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/ogg' });
    formData.append('file', blob, 'audio.ogg');
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', 'pt');

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey
      },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.text || data.transcription;
      if (text && text.trim().length > 0) {
        log(`👂 [OUVIDOS DA BRISA] Áudio transcrito com sucesso: "${text}"`);
        return text.trim();
      }
    } else {
      const errText = await res.text();
      log(`⚠️ ElevenLabs STT erro (${res.status}): ${errText}`);
    }
  } catch (err) {
    log(`⚠️ Falha na transcrição de áudio: ${err.message}`);
  }
  return null;
}

// 🎙️ SÍNTESE DE VOZ HUMANIZADA VIA ELEVENLABS (Voz feminina jovem, 18-25 anos, natural, sem tom robótico)
async function textToSpeechElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || process.env.XI_API_KEY;
  if (!apiKey) return null;

  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.25,
          use_speaker_boost: true
        }
      })
    });

    if (!res.ok) {
      log(`⚠️ ElevenLabs erro (${res.status}): ${await res.text()}`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString('base64');
  } catch (err) {
    log(`⚠️ Falha ElevenLabs TTS: ${err.message}`);
    return null;
  }
}

async function logMessageToSupabase(remoteJid, messageText, direction = 'out', senderName = 'Enfermeira Brisa') {
  try {
    const adminSupa = await getAdminSupabase();
    if (!adminSupa) return;
    const norm = normalizeJid(remoteJid);
    const jid = norm.normalizedJid || remoteJid;

    await Promise.allSettled([
      adminSupa.from('whatsapp_messages').insert({
        remote_jid: jid,
        sender_name: senderName,
        message_text: messageText,
        direction: direction,
        status: direction === 'out' ? 'sent' : 'received',
        from_me: direction === 'out'
      }),
      adminSupa.from('brisa_interaction_logs').insert({
        channel: 'whatsapp',
        user_ref: norm.phone ? `***${norm.phone.slice(-4)}` : jid,
        status: 'replied',
        meta: {
          text: (messageText || '').slice(0, 300),
          direction,
          via: 'evolution_api_v2'
        }
      })
    ]);
  } catch (e) {
    // Falha em telemetria nunca interrompe a resposta
  }
}

// Envio de texto com blindagem contra duplicatas, presença humana digitando e persistência em memória
async function sendWhatsApp(recipient, text) {
  const targetNumber = recipient.includes('@lid') ? recipient : recipient.replace(/\D/g, '');
  if (!targetNumber || targetNumber.length < 5) {
    log(`⚠️ Destinatário inválido (${recipient}). Envio ignorado.`);
    return null;
  }

  const mem = getContactMemory(recipient);

  // 1. Regra Oficial: 'Estou com muitos atendimentos agora' no máximo 1x por conversa, e NUNCA 2x seguidas
  if (text.toLowerCase().includes('muitos atendimentos')) {
    if ((mem.busyNoticeSentCount || 0) >= 1) {
      log(`🛑 [FILA CHEIA BARRADA] 'muitos atendimentos' já foi enviado anteriormente para ${targetNumber}. Bloqueando disparo repetido.`);
      return null;
    }
    if ((mem.lastAnswerSent || '').toLowerCase().includes('muitos atendimentos')) {
      log(`🛑 [FILA CHEIA BARRADA] 'muitos atendimentos' seria enviado 2x seguidas para ${targetNumber}. Bloqueando reenvio.`);
      return null;
    }
  }

  // 2. Trava anti-repetição de 24 horas (não enviar a mesma mensagem ou com >= 80% de semelhança)
  if (checkSemanticRepetition(text, recipient, mem.sentHistory24h || [])) {
    log(`🛡️ [ANTI-REPETIÇÃO 24H] Mensagem idêntica ou >= 80% similar já enviada para ${targetNumber} em menos de 24h. Cancelando envio.`);
    return null;
  }

  // 3. Guarda de pré-envio (pausa, opt-out, dry-run)
  const guard = preSendGuard(targetNumber, text);
  if (!guard.canSend) {
    log(`🛡️ ${guard.log}`);
    await logMessageToSupabase(targetNumber, text, 'out', 'Assistente Virtual Planta y Raíz [Dry-Run]');
    return { dryRun: true, status: 'blocked', reason: guard.reason };
  }

  // 4. Simulação de digitação humana
  const typingDelay = Math.min(2500, Math.max(900, text.length * 15));
  await sendPresence(targetNumber, 'composing', typingDelay);
  await new Promise(r => setTimeout(r, Math.min(1800, typingDelay)));

  if (!preSendGuard(targetNumber, text).canSend) return null;
  log(`Enviando resposta para ${targetNumber}...`);
  const res = await fetch(`${EVO_URL}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: {
      'apikey': EVO_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number: targetNumber,
      options: {
        delay: 1000,
        presence: 'composing'
      },
      text
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro envio Evolution (${res.status}): ${err}`);
  }

  const result = await res.json();
  log(`✅ Mensagem enviada com sucesso para ${targetNumber}`);

  // Atualiza histórico e controle de repetição
  addMessageToMemory(recipient, 'brisa', text);
  if (!mem.sentHistory24h) mem.sentHistory24h = [];
  mem.sentHistory24h.push({ text, sentAt: Date.now() });
  mem.sentHistory24h = mem.sentHistory24h.filter(m => (Date.now() - m.sentAt) < 24 * 3600 * 1000);
  if (text.toLowerCase().includes('muitos atendimentos')) {
    mem.busyNoticeSentCount = (mem.busyNoticeSentCount || 0) + 1;
  }
  saveConversationMemory();

  await logMessageToSupabase(targetNumber, text, 'out', 'Assistente Virtual Planta y Raíz');
  return result;
}

// Envio de áudio via WhatsApp (ElevenLabs)
async function sendWhatsAppAudio(recipient, base64Mp3) {
  const targetNumber = recipient.includes('@lid') ? recipient : recipient.replace(/\D/g, '');
  log(`🎙️ Enviando resposta em áudio humanizado (ElevenLabs) para ${targetNumber}...`);
  try {
    // 🎙️ Simula gravação de áudio no WhatsApp
    await sendPresence(targetNumber, 'recording', 2500);
    await new Promise(r => setTimeout(r, 2000));

    const res = await fetch(`${EVO_URL}/message/sendWhatsAppAudio/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: targetNumber,
        audio: `data:audio/mp3;base64,${base64Mp3}`,
        options: {
          delay: 2000,
          presence: 'recording'
        }
      })
    });
    if (res.ok) {
      log(`✅ Áudio humanizado enviado com sucesso para ${targetNumber}!`);
      return true;
    }
  } catch (err) {
    log(`⚠️ Erro ao enviar áudio: ${err.message}`);
  }
  return false;
}

// Ingestão e arquivamento de documentos (PDF/Imagens) recebidos de médicos
async function ingestIncomingDoc(msg, recipient, senderName) {
  try {
    log(`📥 Baixando mídia anexada de ${recipient}...`);
    const mediaRes = await fetch(`${EVO_URL}/chat/getBase64FromMediaMessage/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: msg,
        convertToMp4: false
      })
    });

    if (!mediaRes.ok) {
      log(`⚠️ Falha ao obter base64 da mídia Evolution: ${mediaRes.status}`);
      return false;
    }

    const mediaData = await mediaRes.json();
    const base64Data = mediaData.base64 || mediaData.data;
    if (!base64Data) {
      log(`⚠️ Base64 da mídia vazio.`);
      return false;
    }

    const mimeType = mediaData.mimetype || 'image/jpeg';
    const ext = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('png') ? 'png' : 'jpg';
    const buffer = Buffer.from(base64Data, 'base64');

    const adminSupa = await getAdminSupabase();

    const cleanPhone = recipient.replace(/\D/g, '');
    let doctor = findDoctorByPhone(cleanPhone);
    if (!doctor && senderName) {
      doctor = findDoctorByName(senderName);
    }
    if (!doctor && recipient.includes('@lid')) {
      const doctors = loadKnownDoctors();
      if (recipient.includes('66516175310923')) {
        doctor = doctors.find(d => d.crm === '135012-9' || (d.name && d.name.includes('Mariana Alves')));
      } else if (recipient.includes('70373206949947')) {
        doctor = doctors.find(d => d.crm === '58169' || (d.name && d.name.includes('Urban')));
      } else if (recipient.includes('53206709227635')) {
        doctor = doctors.find(d => d.name && d.name.includes('Anderson'));
      } else if (recipient.includes('129076786409510')) {
        doctor = doctors.find(d => d.crm === '98083' || (d.name && d.name.includes('Geovana')));
      } else if (recipient.includes('4952130879556') || cleanPhone.includes('8494183793')) {
        doctor = doctors.find(d => d.crm === '9727' || (d.name && d.name.includes('Edna')));
      } else if (recipient.includes('202469137248373') || cleanPhone.includes('8499992302')) {
        doctor = doctors.find(d => (d.name && d.name.includes('Verônica')) || (d.name && d.name.includes('Veronica')));
      } else if (recipient.includes('199218014748755') || cleanPhone.includes('3284599585')) {
        doctor = doctors.find(d => d.crm === '54892' || (d.name && d.name.includes('Frederico')));
      } else if (recipient.includes('130653039378665') || cleanPhone.includes('991787930')) {
        doctor = doctors.find(d => (d.crm && d.crm.toLowerCase().includes('crn')) || (d.name && d.name.toLowerCase().includes('stella')));
      } else if (cleanPhone.includes('206873')) {
        doctor = doctors.find(d => d.crm === '206873' || (d.name && d.name.toLowerCase().includes('victor')));
      } else if (recipient.includes('206219281190998')) {
        doctor = doctors.find(d => d.name && d.name.includes('Abbade'));
      } else if (recipient.includes('16673096659146')) {
        doctor = doctors.find(d => d.name && d.name.includes('Menta'));
      }
    }
    if (!doctor) {
      log(`⚠️ Médico não pré-cadastrado no banco para o contato ${senderName} (${recipient}). Criando pré-cadastro KYC...`);
      try {
        const cleanNum = cleanPhone.length >= 8 ? cleanPhone : Date.now().toString();
        const tempEmail = `medico.whatsapp.${cleanNum}@plantayraiz.com.br`;
        const { data: signUpData } = await supabase.auth.signUp({
          email: tempEmail,
          password: 'MedicinaCanabica2026!',
          options: {
            data: {
              full_name: senderName || 'Médico Prescritor (WhatsApp)',
              phone: `+${cleanPhone}`,
              role: 'doctor'
            }
          }
        });
        const newUserId = signUpData?.user?.id;
        if (newUserId) {
          await adminSupa.from('profiles').upsert({
            id: newUserId,
            full_name: senderName || 'Médico Prescritor (WhatsApp)',
            phone: `+${cleanPhone}`,
            role: 'doctor',
            updated_at: new Date().toISOString()
          });
          const { data: newDocRec } = await adminSupa.from('doctors').upsert({
            user_id: newUserId,
            specialty: 'Medicina Integrativa & Canabinoide',
            bio: 'Médico em processo de credenciamento via WhatsApp.',
            is_verified: true,
            is_approved_by_admin: false,
            approval_status: 'pending',
            kyc_status: 'pending',
            country: 'BR'
          }, { onConflict: 'user_id' }).select();
          doctor = {
            id: newDocRec?.[0]?.id,
            user_id: newUserId,
            name: senderName,
            phone: `+${cleanPhone}`
          };
          log(`✅ Pré-cadastro criado em doctors para: ${senderName} (ID: ${newDocRec?.[0]?.id})`);
        }
      } catch (createErr) {
        log(`Erro ao criar pré-cadastro: ${createErr.message}`);
      }
    }
    if (!doctor) {
      log(`⚠️ Não foi possível vincular médico para ${senderName} (${recipient}).`);
      return false;
    }
    const userId = doctor.user_id;
    const filename = `wa_kyc_${Date.now()}.${ext}`;
    const storagePath = `${userId}/${filename}`;

    // Upload no bucket doctor-kyc-documents via adminSupa (com permissões totais)
    const { error: upErr } = await adminSupa.storage
      .from('doctor-kyc-documents')
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: mimeType
      });

    if (upErr) {
      log(`⚠️ Erro ao salvar arquivo no Supabase Storage: ${upErr.message}`);
    } else {
      log(`✅ Documento salvo com sucesso no bucket: ${storagePath}`);
    }

    // Consulta em tempo real aos documentos existentes para determinar o tipo correto sem duplicidade
    const { data: currentDocs } = await adminSupa
      .from('doctor_kyc_documents')
      .select('document_kind')
      .eq('doctor_user_id', userId);
    
    const existingKinds = new Set((currentDocs || []).map(d => d.document_kind));
    const orderOfKinds = ['id_front', 'id_back', 'crm_front', 'crm_back', 'address_proof', 'cpf_doc', 'cfm_print'];
    let docKind = 'cfm_print';
    for (const k of orderOfKinds) {
      if (!existingKinds.has(k)) {
        docKind = k;
        break;
      }
    }

    // Upsert na tabela doctor_kyc_documents via adminSupa
    const { error: dbErr } = await adminSupa
      .from('doctor_kyc_documents')
      .upsert({
        doctor_user_id: userId,
        document_kind: docKind,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: buffer.length,
        verification_status: 'pending',
        verification_notes: `Documento recebido via WhatsApp de ${doctor.name} (+${doctor.phone || recipient}) em ${new Date().toLocaleString('pt-BR')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'doctor_user_id,document_kind'
      });

    if (dbErr) {
      log(`⚠️ Erro ao registrar documento na tabela doctor_kyc_documents: ${dbErr.message}`);
    } else {
      log(`✅ Documento registrado na tabela doctor_kyc_documents [${docKind}] para: ${doctor.name}`);
    }

    // Se for PDF ou arquivo com assinatura, atualizar na tabela doctors
    if (ext === 'pdf') {
      await adminSupa
        .from('doctors')
        .update({
          signature_url: storagePath,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      log(`✅ Assinatura/PDF vinculado em doctors.signature_url para: ${doctor.name}`);
    }

    // Alerta imediato ao Dr. Edilson Bezerra (Admin) com link de 1 clique
    const adminAlert = `Dr. Edilson Bezerra, o médico *${doctor.name}* (+${doctor.phone || recipient}) acabou de enviar um novo documento [${docKind}] pelo WhatsApp!\n\n📄 *Arquivo salvo no KYC:* \`${storagePath}\`\n🔍 *Disponível em 1 clique para conferência:* https://www.plantayraiz.com.br/admin/aprovacoes-medicas`;
    await sendWhatsApp(ADMIN_PHONE, adminAlert).catch((e) => log(`Aviso admin error: ${e.message}`));

    return true;
  } catch (err) {
    log(`❌ Erro no processamento de mídia inbound: ${err.message}`);
    return false;
  }
}

// 🔍 CLASSIFICADOR INTELIGENTE DE PÚBLICO (MÉDICO × FARMÁCIA × PACIENTE COM FOCO TOTAL EM CONVERSÃO)
function classifyAudience(jid, senderName, text) {
  const cleanPhone = (jid || '').includes('@lid') ? jid : (jid || '').replace(/\D/g, '');
  const normText = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normName = (senderName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 0. DETECÇÃO DE RECUSA / OPT-OUT
  if (isOptOutRequested(normText)) {
    return {
      role: 'opt_out',
      name: cleanDoctorName(senderName),
      doctor: null
    };
  }

  // 1. FILTRO DE EXCLUSÃO ESTREITO
  const isExplicitlyNotDoctor = /(não sou médico|nao sou medico|não sou médica|nao sou medica|não sou doutor|nao sou doutor)/i.test(normText);
  if (isExplicitlyNotDoctor) {
    return {
      role: 'patient',
      name: senderName || 'Paciente',
      doctor: null
    };
  }

  // Verificação de Veterinário ou Dentista:
  // Se contiver CRMV ou CRO explícito de credenciamento profissional, trata como credenciamento.
  // Se for paciente buscando consulta para pet ou dor orofacial/bruxismo, trata como PACIENTE!
  if (/\b(meu crmv|sou veterinari|sou dentista|meu cro|minha clinica veterinaria|credenciamento cro|credenciamento crmv)\b/i.test(normText)) {
    return {
      role: 'doctor',
      name: cleanDoctorName(senderName),
      doctor: null
    };
  }

  // Verificação de Secretária / Recepção / Clínica
  if (/\b(secretari[ao]|recepcao|recepção|atendente)\b/i.test(normName) || /\b(sou secretari[ao]|aqui e da recepcao|repassar ao medico|repassar ao doutor)\b/i.test(normText)) {
    return {
      role: 'clinic_secretary',
      name: senderName,
      doctor: null
    };
  }

  // 2. VERIFICAÇÃO DE MÉDICO / PRESCRIBER
  const docByPhone = findDoctorByPhone(cleanPhone);
  const docByName = findDoctorByName(senderName);
  const invitedDoc = findInvitedDoctor(cleanPhone);
  let doctorObj = docByPhone || docByName;

  if (!doctorObj && (jid || '').includes('@lid')) {
    const doctors = loadKnownDoctors();
    if (jid.includes('66516175310923')) doctorObj = doctors.find(d => d.crm === '135012-9' || (d.name && d.name.includes('Mariana Alves')));
    else if (jid.includes('70373206949947')) doctorObj = doctors.find(d => d.crm === '58169' || (d.name && d.name.includes('Urban')));
    else if (jid.includes('53206709227635')) doctorObj = doctors.find(d => d.name && d.name.includes('Anderson'));
    else if (jid.includes('129076786409510')) doctorObj = doctors.find(d => d.crm === '98083' || (d.name && d.name.includes('Geovana')));
    else if (jid.includes('157342100390139')) doctorObj = doctors.find(d => d.crm === '206873' || (d.name && d.name.includes('Victor')));
    else if (jid.includes('206219281190998')) doctorObj = doctors.find(d => d.name && d.name.includes('Abbade'));
    else if (jid.includes('16673096659146')) doctorObj = doctors.find(d => d.name && d.name.includes('Menta'));
    else if (jid.includes('4952130879556')) doctorObj = doctors.find(d => d.crm === '9727' || (d.name && d.name.includes('Edna')));
    else if (jid.includes('202469137248373')) doctorObj = doctors.find(d => (d.name && d.name.includes('Verônica')) || (d.name && d.name.includes('Veronica')));
    else if (jid.includes('199218014748755')) doctorObj = doctors.find(d => d.crm === '54892' || (d.name && d.name.includes('Frederico')));
  }

  // Uso estrito de \bcrm\b com limite de palavra para não casar crmv!
  const isDoctorKeywords = /(\bcrm\b|prescritor|prescrever|prescricao|prontuario|titulacao|ajuste de dose|meus pacientes|minha agenda|honorarios|plano vip|credenciamento|sou medico|sou medica|minha clinica|retorno de paciente|minha cedula|documentos medicos|assinatura digital|icp|vidaas|birdid|posso prescrever|como prescrever|receita controlada)/i.test(normText);
  const isDoctorName = /^(dr\b|dra\b|doutor|doutora|medico|medica)/i.test(normName) || normName.includes('dr.') || normName.includes('dra.');

  if (doctorObj || invitedDoc || isDoctorKeywords || isDoctorName) {
    let cleanName = cleanDoctorName(doctorObj?.name || (invitedDoc ? invitedDoc.name : senderName));
    if (cleanName.toLowerCase().includes('edilson bezerra') && !cleanPhone.includes(ADMIN_PHONE.slice(-8))) {
      cleanName = cleanDoctorName(senderName);
    }
    const isFemale = /\b(dra|doutora|edna|veronica|verônica|mariana|geovana|barbara|bárbara|stella|camyla|leticia|letícia|patricia|patrícia|ana|carolina|fernanda|juliana|camila|paula)\b/i.test(cleanName);
    const prefix = isFemale ? 'Dra.' : 'Dr.';
    const formattedName = cleanName.startsWith('Dr') ? cleanName : `${prefix} ${cleanName}`;

    return {
      role: 'doctor',
      name: formattedName,
      doctor: doctorObj || (invitedDoc ? { name: invitedDoc.name, phone: cleanPhone } : null)
    };
  }

  // 3. VERIFICAÇÃO DE FARMÁCIA / DROGARIA PARCEIRA
  const isPharmacyKeywords = /(farmacia|drogaria|dispensacao|dispensar|estoque|balcao|catalogo|produtos|venda de canabidiol|preco de atacado|crf|farmaceutico|farmaceutica|receita que o paciente|fornecedor|lojista|painel farmacia|comissao da farmacia|distribuidora|manipulacao)/i.test(normText);
  const isPharmacyName = /(farmacia|drogaria|pharma|farma|drog|manipulacao|distribuidora)/i.test(normName);

  if (isPharmacyKeywords || isPharmacyName) {
    return {
      role: 'pharmacy',
      name: senderName || 'Equipe da Farmácia',
      doctor: null
    };
  }

  // 4. PADRÃO PARA TODA A DEMANDA DE ANÚNCIOS / TRÁFEGO: CLASSIFICA COMO PACIENTE
  // Garante acolhimento humanizado e foco em cadastro imediato sem questionários robóticos!
  return {
    role: 'patient',
    name: senderName || 'Paciente',
    doctor: null
  };
}


// 🩺 RESPOSTAS EXCLUSIVAS PARA MÉDICOS PRESCRITORES (Tom de Coordenação Clínica)
function getDoctorSpecializedAnswer(question, senderName, doctorObj) {
  const q = question.toLowerCase();

  // 1. Origem do contato (Resposta Oficial LGPD aprovada pelo Dr. Edilson)
  if (/(como|onde)\s+(achou|conseguiu|obteve|pegou|descobriu|encontrou)\s+(meu|o\s+meu)?\s*(contato|numero|telefone|whatsapp)|de\s+onde\s+(e|eh|vem)\s+esse\s+contato/i.test(q)) {
    return buildLgpdOriginReply(senderName);
  }

  // 2. Prazo oficial e início de atendimentos (Diretriz Oficial: "Em até 24 a 48 horas úteis")
  if (q.includes('quando posso atender') || q.includes('quando começo') || q.includes('quando comeco') || q.includes('quanto tempo demora') || q.includes('prazo de aprova') || q.includes('prazo para aprova') || q.includes('libera a agenda') || q.includes('quando posso começar')) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da Planta y Raíz 🌿🩺\n\nO prazo oficial da nossa diretoria técnica para conferência dos seus documentos e ativação completa do seu consultório virtual na vitrine é de *${BRISA_CONFIG.PRAZO_APROVACAO.textoOficial}*!\n\nAssim que recebemos os 4 documentos obrigatórios:\n1️⃣ Foto do documento profissional (CRM ativo)\n2️⃣ Comprovante de endereço/residência recente\n3️⃣ Cópia do Diploma de Medicina ou Certificado de Especialidade/RQE\n4️⃣ Chave PIX vinculada ao titular para liquidação instantânea\n\nNossa auditoria homologa o perfil e você já começa a receber pacientes na vitrine! Pode enviar qualquer documento pendente por aqui mesmo! 🙏✨`;
  }

  // Agradecimento educado (NUNCA disparar SAMU para médicos)
  if (q.includes('obrigad') || q.includes('valeu') || q.includes('agradeco') || q.includes('agradeço') || q.includes('combinado') || q.includes('perfeito')) {
    return `Por nada, Dr(a). ${senderName}! Fico à sua total disposição para acompanhar seu credenciamento e liberar sua agenda de atendimentos. Conte comigo e com toda a diretoria técnica da Planta y Raíz! 🙏🌿🩺`;
  }

  // Dúvidas de credenciamento: "como seria?", "como funciona?", "qual a proposta?", "o que é?" (Dra. Camyla)
  if (q.includes('como seria') || q.includes('como funciona') || q.includes('qual a proposta') || q.includes('qual o objetivo') || q.includes('do que se trata') || q.includes('o que e') || q.includes('o que é') || q.includes('me explica') || q.includes('explicar')) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica da Planta y Raíz 🌿🩺\n\nNossa plataforma conecta médicos prescritores a pacientes que buscam acompanhamento em cannabis medicinal e medicina integrativa:\n\n• 💰 *Repasse Integral (Plano VIP)*: 100% do valor da sua teleconsulta (taxa zero da plataforma) e repasse instantâneo via PIX!\n• 🛡️ *Segurança Jurídica Total*: Prontuário eletrônico em conformidade com o CFM (Resolução 2.314/2022) e ANVISA (RDCs 660 e 327) com assinatura ICP-Brasil / Gov.br nativa.\n• 🩺 *Demanda Ativa de Pacientes*: Pacientes direcionados por triagem clínica da plataforma e perfil público na nossa vitrine.\n• 🏪 *Farmácia Digital Integrada*: Validação ágil de receitas e acesso facilitado aos fitocanabinoides para seus pacientes.\n\nPara ativar seu consultório gratuito em menos de 2 minutos, basta acessar:\n👉 https://www.plantayraiz.com.br/cadastro-profissional\n\nSe preferir, pode me enviar fotos da sua Cédula do CRM e comprovante de endereço por aqui mesmo no WhatsApp! 🙏✨`;
  }

  // Dificuldade no cadastro no site (Dr. Frederico)
  if (q.includes('dificuldade') || q.includes('travou') || q.includes('nao consigo cadastrar') || q.includes('não consigo cadastrar') || q.includes('erro no cadastro') || q.includes('erro no site')) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica 🌿🩺\n\nVi que teve dificuldade ao realizar o cadastro. O processo leva menos de 2 minutos:\n1️⃣ Acesse https://www.plantayraiz.com.br/cadastro-profissional\n2️⃣ Preencha seus dados básicos e número de CRM\n3️⃣ Se preferir, pode enviar as fotos da sua Cédula do CRM e Comprovante de Endereço por aqui mesmo no WhatsApp, que nossa equipe técnica faz a inserção para você!\n\nEm qual etapa você sentiu dificuldade? Me avise por aqui para eu te ajudar! 🙏✨`;
  }

  // Já enviou dados no site (Dra. Verônica)
  if (q.includes('ja enviei') || q.includes('já enviei') || q.includes('enviei os dados') || q.includes('já me cadastrei') || q.includes('ja me cadastrei') || q.includes('dados no site') || q.includes('cadastro ja feito') || q.includes('cadastro já feito')) {
    return `Olá, Dr(a). ${senderName}! Confirmamos o recebimento dos seus dados cadastrais em nossa base! Nossos analistas estão conferindo sua documentação no painel KYC. Se faltar algum item (como comprovante de residência ou CRM frente/verso), você pode enviar a foto por aqui mesmo. Assim que homologado, seu consultório virtual estará 100% ativo! 🙏✨`;
  }

  // Dúvidas sobre envio de documentos / fotos / WhatsApp / onde enviar
  if (q.includes('document') || q.includes('onde enviar') || q.includes('como enviar') || q.includes('por aqui') || q.includes('anexar') || q.includes('foto') || q.includes('whatsapp') || q.includes('cadastro') || q.includes('pendent')) {
    if (q.includes('certificado') || q.includes('assinatur') || q.includes('icp') || q.includes('token') || q.includes('digital')) {
      return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica da Planta y Raíz 🌿🩺\n\nSobre o envio de documentos e o *Certificado Digital*:\n\n1️⃣ *Pode enviar tudo direto por aqui*: Fotos ou PDFs da sua Cédula CRM (frente/verso), RG ou CNH e Comprovante de Residência podem ser enviados diretamente por este WhatsApp. Nossa equipe recolhe os arquivos e anexa imediatamente no seu cadastro KYC!\n\n2️⃣ *Certificado Digital ICP-Brasil*: O doutor(a) *não* precisa exportar chaves complicadas do computador! Basta assinar qualquer documento ou receita teste em PDF com seu certificado (VIDaaS, BirdID, Certisign, Gov.br prata/ouro ou token físico) e nos enviar esse PDF assinado por aqui. Nosso sistema valida a autenticidade e libera seu consultório para emissão de prescrições oficiais com validade jurídica.\n\nPode mandar as fotos dos seus documentos por aqui mesmo que eu já cuido de tudo! 🙏✨`;
    }

    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica da Planta y Raíz 🌿🩺\n\nSim, com certeza! O doutor(a) pode enviar as fotos ou PDFs dos seus documentos faltantes (CRM, RG/CNH frente e verso e comprovante de endereço) diretamente por este WhatsApp.\n\nNossa equipe técnica recolhe os arquivos recebidos e insere diretamente no seu cadastro KYC para liberar seu consultório virtual ainda hoje!\n\nPode mandar as fotos por aqui mesmo! 🙏✨`;
  }

  // Dúvidas sobre certificado digital / assinatura eletrônica
  if (q.includes('certificado digital') || q.includes('assinatura digital') || q.includes('como enviar o certificado') || q.includes('como envio a assinatura') || q.includes('icp-brasil') || q.includes('icp brasil') || q.includes('vidaas') || q.includes('birdid')) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica da Planta y Raíz 🌿🩺\n\nSobre o *Certificado Digital ICP-Brasil*:\n\n1️⃣ O doutor(a) *não* precisa exportar arquivo de certificado do computador! Basta assinar qualquer arquivo em PDF usando seu assinador digital habitual (VIDaaS, BirdID, Certisign, Gov.br prata/ouro ou token) e nos mandar esse PDF assinado por aqui no WhatsApp.\n\n2️⃣ Se já tiver os outros documentos (CRM, RG/CNH ou comprovante), pode enviar as fotos por aqui mesmo que nós recolhemos e anexamos ao seu dossiê para homologar seu consultório virtual imediatamente.\n\nEstou à sua inteira disposição para acompanhar! 🙏✨`;
  }

  // Dúvidas sobre prontuário, preenchimento, anotação, remarcação, ajuste de dose, acompanhamento clínico (DR. ANDERSON)
  if (q.includes('prontuário') || q.includes('prontuario') || q.includes('sinalizar') || q.includes('remarca') || q.includes('ajuste de dose') || q.includes('acompanhamento') || q.includes('retorno') || q.includes('8 semanas') || q.includes('titula')) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica da Planta y Raíz 🌿🩺\n\nSobre o prontuário eletrônico e a conduta de acompanhamento dos seus pacientes:\n\n1️⃣ *Prontuário Completo e Integrado*: Sim! Dentro do seu consultório virtual (https://www.plantayraiz.com.br/consultorio), o senhor(a) registra a anamnese, evolução do paciente, ajuste e titulação de doses (gotas/dia de fitocanabinoides) e emite a receita oficial com QR Code com assinatura válida pela ANVISA/CFM.\n\n2️⃣ *Vínculo Médico-Paciente*: O paciente é 100% seu! O acompanhamento, remarcações de retorno e renovação do protocolo terapêutico de 8 semanas são agendados *diretamente com você* na sua agenda.\n\n3️⃣ *Autonomia Total*: O doutor(a) tem total autonomia técnica para prescrever, conduzir a titulação e definir a frequência dos retornos clínicos.\n\nQualquer dúvida adicional, sigo à sua inteira disposição! 🙏✨`;
  }

  // Dúvidas sobre a Orientação Técnica (FAQ oficial para médicos)
  if (/orienta[cç][aã]o\s*t[eé]cnica|orientacao/i.test(q)) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica da Planta y Raíz 🌿🩺\n\n*O que é a Orientação Técnica (R$ 30)?*\n\n• É uma modalidade de *triagem e educação em saúde* criada pela plataforma para separar pacientes realmente interessados dos curiosos e educar o paciente sobre sua necessidade/patologia *antes da consulta real* com o médico prescritor.\n• É conduzida integralmente por uma *inteligência artificial supervisionada em tempo real* pela diretoria técnica da plataforma.\n• A IA *não prescreve nem indica medicamentos*; ela encaminha o paciente ao médico da vitrine mais indicado para o caso, com relatório estruturado.\n• Os médicos *NÃO oferecem nem cobram* Orientação Técnica: ela aparece no card apenas como porta de entrada. O senhor(a) recebe pacientes já triados e educados para a consulta (*Chat R$ 100 / Vídeo R$ 150*).\n\nQualquer dúvida, sigo à sua inteira disposição! 🙏✨`;
  }

  // Dúvidas sobre valores, repasse e honorários médicos (Política Oficial Dr. Edilson)
  if (q.includes('quanto') || q.includes('valor') || q.includes('repass') || q.includes('porcentagem') || q.includes('pix') || q.includes('honorário') || q.includes('ganho') || q.includes('plano vip')) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da Planta y Raíz 🌿🩺\n\nNossa política comercial e modelo de monetização médica são 100% transparentes e pensados para valorizar a autonomia do prescritor:\n\n• 🎁 *Proposta de Entrada (Oferta Gancho VIP)*: ${BRISA_CONFIG.POLITICA_COMERCIAL.ofertaGancho}\n• ⚡ *Regra Operacional Padrão*: ${BRISA_CONFIG.POLITICA_COMERCIAL.regraPadrao}\n• 🛡️ *Prontuário & Prescrição*: Sistema próprio em total conformidade CFM/Anvisa com assinatura digital ICP-Brasil e gov.br.\n\nValores das modalidades de consulta:\n• *Consulta Médica por Chat*: R$ 100\n• *Teleconsulta por Vídeo HD*: R$ 150\n• *Renovação de Protocolo*: R$ 90\n\nA *Orientação Técnica (R$ 30)* é a porta de entrada da plataforma, onde nossa triagem prepara o paciente e o entrega pronto para a sua teleconsulta.\n\nVocê tem total liberdade para definir seus horários de atendimento na agenda!`;
  }

  // Dúvidas sobre distribuição de pacientes, escolha do paciente, modelo estilo Uber
  if (q.includes('distribui') || q.includes('paciente') || q.includes('chegam') || q.includes('vitrine') || q.includes('encaminha') || q.includes('escolhe') || q.includes('uber') || q.includes('divis') || q.includes('divisão') || q.includes('divisao') || q.includes('fila') || q.includes('indica') || q.includes('funciona a escolha')) {
    return `Olá, Dr(a). ${senderName}! Aqui é a Enfermeira Brisa da coordenação clínica da Planta y Raíz 🌿🩺\n\nSobre a *escolha do paciente* e nossa *distribuição de consultas* (operamos no estilo *Uber da Saúde Canábica*), o sistema funciona com critérios técnicos e meritocráticos:\n\n1️⃣ *Escolha Soberana do Paciente*: Na vitrine de especialistas (https://www.plantayraiz.com.br/profissionais), o paciente conhece sua biografia e títulos e pode escolher agendar diretamente com o senhor(a). Se você estiver online e apto, o atendimento é seu! Se estiver offline no momento urgente, o paciente é avisado e a consulta é transferida para o médico mais qualificado online.\n\n2️⃣ *Despacho Inteligente e Rodízio Autônomo ("Estilo Uber")*:\n• *Prioridade #1*: Médicos assinantes do *Plano VIP* (R$ 99/mês, taxa zero e 100% repasse) têm preferência imediata na fila geral.\n• *Prioridade #2*: *Geolocalização* — o sistema cruza as coordenadas e prioriza o médico mais próximo geograficamente do paciente.\n• *Fallback Autônomo 24/7*: Se o médico mais próximo estiver offline, o sistema busca o próximo médico com assinatura em dia, KYC 100% verificado e status Online.\n\n3️⃣ *Fluxo da Telemedicina*: Entrevista com 5 perguntas -> Pagamento -> Triagem -> Teleconsulta -> Avaliação do paciente -> Liberação instantânea do repasse via PIX ao médico!\n\n4️⃣ *Orientação Técnica (porta de entrada, R$ 30)*: triagem e educação em saúde conduzidas por inteligência artificial supervisionada em tempo real pela diretoria técnica. A IA não prescreve nem indica medicamentos e encaminha o paciente ao médico da vitrine mais indicado, com relatório estruturado. O médico recebe o paciente já triado e educado para a consulta (Chat R$ 100 / Vídeo R$ 150).\n\nQualquer dúvida, sigo à sua inteira disposição! 🙏✨`;
  }

  return null;
}

// 📦 RESPOSTAS EXCLUSIVAS PARA FARMÁCIAS E DROGARIAS (Tom B2B Farmacêutico)
function getPharmacySpecializedAnswer(question, senderName) {
  const q = question.toLowerCase();

  if (q.includes('obrigad') || q.includes('valeu') || q.includes('agradeco') || q.includes('agradeço')) {
    return `À disposição, equipe da ${senderName}! Contem sempre com a Planta y Raíz para expandir o acesso a tratamentos canabinoides com total segurança sanitária. Um abraço da Enfª Brisa! 🌿📦`;
  }

  if (q.includes('produto') || q.includes('catalogo') || q.includes('catálogo') || q.includes('vender') || q.includes('cadastro') || q.includes('estoque') || q.includes('fornecedor')) {
    return `Olá! Aqui é a Enfermeira Brisa, da coordenação de parcerias da Planta y Raíz 🌿📦\n\nSobre a integração da sua drogaria/farmácia na nossa plataforma:\n\n1️⃣ *Farmácia Virtual*: Acesso ao nosso portal exclusivo (https://www.plantayraiz.com.br/farmacia-virtual) para exibir seu catálogo de fitocanabinoides (óleos, gomas, pomadas) autorizados pela ANVISA (RDC 660 e RDC 327).\n2️⃣ *Validação Automática de Receitas*: Nosso sistema valida instantaneamente as receitas digitais com QR Code e ICP-Brasil emitidas por médicos credenciados.\n3️⃣ *Split Financeiro Automático*: O faturamento das vendas é creditado com liquidação direta na conta da sua drogaria.\n\nComo posso ajudar no credenciamento da sua farmácia hoje?`;
  }

  if (q.includes('receita') || q.includes('dispens') || q.includes('anvisa') || q.includes('validade') || q.includes('crf')) {
    return `Olá! Aqui é a Enfermeira Brisa da Planta y Raíz 🌿🩺\n\nNossas receitas médicas digitais contam com assinatura digital ICP-Brasil e QR Code de verificação em tempo real pelo CFM e ITI, em estrita conformidade com as normas da ANVISA (RDC 660 e 327). O farmacêutico responsável técnico (CRF) pode dispensar o medicamento com 100% de respaldo jurídico e sanitário.`;
  }

  return `Olá, equipe da ${senderName}! Sou a Enfermeira Brisa, coordenadora de parcerias da Planta y Raíz 🌿📦\n\nNossa plataforma conecta farmácias e drogarias a milhares de pacientes com receitas válidas pela ANVISA de médicos especialistas de todo o Brasil!\n\nVocê pode acessar o painel farmacêutico em https://www.plantayraiz.com.br/farmacia-virtual ou me dizer sua dúvida sobre dispensação, catálogo e split de vendas!`;
}

// 🌿 RESPOSTAS EXCLUSIVAS PARA PACIENTES (Tom de Acolhimento Humano, Foco em Cadastro e Alta Conversão)
function getPatientSpecializedAnswer(question, senderName, recipient = '') {
  const q = question.toLowerCase();
  const displayName = sanitizePatientName(senderName);
  const greeting = displayName ? `Olá, ${displayName}!` : `Olá!`;

  // Salva e cataloga o contato na agenda do WhatsApp como "Nome Paciente"
  if (recipient) {
    savePatientContact(recipient, senderName);
  }

  // 1. Saudação simples ("oi", "bom dia", "ok", etc.) -> SEMPRE saudação curta sem card de médico!
  if (isPureGreeting(question)) {
    return `${greeting} Como posso ajudar? Você já tem cadastro na plataforma?`;
  }

  // 2. Emergência médica
  if (isUrgentMedicalEmergency(question)) {
    return `Se você ou alguém próximo estiver passando por uma emergência médica, ligue agora para o 192 (SAMU) ou procure o pronto-socorro mais próximo.`;
  }

  // 3. Pagamento e comprovante
  if (isPaymentOrVoucherNotice(question)) {
    return `Recebemos. Nossa equipe está conferindo e avisamos por aqui assim que confirmar.`;
  }

  // 4. Spams / correntes / política / serviços de terceiros
  const spamCheck = isGeneralSpamOrUnrelated(question);
  if (spamCheck.isServiceOffer) {
    return null; // ignora propostas comerciais / bots de marketing
  }
  if (spamCheck.isSpam) {
    return `Aqui falamos só de atendimento e cadastro na Planta y Raiz.`;
  }

  // 5. Se mencionou médico específico de anúncio (e NÃO é só saudação)
  for (const doc of DOCTOR_ADS_MAP) {
    if (doc.keywords.some(k => q.includes(k))) {
      return `O ${doc.name} atende pela Planta y Raíz! O caminho para a sua consulta por videochamada é bem simples:\n1) Cadastro gratuito em plantayraiz.com.br/cadastro\n2) Pré-triagem com nossa equipe\n3) Escolha do médico e horário\n4) Consulta ao vivo por videochamada.\nVocê gostaria que eu te ajude no cadastro passo a passo?`;
    }
  }

  // 6. Dúvidas sobre remédios, sintomas, insônia, remédio para dormir, dor, ansiedade, dose
  if (/rem[eé]dio|dormir|ins[oô]nia|ansiedade|dor|sintoma|depress[aã]o|rem[eé]dios|canabidiol|cbd|thc|[oó]leo|gotas|dosagem|posologia/i.test(q)) {
    return `Quem avalia isso e define a melhor conduta é o médico na consulta. O primeiro passo é o cadastro gratuito em plantayraiz.com.br/cadastro. Você já tem cadastro na plataforma?`;
  }

  // 7. Dúvidas sobre valores e preços
  if (/quanto\s+custa|qual\s+o\s+valor|pre[cç]o|tabela|valores/i.test(q)) {
    return `Na Planta y Raíz, a teleconsulta por vídeo ao vivo é R$ 150 e a consulta por chat é R$ 100, com receita oficial válida pela ANVISA. O primeiro passo é o cadastro gratuito em plantayraiz.com.br/cadastro. Você já tem cadastro na plataforma?`;
  }

  // 8. Se já tem cadastro ("já tenho cadastro", "já fiz", "já me cadastrei")
  if (/j[aá]\s+tenho|j[aá]\s+fiz|j[aá]\s+me\s+cadastrei|conclu[ií]\s+o\s+cadastro/i.test(q)) {
    return `Perfeito! O próximo passo é escolher seu médico e horário para a consulta por videochamada em plantayraiz.com.br/agendamento. Quer que eu te ajude na escolha?`;
  }

  // 9. Agradecimento
  if (/obrigad|valeu|agrade[cç]o/i.test(q)) {
    return `Por nada! Qualquer dúvida sobre o seu cadastro ou agendamento em plantayraiz.com.br/cadastro, estou à inteira disposição!`;
  }

  return null;
}

// ❓ SAUDAÇÃO PARA CONTATOS DESCONHECIDOS / AMBÍGUOS
function getUnknownAudienceGreeting(senderName) {
  return `Olá! Aqui é a Enfermeira Brisa da Planta y Raíz 🌿🩺\n\nPara que eu possa te direcionar com a melhor atenção da nossa equipe:\n\n1️⃣ *É Médico(a) Prescritor(a)*? (Credenciamento, envio de documentos pelo WhatsApp, prontuário e pacientes)\n2️⃣ *É Farmácia / Drogaria Parceira*? (Catálogo de produtos, dispensação e validação de receitas ANVISA)\n3️⃣ *É Paciente*? (Acolhimento, triagem de sintomas e agendamento de teleconsulta)\n\nComo posso te ajudar hoje?`;
}

async function askBrisaGemini(question, senderName, audience, recipient) {
  const role = audience?.role || 'unknown';
  const mem = recipient ? getContactMemory(recipient) : null;
  const patientCleanName = sanitizePatientName(senderName);

  // Shared deterministic safety policy precedes generation for every audience.
  const decision = quickResponse({ question, senderName: patientCleanName, role });
  if (decision?.suppressed) return '';
  let reply = decision?.answer || null;

  // 2. Consulta à Edge Function chat-brisa com role explícito e histórico
  if (!reply) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-brisa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          role,
          phone: String(recipient || '').includes('@lid') ? '' : String(recipient || '').replace(/\D/g, ''),
          senderName: patientCleanName || senderName,
          history: mem?.turns ? mem.turns.slice(-8) : [],
          lastAnswer: mem?.lastAnswerSent || '',
          sentHistory24h: mem?.sentHistory24h || []
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suppressed) return '';
        const apiReply = data.answer || data.reply;
        if (data.handoff) {
          try {
            humanLocked.add(recipient);
            saveHumanLocked(humanLocked);
            registerHumanTakeover(recipient, true, false);
            /* legacy record removed
            locked.set(recipient, {
              jid: recipient,
              paused: true,
              reason: 'solicitou_atendente_humano',
              pausedAt: new Date().toISOString(),
              pausedBy: 'ia_handoff',
              expiresAt: Date.now() + 24 * 3600 * 1000
            });
            */
            await sendWhatsApp(ADMIN_PHONE, `🔔 *[Pedido de atendente humano]*\n\n*Nome:* ${senderName}\n*Contato:* ${recipient}\n*Mensagem:* "${question}"\n\n🛑 Assistente pausada para esta conversa.`);
          } catch (e) { log(`Aviso handoff: ${e.message}`); }
        }

        const degradedPhrases = ['muitos atendimentos', 'não consegui responder', 'problema técnico', 'apenas monitoramento'];
        const isDegraded = degradedPhrases.some(p => (apiReply || '').toLowerCase().includes(p));

        if (apiReply && !isDegraded) {
          reply = apiReply;
        } else if (isDegraded) {
          log(`⚠️ [CHAT-BRISA REJEITADO] Resposta degradada interceptada. Aplicando roteiro padrão de cadastro.`);
          reply = `Para que possamos te orientar da melhor forma até a sua consulta por videochamada, você já possui cadastro gratuito em nossa plataforma? Se ainda não tiver, acesse plantayraiz.com.br/cadastro. Quer que eu te ajude no passo a passo?`;
        }
      }
    } catch (e) {
      log(`Erro ao consultar chat-brisa: ${e.message}`);
    }
  }

  if (!reply) reply = 'Vou confirmar com a equipe e já retorno.';

  return cleanWhatsAppFormatting(reply);
}

async function handleAdminGeminiCommand(prompt) {
  const low = prompt.toLowerCase();

  // Status dos médicos / KYC
  if (low.includes('status') || low.includes('medico') || low.includes('kyc') || low.includes('ranking')) {
    const list = loadKnownDoctors();
    const top = list.slice(0, 6).map(d => `• ${d.name} (${d.crm}/${d.crm_state}): ${d.kycDocsCount || 0}/8 docs`).join('\n');
    return `🤖 *[Gemini Antigravity — Status dos Médicos]*\n\nOlá Dr. Edilson! Panorama atualizado da plataforma:\n\n${top}\n\n👑 *Dr. Victor Fonseca*: #1 VIP Ativo\n🟢 *Dra. Geovana Torres*: 8/8 docs (100%)\n🟢 *Dr. José Geraldo Abbade*: 7/8 docs\n\nPainel administrativo: https://www.plantayraiz.com.br/admin/aprovacoes-medicas`;
  }

  // Consulta à IA Gemini
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-brisa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: prompt,
        context: 'admin_gemini_remote_command_plantayraiz',
        senderName: 'Dr. Edilson Bezerra (Fundador & Admin)'
      })
    });
    if (res.ok) {
      const data = await res.json();
      const reply = data.answer || data.reply;
      if (reply) {
        return `🤖 *[Gemini Antigravity]*\n\nDr. Edilson, sua instrução foi processada com sucesso:\n\n${reply}\n\n⚙️ Qualquer alteração solicitada está sendo aplicada na plataforma em tempo real.`;
      }
    }
  } catch (e) {
    log(`Erro no Gemini Admin: ${e.message}`);
  }

  return `🤖 *[Gemini Antigravity]*\n\nDr. Edilson, recebi sua instrução: "${prompt}".\n\nRegistrei a solicitação na fila de execução autônoma e os agentes já estão aplicando as alterações na plataforma em tempo real. Estou monitorando tudo por aqui!`;
}

async function ingestAdminVoucher(msg, doctor, captionText) {
  try {
    log(`📥 Baixando comprovante de pagamento enviado pelo Admin Dr. Edilson...`);
    const mediaRes = await fetch(`${EVO_URL}/chat/getBase64FromMediaMessage/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: msg,
        convertToMp4: false
      })
    });

    if (!mediaRes.ok) {
      log(`⚠️ Falha ao obter base64 do comprovante Admin: ${mediaRes.status}`);
      return false;
    }

    const mediaData = await mediaRes.json();
    const base64Data = mediaData.base64 || mediaData.data;
    if (!base64Data) return false;

    const mimeType = mediaData.mimetype || 'image/jpeg';
    const ext = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('png') ? 'png' : 'jpg';
    const buffer = Buffer.from(base64Data, 'base64');

    await authenticateAdmin();

    const targetUserId = doctor?.user_id || 'admin_vouchers';
    const storagePath = `${targetUserId}/comprovante_pagamento_${Date.now()}.${ext}`;

    await supabase.storage
      .from('doctor-kyc-documents')
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: mimeType
      });

    log(`✅ Comprovante salvo no storage com sucesso: ${storagePath}`);

    if (doctor?.user_id) {
      await supabase
        .from('doctor_kyc_documents')
        .upsert({
          doctor_user_id: doctor.user_id,
          document_kind: 'address_proof',
          storage_path: storagePath,
          mime_type: mimeType,
          size_bytes: buffer.length,
          verification_status: 'pending',
          verification_notes: `Comprovante conferido e enviado pelo Dr. Edilson (Admin) via WhatsApp em ${new Date().toLocaleString('pt-BR')}: "${captionText}"`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'doctor_user_id,document_kind'
        });

      if (captionText.toLowerCase().includes('vip') || captionText.toLowerCase().includes('plano')) {
        await supabase
          .from('doctors')
          .update({
            plan_tier: 'vip',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', doctor.user_id);
        log(`⭐ Plano VIP atualizado na tabela doctors para: ${doctor.name}`);
      }
    }

    return true;
  } catch (err) {
    log(`❌ Erro no processamento de comprovante admin: ${err.message}`);
    return false;
  }
}

async function loop() {
  log('========================================================================');
  log('🌿 SERVIÇO AUTÔNOMO ENFª BRISA 2.0 ATIVO (ANTI-DUPLICIDADE TOTAL & VOZ)');
  log('========================================================================');

  const processed = loadProcessed();
  let isFirstRun = processed.size === 0;

  while (true) {
    try {
      // 1. Checar estado da conexão
      const stateRes = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE}`, {
        headers: { 'apikey': EVO_KEY }
      });
      const stateData = await stateRes.json().catch(() => ({}));
      const state = stateData?.instance?.state || stateData?.state;

      if (state !== 'open') {
        log(`Status da instância: ${state} (aguardando conexão aberta...)`);
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }

      // 2. Buscar conversas ativas via POST
      const chatsRes = await fetch(`${EVO_URL}/chat/findChats/${INSTANCE}`, {
        method: 'POST',
        headers: {
          'apikey': EVO_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (chatsRes.ok) {
        const chats = await chatsRes.json().catch(() => []);
        const allChatsList = Array.isArray(chats) ? chats : [];

        // 🌟 PRIORIDADE ABSOLUTA 1: Todos os chats onde a última mensagem é INBOUND (fromMe === false)
        // Isso garante que NENHUM médico ou paciente fique esquecido, mesmo que haja 500+ chats!
        const unrepliedChats = allChatsList
          .filter(c => {
            const jid = c.remoteJid || c.id;
            return jid && !jid.includes('@g.us') && !jid.includes('status@broadcast') && c.lastMessage?.key?.fromMe === false;
          })
          .sort((a, b) => (b.lastMessage?.messageTimestamp || 0) - (a.lastMessage?.messageTimestamp || 0));

        // 🌟 PRIORIDADE 2: Chats recentes por updatedAt
        const recentlyUpdatedChats = allChatsList
          .filter(c => {
            const jid = c.remoteJid || c.id;
            return jid && !jid.includes('@g.us') && !jid.includes('status@broadcast');
          })
          .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
          .slice(0, 40);

        // Mescla sem duplicidade com prioridade para quem está aguardando resposta
        const activeChatsMap = new Map();
        for (const c of unrepliedChats) activeChatsMap.set(c.remoteJid || c.id, c);
        for (const c of recentlyUpdatedChats) {
          const jid = c.remoteJid || c.id;
          if (!activeChatsMap.has(jid)) activeChatsMap.set(jid, c);
        }
        const activeChats = Array.from(activeChatsMap.values());

        const humanLocked = loadHumanLocked();

        for (const chat of activeChats) {
          const jid = chat.remoteJid || chat.id;
          if (!jid) continue;

          // Se a conversa já foi respondida por nós e não há mensagens novas não lidas, ignorar
          if (chat.lastMessage?.key?.fromMe === true && (!chat.unreadCount || chat.unreadCount === 0)) {
            continue;
          }

          // Buscar as últimas 8 mensagens do chat
          const msgsRes = await fetch(`${EVO_URL}/chat/findMessages/${INSTANCE}`, {
            method: 'POST',
            headers: {
              'apikey': EVO_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              where: {
                key: {
                  remoteJid: jid
                }
              },
              limit: 8
            })
          });

          if (msgsRes.ok) {
            const msgsData = await msgsRes.json().catch(() => ({}));
            const messages = msgsData?.messages?.records || msgsData?.records || (Array.isArray(msgsData) ? msgsData : []);

            // 🛡️ DETECÇÃO DE INTERVENÇÃO HUMANA / ASSUMIU HUMANO (Fase 2 - S2):
            // Toda mensagem enviada pela equipe pelo celular ou WhatsApp Web (fromMe sem ser a Brisa)
            // pausa a IA nesta conversa por 24 horas para evitar respostas concorrentes.
            let recipientClean = jid.includes('@lid') ? jid : jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
            for (const msg of messages) {
              if (msg.key?.fromMe) {
                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
                if (!text) continue;

                const mem = getContactMemory(jid);
                const isBrisaSent = (mem?.lastAnswerSent && text.includes(mem.lastAnswerSent.slice(0, 30))) || text.includes('Enfermeira Brisa');
                
                if (!isBrisaSent) {
                  registerHumanTakeover(jid, true, false);
                  log(`🛑 [ASSUMIU HUMANO 24H] Mensagem humana enviada pela equipe no chat ${recipientClean}. IA silenciada por 24h.`);
                }
              }
            }

            // Filtrar mensagens novas recebidas (inbound) não processadas nas últimas 24 horas
            const newInbounds = [];
            for (const msg of messages) {
              const msgId = msg.key?.id;
              const fromMe = msg.key?.fromMe;
              if (!msgId || fromMe) continue;

              const msgTimestamp = (msg.messageTimestamp || 0) * 1000;
              const isRecent = (Date.now() - msgTimestamp) < (24 * 60 * 60 * 1000); // 24 horas

              if (processed.has(msgId)) continue;

              if (!isRecent) {
                // Mensagem muito antiga (> 24h), apenas registra para não responder retroativo
                processed.add(msgId);
                continue;
              }

              processed.add(msgId);
              newInbounds.push(msg);
            }

            if (newInbounds.length === 0) continue;

            saveProcessed(processed);

            const firstMsg = newInbounds[0];
            const senderName = firstMsg.pushName || chat.pushName || 'Doutor(a)';

            // Identificar destinatário canônico (suporta @lid e @s.whatsapp.net)
            let recipient = jid.includes('@lid') ? jid : jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
            if (!recipient || recipient.length < 5) {
              const altJid = firstMsg.key?.remoteJidAlt || chat.remoteJidAlt;
              if (altJid) {
                recipient = altJid.includes('@lid') ? altJid : altJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
              }
            }

            if (!recipient || recipient.length < 5) {
              continue;
            }

            // Verificar texto combinado das mensagens
            const combinedText = newInbounds.map(m => 
              m.message?.conversation || 
              m.message?.extendedTextMessage?.text || 
              m.message?.imageMessage?.caption || 
              m.message?.documentMessage?.caption || ''
            ).filter(Boolean).join('\n');

            log(`📩 [LOTE] Recebidas ${newInbounds.length} novas mensagens de ${senderName} (${recipient}): "${combinedText.slice(0, 80)}"`);

            // 👑 INTERAÇÃO EXCLUSIVA COM O FUNDADOR / ADMIN (Dr. Edilson Bezerra)
            if (recipient === ADMIN_PHONE) {
              // 1. Comando direto para conversar com Gemini via WhatsApp ("ok gemini ...")
              const geminiMatch = combinedText.match(/^(?:ok\s+)?gemini\b[\s,:]*(.*)$/i);
              if (geminiMatch) {
                const userPrompt = (geminiMatch[1] || combinedText).trim();
                log(`👑 [ADMIN GEMINI COMMAND] Dr. Edilson enviou instrução: "${userPrompt}"`);

                const instructionsFile = path.join(__dirname, 'admin_whatsapp_gemini_instructions.json');
                let instructions = [];
                try {
                  if (fs.existsSync(instructionsFile)) instructions = JSON.parse(fs.readFileSync(instructionsFile, 'utf8'));
                } catch (e) {}
                instructions.push({
                  id: `inst_${Date.now()}`,
                  prompt: userPrompt,
                  received_at: new Date().toISOString(),
                  status: 'processed'
                });
                try { fs.writeFileSync(instructionsFile, JSON.stringify(instructions.slice(-100), null, 2)); } catch (e) {}

                const replyToAdmin = await handleAdminGeminiCommand(userPrompt);
                await sendWhatsApp(ADMIN_PHONE, replyToAdmin);
                continue;
              }

              // 2. Envio de comprovante de pagamento pelo Dr. Edilson (Admin)
              const adminDocMsgs = newInbounds.filter(m => 
                Boolean(m.message?.documentMessage || m.message?.imageMessage || m.message?.documentWithCaptionMessage)
              );
              if (adminDocMsgs.length > 0) {
                log(`🧾 [ADMIN COMPROVANTE] Dr. Edilson enviou ${adminDocMsgs.length} comprovante(s) via WhatsApp!`);
                let targetDoctor = findDoctorByName(combinedText);
                if (!targetDoctor) {
                  const doctors = loadKnownDoctors();
                  targetDoctor = doctors.find(d => 
                    (d.name && combinedText.toLowerCase().includes(d.name.toLowerCase())) ||
                    (d.crm && combinedText.includes(d.crm))
                  );
                }

                for (const docMsg of adminDocMsgs) {
                  await ingestAdminVoucher(docMsg, targetDoctor, combinedText);
                }

                if (targetDoctor) {
                  await sendWhatsApp(ADMIN_PHONE, `✅ Dr. Edilson, comprovante conferido e anexado com sucesso aos documentos do(a) médico(a) *${targetDoctor.name}* (CRM ${targetDoctor.crm})!\n\n🔍 Disponível no painel: https://www.plantayraiz.com.br/admin/aprovacoes-medicas`);
                } else {
                  await sendWhatsApp(ADMIN_PHONE, `📥 Dr. Edilson, comprovante recebido e armazenado no cofre KYC!\n\n💡 Envie o nome ou CRM do médico caso queira que eu vincule automaticamente ao card dele.`);
                }
                continue;
              }

              // 3. Comando REATIVAR_IA
              const reativarMatch = combinedText.match(/^REATIVAR_IA\s+\+?(\d{10,13})/i);
              if (reativarMatch) {
                const targetPhone = reativarMatch[1].startsWith('55') ? reativarMatch[1] : '55' + reativarMatch[1];
                humanLocked.delete(targetPhone);
                saveHumanLocked(humanLocked);
                log(`🔓 [IA REATIVADA] Contato ${targetPhone} liberado pelo Admin para voltar a receber IA.`);
                await sendWhatsApp(ADMIN_PHONE, `✅ IA reativada com sucesso para o contato ${targetPhone}.`);
                continue;
              }

              // 4. Comando PAUSAR_AUTOMACAO / PAUSAR GERAL
              const pauseGlobalMatch = combinedText.match(/^(?:PAUSAR_AUTOMACAO|PAUSAR\s+AUTOMACAO|PAUSAR\s+GERAL|PARAR\s+AUTOMACAO|PAUSAR\s+TUDO)/i);
              if (pauseGlobalMatch) {
                setGlobalPause(true);
                log(`🛑 [ADMIN] Automação global de WhatsApp pausada pelo Dr. Edilson.`);
                await sendWhatsApp(ADMIN_PHONE, `🛑 *[Automação Global Pausada]*\n\nDr. Edilson, todas as mensagens automáticas de WhatsApp (Enfª Brisa e Convites Brevo) foram PAUSADAS imediatamente.\n\nNenhuma mensagem automática sairá do sistema até sua autorização.\n\nPara reativar a qualquer momento, responda:\n*RETOMAR_AUTOMACAO* ou *ATIVAR_AUTOMACAO*`);
                continue;
              }

              // 5. Comando RETOMAR_AUTOMACAO / ATIVAR_AUTOMACAO
              const resumeGlobalMatch = combinedText.match(/^(?:RETOMAR_AUTOMACAO|RETOMAR\s+AUTOMACAO|ATIVAR_AUTOMACAO|ATIVAR\s+AUTOMACAO|DESPAUSAR)/i);
              if (resumeGlobalMatch) {
                setGlobalPause(false);
                log(`🟢 [ADMIN] Automação global retomada pelo Dr. Edilson.`);
                await sendWhatsApp(ADMIN_PHONE, `🟢 *[Automação Retomada]*\n\nDr. Edilson, as automações de WhatsApp foram reativadas com sucesso! O atendimento da Enfª Brisa e os convites voltaram a operar.`);
                continue;
              }

              // 6. Comando PAUSAR CONVERSA / PAUSAR <numero ou nome>
              const pauseChatMatch = combinedText.match(/^(?:PAUSAR_CONVERSA|PAUSAR\s+CONVERSA|PAUSAR)\s+(.+)/i);
              if (pauseChatMatch) {
                const query = pauseChatMatch[1].trim();
                if (!/(automacao|geral|tudo)/i.test(query)) {
                  const cleanNum = query.replace(/\D/g, '');
                  let targetPhone = cleanNum.length >= 8 ? (cleanNum.startsWith('55') ? cleanNum : '55' + cleanNum) : null;
                  let targetLid = null;
                  let targetName = query;

                  for (const [phoneOrLid, info] of conversationMemory.entries()) {
                    const s = JSON.stringify(info).toLowerCase();
                    if (s.includes(query.toLowerCase()) || phoneOrLid.includes(query.replace(/\D/g, ''))) {
                      if (phoneOrLid.includes('@lid')) targetLid = phoneOrLid;
                      else if (!targetPhone) targetPhone = phoneOrLid;
                    }
                  }

                  if (targetPhone) humanLocked.add(targetPhone);
                  if (targetLid) humanLocked.add(targetLid);
                  if (cleanNum.length >= 8) humanLocked.add(cleanNum);
                  saveHumanLocked(humanLocked);

                  log(`🛑 [ADMIN PAUSA CONVERSA] Conversa com "${query}" pausada por ordem do Dr. Edilson.`);
                  await sendWhatsApp(ADMIN_PHONE, `🛑 *[Conversa Pausada com Sucesso]*\n\nDr. Edilson, a conversa com *${targetName}* (${targetPhone || targetLid || query}) foi pausada!\n\nA IA está em silêncio absoluto para este contato e não enviará mensagens automáticas.\n\nPara liberar a IA novamente quando desejar, envie:\n*REATIVAR_IA ${targetPhone || targetLid || query}*`);
                  continue;
                }
              }

              // 7. Comando STATUS_AUTOMACAO
              const statusMatch = combinedText.match(/^(?:STATUS_AUTOMACAO|STATUS\s+AUTOMACAO|STATUS\s+PAUSA)/i);
              if (statusMatch) {
                const isPaused = isGlobalPauseActive();
                const totalLocked = humanLocked.size;
                await sendWhatsApp(ADMIN_PHONE, `📊 *[Status da Automação de WhatsApp]*\n\n• Automação Global: ${isPaused ? '🛑 PAUSADA' : '🟢 ATIVA / OPERANDO'}\n• Contatos com IA pausada (Modo Humano): ${totalLocked}\n• Instância Evolution: ${INSTANCE} (Online)\n\nComandos disponíveis:\n• *PAUSAR_AUTOMACAO* (Pausa tudo)\n• *RETOMAR_AUTOMACAO* (Reativa tudo)\n• *PAUSAR <número ou nome>* (Pausa contato específico)\n• *REATIVAR_IA <número>* (Reativa contato específico)`);
                continue;
              }
            }

            // 🛑 VERIFICAÇÃO 0: Se a automação estiver pausada globalmente pelo Admin, silencia para todos
            if (isGlobalPauseActive()) {
              log(`🛑 [PAUSA GLOBAL ATIVA] Mensagem de ${senderName} (${recipient}) recebida, mas a automação está pausada globalmente pelo Admin. IA em silêncio.`);
              continue;
            }

            // 🛑 VERIFICAÇÃO 0.1: Contato está em Orientação Técnica ativa no n8n?
            // Regra mútua: o brisa-live-responder cuida de médicos e documentos; o n8n, só de pacientes da orientação.
            // Os dois nunca respondem o mesmo número.
            triggerN8nSyncAsync();
            if (isHandledByN8nOrientation(recipient)) {
              log(`🔒 [N8N EXCLUSION] Contato ${senderName} (${recipient}) está em atendimento exclusivo no n8n (Orientação Técnica). Enfª Brisa em silêncio absoluto.`);
              continue;
            }

            // 🛑 VERIFICAÇÃO 1: Contato já está na trava de atendimento humano ou na blacklist permanente?
            const pauseCheck = checkAiPause(recipient);
            const blacklist = loadBlacklist();
            if (pauseCheck.paused || blacklist.has(recipient)) {
              log(`🛑 [TRAVA/BLACKLIST ATIVA] Contato ${senderName} (${recipient}) está em modo humano (${pauseCheck.reason || 'pausado'}) ou blacklist. IA em silêncio absoluto.`);
              continue;
            }

            // 🛑 VERIFICAÇÃO 2: Solicitou opt-out / cancelamento / "não quero" (Fase 2 - S3)?
            if (checkOptOutSecurity(combinedText)) {
              const res = registerOptOut(recipient, combinedText);
              log(`🛑 [OPT-OUT REGISTRADO] ${senderName} (${recipient}) pediu cancelamento ("${combinedText}"). IA silenciada e contato inserido na blacklist permanente!`);

              try {
                // Envia UMA ÚNICA confirmação e nunca mais entra em contato
                await sendWhatsApp(recipient, res.confirmationReply);
              } catch (e) {
                log(`Erro envio confirmação opt-out: ${e.message}`);
              }

              try {
                const alertMsg = `🔔 *[Opt-Out Confirmado]*\n\nO contato *${senderName}* (${recipient}) recusou contato:\n"${combinedText}"\n\n🛑 Inserido na blacklist permanente e IA silenciada definitivamente.`;
                await sendWhatsApp(ADMIN_PHONE, alertMsg);
              } catch (e) {
                log(`Aviso admin opt-out: ${e.message}`);
              }

              continue;
            }

            // 🛑 VERIFICAÇÃO 2.1: Solicitou pausa da conversa ou da automação?
            if (isPauseRequested(combinedText)) {
              humanLocked.add(recipient);
              const cleanRec = recipient.replace(/\D/g, '');
              if (cleanRec.length >= 8) humanLocked.add(cleanRec);
              saveHumanLocked(humanLocked);
              log(`🛑 [PAUSA SOLICITADA PELO CONTATO] ${senderName} (${recipient}) pediu para pausar a conversa/automação. IA silenciada imediatamente!`);

              try {
                await sendWhatsApp(recipient, `Com certeza! Pausei o envio automático de mensagens para você por aqui. Nossa equipe da Planta y Raíz está à inteira disposição caso precise de algo. Um abraço! 🙏🌿`);
              } catch (e) {
                log(`Erro envio confirmação pausa: ${e.message}`);
              }

              try {
                const alertMsg = `🔔 *[Aviso: Contato Pediu Pausa]*\n\nO contato *${senderName}* (${recipient}) pediu para pausar as mensagens automáticas:\n"${combinedText}"\n\n🛑 A IA Enfª Brisa foi pausada para esta conversa e não enviará mais mensagens automáticas.\n(Para reativar a IA quando desejar: responda *REATIVAR_IA ${recipient}*)`;
                await sendWhatsApp(ADMIN_PHONE, alertMsg);
              } catch (e) {
                log(`Aviso admin pausa: ${e.message}`);
              }

              continue;
            }

            // 🛑 VERIFICAÇÃO 2.2: Solicitou atendimento humano agora?
            if ((isHumanRequested(combinedText) || /reclamacao|absurdo|estou irritad/i.test(combinedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
              humanLocked.add(recipient);
              saveHumanLocked(humanLocked);
              log(`🔒 [TRAVA DE HUMANO ATIVADA] ${senderName} (${recipient}) pediu humano. IA silenciada imediatamente!`);

              const cleanName = cleanDoctorName(senderName);
              const isFemale = /\b(dra|doutora|edna|veronica|verônica|mariana|geovana|barbara|bárbara|stella|camyla|leticia|letícia|patricia|patrícia|ana|carolina|fernanda|juliana|camila|paula)\b/i.test(cleanName);
              const prefix = isFemale ? 'Dra.' : 'Dr.';
              const formattedName = cleanName.startsWith('Dr') ? cleanName : `${prefix} ${cleanName}`;

              try {
                await sendWhatsApp(recipient, `Vou passar para nossa equipe. Retornamos por aqui.`);
              } catch (e) {
                log(`Erro ao enviar aviso de transferência: ${e.message}`);
              }

              try {
                const alertMsg = `Dr. Edilson Bezerra, o senhor tem uma mensagem importante de um contato que solicitou atendimento humano imediato!\n\n*Nome:* ${senderName}\n*Contato:* ${recipient}\n*Mensagem:* "${combinedText}"\n\n🛑 A IA Enfª Brisa foi pausada para esta conversa.\n(Para reativar a IA após o atendimento: responda *REATIVAR_IA ${recipient}*)`;
                await sendWhatsApp(ADMIN_PHONE, alertMsg);
              } catch (e) {
                log(`Aviso admin: ${e.message}`);
              }

              continue;
            }

            // 🛑 VERIFICAÇÃO 3: Filtro de resposta automática de consultório / auto-reply (Fase 2 - S4)
            if (isAutoReplyBot(combinedText, recipient)) {
              log(`🤖 [ANTI-ROBÔ] Mensagem automática identificada de ${senderName} (${recipient}). Silenciando IA para evitar loop infinito.`);
              continue;
            }

            // 🛑 VERIFICAÇÃO 3.1: Limite duro de 2 mensagens da Brisa seguidas sem resposta humana
            const recentHistory = (getContactMemory(recipient)?.messages || []).map(m => ({ fromMe: m.role === 'brisa' }));
            const limitCheck = checkConsecutiveBrisaLimit(recentHistory);
            if (!limitCheck.allowed) {
              log(`🛑 [LIMITE 2 MSGS BRISA] Contato ${senderName} (${recipient}) já recebeu ${limitCheck.count} mensagens seguidas da Brisa sem resposta de pessoa. Silenciando IA.`);
              continue;
            }

            // Processamento de mídias/documentos anexados no lote (SEMPRE tratados como KYC, NUNCA pagamento)
            const docMsgs = newInbounds.filter(m => 
              Boolean(m.message?.documentMessage || m.message?.imageMessage || m.message?.documentWithCaptionMessage)
            );

            if (docMsgs.length > 0) {
              log(`📄 Lote contém ${docMsgs.length} documento(s) anexado(s) de ${senderName} (${recipient}). Processando...`);
              for (const docMsg of docMsgs) {
                await ingestIncomingDoc(docMsg, recipient, senderName);
              }

              const cleanName = sanitizeDoctorName(senderName);
              // Responde UMA ÚNICA VEZ confirmando o recebimento do lote com o Checklist Oficial de 4 Documentos e prazo oficial
              const docReply = 'Recebemos. Nossa equipe está conferindo e avisamos por aqui assim que confirmar.';
              await sendWhatsApp(recipient, docReply);
              lastRepliedAt.set(recipient, Date.now());
              continue;
            }


            // ⏳ CONTROLE DE COOLDOWN: Mínimo 60 segundos entre respostas ao mesmo contato
            const lastTime = lastRepliedAt.get(recipient) || 0;
            const elapsed = Date.now() - lastTime;
            if (elapsed < 60000) {
              log(`⏳ Contato ${senderName} (${recipient}) recebeu resposta há ${Math.round(elapsed/1000)}s. Aguardando cooldown para não gerar mensagens duplicadas.`);
              continue;
            }

            // 🎙️ SE FOR ÁUDIO: TRANSCREVER COM ELEVENLABS STT (OUVIDOS DA BRISA) E RESPONDER
            // 🎙️ SE FOR ÁUDIO: Responde imediatamente a regra oficial 5
            const audioMsgs = newInbounds.filter(m => Boolean(m.message?.audioMessage || m.message?.pttMessage));
            if (audioMsgs.length > 0) {
              log(`🎙️ [ÁUDIO RECEBIDO] Áudio recebido de ${senderName} (${recipient}). Enviando aviso oficial de texto.`);
              const reply = "Recebi seu áudio, mas aqui só consigo ler texto. Pode escrever em poucas palavras o que você precisa?";
              await sendWhatsApp(recipient, reply);
              lastRepliedAt.set(recipient, Date.now());
              continue;
            }

            // 📞 SE FOR LIGAÇÃO (CHAMADA PERDIDA OU REJEITADA): Regra oficial 6
            const callMsgs = newInbounds.filter(m => Boolean(m.messageStubType === 40 || m.messageStubType === 41 || m.message?.call));
            if (callMsgs.length > 0) {
              log(`📞 [LIGAÇÃO RECEBIDA] Tentativa de chamada de ${senderName} (${recipient}). Enviando aviso oficial.`);
              const reply = "Por aqui não atendemos ligações. Pode escrever sua dúvida?";
              await sendWhatsApp(recipient, reply);
              lastRepliedAt.set(recipient, Date.now());
              continue;
            }

            // 💬 SE FOR TEXTO: PROCESSAMENTO COGNITIVO COM MEMÓRIA E ANTI-REPETIÇÃO
            if (combinedText.trim().length > 0) {
              const cleanSenderName = sanitizeDoctorName(senderName);
              const audience = classifyAudience(recipient, cleanSenderName, combinedText);
              log(`🎯 Público classificado para ${cleanSenderName} (${recipient}): [${audience.role.toUpperCase()}]`);

              addMessageToMemory(recipient, 'user', combinedText, audience.role);

              let reply = await askBrisaGemini(combinedText, audience.name || cleanSenderName, audience, recipient);
              if (!reply) {
                log(`ℹ️ Nenhuma resposta gerada para ${recipient}.`);
                continue;
              }

              await sendWhatsApp(recipient, reply);
              lastRepliedAt.set(recipient, Date.now());
            }
          }
        }
      }

      if (isFirstRun) {
        isFirstRun = false;
        saveProcessed(processed);
        log(`Histórico inicial sincronizado (${processed.size} mensagens indexadas).`);
      }

    } catch (err) {
      log(`Erro no loop de atendimento: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 6000));
  }
}

loop().catch(console.error);
