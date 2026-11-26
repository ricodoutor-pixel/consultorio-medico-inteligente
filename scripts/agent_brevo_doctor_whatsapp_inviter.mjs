/**
 * scripts/agent_brevo_doctor_whatsapp_inviter.mjs
 *
 * 🌿 Planta y Raiz — Agente Oficial de Convites WhatsApp para Médicos
 * Reativado por autorização expressa do Dr. Edilson em 26/11/2026.
 *
 * Regras estritas de segurança e governança:
 * - Cadência fixa: 1 convite a cada 15 minutos (mínimo rígido de 15 min; nunca loop de 10 min)
 * - Horário comercial estrito: Segunda a Sábado, 09h às 19h BRT (America/Sao_Paulo)
 * - Trava PID exclusiva (rejeita instâncias sobrepostas no PM2/VPS)
 * - Bloqueio rigoroso de PJ/empresas/clínicas/não-médicos (isCompanyOrNonDoctorContact)
 * - Jamais prefixa "Dr(a)." sem CRM confirmado (saudação neutra para leads sem CRM)
 * - Texto institucional sem frases proibidas, assinado pela Enfª Brisa, com link do site e "responda SAIR"
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { BRISA_CONFIG, buildOfficialInvitationMessage } from './brisa_onboarding_config.mjs';
import { preSendGuard, normalizeJid, sanitizeDoctorName } from './lib/brisa_security.mjs';
import {
  getBrasiliaTimeParts,
  isBusinessHoursBRT,
  isCompanyOrNonDoctorContact,
  hasConfirmedCrm,
  formatDoctorAddressing,
} from '../supabase/functions/_shared/whatsapp-outreach-guard.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Carrega .env da raiz do projeto explicitamente (não depende do cwd)
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const getLogFile = () => process.env.WPP_INVITER_LOG_FILE || path.join(__dirname, 'brevo_whatsapp_inviter.log');
const getStateFile = () => process.env.WPP_INVITER_STATE_FILE || path.join(__dirname, 'brevo_whatsapp_invited_doctors.json');
const getPidLockFile = () => process.env.WPP_INVITER_PID_LOCK || path.join(__dirname, 'brevo_whatsapp_inviter.pid.lock');
const DOCTORS_LIST_FILE = path.join(__dirname, 'database_doctors_list.json');
const UNREGISTERED_LEADS_FILE = path.join(__dirname, 'unregistered_doctors_leads.json');
const CLINICOS_LEADS_FILE = path.join(__dirname, 'clinicos_gerais_pos2020_leads.json');
const HUMAN_LOCK_FILE = path.join(__dirname, 'evolution_human_mode_contacts.json');
const BLACKLIST_FILE = path.join(__dirname, 'evolution_optout_blacklist.json');
const PAUSE_GLOBAL_FILE = path.join(__dirname, 'PAUSE_AUTOMATION.flag');

// Chave de Liga/Desliga (ativa no PM2 via ecosystem.config.cjs; desligável via env)
const BRISA_COLD_OUTREACH_ENABLED = process.env.BRISA_COLD_OUTREACH_ENABLED !== 'false';

// Cadência fixa de 15 minutos entre envios bem-sucedidos (mínimo rígido de 15 min em produção)
export const CADENCE_MS = Math.max(
  15 * 60 * 1000,
  Number(process.env.WPP_INVITE_CADENCE_MS || 15 * 60 * 1000),
);

function getEvoConfig() {
  return {
    url: (
      process.env.EVOLUTION_URL_VPS ||
      process.env.EVOLUTION_API_URL ||
      process.env.EVOLUTION_API_BASE_URL ||
      process.env.EVOLUTION_URL ||
      'https://whatsapp.plantayraiz.com.br'
    ).replace(/\/+$/, ''),
    key: process.env.EVOLUTION_API_KEY_VPS || process.env.EVOLUTION_API_KEY || '',
    instance: process.env.EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE_NAME || 'plantayraiz',
  };
}

function getBrevoConfig() {
  return {
    baseUrl: (process.env.BREVO_API_BASE_URL || 'https://api.brevo.com/v3').replace(/\/+$/, ''),
    key: process.env.BREVO_API_KEY || process.env.BREVO_KEY || '',
    listId: Number(process.env.BREVO_LIST_MEDICOS || 6),
  };
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [BREVO-WPP-15MIN] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(getLogFile(), line + '\n');
  } catch (_) {}
}

function acquirePidLock() {
  const lockFile = getPidLockFile();
  try {
    const fd = fs.openSync(lockFile, 'wx');
    fs.writeFileSync(fd, String(process.pid));
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err?.code !== 'EEXIST') return false;
    try {
      const oldPid = Number(fs.readFileSync(lockFile, 'utf8').trim());
      if (oldPid && oldPid !== process.pid) {
        try {
          process.kill(oldPid, 0);
          log(`🛑 [PID-LOCK] Outra instância já ativa (PID ${oldPid}). Encerrando duplicata.`);
          return false;
        } catch (_) {
          fs.unlinkSync(lockFile);
          const fd = fs.openSync(lockFile, 'wx');
          fs.writeFileSync(fd, String(process.pid));
          fs.closeSync(fd);
          return true;
        }
      }
      // Lock vazio/corrompido
      fs.unlinkSync(lockFile);
      const fd = fs.openSync(lockFile, 'wx');
      fs.writeFileSync(fd, String(process.pid));
      fs.closeSync(fd);
      return true;
    } catch (_) {}
    return false;
  }
}

function releasePidLock() {
  const lockFile = getPidLockFile();
  try {
    if (fs.existsSync(lockFile)) {
      const pidInFile = Number(fs.readFileSync(lockFile, 'utf8').trim());
      if (pidInFile === process.pid) {
        fs.unlinkSync(lockFile);
      }
    }
  } catch (_) {}
}

function isGlobalPauseActive() {
  return fs.existsSync(PAUSE_GLOBAL_FILE);
}

function loadHumanLocked() {
  try {
    if (fs.existsSync(HUMAN_LOCK_FILE)) {
      const raw = JSON.parse(fs.readFileSync(HUMAN_LOCK_FILE, 'utf8'));
      if (Array.isArray(raw)) {
        return new Set(raw.map(item => (typeof item === 'string' ? item : item?.jid || '')).filter(Boolean));
      }
      if (raw && typeof raw === 'object') {
        return new Set(Object.keys(raw));
      }
    }
  } catch (_) {}
  return new Set();
}

function loadBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8')));
    }
  } catch (_) {}
  return new Set();
}

export function isWithinBusinessHours(now = new Date()) {
  return isBusinessHoursBRT(now);
}

async function checkInstanceStatus() {
  const { url, key, instance } = getEvoConfig();
  if (!key) return { state: 'missing_api_key', detail: 'EVOLUTION_API_KEY ausente no .env' };
  try {
    const res = await fetch(`${url}/instance/connectionState/${encodeURIComponent(instance)}`, {
      headers: { apikey: key },
    });
    const text = await res.text();
    if (!res.ok) {
      return { state: `http_${res.status}`, detail: text.slice(0, 140) };
    }
    let data = {};
    try { data = JSON.parse(text); } catch (_) {}
    const state = data?.instance?.state || data?.state || 'close';
    return { state, detail: text.slice(0, 120) };
  } catch (e) {
    return { state: 'network_error', detail: e.message };
  }
}

function loadState() {
  const stateFile = getStateFile();
  const defaultState = {
    lastOffset: 0,
    brevoOffset: 0,
    totalInvited: 0,
    invitedPhones: {},
    invitedEmails: {},
  };
  try {
    if (fs.existsSync(stateFile)) {
      const parsed = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      return {
        ...defaultState,
        ...parsed,
        invitedPhones: parsed?.invitedPhones || {},
        invitedEmails: parsed?.invitedEmails || {},
      };
    }
  } catch (_) {}
  return defaultState;
}

function saveState(state) {
  try {
    fs.writeFileSync(getStateFile(), JSON.stringify(state, null, 2));
  } catch (_) {}
}

function loadKnownDoctors() {
  try {
    if (fs.existsSync(DOCTORS_LIST_FILE)) {
      return JSON.parse(fs.readFileSync(DOCTORS_LIST_FILE, 'utf8'));
    }
  } catch (_) {}
  return [];
}

// Normaliza e valida celular brasileiro (55 + DDD + 9 + 8 dígitos)
export function normalizeValidBrazilianMobile(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!digits.startsWith('55')) return null;

  if (digits.length === 13) {
    const ddd = Number(digits.slice(2, 4));
    const ninth = digits[4];
    if (ninth === '9' && ddd >= 11 && ddd <= 99) {
      return digits;
    }
  }
  return null;
}

// Bloqueia PJ/empresas/clínicas/não-médicos. Contatos PF sem CRM seguem com saudação neutra (sem "Dr(a).").
export function isExcludedAudience(name = '', email = '', specialty = '', crm = '', councilType = '') {
  const check = isCompanyOrNonDoctorContact({ name, email, specialty, crm, councilType });
  if (check.blocked) {
    return { excluded: true, reason: check.reason };
  }
  return { excluded: false };
}

export function buildInvitationMessage(doctorName, options = {}) {
  const cleanName = sanitizeDoctorName(doctorName);
  const crmConfirmed = Boolean(options.crmConfirmed) || hasConfirmedCrm(
    options.crm || '',
    options.crmState || options.crm_state || '',
    options.councilType || options.council_type || '',
  );
  const addressing = formatDoctorAddressing({
    name: cleanName || doctorName,
    crm: options.crm || '',
    crmState: options.crmState || options.crm_state || '',
    councilType: options.councilType || options.council_type || '',
    crmConfirmed,
    email: options.email || '',
    specialty: options.specialty || '',
  });
  if (!addressing.allowed) return '';
  return buildOfficialInvitationMessage(addressing.cleanName || cleanName, {
    ...options,
    crmConfirmed,
  });
}

async function sendWhatsApp(recipient, text, contact = {}, now = new Date()) {
  if (!isWithinBusinessHours(now)) {
    return { sent: false, status: 'blocked', reason: 'OUTSIDE_BUSINESS_HOURS_BRT', retryLater: true };
  }
  if (!text || !text.trim()) {
    return { sent: false, status: 'blocked', reason: 'EMPTY_OR_BLOCKED_MESSAGE', retryLater: false };
  }
  const norm = normalizeJid(recipient);
  const cleanNumber = norm.phone || recipient.replace(/\D/g, '');
  const crmConfirmed = Boolean(contact.crmConfirmed) || hasConfirmedCrm(
    contact.crm || '',
    contact.crmState || contact.crm_state || '',
    contact.councilType || contact.council_type || '',
  );

  // 🛡️ GUARDA DE PRÉ-ENVIO (horário BRT, PJ, sem Dr(a). sem CRM, opt-out, textos proibidos)
  const guard = preSendGuard(norm.normalizedJid, text, {
    isOutreach: true,
    contact,
    crmConfirmed,
    now,
  });
  if (!guard.canSend) {
    log(`🛡️ ${guard.log}`);
    const retryLater = guard.reason === 'OUTSIDE_BUSINESS_HOURS_BRT' || guard.reason === 'DRY_RUN_ACTIVE';
    return { sent: false, dryRun: guard.reason === 'DRY_RUN_ACTIVE', status: 'blocked', reason: guard.reason, retryLater };
  }

  const { url, key, instance } = getEvoConfig();
  log(`📤 Enviando convite WhatsApp via ${url} (${instance}) para +${cleanNumber.slice(0, 6)}****${cleanNumber.slice(-2)}...`);
  const res = await fetch(`${url}/message/sendText/${encodeURIComponent(instance)}`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: cleanNumber,
      options: {
        delay: 2000,
        presence: 'composing',
      },
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro Evolution (${res.status}): ${err}`);
  }

  const data = await res.json().catch(() => ({}));
  return { sent: true, status: 'sent', data };
}

export function loadLocalCuratedLeads() {
  const combined = [];
  for (const filePath of [UNREGISTERED_LEADS_FILE, CLINICOS_LEADS_FILE]) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed)) combined.push(...parsed);
    } catch (e) {
      log(`⚠️ Erro lendo ${path.basename(filePath)}: ${e.message}`);
    }
  }

  // Deduplica por celular BR válido ou e-mail
  const seenPhones = new Set();
  const seenEmails = new Set();
  const deduped = [];
  for (const l of combined) {
    const phone = normalizeValidBrazilianMobile(l.phone);
    const email = String(l.email || '').trim().toLowerCase();
    if (!phone) continue;
    if (seenPhones.has(phone)) continue;
    if (email && seenEmails.has(email)) continue;
    seenPhones.add(phone);
    if (email) seenEmails.add(email);
    deduped.push({
      email,
      attributes: {
        NOME: l.name || '',
        WHATSAPP: phone,
        SPECIALTY: l.specialty || '',
        CRM: l.crm || '',
        UF: l.uf || l.state || '',
      },
    });
  }
  return deduped;
}

async function fetchBrevoFallbackBatch(brevoOffset = 0, limit = 50) {
  const { baseUrl, key, listId } = getBrevoConfig();
  if (!key) {
    return { count: 0, contacts: [] };
  }
  try {
    const url = `${baseUrl}/contacts/lists/${listId}/contacts?limit=${limit}&offset=${brevoOffset}`;
    const res = await fetch(url, {
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        count: data.count || 0,
        contacts: data.contacts || [],
      };
    }
    log(`⚠️ Brevo Lista ${listId} retornou HTTP ${res.status}`);
  } catch (err) {
    log(`⚠️ Erro na conexão Brevo API: ${err.message}`);
  }
  return { count: 0, contacts: [] };
}

function findNextEligibleInList(contacts, state, { knownPhones, knownNames, humanLocked, blacklist }) {
  for (const contact of contacts) {
    const rawPhone = contact.attributes?.WHATSAPP || contact.attributes?.SMS || contact.attributes?.PHONE;
    const validPhone = normalizeValidBrazilianMobile(rawPhone);
    const email = (contact.email || '').toLowerCase().trim();
    const rawName = contact.attributes?.NOME || contact.attributes?.FIRSTNAME || contact.email?.split('@')[0] || '';
    const specialty = contact.attributes?.SPECIALTY || '';
    const crm = contact.attributes?.CRM || '';
    const crmState = contact.attributes?.UF || '';

    if (!validPhone) continue;
    if (blacklist.has(validPhone) || blacklist.has(`${validPhone}@s.whatsapp.net`) || (email && blacklist.has(email))) continue;
    if (humanLocked.has(validPhone) || humanLocked.has(validPhone.slice(2)) || humanLocked.has(`${validPhone}@s.whatsapp.net`)) continue;
    if (knownPhones.has(validPhone) || (rawName && knownNames.has(rawName.toLowerCase().trim()))) continue;
    if (state.invitedPhones[validPhone] || (email && state.invitedEmails[email])) continue;

    const exclusion = isExcludedAudience(rawName, email, specialty, crm);
    if (exclusion.excluded) {
      log(`🚫 Contato PJ/não-médico descartado [${exclusion.reason}]: "${rawName}"`);
      state.invitedPhones[validPhone] = {
        name: rawName,
        excluded: true,
        reason: exclusion.reason,
        date: new Date().toISOString(),
      };
      saveState(state);
      continue;
    }

    const crmConfirmed = hasConfirmedCrm(crm, crmState);
    return {
      name: rawName,
      phone: validPhone,
      email,
      specialty,
      crm,
      crmState,
      crmConfirmed,
    };
  }
  return null;
}

export async function runOneInviteCycle({ localLeads, knownPhones, knownNames, state, now = new Date() }) {
  if (!BRISA_COLD_OUTREACH_ENABLED) {
    log('ℹ️ [ENVIO DESLIGADO] BRISA_COLD_OUTREACH_ENABLED=false.');
    return { action: 'sleep', ms: 60000, reason: 'disabled' };
  }

  if (isGlobalPauseActive()) {
    log('🛑 [PAUSA ATIVA] Automação pausada globalmente via PAUSE_AUTOMATION.flag.');
    return { action: 'sleep', ms: 60000, reason: 'global_pause' };
  }

  if (!isWithinBusinessHours(now)) {
    const brt = getBrasiliaTimeParts(now);
    log(`🌙 [FORA DO HORÁRIO COMERCIAL] Agora: ${brt.weekdayShort} ${String(brt.hour).padStart(2, '0')}:${String(brt.minute).padStart(2, '0')} BRT (permitido Seg–Sáb 09h–19h BRT). Dormindo 15 min...`);
    return { action: 'sleep', ms: 15 * 60 * 1000, reason: 'outside_business_hours' };
  }

  const conn = await checkInstanceStatus();
  if (conn.state !== 'open') {
    log(`⚠️ [EVOLUTION DESCONECTADO] Status='${conn.state}' (${conn.detail}). Aguardando 30s...`);
    return { action: 'sleep', ms: 30000, reason: `evolution_${conn.state}` };
  }

  const filters = {
    knownPhones,
    knownNames,
    humanLocked: loadHumanLocked(),
    blacklist: loadBlacklist(),
  };

  // 1. Varre toda a base local curada (sem depender de lastOffset legado obsoleto)
  let candidateFound = findNextEligibleInList(localLeads, state, filters);

  // 2. Fallback para Lista 6 da Brevo somente quando toda a base local já estiver atendida
  if (!candidateFound) {
    const { contacts } = await fetchBrevoFallbackBatch(state.brevoOffset || 0, 50);
    if (contacts.length > 0) {
      candidateFound = findNextEligibleInList(contacts, state, filters);
      if (!candidateFound) {
        state.brevoOffset = (state.brevoOffset || 0) + contacts.length;
        saveState(state);
        return { action: 'sleep', ms: 2000, reason: 'brevo_page_exhausted' };
      }
    }
  }

  if (!candidateFound) {
    log(`ℹ️ Todos os contatos elegíveis já foram processados (base local=${localLeads.length}, brevoOffset=${state.brevoOffset || 0}, totalInvited=${state.totalInvited}). Nova checagem em 1 hora...`);
    return { action: 'sleep', ms: 60 * 60 * 1000, reason: 'no_candidates' };
  }

  const msg = buildInvitationMessage(candidateFound.name, candidateFound);
  if (!msg) {
    log(`🚫 Mensagem vazia/bloqueada pelo guard para "${candidateFound.name}". Descartando.`);
    state.invitedPhones[candidateFound.phone] = {
      name: candidateFound.name,
      excluded: true,
      reason: 'addressing_blocked',
      date: new Date().toISOString(),
    };
    saveState(state);
    return { action: 'sleep', ms: 2000, reason: 'addressing_blocked' };
  }

  const displayTag = candidateFound.crmConfirmed ? `CRM ${candidateFound.crm}` : 'sem CRM (saudação neutra)';
  log(`🎯 Candidato selecionado: ${candidateFound.name} [${displayTag}]`);

  try {
    const sendRes = await sendWhatsApp(candidateFound.phone, msg, candidateFound, now);
    if (sendRes.sent) {
      state.totalInvited++;
      state.invitedPhones[candidateFound.phone] = {
        name: candidateFound.name,
        email: candidateFound.email,
        crmConfirmed: candidateFound.crmConfirmed,
        invited_at: new Date().toISOString(),
      };
      if (candidateFound.email) {
        state.invitedEmails[candidateFound.email] = new Date().toISOString();
      }
      saveState(state);
      log(`✅ Convite WhatsApp enviado! Total acumulado: ${state.totalInvited}. Próximo em ${Math.round(CADENCE_MS / 60000)} min.`);
      return { action: 'sent', ms: CADENCE_MS, phone: candidateFound.phone };
    }
    if (sendRes.retryLater) {
      log(`⏸️ Envio adiado (${sendRes.reason}) sem descartar contato. Aguardando 5 min...`);
      return { action: 'sleep', ms: 5 * 60 * 1000, reason: sendRes.reason };
    }
    log(`🚫 Envio barrado (${sendRes.reason}). Marcando contato como ignorado.`);
    state.invitedPhones[candidateFound.phone] = {
      name: candidateFound.name,
      excluded: true,
      reason: sendRes.reason,
      date: new Date().toISOString(),
    };
    saveState(state);
    return { action: 'sleep', ms: 5000, reason: sendRes.reason };
  } catch (sendErr) {
    const isConnErr = /Connection Closed|500|502|503|ECONNREFUSED|ETIMEDOUT/i.test(sendErr.message || '');
    if (isConnErr) {
      log(`⚠️ [EVOLUTION INSTABILIDADE] Erro transitório: ${sendErr.message}. Contato preservado; aguardando 60s...`);
      return { action: 'sleep', ms: 60000, reason: 'evolution_transient_error' };
    }
    log(`❌ Falha permanente no envio: ${sendErr.message}`);
    state.invitedPhones[candidateFound.phone] = {
      name: candidateFound.name,
      email: candidateFound.email,
      failed: true,
      error: sendErr.message,
      attempted_at: new Date().toISOString(),
    };
    saveState(state);
    return { action: 'sleep', ms: 5000, reason: 'send_permanent_error' };
  }
}

export async function run() {
  if (!acquirePidLock()) {
    process.exit(0);
  }
  process.on('exit', releasePidLock);
  process.on('SIGINT', () => { releasePidLock(); process.exit(0); });
  process.on('SIGTERM', () => { releasePidLock(); process.exit(0); });

  const localLeads = loadLocalCuratedLeads();
  const knownDoctors = loadKnownDoctors();
  const knownPhones = new Set(knownDoctors.map(d => (d.phone || '').replace(/\D/g, '')).filter(Boolean));
  const knownNames = new Set(knownDoctors.map(d => (d.name || '').toLowerCase().trim()).filter(Boolean));
  const state = loadState();
  const evo = getEvoConfig();
  const brevo = getBrevoConfig();
  const brt = getBrasiliaTimeParts();
  const pendingLocal = localLeads.filter(c => !state.invitedPhones[c.attributes.WHATSAPP]).length;

  log('========================================================================');
  log('🚀 AGENTE DE CONVITES WHATSAPP PARA MÉDICOS INICIADO (PM2 COMPATÍVEL)');
  log(`🔒 OUTREACH_ENABLED=${BRISA_COLD_OUTREACH_ENABLED} | DRY_RUN=${BRISA_CONFIG.DRY_RUN} | EVO_KEY=${evo.key ? 'OK' : 'AUSENTE'} | BREVO_KEY=${brevo.key ? 'OK' : 'AUSENTE'}`);
  log(`🌐 Evolution: ${evo.url} (instância: ${evo.instance})`);
  log(`🕒 Agora em BRT: ${brt.weekdayShort} ${String(brt.hour).padStart(2, '0')}:${String(brt.minute).padStart(2, '0')} | Janela Seg–Sáb 09h–19h: ${isWithinBusinessHours() ? 'ABERTA' : 'FECHADA'}`);
  log(`⏱️ Cadência fixa: 1 convite a cada ${Math.round(CADENCE_MS / 60000)} minutos`);
  log(`📋 Base local: ${localLeads.length} celulares BR válidos | Pendentes locais: ${pendingLocal} | Já enviados: ${state.totalInvited}`);
  log('========================================================================');

  while (true) {
    try {
      const result = await runOneInviteCycle({ localLeads, knownPhones, knownNames, state });
      await new Promise(r => setTimeout(r, result.ms));
    } catch (loopErr) {
      log(`⚠️ Erro no ciclo de convites WhatsApp: ${loopErr.message}`);
      await new Promise(r => setTimeout(r, 60000));
    }
  }
}

// PM2 roda ESM via ProcessContainerFork.js (onde process.argv[1] != __filename).
// Por isso só desativamos autostart em ambiente de teste (VITEST / NODE_ENV=test / BRISA_NO_AUTOSTART=1).
const isTestEnv = Boolean(
  process.env.VITEST ||
  process.env.NODE_ENV === 'test' ||
  process.env.BRISA_NO_AUTOSTART === '1',
);
if (!isTestEnv) {
  run().catch((err) => {
    log(`🔥 Erro fatal: ${err.message}`);
    releasePidLock();
    process.exit(1);
  });
}
