/**
 * scripts/agent_brevo_doctor_whatsapp_inviter.mjs
 *
 * 🌿 Planta y Raiz — Agente Oficial de Convites WhatsApp para Médicos
 * Atualizado por ordem expressa do Dr. Edilson em 26/11/2026:
 *
 * Regras estritas de segurança e governança:
 * - Cadência fixa: 1 convite a cada 15 minutos (mínimo rígido de 15 min)
 * - Operação 24x7 por padrão (sem restrição de dia nem de hora). Opcionalmente restringível via OUTREACH_HOURS=09-19
 * - Busca leads médicos em TODAS as fontes locais (repositório + scripts/) e TODAS as listas de médicos da Brevo
 * - Nunca repete o mesmo número (state invitedPhones + variantes com/sem 9º dígito/DDI)
 * - Respeita integralmente quem respondeu SAIR (blacklist opt-out) e contatos em atendimento humano
 * - Bloqueio rigoroso de PJ/empresas/clínicas/não-médicos (isCompanyOrNonDoctorContact)
 * - Jamais prefixa "Dr(a)." sem CRM confirmado (saudação neutra para leads sem CRM)
 * - Assinado pela Enfª Brisa, com link oficial de credenciamento e opção SAIR
 * - Trava PID exclusiva (rejeita instâncias sobrepostas no PM2/VPS)
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
  isOutreachHoursAllowed,
  parseOutreachHoursSpec,
  isCompanyOrNonDoctorContact,
  hasConfirmedCrm,
  formatDoctorAddressing,
  normalizeAscii,
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
const HUMAN_LOCK_FILE = path.join(__dirname, 'evolution_human_mode_contacts.json');
const BLACKLIST_FILE = path.join(__dirname, 'evolution_optout_blacklist.json');
const PAUSE_GLOBAL_FILE = path.join(__dirname, 'PAUSE_AUTOMATION.flag');

// Fontes locais conhecidas de leads médicos (repositório + arquivos opcionais no disco da VPS)
export const EXPLICIT_LOCAL_LEAD_FILES = Object.freeze([
  'unregistered_doctors_leads.json',
  'clinicos_gerais_pos2020_leads.json',
  'linkedin_prescribers_leads.json',
  'prescritores_master_list.json',
  'doctor_leads_collected.json',
  'mined_doctor_leads.json',
  'priority_doctor_queue.json',
  'priority_doctors_phones.json',
  'apify_harvested_leads.json',
]);

// Arquivos que NUNCA são fila de prospecção (estado, logs, blacklists, pacientes, farmácias, já cadastrados)
const EXCLUDED_LOCAL_FILE_EXACT = new Set([
  'database_doctors_list.json',
  'brevo_whatsapp_invited_doctors.json',
  'evolution_optout_blacklist.json',
  'evolution_human_mode_contacts.json',
  'email_welcome_medicos_log.json',
  'vip_lifecycle_state.json',
  'master_dashboard_snapshot.json',
  'optimizer_history.json',
  'whatsapp_contacts_map.json',
  'bounced_emails_blacklist.json',
  'instagram_invited_doctors.json',
]);

const EXCLUDED_LOCAL_FILE_PATTERN =
  /(state|log|blacklist|optout|human_mode|snapshot|history|map|bounced|welcome|database_doctors|paciente|patient|farmac|drogaria|lojista|partner|parceiro|invited|sent|campaign|hunter|audit|backup|package)/i;

const AUTO_DISCOVER_LEAD_FILE_PATTERN =
  /(doctor|medico|medicos|prescritor|prescritores|clinicos|crm|lead)/i;

// Listas da Brevo: nunca puxar farmácias (5), pacientes (7), leads gerais (8) ou listas de exclusão
const BREVO_DOCTOR_LIST_NAME_PATTERN =
  /m[eé]dic|prescritor|doctor|crm|cl[ií]nic[oa]s?\s+gera|sa[uú]de\s+da\s+fam[ií]lia|integrativ|canabin/i;

const BREVO_EXCLUDED_LIST_NAME_PATTERN =
  /paciente|farmac|drogaria|lojista|cadastrad|bloquead|bounce|optout|exclu|cancelad|desinscrit|blacklist|fornecedor/i;

const BREVO_MEDICAL_INDICATOR_PATTERN =
  /\b(dr\.?|dra\.?|dr\(a\)\.?|m[eé]dic[oa]s?|prescritor(?:a|es)?|crm|cl[ií]nic[oa]\s+geral|medicina|psiquiatr|neurolog|pediatr|ortoped|cardiolog|ginecolog|dermatolog|endocrinolog|oncolog|pneumolog|reumatolog|geriatr|anestesiolog|urolog|oftalmolog|otorrino|cirurgi[aã]o)\b/i;

// Chave de Liga/Desliga (ativa no PM2 via ecosystem.config.cjs; desligável via env)
const BRISA_COLD_OUTREACH_ENABLED = process.env.BRISA_COLD_OUTREACH_ENABLED !== 'false';

// Cadência fixa de 15 minutos entre envios bem-sucedidos (mínimo rígido de 15 min em produção)
export const CADENCE_MS = Math.max(
  15 * 60 * 1000,
  Number(process.env.WPP_INVITE_CADENCE_MS || 15 * 60 * 1000),
);

const QUEUE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

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
  const configuredListId = Number(process.env.BREVO_LIST_MEDICOS || 6);
  const extraListIds = String(process.env.BREVO_DOCTOR_LIST_IDS || '')
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  const excludedIds = new Set(
    [
      Number(process.env.BREVO_LIST_FARMACIAS || 5),
      Number(process.env.BREVO_LIST_PACIENTES || 7),
      8, // Lista geral de leads/pacientes (agent_meta_organic_growth.mjs)
    ].filter((n) => Number.isInteger(n) && n > 0),
  );
  // Se o operador configurou explicitamente um ID como lista de médicos, não excluir
  excludedIds.delete(configuredListId);
  for (const id of extraListIds) excludedIds.delete(id);

  return {
    baseUrl: (process.env.BREVO_API_BASE_URL || 'https://api.brevo.com/v3').replace(/\/+$/, ''),
    key: process.env.BREVO_API_KEY || process.env.BREVO_KEY || '',
    listId: configuredListId,
    extraListIds,
    excludedIds,
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

// ============================================================================
// NORMALIZAÇÃO DE TELEFONES E CHAVES DE DEDUPLICAÇÃO (COM/SEM 9º DÍGITO E DDI)
// ============================================================================

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

export function getPhoneMatchKeys(raw) {
  if (!raw) return [];
  const rawStr = String(raw).trim().toLowerCase();
  let digits = rawStr.replace(/@.*$/, '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits) return [];

  const keys = new Set([digits]);
  if (digits.length === 13 && digits.startsWith('55')) {
    keys.add(digits.slice(2)); // DD9XXXXXXXX
    keys.add(`${digits.slice(0, 4)}${digits.slice(5)}`); // 55DDXXXXXXXX
    keys.add(`${digits.slice(2, 4)}${digits.slice(5)}`); // DDXXXXXXXX
  } else if (digits.length === 12 && digits.startsWith('55')) {
    keys.add(digits.slice(2)); // DDXXXXXXXX
    keys.add(`${digits.slice(0, 4)}9${digits.slice(4)}`); // 55DD9XXXXXXXX
    keys.add(`${digits.slice(2, 4)}9${digits.slice(4)}`); // DD9XXXXXXXX
  } else if (digits.length === 11) {
    keys.add(`55${digits}`);
    keys.add(`55${digits.slice(0, 2)}${digits.slice(3)}`);
    keys.add(`${digits.slice(0, 2)}${digits.slice(3)}`);
  } else if (digits.length === 10) {
    keys.add(`55${digits}`);
    keys.add(`55${digits.slice(0, 2)}9${digits.slice(2)}`);
    keys.add(`${digits.slice(0, 2)}9${digits.slice(2)}`);
  }
  return Array.from(keys);
}

function addPhoneKeysToSet(targetSet, raw) {
  if (!raw) return;
  const rawLower = String(raw).trim().toLowerCase();
  if (rawLower) targetSet.add(rawLower);
  for (const key of getPhoneMatchKeys(raw)) {
    targetSet.add(key);
  }
}

function hasPhoneMatch(targetSet, phone, email = '') {
  if (!targetSet || targetSet.size === 0) return false;
  if (email && targetSet.has(email.toLowerCase().trim())) return true;
  if (targetSet.has(`${phone}@s.whatsapp.net`)) return true;
  for (const key of getPhoneMatchKeys(phone)) {
    if (targetSet.has(key)) return true;
  }
  return false;
}

// Campanhas antigas que já mandaram convite frio ("Parabéns, Dr(a)...") pelo mesmo WhatsApp.
// Quem já recebeu por elas nunca recebe de novo (ordem do Dr. Edilson: nunca repetir o mesmo número).
export const PREVIOUS_CAMPAIGN_STATE_FILES = Object.freeze([
  'priority_campaign_state.json',     // priority-15min-inviter
  'medico_socio_campaign_state.json', // cadence-10min-inviter
]);

export function loadPreviousCampaignPhones(dir = __dirname) {
  const set = new Set();
  for (const fileName of PREVIOUS_CAMPAIGN_STATE_FILES) {
    try {
      const full = path.join(dir, fileName);
      if (!fs.existsSync(full)) continue;
      const data = JSON.parse(fs.readFileSync(full, 'utf8'));
      const sent = [
        ...(Array.isArray(data?.sentWhatsapps) ? data.sentWhatsapps : []),
        ...(Array.isArray(data?.invalidWhatsapps) ? data.invalidWhatsapps : []),
      ];
      for (const item of sent) addPhoneKeysToSet(set, typeof item === 'string' ? item : item?.phone || '');
      for (const info of Object.values(data?.history || {})) {
        if (info?.phone && (info.whatsappAt || info.status === 'ENVIADO' || info.status === 'JA_ENVIADO_NO_EVOLUTION')) {
          addPhoneKeysToSet(set, info.phone);
        }
      }
    } catch (_) { /* arquivo corrompido não bloqueia o robô */ }
  }
  return set;
}

