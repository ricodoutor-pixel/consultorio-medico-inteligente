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
  isBusinessHoursBRT,
  isCompanyOrNonDoctorContact,
  hasConfirmedCrm,
  formatDoctorAddressing,
} from '../supabase/functions/_shared/whatsapp-outreach-guard.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, 'brevo_whatsapp_inviter.log');
const STATE_FILE = path.join(__dirname, 'brevo_whatsapp_invited_doctors.json');
const PID_LOCK_FILE = path.join(__dirname, 'brevo_whatsapp_inviter.pid.lock');
const DOCTORS_LIST_FILE = path.join(__dirname, 'database_doctors_list.json');
const UNREGISTERED_LEADS_FILE = path.join(__dirname, 'unregistered_doctors_leads.json');
const CLINICOS_LEADS_FILE = path.join(__dirname, 'clinicos_gerais_pos2020_leads.json');
const HUMAN_LOCK_FILE = path.join(__dirname, 'evolution_human_mode_contacts.json');
const BLACKLIST_FILE = path.join(__dirname, 'evolution_optout_blacklist.json');
const PAUSE_GLOBAL_FILE = path.join(__dirname, 'PAUSE_AUTOMATION.flag');

// Chave de Liga/Desliga (ativa no PM2 via ecosystem.config.cjs; desligável via env)
const BRISA_COLD_OUTREACH_ENABLED = process.env.BRISA_COLD_OUTREACH_ENABLED !== 'false';

// Cadência fixa de 15 minutos entre envios bem-sucedidos (mínimo rígido de 15 min)
export const CADENCE_MS = Math.max(
  15 * 60 * 1000,
  Number(process.env.WPP_INVITE_CADENCE_MS || 15 * 60 * 1000),
);

const EVO_URL = process.env.EVOLUTION_URL_VPS || process.env.EVOLUTION_URL || 'https://whatsapp.plantayraiz.com.br';
const EVO_KEY = process.env.EVOLUTION_API_KEY_VPS || process.env.EVOLUTION_API_KEY || '';
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'plantayraiz';

const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_LIST_ID = Number(process.env.BREVO_LIST_MEDICOS || 6);

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [BREVO-WPP-15MIN] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (_) {}
}

function acquirePidLock() {
  try {
    const fd = fs.openSync(PID_LOCK_FILE, 'wx');
    fs.writeFileSync(fd, String(process.pid));
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err?.code !== 'EEXIST') return false;
    try {
      const oldPid = Number(fs.readFileSync(PID_LOCK_FILE, 'utf8').trim());
      if (oldPid && oldPid !== process.pid) {
        try {
          process.kill(oldPid, 0);
          log(`🛑 [PID-LOCK] Outra instância já ativa (PID ${oldPid}). Encerrando duplicata.`);
          return false;
        } catch (_) {
          // Processo antigo não existe mais; recupera o lock
          fs.unlinkSync(PID_LOCK_FILE);
          const fd = fs.openSync(PID_LOCK_FILE, 'wx');
          fs.writeFileSync(fd, String(process.pid));
          fs.closeSync(fd);
          return true;
        }
      }
    } catch (_) {}
    return false;
  }
}

