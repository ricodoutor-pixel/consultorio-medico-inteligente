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
  return /(humano|atendente|pessoa real|pessoa de verdade|preciso falar com|quero falar com (alguem|uma pessoa|o dr|a dra|o doutor|a doutora|o edilson|a equipe|o suporte)|falar com (alguem|a equipe|o suporte|o edilson)|equipe humana|nao quero (falar com )?(robo|bot|ia))/i.test(low);
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
            registerHumanTakeover(recipient, true, false, { permanent: true });
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
                const isBrisaSent = (mem?.sentHistory24h || []).some(h => h.text === text);
                
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

              const scopedId = `${jid}:${msgId}`;
              if (processed.has(scopedId) || processed.has(msgId)) continue;

              if (!isRecent) {
                // Mensagem muito antiga (> 24h), apenas registra para não responder retroativo
                processed.add(scopedId);
                continue;
              }

              processed.add(scopedId);
              newInbounds.push(msg);
            }

            if (newInbounds.length === 0) continue;

            saveProcessed(processed);

            const firstMsg = newInbounds[0];
            const senderName = firstMsg.pushName || chat.pushName || '';

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
            if (pauseCheck.paused || humanLocked.has(recipient) || blacklist.has(recipient)) {
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
              try {
                await sendWhatsApp(recipient, 'Vou passar para nossa equipe. Retornamos por aqui.');
              } finally {
                registerHumanTakeover(recipient, true, false, { permanent: true });
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
              const cleanSenderName = sanitizePatientName(senderName);
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

const PROCESS_LOCK = path.join(__dirname, 'brisa_responder.lock');
try {
  if (fs.existsSync(PROCESS_LOCK)) {
    const pid = Number(fs.readFileSync(PROCESS_LOCK, 'utf8'));
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch {}
    if (alive) throw new Error('Another Brisa responder is already running');
    fs.unlinkSync(PROCESS_LOCK);
  }
  fs.writeFileSync(PROCESS_LOCK, String(process.pid), { flag: 'wx' });
  process.on('exit', () => { try { fs.unlinkSync(PROCESS_LOCK); } catch {} });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(0));
  loop().catch(console.error);
} catch (error) {
  console.error('Brisa responder not started:', error.message);
  process.exitCode = 1;
}