function buildInvitedPhoneKeySet(state) {
  const set = loadPreviousCampaignPhones();
  for (const k of Object.keys(state?.invitedPhones || {})) {
    addPhoneKeysToSet(set, k);
  }
  return set;
}

function loadHumanLocked() {
  const locked = new Set();
  try {
    if (fs.existsSync(HUMAN_LOCK_FILE)) {
      const raw = JSON.parse(fs.readFileSync(HUMAN_LOCK_FILE, 'utf8'));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          addPhoneKeysToSet(locked, typeof item === 'string' ? item : item?.jid || item?.phone || '');
        }
      } else if (raw && typeof raw === 'object') {
        for (const key of Object.keys(raw)) {
          addPhoneKeysToSet(locked, key);
        }
      }
    }
  } catch (_) {}
  return locked;
}

function loadBlacklist() {
  const blocked = new Set();
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      const raw = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          addPhoneKeysToSet(blocked, typeof item === 'string' ? item : item?.jid || item?.phone || item?.email || '');
        }
      } else if (raw && typeof raw === 'object') {
        for (const key of Object.keys(raw)) {
          addPhoneKeysToSet(blocked, key);
        }
      }
    }
  } catch (_) {}
  return blocked;
}

// ============================================================================
// JANELA DE HORÁRIO (24x7 POR PADRÃO; OPCIONAL OUTREACH_HOURS=09-19)
// ============================================================================

export function isWithinOutreachHours(now = new Date(), hoursSpec = undefined) {
  return isOutreachHoursAllowed(now, hoursSpec);
}