function releasePidLock() {
  try {
    if (fs.existsSync(PID_LOCK_FILE)) {
      const pidInFile = Number(fs.readFileSync(PID_LOCK_FILE, 'utf8').trim());
      if (pidInFile === process.pid) {
        fs.unlinkSync(PID_LOCK_FILE);
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
  if (!EVO_KEY) return 'missing_api_key';
  try {
    const res = await fetch(`${EVO_URL}/instance/connectionState/${INSTANCE}`, {
      headers: { apikey: EVO_KEY },
    });
    if (!res.ok) return 'error';
    const data = await res.json();
    return data?.instance?.state || data?.state || 'close';
  } catch (_) {
    return 'network_error';
  }
}

function loadState() {
  const defaultState = {
    lastOffset: 0,
    brevoOffset: 0,
    totalInvited: 0,
    invitedPhones: {},
    invitedEmails: {},
  };
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
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
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
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

async function sendWhatsApp(recipient, text, contact = {}) {
  if (!isWithinBusinessHours()) {
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
  });
  if (!guard.canSend) {
    log(`🛡️ ${guard.log}`);
    const retryLater = guard.reason === 'OUTSIDE_BUSINESS_HOURS_BRT' || guard.reason === 'DRY_RUN_ACTIVE';
    return { sent: false, dryRun: guard.reason === 'DRY_RUN_ACTIVE', status: 'blocked', reason: guard.reason, retryLater };
  }

  log(`📤 Enviando convite WhatsApp para +${cleanNumber}...`);
  const res = await fetch(`${EVO_URL}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: {
      apikey: EVO_KEY,
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

function loadLocalCuratedLeads() {
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

async function fetchNextBatch(localLeads, state, limit = 50) {
  // 1. Prioriza a base local curada e deduplicada
  if (state.lastOffset < localLeads.length) {
    return {
      source: 'local',
      count: localLeads.length,
      contacts: localLeads.slice(state.lastOffset, state.lastOffset + limit),
    };
  }

  // 2. Fallback para API Brevo Lista 6 após concluir a base local
  if (!BREVO_KEY) {
    return { source: 'none', count: 0, contacts: [] };
  }
  try {
    const url = `https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}/contacts?limit=${limit}&offset=${state.brevoOffset || 0}`;
    const res = await fetch(url, {
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        source: 'brevo',
        count: data.count || 0,
        contacts: data.contacts || [],
      };
    }
  } catch (err) {
    log(`⚠️ Erro na conexão Brevo API: ${err.message}`);
  }

  return { source: 'brevo', count: 0, contacts: [] };
}

async function run() {
  if (!acquirePidLock()) {
    process.exit(0);
  }
  process.on('exit', releasePidLock);
  process.on('SIGINT', () => { releasePidLock(); process.exit(0); });
  process.on('SIGTERM', () => { releasePidLock(); process.exit(0); });

  const localLeads = loadLocalCuratedLeads();

  log('========================================================================');
  log('🚀 AGENTE DE CONVITES WHATSAPP PARA MÉDICOS INICIADO');
  log(`🔒 BRISA_COLD_OUTREACH_ENABLED = ${BRISA_COLD_OUTREACH_ENABLED} | DRY_RUN = ${BRISA_CONFIG.DRY_RUN}`);
  log('🕒 Janela estrita: Segunda a Sábado, 09h às 19h (Horário de Brasília)');
  log(`⏱️ Cadência fixa: 1 convite a cada ${Math.round(CADENCE_MS / 60000)} minutos`);
  log(`📋 Base local curada com celular BR válido: ${localLeads.length} contatos`);
  log('========================================================================');

  const knownDoctors = loadKnownDoctors();
  const knownPhones = new Set(knownDoctors.map(d => (d.phone || '').replace(/\D/g, '')).filter(Boolean));
  const knownNames = new Set(knownDoctors.map(d => (d.name || '').toLowerCase().trim()).filter(Boolean));

  const state = loadState();

  while (true) {
    try {
      if (!BRISA_COLD_OUTREACH_ENABLED) {
        log('ℹ️ [ENVIO DESLIGADO] BRISA_COLD_OUTREACH_ENABLED=false. Aguardando 60s...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }

      if (isGlobalPauseActive()) {
        log('🛑 [PAUSA ATIVA] Automação pausada globalmente via PAUSE_AUTOMATION.flag. Aguardando 60s...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }

      if (!isWithinBusinessHours()) {
        log('🌙 [FORA DO HORÁRIO COMERCIAL] Envios permitidos apenas Seg–Sáb, 09h–19h BRT. Aguardando 15 min...');
        await new Promise(r => setTimeout(r, 15 * 60 * 1000));
        continue;
      }

      const connState = await checkInstanceStatus();
      if (connState !== 'open') {
        log(`⚠️ [EVOLUTION DESCONECTADO] Status da instância '${INSTANCE}': ${connState}. Aguardando 30s...`);
        await new Promise(r => setTimeout(r, 30000));
        continue;
      }

      const { source, contacts } = await fetchNextBatch(localLeads, state, 50);

      if (!contacts || contacts.length === 0) {
        log(`ℹ️ Todos os contatos disponíveis já foram percorridos (local: ${state.lastOffset}/${localLeads.length}, brevo: ${state.brevoOffset || 0}). Nova verificação em 1 hora...`);
        await new Promise(r => setTimeout(r, 60 * 60 * 1000));
        continue;
      }

      let candidateFound = null;
      const humanLocked = loadHumanLocked();
      const blacklist = loadBlacklist();

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
          log(`🚫 Contato PJ/não-médico descartado [${exclusion.reason}]: "${rawName}" (+${validPhone})`);
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
        candidateFound = {
          name: rawName,
          phone: validPhone,
          email,
          specialty,
          crm,
          crmState,
          crmConfirmed,
        };
        break;
      }

      if (!candidateFound) {
        if (source === 'local') {
          state.lastOffset += contacts.length;
        } else if (source === 'brevo') {
          state.brevoOffset = (state.brevoOffset || 0) + contacts.length;
        }
        saveState(state);
        log(`⏩ Lote (${source}) sem pendentes. Avançando offset (local=${state.lastOffset}, brevo=${state.brevoOffset || 0})...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const msg = buildInvitationMessage(candidateFound.name, candidateFound);
      if (!msg) {
        log(`🚫 Mensagem vazia/bloqueada pelo guard para "${candidateFound.name}" (+${candidateFound.phone}). Descartando.`);
        state.invitedPhones[candidateFound.phone] = {
          name: candidateFound.name,
          excluded: true,
          reason: 'addressing_blocked',
          date: new Date().toISOString(),
        };
        saveState(state);
        continue;
      }

      const displayTag = candidateFound.crmConfirmed ? `CRM ${candidateFound.crm}` : 'sem CRM (saudação neutra)';
      log(`🎯 Candidato selecionado: ${candidateFound.name} (+${candidateFound.phone}) [${displayTag}]`);

      let sentSuccessfully = false;
      try {
        const sendRes = await sendWhatsApp(candidateFound.phone, msg, candidateFound);
        if (sendRes.sent) {
          log(`✅ Convite enviado com sucesso para ${candidateFound.name} (+${candidateFound.phone})!`);
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
          log(`📊 Total acumulado de convites WhatsApp: ${state.totalInvited}`);
          sentSuccessfully = true;
        } else if (sendRes.retryLater) {
          log(`⏸️ Envio adiado (${sendRes.reason}) sem descartar contato. Aguardando 5 min...`);
          await new Promise(r => setTimeout(r, 5 * 60 * 1000));
          continue;
        } else {
          log(`🚫 Envio barrado (${sendRes.reason}) para +${candidateFound.phone}. Marcando como ignorado.`);
          state.invitedPhones[candidateFound.phone] = {
            name: candidateFound.name,
            excluded: true,
            reason: sendRes.reason,
            date: new Date().toISOString(),
          };
          saveState(state);
        }
      } catch (sendErr) {
        const isConnErr = /Connection Closed|500|502|503|ECONNREFUSED|ETIMEDOUT/i.test(sendErr.message || '');
        if (isConnErr) {
          log(`⚠️ [EVOLUTION INSTABILIDADE] Erro transitório para +${candidateFound.phone}: ${sendErr.message}. Contato preservado; aguardando 60s...`);
          await new Promise(r => setTimeout(r, 60000));
          continue;
        }
        log(`❌ Falha permanente no envio para +${candidateFound.phone}: ${sendErr.message}`);
        state.invitedPhones[candidateFound.phone] = {
          name: candidateFound.name,
          email: candidateFound.email,
          failed: true,
          error: sendErr.message,
          attempted_at: new Date().toISOString(),
        };
        saveState(state);
      }

      if (sentSuccessfully) {
        log(`⏳ Aguardando ${Math.round(CADENCE_MS / 60000)} minutos até o próximo convite WhatsApp...`);
        await new Promise(r => setTimeout(r, CADENCE_MS));
      } else {
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (loopErr) {
      log(`⚠️ Erro no ciclo de convites WhatsApp: ${loopErr.message}`);
      await new Promise(r => setTimeout(r, 60000));
    }
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  run().catch((err) => {
    log(`🔥 Erro fatal: ${err.message}`);
    releasePidLock();
    process.exit(1);
  });
}