// Mantém alias exportado por compatibilidade com chamadores existentes
export function isWithinBusinessHours(now = new Date(), hoursSpec = undefined) {
  return isOutreachHoursAllowed(now, hoursSpec);
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

// ============================================================================
// HIGIENIZAÇÃO DE CAMPOS DE LEAD (INCLUINDO PERFIS ESTILO LINKEDIN/GOOGLE PLACES)
// ============================================================================

const FACILITY_TAGLINE_PATTERN =
  /\b(instituto|hospital|policlinica|centro\s+medico|ltda|eireli|s\/a|cnpj|odontolog|psicolog|veterinari|contabil|imobiliaria|advocacia)\b/i;

const NON_SPECIALTY_CLINIC_TAGLINE_PATTERN =
  /\bclinica\b(?!\s+(?:geral|medica)\b)/i;

export function normalizeLeadRecord(rawRecord, sourceName = 'local') {
  if (!rawRecord || typeof rawRecord !== 'object' || Array.isArray(rawRecord)) return null;

  const attrs = rawRecord.attributes && typeof rawRecord.attributes === 'object' ? rawRecord.attributes : rawRecord;
  const rawPhone =
    attrs.WHATSAPP ||
    attrs.SMS ||
    attrs.PHONE ||
    attrs.TELEFONE ||
    attrs.CELULAR ||
    attrs.MOBILE ||
    attrs.FONE ||
    rawRecord.phone ||
    rawRecord.whatsapp ||
    rawRecord.telefone ||
    rawRecord.celular ||
    rawRecord.tel ||
    rawRecord.cell ||
    rawRecord.mobile ||
    '';

  const phone = normalizeValidBrazilianMobile(rawPhone);
  if (!phone) return null;

  const email = String(rawRecord.email || attrs.EMAIL || '').trim().toLowerCase();
  const fullNameRaw = String(
    attrs.NOME ||
      attrs.FULLNAME ||
      attrs.NAME ||
      [attrs.FIRSTNAME, attrs.LASTNAME].filter(Boolean).join(' ') ||
      rawRecord.name ||
      rawRecord.full_name ||
      rawRecord.cleanName ||
      rawRecord.title ||
      '',
  ).trim();

  // Nunca aceitar registros sem nome e sem e-mail (protege contra dumps de números anônimos de empresas/clínicas)
  if (!fullNameRaw && !email) return null;

  // Separa nome pessoal de descrições após "|", "•", "–", "—" ou " - " (ex.: perfis do LinkedIn/Google Places)
  const nameParts = fullNameRaw
    .split(/\s*[|–—•]\s*|\s+-\s+|\s+-(?=[A-ZÁ-Ú])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const leadName = nameParts[0] || fullNameRaw || email.split('@')[0] || '';
  const tagline = nameParts.slice(1).join(' | ').trim();
  const taglineNorm = normalizeAscii(tagline);

  const rawSpecialty = String(
    attrs.SPECIALTY ||
      attrs.ESPECIALIDADE ||
      attrs.AREA ||
      rawRecord.specialty ||
      rawRecord.especialidade ||
      rawRecord.role ||
      rawRecord.headline ||
      '',
  ).trim();

  const rawBio = String(attrs.BIO || attrs.NOTES || rawRecord.bio || rawRecord.notes || '').trim();
  const rawCompany = String(attrs.COMPANY || attrs.EMPRESA || rawRecord.company || rawRecord.empresa || '').trim();

  // Se o sufixo contiver empresa/instituto/clínica não-especialidade, envia em `company` para o filtro PJ bloquear
  const taglineIsFacility =
    Boolean(taglineNorm) &&
    (FACILITY_TAGLINE_PATTERN.test(taglineNorm) || NON_SPECIALTY_CLINIC_TAGLINE_PATTERN.test(taglineNorm));

  const company = [rawCompany, taglineIsFacility ? tagline : ''].filter(Boolean).join(' | ');
  const specialty = [rawSpecialty, !taglineIsFacility ? tagline : ''].filter(Boolean).join(' | ');

  const crm = String(attrs.CRM || rawRecord.crm || '').trim();
  const uf = String(attrs.UF || attrs.STATE || attrs.ESTADO || rawRecord.uf || rawRecord.state || '').trim();
  const councilType = String(attrs.COUNCIL_TYPE || rawRecord.councilType || rawRecord.council_type || '').trim();

  return {
    email,
    source: sourceName,
    attributes: {
      NOME: leadName,
      RAW_NAME: fullNameRaw,
      WHATSAPP: phone,
      SPECIALTY: specialty,
      BIO: rawBio,
      COMPANY: company,
      CRM: crm,
      UF: uf,
      COUNCIL_TYPE: councilType,
    },
  };
}

// Bloqueia PJ/empresas/clínicas/não-médicos. Contatos PF sem CRM seguem com saudação neutra (sem "Dr(a).").
export function isExcludedAudience(name = '', email = '', specialty = '', crm = '', councilType = '', extra = {}) {
  const check = isCompanyOrNonDoctorContact({
    name,
    email,
    specialty,
    crm,
    councilType,
    company: extra?.company || '',
    bio: extra?.bio || '',
  });
  if (check.blocked) {
    return { excluded: true, reason: check.reason };
  }
  return { excluded: false };
}

export function buildInvitationMessage(doctorName, options = {}) {
  const rawCheck = isCompanyOrNonDoctorContact({
    name: doctorName,
    email: options.email || '',
    specialty: options.specialty || '',
    company: options.company || '',
    bio: options.bio || '',
    crm: options.crm || '',
    councilType: options.councilType || options.council_type || '',
  });
  if (rawCheck.blocked) return '';

  const sanitized = sanitizeDoctorName(doctorName);
  const isGenericOrUsername =
    !sanitized ||
    /^doutor(?:\(a\)|a)?$/i.test(sanitized) ||
    /\d|[._@]/.test(sanitized);
  const cleanName = isGenericOrUsername ? '' : sanitized;

  const crmConfirmed = Boolean(options.crmConfirmed) || hasConfirmedCrm(
    options.crm || '',
    options.crmState || options.crm_state || '',
    options.councilType || options.council_type || '',
  );
  const addressing = formatDoctorAddressing({
    name: cleanName,
    crm: options.crm || '',
    crmState: options.crmState || options.crm_state || '',
    councilType: options.councilType || options.council_type || '',
    crmConfirmed,
    email: options.email || '',
    specialty: options.specialty || '',
    company: options.company || '',
    bio: options.bio || '',
  });
  if (!addressing.allowed) return '';
  return buildOfficialInvitationMessage(addressing.cleanName, {
    ...options,
    crmConfirmed,
  });
}

async function sendWhatsApp(recipient, text, contact = {}, now = new Date()) {
  if (!isWithinOutreachHours(now)) {
    return { sent: false, status: 'blocked', reason: 'OUTSIDE_OUTREACH_HOURS_BRT', retryLater: true };
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

  // 🛡️ GUARDA DE PRÉ-ENVIO (janela configurada 24x7/OUTREACH_HOURS, PJ, sem Dr(a). sem CRM, opt-out, textos proibidos)
  const guard = preSendGuard(norm.normalizedJid, text, {
    isOutreach: true,
    contact,
    crmConfirmed,
    now,
  });
  if (!guard.canSend) {
    log(`🛡️ ${guard.log}`);
    const retryLater =
      guard.reason === 'OUTSIDE_OUTREACH_HOURS_BRT' ||
      guard.reason === 'OUTSIDE_BUSINESS_HOURS_BRT' ||
      guard.reason === 'DRY_RUN_ACTIVE';
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

// ============================================================================
// CARREGAMENTO DE TODAS AS FONTES LOCAIS DE LEADS MÉDICOS (scripts/)
// ============================================================================

function extractStructuredDoctorObjects(parsed) {
  if (Array.isArray(parsed)) {
    return parsed.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
  }
  if (!parsed || typeof parsed !== 'object') return [];

  // Contêineres com arrays nomeados: ler APENAS coleções médicas (nunca pacientes/farmácias)
  const medicalArrayKeys = ['medicos', 'doctors', 'leads', 'contacts', 'queue', 'items'];
  let foundContainerArray = false;
  const collected = [];
  for (const key of medicalArrayKeys) {
    if (Array.isArray(parsed[key])) {
      foundContainerArray = true;
      for (const item of parsed[key]) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          collected.push(item);
        }
      }
    }
  }
  if (foundContainerArray) return collected;

  // Mapa indexado por telefone (ex.: priority_doctors_phones.json: { "55119...": { name, salutation } })
  for (const [key, val] of Object.entries(parsed)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const candidatePhone = val.phone || val.whatsapp || key;
      if (normalizeValidBrazilianMobile(candidatePhone)) {
        collected.push({ ...val, phone: candidatePhone });
      }
    }
  }
  return collected;
}

export function loadAllLocalDoctorLeadSources(scriptsDir = __dirname) {
  const orderedFiles = [];
  const addedNames = new Set();

  for (const fileName of EXPLICIT_LOCAL_LEAD_FILES) {
    const fullPath = path.join(scriptsDir, fileName);
    if (fs.existsSync(fullPath)) {
      orderedFiles.push({ fileName, fullPath });
      addedNames.add(fileName);
    }
  }

  // Autodescoberta de quaisquer outras listas JSON de médicos em scripts/ (ex.: arquivos locais na VPS)
  try {
    const entries = fs.readdirSync(scriptsDir).sort();
    for (const fileName of entries) {
      if (!fileName.endsWith('.json') || addedNames.has(fileName)) continue;
      if (EXCLUDED_LOCAL_FILE_EXACT.has(fileName)) continue;
      if (EXCLUDED_LOCAL_FILE_PATTERN.test(fileName)) continue;
      if (!AUTO_DISCOVER_LEAD_FILE_PATTERN.test(fileName)) continue;
      orderedFiles.push({ fileName, fullPath: path.join(scriptsDir, fileName) });
      addedNames.add(fileName);
    }
  } catch (err) {
    log(`⚠️ Erro listando diretório ${scriptsDir}: ${err.message}`);
  }

  const seenPhoneKeys = new Set();
  const seenEmails = new Set();
  const contacts = [];
  const sources = [];

  for (const { fileName, fullPath } of orderedFiles) {
    const stats = { source: fileName, kind: 'local', totalRaw: 0, validMobile: 0, uniqueAdded: 0 };
    try {
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const objects = extractStructuredDoctorObjects(parsed);
      stats.totalRaw = Array.isArray(parsed) ? parsed.length : objects.length;

      for (const rawItem of objects) {
        const normalized = normalizeLeadRecord(rawItem, fileName);
        if (!normalized) continue;
        stats.validMobile++;
        const phone = normalized.attributes.WHATSAPP;
        const email = normalized.email;
        if (hasPhoneMatch(seenPhoneKeys, phone)) continue;
        if (email && seenEmails.has(email)) continue;
        addPhoneKeysToSet(seenPhoneKeys, phone);
        if (email) seenEmails.add(email);
        contacts.push(normalized);
        stats.uniqueAdded++;
      }
    } catch (e) {
      stats.error = e.message;
      log(`⚠️ Erro lendo ${fileName}: ${e.message}`);
    }
    sources.push(stats);
  }

  return { contacts, sources };
}

export function loadLocalCuratedLeads(scriptsDir = __dirname) {
  return loadAllLocalDoctorLeadSources(scriptsDir).contacts;
}

// ============================================================================
// CARREGAMENTO DE TODAS AS LISTAS DE MÉDICOS NA BREVO API
// ============================================================================

async function fetchJsonWithTimeout(url, headers, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (_) {}
    return { ok: res.ok, status: res.status, data, text };
  } finally {
    clearTimeout(timer);
  }
}

export async function loadBrevoDoctorLeads(options = {}) {
  const { baseUrl, key, listId, extraListIds, excludedIds } = getBrevoConfig();
  const pageSize = Math.min(500, Math.max(50, Number(options.pageSize || 500)));
  const maxPagesPerList = Math.max(1, Number(options.maxPagesPerList || 40));
  const maxFallbackPages = Math.max(1, Number(options.maxFallbackPages || 10));
  const includeAllContactsFallback = options.includeAllContactsFallback !== false;

  if (!key) {
    return {
      contacts: [],
      sources: [{ source: 'brevo_api', kind: 'brevo', totalRaw: 0, validMobile: 0, uniqueAdded: 0, note: 'BREVO_API_KEY ausente' }],
      discoveredLists: [],
    };
  }

  const headers = {
    'api-key': key,
    accept: 'application/json',
    'Content-Type': 'application/json',
  };

  // 1. Descobre todas as listas existentes na conta Brevo
  const discoveredLists = [];
  try {
    for (let page = 0; page < 10; page++) {
      const offset = page * 50;
      const res = await fetchJsonWithTimeout(`${baseUrl}/contacts/lists?limit=50&offset=${offset}`, headers);
      if (!res.ok) break;
      const lists = Array.isArray(res.data?.lists) ? res.data.lists : [];
      discoveredLists.push(...lists);
      if (lists.length < 50) break;
    }
  } catch (err) {
    log(`⚠️ Falha ao listar listas da Brevo: ${err.message}`);
  }

  const dynamicExcludedIds = new Set(excludedIds);
  const targetListsMap = new Map();
  const explicitTargetIds = new Set([listId, ...extraListIds]);

  for (const list of discoveredLists) {
    const id = Number(list?.id);
    const name = String(list?.name || '').trim();
    if (!Number.isInteger(id) || id <= 0) continue;

    if (!explicitTargetIds.has(id) && BREVO_EXCLUDED_LIST_NAME_PATTERN.test(name)) {
      dynamicExcludedIds.add(id);
      continue;
    }

    if (explicitTargetIds.has(id)) {
      targetListsMap.set(id, name || `Lista ${id}`);
      continue;
    }

    if (!dynamicExcludedIds.has(id) && BREVO_DOCTOR_LIST_NAME_PATTERN.test(name)) {
      targetListsMap.set(id, name);
    }
  }

  // Garante que a lista principal configurada (padrão 6) e eventuais extras sempre sejam consultadas
  for (const id of explicitTargetIds) {
    if (!targetListsMap.has(id)) {
      targetListsMap.set(id, `Lista ${id}`);
    }
  }

  const seenPhoneKeys = new Set();
  const seenEmails = new Set();
  const contacts = [];
  const sources = [];

  const appendBrevoContact = (rawContact, sourceLabel, stats, requireMedicalSignal = false) => {
    stats.totalRaw++;
    if (rawContact?.smsBlacklisted) return;

    const contactListIds = Array.isArray(rawContact?.listIds) ? rawContact.listIds.map(Number) : [];
    if (contactListIds.some((id) => dynamicExcludedIds.has(id))) return;

    const normalized = normalizeLeadRecord(rawContact, sourceLabel);
    if (!normalized) return;

    if (requireMedicalSignal) {
      const attrs = normalized.attributes;
      const signalText = [
        attrs.CRM,
        attrs.SPECIALTY,
        attrs.RAW_NAME,
        attrs.NOME,
        rawContact?.attributes?.PERFIL,
        rawContact?.attributes?.TIPO,
        rawContact?.attributes?.ROLE,
      ]
        .filter(Boolean)
        .join(' ');
      if (!BREVO_MEDICAL_INDICATOR_PATTERN.test(signalText)) return;
    }

    stats.validMobile++;
    const phone = normalized.attributes.WHATSAPP;
    const email = normalized.email;
    if (hasPhoneMatch(seenPhoneKeys, phone)) return;
    if (email && seenEmails.has(email)) return;

    addPhoneKeysToSet(seenPhoneKeys, phone);
    if (email) seenEmails.add(email);
    contacts.push(normalized);
    stats.uniqueAdded++;
  };

  // 2. Varre todas as páginas de cada lista médica da Brevo a partir do offset 0
  for (const [id, listName] of targetListsMap.entries()) {
    const sourceLabel = `brevo_list_${id} (${listName})`;
    const stats = { source: sourceLabel, kind: 'brevo', listId: id, listName, totalRaw: 0, validMobile: 0, uniqueAdded: 0 };
    try {
      for (let page = 0; page < maxPagesPerList; page++) {
        const offset = page * pageSize;
        const url = `${baseUrl}/contacts/lists/${id}/contacts?limit=${pageSize}&offset=${offset}`;
        const res = await fetchJsonWithTimeout(url, headers);
        if (!res.ok) {
          stats.note = `HTTP ${res.status}`;
          if (page === 0) log(`⚠️ Brevo ${sourceLabel} retornou HTTP ${res.status}`);
          break;
        }
        const batch = Array.isArray(res.data?.contacts) ? res.data.contacts : [];
        if (batch.length === 0) break;
        for (const c of batch) {
          appendBrevoContact(c, sourceLabel, stats, false);
        }
        if (batch.length < pageSize) break;
      }
    } catch (err) {
      stats.error = err.message;
      log(`⚠️ Erro consultando Brevo ${sourceLabel}: ${err.message}`);
    }
    sources.push(stats);
  }

  // 3. Varredura complementar em /v3/contacts apenas para contatos com sinal médico explícito fora de listas de pacientes/farmácias
  if (includeAllContactsFallback) {
    const sourceLabel = 'brevo_contacts_medicos';
    const stats = { source: sourceLabel, kind: 'brevo', totalRaw: 0, validMobile: 0, uniqueAdded: 0 };
    try {
      for (let page = 0; page < maxFallbackPages; page++) {
        const offset = page * pageSize;
        const url = `${baseUrl}/contacts?limit=${pageSize}&offset=${offset}`;
        const res = await fetchJsonWithTimeout(url, headers);
        if (!res.ok) {
          if (res.status !== 404) stats.note = `HTTP ${res.status}`;
          break;
        }
        const batch = Array.isArray(res.data?.contacts) ? res.data.contacts : [];
        if (batch.length === 0) break;
        for (const c of batch) {
          appendBrevoContact(c, sourceLabel, stats, true);
        }
        if (batch.length < pageSize) break;
      }
    } catch (err) {
      stats.error = err.message;
    }
    if (stats.uniqueAdded > 0 || stats.totalRaw > 0) {
      sources.push(stats);
    }
  }

  return { contacts, sources, discoveredLists };
}

// ============================================================================
// FILA UNIFICADA E CONTAGEM REAL DE PENDENTES SOMANDO TODAS AS FONTES
// ============================================================================

function buildFilters({ knownDoctors = null, knownPhones = null, knownNames = null, humanLocked = null, blacklist = null } = {}) {
  const knownPhoneSet = new Set();
  const knownNameSet = new Set();

  if (knownPhones) {
    for (const p of knownPhones) addPhoneKeysToSet(knownPhoneSet, p);
  }
  if (knownNames) {
    for (const n of knownNames) {
      const clean = String(n || '').toLowerCase().trim();
      if (clean) knownNameSet.add(clean);
    }
  }
  if (Array.isArray(knownDoctors)) {
    for (const d of knownDoctors) {
      if (d?.phone) addPhoneKeysToSet(knownPhoneSet, d.phone);
      if (d?.name) knownNameSet.add(String(d.name).toLowerCase().trim());
    }
  }

  const hlSet = new Set();
  const rawHl = humanLocked || loadHumanLocked();
  for (const item of rawHl) addPhoneKeysToSet(hlSet, item);

  const blSet = new Set();
  const rawBl = blacklist || loadBlacklist();
  for (const item of rawBl) addPhoneKeysToSet(blSet, item);

  return {
    knownPhones: knownPhoneSet,
    knownNames: knownNameSet,
    humanLocked: hlSet,
    blacklist: blSet,
  };
}

function evaluateContactEligibility(contact, state, filters, invitedPhoneKeys) {
  const rawPhone = contact?.attributes?.WHATSAPP || contact?.attributes?.SMS || contact?.attributes?.PHONE || contact?.phone;
  const validPhone = normalizeValidBrazilianMobile(rawPhone);
  const email = String(contact?.email || '').toLowerCase().trim();
  const rawName = String(
    contact?.attributes?.NOME || contact?.attributes?.FIRSTNAME || contact?.name || email.split('@')[0] || '',
  ).trim();
  const specialty = String(contact?.attributes?.SPECIALTY || contact?.specialty || '').trim();
  const bio = String(contact?.attributes?.BIO || contact?.bio || '').trim();
  const company = String(contact?.attributes?.COMPANY || contact?.company || '').trim();
  const crm = String(contact?.attributes?.CRM || contact?.crm || '').trim();
  const crmState = String(contact?.attributes?.UF || contact?.uf || '').trim();
  const councilType = String(contact?.attributes?.COUNCIL_TYPE || contact?.councilType || '').trim();

  if (!validPhone) return { eligible: false, skipReason: 'invalid_phone' };
  if (hasPhoneMatch(filters.blacklist, validPhone, email)) return { eligible: false, skipReason: 'blacklisted' };
  if (hasPhoneMatch(filters.humanLocked, validPhone)) return { eligible: false, skipReason: 'human_locked' };
  if (hasPhoneMatch(filters.knownPhones, validPhone) || (rawName && filters.knownNames.has(rawName.toLowerCase()))) {
    return { eligible: false, skipReason: 'known_doctor' };
  }
  if (hasPhoneMatch(invitedPhoneKeys, validPhone) || (email && state?.invitedEmails?.[email])) {
    return { eligible: false, skipReason: 'already_invited' };
  }

  const exclusion = isExcludedAudience(rawName, email, specialty, crm, councilType, { company, bio });
  if (exclusion.excluded) {
    return {
      eligible: false,
      skipReason: 'pj_or_non_doctor',
      exclusionReason: exclusion.reason,
      phone: validPhone,
      name: rawName,
    };
  }

  const crmConfirmed = hasConfirmedCrm(crm, crmState, councilType);
  return {
    eligible: true,
    candidate: {
      name: rawName,
      phone: validPhone,
      email,
      specialty,
      bio,
      company,
      crm,
      crmState,
      councilType,
      crmConfirmed,
      source: contact?.source || 'local',
    },
  };
}

export async function buildUnifiedDoctorQueue({
  scriptsDir = __dirname,
  state = null,
  knownDoctors = null,
  knownPhones = null,
  knownNames = null,
  humanLocked = null,
  blacklist = null,
  includeBrevo = true,
  brevoOptions = {},
} = {}) {
  const effectiveState = state || loadState();
  const filters = buildFilters({
    knownDoctors: knownDoctors || (knownPhones ? null : loadKnownDoctors()),
    knownPhones,
    knownNames,
    humanLocked,
    blacklist,
  });

  const localRes = loadAllLocalDoctorLeadSources(scriptsDir);
  const brevoRes = includeBrevo
    ? await loadBrevoDoctorLeads(brevoOptions)
    : { contacts: [], sources: [], discoveredLists: [] };

  // Unifica e deduplica preservando a primeira fonte de cada celular/e-mail
  const seenPhoneKeys = new Set();
  const seenEmails = new Set();
  const unifiedContacts = [];
  const sourceSummaryMap = new Map();

  for (const s of [...localRes.sources, ...brevoRes.sources]) {
    sourceSummaryMap.set(s.source, { ...s, uniqueInUnified: 0, eligiblePending: 0 });
  }

  for (const c of [...localRes.contacts, ...brevoRes.contacts]) {
    const phone = c.attributes?.WHATSAPP;
    const email = c.email || '';
    if (!phone) continue;
    if (hasPhoneMatch(seenPhoneKeys, phone)) continue;
    if (email && seenEmails.has(email)) continue;

    addPhoneKeysToSet(seenPhoneKeys, phone);
    if (email) seenEmails.add(email);
    unifiedContacts.push(c);

    const bucket = sourceSummaryMap.get(c.source);
    if (bucket) bucket.uniqueInUnified++;
  }

  // Calcula quantos médicos estão DE FATO pendentes e elegíveis somando todas as fontes (sem mutar state)
  const invitedPhoneKeys = buildInvitedPhoneKeySet(effectiveState);
  const skippedBreakdown = {
    alreadyInvited: 0,
    blacklisted: 0,
    humanLocked: 0,
    knownDoctor: 0,
    pjOrNonDoctor: 0,
  };
  let eligiblePending = 0;

  for (const c of unifiedContacts) {
    const check = evaluateContactEligibility(c, effectiveState, filters, invitedPhoneKeys);
    if (check.eligible) {
      eligiblePending++;
      const bucket = sourceSummaryMap.get(c.source);
      if (bucket) bucket.eligiblePending++;
    } else if (check.skipReason === 'already_invited') {
      skippedBreakdown.alreadyInvited++;
    } else if (check.skipReason === 'blacklisted') {
      skippedBreakdown.blacklisted++;
    } else if (check.skipReason === 'human_locked') {
      skippedBreakdown.humanLocked++;
    } else if (check.skipReason === 'known_doctor') {
      skippedBreakdown.knownDoctor++;
    } else if (check.skipReason === 'pj_or_non_doctor') {
      skippedBreakdown.pjOrNonDoctor++;
    }
  }

  return {
    contacts: unifiedContacts,
    sources: Array.from(sourceSummaryMap.values()),
    discoveredLists: brevoRes.discoveredLists || [],
    totalUniquePhones: unifiedContacts.length,
    eligiblePending,
    skippedBreakdown,
  };
}

function findNextEligibleInList(contacts, state, rawFilters) {
  const filters = buildFilters(rawFilters);
  const invitedPhoneKeys = buildInvitedPhoneKeySet(state);

  for (const contact of contacts) {
    const check = evaluateContactEligibility(contact, state, filters, invitedPhoneKeys);
    if (check.eligible) {
      return check.candidate;
    }
    if (check.skipReason === 'pj_or_non_doctor' && check.phone) {
      log(`🚫 Contato PJ/não-médico descartado [${check.exclusionReason}]: "${check.name}"`);
      state.invitedPhones[check.phone] = {
        name: check.name,
        excluded: true,
        reason: check.exclusionReason,
        date: new Date().toISOString(),
      };
      addPhoneKeysToSet(invitedPhoneKeys, check.phone);
      saveState(state);
    }
  }
  return null;
}

export async function runOneInviteCycle({
  allLeads = null,
  localLeads = null,
  knownPhones = new Set(),
  knownNames = new Set(),
  humanLocked = null,
  blacklist = null,
  state,
  now = new Date(),
  includeBrevo = true,
  brevoOptions = {},
}) {
  if (!BRISA_COLD_OUTREACH_ENABLED) {
    log('ℹ️ [ENVIO DESLIGADO] BRISA_COLD_OUTREACH_ENABLED=false.');
    return { action: 'sleep', ms: 60000, reason: 'disabled' };
  }

  if (isGlobalPauseActive()) {
    log('🛑 [PAUSA ATIVA] Automação pausada globalmente via PAUSE_AUTOMATION.flag.');
    return { action: 'sleep', ms: 60000, reason: 'global_pause' };
  }

  if (!isWithinOutreachHours(now)) {
    const brt = getBrasiliaTimeParts(now);
    const hoursCfg = parseOutreachHoursSpec();
    log(
      `🌙 [FORA DA JANELA CONFIGURADA] Agora: ${brt.weekdayShort} ${String(brt.hour).padStart(2, '0')}:${String(brt.minute).padStart(2, '0')} BRT (janela: ${hoursCfg.label}). Dormindo 15 min...`,
    );
    return { action: 'sleep', ms: 15 * 60 * 1000, reason: 'outside_outreach_hours' };
  }

  const conn = await checkInstanceStatus();
  if (conn.state !== 'open') {
    log(`⚠️ [EVOLUTION DESCONECTADO] Status='${conn.state}' (${conn.detail}). Aguardando 30s...`);
    return { action: 'sleep', ms: 30000, reason: `evolution_${conn.state}` };
  }

  const filters = {
    knownPhones,
    knownNames,
    humanLocked: humanLocked || loadHumanLocked(),
    blacklist: blacklist || loadBlacklist(),
  };

  // 1. Varre a fila unificada (ou base local fornecida)
  const primaryPool = Array.isArray(allLeads) ? allLeads : Array.isArray(localLeads) ? localLeads : [];
  let candidateFound = findNextEligibleInList(primaryPool, state, filters);

  // 2. Se allLeads não incluiu Brevo ainda (ex.: chamada direta com localLeads), consulta todas as listas médicas da Brevo
  if (!candidateFound && !Array.isArray(allLeads) && includeBrevo) {
    const brevoRes = await loadBrevoDoctorLeads(brevoOptions);
    if (brevoRes.contacts.length > 0) {
      candidateFound = findNextEligibleInList(brevoRes.contacts, state, filters);
    }
  }

  if (!candidateFound) {
    log(
      `⚠️ [FILA ZERADA] 0 médicos pendentes elegíveis somando TODAS as fontes (base carregada=${primaryPool.length}, já enviados=${state.totalInvited}). Nenhum contato será inventado. Nova verificação em 60 min...`,
    );
    return { action: 'sleep', ms: QUEUE_REFRESH_INTERVAL_MS, reason: 'queue_empty', queueEmpty: true };
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
  log(`🎯 Candidato selecionado [${candidateFound.source}]: ${candidateFound.name} [${displayTag}]`);

  try {
    const sendRes = await sendWhatsApp(candidateFound.phone, msg, candidateFound, now);
    if (sendRes.sent) {
      state.totalInvited++;
      state.invitedPhones[candidateFound.phone] = {
        name: candidateFound.name,
        email: candidateFound.email,
        source: candidateFound.source,
        crmConfirmed: candidateFound.crmConfirmed,
        invited_at: new Date().toISOString(),
      };
      if (candidateFound.email) {
        state.invitedEmails[candidateFound.email] = new Date().toISOString();
      }
      saveState(state);
      log(
        `✅ Convite WhatsApp enviado (${candidateFound.source})! Total acumulado: ${state.totalInvited}. Próximo em ${Math.round(CADENCE_MS / 60000)} min.`,
      );
      return { action: 'sent', ms: CADENCE_MS, phone: candidateFound.phone, source: candidateFound.source };
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
      source: candidateFound.source,
      failed: true,
      error: sendErr.message,
      attempted_at: new Date().toISOString(),
    };
    saveState(state);
    return { action: 'sleep', ms: 5000, reason: 'send_permanent_error' };
  }
}

function logStartupQueueReport(queue, state) {
  const evo = getEvoConfig();
  const brevo = getBrevoConfig();
  const brt = getBrasiliaTimeParts();
  const hoursCfg = parseOutreachHoursSpec();

  log('========================================================================');
  log('🚀 AGENTE DE CONVITES WHATSAPP PARA MÉDICOS INICIADO (PM2 COMPATÍVEL)');
  log(`🔒 OUTREACH_ENABLED=${BRISA_COLD_OUTREACH_ENABLED} | DRY_RUN=${BRISA_CONFIG.DRY_RUN} | EVO_KEY=${evo.key ? 'OK' : 'AUSENTE'} | BREVO_KEY=${brevo.key ? 'OK' : 'AUSENTE'}`);
  log(`🌐 Evolution: ${evo.url} (instância: ${evo.instance})`);
  log(
    `🕒 Agora em BRT: ${brt.weekdayShort} ${String(brt.hour).padStart(2, '0')}:${String(brt.minute).padStart(2, '0')} | Janela de envio: ${hoursCfg.label} | Status: ${isWithinOutreachHours() ? 'ABERTA' : 'FECHADA'}`,
  );
  log(`⏱️ Cadência fixa: 1 convite a cada ${Math.round(CADENCE_MS / 60000)} minutos`);
  log('📂 Fontes de leads médicos consultadas:');
  for (const s of queue.sources) {
    const note = s.note ? ` [${s.note}]` : s.error ? ` [erro: ${s.error}]` : '';
    log(
      `   • ${s.source}: ${s.totalRaw} registros | ${s.uniqueInUnified} celulares BR únicos | pendentes elegíveis: ${s.eligiblePending}${note}`,
    );
  }
  log(
    `📊 FILA TOTAL REAL (TODAS AS FONTES): ${queue.eligiblePending} médicos pendentes elegíveis | Base unificada: ${queue.totalUniquePhones} | Já enviados (state): ${state.totalInvited} | Opt-out SAIR: ${queue.skippedBreakdown.blacklisted} | PJ/Clínicas filtrados: ${queue.skippedBreakdown.pjOrNonDoctor}`,
  );
  if (queue.eligiblePending === 0) {
    log(
      '⚠️ [FILA ZERADA] Total de médicos pendentes elegíveis somando TODAS as fontes (repositório + scripts/ + Brevo) = 0. Nenhum contato será inventado.',
    );
  }
  log('========================================================================');
}

export async function run() {
  if (!acquirePidLock()) {
    process.exit(0);
  }
  process.on('exit', releasePidLock);
  process.on('SIGINT', () => { releasePidLock(); process.exit(0); });
  process.on('SIGTERM', () => { releasePidLock(); process.exit(0); });

  const state = loadState();
  let knownDoctors = loadKnownDoctors();
  let knownPhones = new Set(knownDoctors.map((d) => (d.phone || '').replace(/\D/g, '')).filter(Boolean));
  let knownNames = new Set(knownDoctors.map((d) => (d.name || '').toLowerCase().trim()).filter(Boolean));

  let queue = await buildUnifiedDoctorQueue({ state, knownDoctors });
  let lastQueueRefreshAt = Date.now();
  logStartupQueueReport(queue, state);

  while (true) {
    try {
      // Recarrega todas as fontes periodicamente (1h) para capturar novos arquivos em scripts/ ou novos contatos na Brevo
      if (Date.now() - lastQueueRefreshAt >= QUEUE_REFRESH_INTERVAL_MS) {
        knownDoctors = loadKnownDoctors();
        knownPhones = new Set(knownDoctors.map((d) => (d.phone || '').replace(/\D/g, '')).filter(Boolean));
        knownNames = new Set(knownDoctors.map((d) => (d.name || '').toLowerCase().trim()).filter(Boolean));
        queue = await buildUnifiedDoctorQueue({ state, knownDoctors });
        lastQueueRefreshAt = Date.now();
        log(
          `🔄 Fila recarregada (todas as fontes): ${queue.eligiblePending} médicos pendentes elegíveis | Base unificada: ${queue.totalUniquePhones}`,
        );
      }

      const result = await runOneInviteCycle({
        allLeads: queue.contacts,
        knownPhones,
        knownNames,
        state,
        includeBrevo: false, // Brevo já foi consolidado em queue.contacts
      });

      if (result.reason === 'queue_empty') {
        lastQueueRefreshAt = 0; // força recarga completa no próximo ciclo após dormir
      }

      await new Promise((r) => setTimeout(r, result.ms));
    } catch (loopErr) {
      log(`⚠️ Erro no ciclo de convites WhatsApp: ${loopErr.message}`);
      await new Promise((r) => setTimeout(r, 60000));
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
