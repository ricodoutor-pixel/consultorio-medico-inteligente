/**
 * 🌿 Planta y Raiz (Bezerra Med Soluções Integradas Ltda., CNPJ 30.740.319/0001-14)
 * Script: scripts/agent_instagram_direct_inviter.mjs
 *
 * Agente de Prospecção Médica no Instagram Direct — Otimizado para VPS Linux (Hostinger / PM2):
 * 1. Execução headless nativa (`headless: true`) com detecção automática de Chromium/Chrome do sistema
 *    e flags de baixo consumo de RAM (`--disable-dev-shm-usage`, `--disable-gpu`, `--no-zygote`).
 * 2. Autenticação headless para VPS via cookies (`scratch/instagram_cookies.json` ou `IG_SESSIONID` no `.env`),
 *    além de modo interativo `--headed --export-cookies` para gerar cookies na máquina local e copiar à VPS.
 * 3. Lock exclusivo de PID (`acquireBrisaWorkerLock`) impedindo duas instâncias simultâneas na mesma conta.
 * 4. Modo daemon (`--daemon` / `IG_DAEMON=true`) compatível com PM2: respeita janela comercial de Brasília
 *    (09h–19h), fecha o Chromium entre ciclos (0 MB ocioso) e trata `SIGTERM`/`SIGINT` com encerramento limpo.
 * 5. Proteção anti-bloqueio e conformidade:
 *    - Filtro rigoroso de perfil médico (CRM/RQE/especialidade) excluindo psicólogos, nutricionistas,
 *      optometristas, clínicas, farmácias, growshops e pacientes (nunca chama não médico de "Dr(a).").
 *    - Mensagens padronizadas (93% via PIX, taxa fixa 7%, Plano Médico VIP opcional R$ 99/mês, sem "sócio"
 *      nem "participação nos lucros") passando por `sanitizeOutboundAnswer`.
 *    - Detecção imediata de bloqueio/checkpoint/challenge: interrompe na hora e entra em cooldown de 24h
 *      (jamais tenta burlar CAPTCHA ou 2FA).
 *    - `--dry-run` não altera `invitedProfiles` nem consome a cota diária.
 *
 * Uso:
 *   # 1. Na máquina local (uma única vez) para logar e exportar cookies para a VPS:
 *   node scripts/agent_instagram_direct_inviter.mjs --headed --export-cookies
 *
 *   # 2. Simulação segura na VPS (sem disparar DMs e sem sujar o estado):
 *   node scripts/agent_instagram_direct_inviter.mjs --dry-run --max 5
 *
 *   # 3. Ciclo único real na VPS:
 *   node scripts/agent_instagram_direct_inviter.mjs --max 20
 *
 *   # 4. Modo daemon 24/7 via PM2 na VPS (usa ecosystem.config.cjs):
 *   pm2 start ecosystem.config.cjs --only instagram-direct-inviter
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { acquireBrisaWorkerLock } from './lib/brisa-worker-lock.mjs';
import { sanitizeOutboundAnswer } from '../supabase/functions/_shared/brisa-response-policy.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '../scratch');
const SESSION_DIR = process.env.IG_SESSION_DIR || path.join(SCRATCH_DIR, 'instagram_session');
const COOKIES_FILE = process.env.IG_COOKIES_FILE || path.join(SCRATCH_DIR, 'instagram_cookies.json');
const STATE_FILE = process.env.IG_STATE_FILE || path.join(SCRATCH_DIR, 'instagram_invited_doctors.json');
const LOG_FILE = process.env.IG_LOG_FILE || path.join(SCRATCH_DIR, 'instagram_inviter.log');
const LOCK_FILE = process.env.IG_LOCK_FILE || path.join(SCRATCH_DIR, 'instagram_inviter.lock');

const MAX_LOG_BYTES = 5 * 1024 * 1024; // 5 MB (rotação simples na VPS)
const DEFAULT_DAILY_LIMIT = 25;
const DEFAULT_MIN_DELAY_SEC = 120; // 2 min
const DEFAULT_MAX_DELAY_SEC = 300; // 5 min
const DEFAULT_START_HOUR_BRT = 9;
const DEFAULT_END_HOUR_BRT = 19;
const COOLDOWN_ON_RESTRICTION_MS = 24 * 60 * 60 * 1000; // 24h

const DEFAULT_HASHTAGS = [
  'medicinacanabinoide',
  'prescritorcannabis',
  'medicocanabidiol',
  'cannabismedicinalbrasil',
  'medicinaintegrativabrasil',
  'psiquiatriaintegrativa',
  'neurologiaintegrativa',
  'endocanabinologia',
  'medicinadador',
  'dorcronica',
];

// ── TEMPLATES PADRONIZADOS (AUDITORIA 19/11/2026) ───────────────────────────
// Proibido: "sócio", "participação nos lucros", "taxa zero", "100% de repasse", "pacientes 100% seus".
export const INVITE_TEMPLATES = [
  `Olá, {greeting}! Sou da equipe da Planta y Raiz (Bezerra Med Soluções Integradas Ltda., CNPJ 30.740.319/0001-14).

Convidamos médicos com CRM ativo para credenciar gratuitamente seu consultório digital na nossa plataforma de telemedicina:
• Repasse de 93% de cada consulta via PIX (taxa fixa de 7% em todos os planos);
• Prontuário CFM e prescrição digital assinada via ICP-Brasil / Gov.br (RDC 660 e 327);
• Plano Médico VIP opcional (R$ 99/mês) com prioridade na fila e ferramentas de IA.

Cadastro gratuito em 2 minutos:
https://www.plantayraiz.com.br/cadastro-profissional

Dúvidas? Nossa equipe atende no WhatsApp (11) 99136-3154.`,

  `Olá, {greeting}! Tudo bem? Passando em nome da equipe técnica da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.).

Estamos credenciando médicos prescritores com CRM ativo para atender por telemedicina com:
• Cadastro gratuito e aprovação humana em 24 a 48h úteis;
• Repasse de 93% via PIX por consulta (taxa fixa de 7%);
• Consultório virtual com vídeo, prontuário CFM e assinatura digital ICP-Brasil / Gov.br;
• Plano Médico VIP opcional (R$ 99/mês) com prioridade na fila e Copiloto Clínico.

Conheça e faça seu cadastro gratuito:
https://www.plantayraiz.com.br/cadastro-profissional

Qualquer dúvida, nossa equipe humana acompanha por aqui ou no WhatsApp (11) 99136-3154.`,
];

// ── PARSER DE ARGUMENTOS CLI & ENV ──────────────────────────────────────────
export function parseCliArgs(argv = process.argv.slice(2), env = process.env) {
  const getFlagValue = (flag) => {
    const idx = argv.indexOf(flag);
    if (idx !== -1 && idx + 1 < argv.length && !argv[idx + 1].startsWith('--')) {
      return argv[idx + 1];
    }
    const eq = argv.find((a) => a.startsWith(`${flag}=`));
    return eq ? eq.slice(flag.length + 1) : undefined;
  };

  const hasFlag = (flag) => argv.includes(flag);

  const envBool = (key, fallback) => {
    const raw = env?.[key];
    if (raw === undefined || raw === '') return fallback;
    return ['1', 'true', 'yes', 'sim'].includes(String(raw).trim().toLowerCase());
  };

  const parsePositiveInt = (val, fallback) => {
    const n = Number.parseInt(String(val ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const daemon = hasFlag('--daemon') || (!hasFlag('--once') && envBool('IG_DAEMON', false));
  const dryRun = hasFlag('--dry-run') || (!hasFlag('--live') && envBool('IG_DRY_RUN', daemon));
  const headed = hasFlag('--headed') || !envBool('IG_HEADLESS', true);
  const exportCookiesOnly = hasFlag('--export-cookies');
  const maxDaily = parsePositiveInt(getFlagValue('--max') ?? env?.IG_DAILY_LIMIT, DEFAULT_DAILY_LIMIT);
  const minDelaySec = parsePositiveInt(getFlagValue('--min-delay') ?? env?.IG_MIN_DELAY_SEC, DEFAULT_MIN_DELAY_SEC);
  const maxDelaySec = Math.max(
    minDelaySec,
    parsePositiveInt(getFlagValue('--max-delay') ?? env?.IG_MAX_DELAY_SEC, DEFAULT_MAX_DELAY_SEC),
  );
  const startHourBrt = parsePositiveInt(getFlagValue('--start-hour') ?? env?.IG_START_HOUR, DEFAULT_START_HOUR_BRT);
  const endHourBrt = parsePositiveInt(getFlagValue('--end-hour') ?? env?.IG_END_HOUR, DEFAULT_END_HOUR_BRT);
  const cookiesFile = getFlagValue('--cookies') || env?.IG_COOKIES_FILE || COOKIES_FILE;
  const rawHashtags = getFlagValue('--hashtags') || env?.IG_HASHTAGS || '';
  const hashtags = rawHashtags
    ? rawHashtags.split(',').map((h) => h.replace(/^#/, '').trim()).filter(Boolean)
    : DEFAULT_HASHTAGS;

  return {
    dryRun,
    headless: !headed,
    daemon,
    exportCookiesOnly,
    maxDaily,
    minDelaySec,
    maxDelaySec,
    startHourBrt,
    endHourBrt,
    cookiesFile,
    hashtags,
  };
}

// ── DETECÇÃO DE CHROMIUM DO SISTEMA NA VPS LINUX ────────────────────────────
export function resolveChromiumExecutablePath(env = process.env, existsSync = fs.existsSync) {
  if (env?.PUPPETEER_EXECUTABLE_PATH && existsSync(env.PUPPETEER_EXECUTABLE_PATH)) {
    return env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined; // Usa Chromium gerenciado pelo Puppeteer
}

// ── COOKIES PARA AUTENTICAÇÃO HEADLESS NA VPS ───────────────────────────────
export function buildCookiesFromEnv(env = process.env) {
  const sessionid = String(env?.IG_SESSIONID || '').trim();
  if (!sessionid) return [];

  const base = {
    domain: '.instagram.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  };

  const cookies = [{ ...base, name: 'sessionid', value: sessionid }];
  if (env?.IG_DS_USER_ID) {
    cookies.push({ ...base, name: 'ds_user_id', value: String(env.IG_DS_USER_ID).trim(), httpOnly: false });
  }
  if (env?.IG_CSRFTOKEN) {
    cookies.push({ ...base, name: 'csrftoken', value: String(env.IG_CSRFTOKEN).trim(), httpOnly: false });
  }
  if (env?.IG_MID) {
    cookies.push({ ...base, name: 'mid', value: String(env.IG_MID).trim(), httpOnly: false });
  }
  return cookies;
}

export function loadCookiesForVps(cookiesFile = COOKIES_FILE, env = process.env) {
  const envCookies = buildCookiesFromEnv(env);
  if (envCookies.length > 0) return envCookies;

  if (cookiesFile && fs.existsSync(cookiesFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(cookiesFile, 'utf8'));
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cookies) ? parsed.cookies : [];
      return list
        .filter((c) => c && c.name && c.value)
        .map((c) => ({
          name: String(c.name),
          value: String(c.value),
          domain: c.domain || '.instagram.com',
          path: c.path || '/',
          httpOnly: Boolean(c.httpOnly),
          secure: c.secure !== false,
        }));
    } catch (err) {
      log(`⚠️ Falha ao ler arquivo de cookies ${cookiesFile}: ${err.message}`);
    }
  }
  return [];
}

// ── JANELA COMERCIAL (BRASÍLIA) ─────────────────────────────────────────────
export function getBrasiliaHour(now = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hourPart = parts.find((p) => p.type === 'hour')?.value || '0';
  return Number.parseInt(hourPart, 10) % 24;
}

export function isWithinBusinessHours(now = new Date(), startHour = DEFAULT_START_HOUR_BRT, endHour = DEFAULT_END_HOUR_BRT) {
  const h = getBrasiliaHour(now);
  return h >= startHour && h < endHour;
}

export function getBrasiliaDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

// ── FILTRO RIGOROSO DE MÉDICO (EVITA NÃO MÉDICOS E CLÍNICAS) ────────────────
function normalizeAscii(str = '') {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const NON_DOCTOR_EXCLUSION_RE =
  /\b(psicolog[oa]|psicologia|psicanalis|nutricionist|nutricao|optometr|terapeuta ocupacional|fisioterap|odontolog|dentist|veterinari[oa]|farmacia|drogaria|associacao|growshop|headshop|tabacaria|loja|e-commerce|advogad[oa]|oab|crp|crn|crefito|cro|crmv|crf|enfermeir[oa]|coren|coach|blog|portal|revista|noticias|podcast|paciente)\b/i;

const POSITIVE_DOCTOR_RE =
  /\b(crm[\s\-/:]*[a-z]{0,2}[\s\-/:]*\d{3,}|rqe[\s\-/:]*\d{2,}|medic[oa]\b|medicina\b|psiquiatra\b|neurologista\b|oncologista\b|reumatologista\b|pediatra\b|ortopedista\b|geriatra\b|endocrinologista\b|anestesiologista\b|clinico geral\b|prescritor\s+de\s+cannabis|medico\s+prescritor)\b/i;

export function isDoctorProfile(bio = '', name = '') {
  const combined = normalizeAscii(`${bio} ${name}`);
  if (!combined.trim()) return false;
  if (NON_DOCTOR_EXCLUSION_RE.test(combined)) return false;
  return POSITIVE_DOCTOR_RE.test(combined);
}

export function formatGreetingName(fullName = '', username = '', bio = '') {
  const rawName = String(fullName || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}|•·]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const combined = normalizeAscii(`${bio} ${rawName}`);
  const hasExplicitDoctorCredential = /\b(crm[\s\-/:]*[a-z]{0,2}[\s\-/:]*\d{3,}|rqe|medic[oa]|psiquiatra|neurologista|oncologista|reumatologista|pediatra)\b/i.test(combined)
    || /^(dr|dra|doutor|doutora)\.?\s+/i.test(rawName);

  const cleaned = rawName
    .replace(/^(?:dr\(a\)\.?|dra?\.?|doutora?|m[eé]dic[oa])\s+/i, '')
    .replace(/\s*[-–—|•].*$/, '')
    .trim();

  const isClinicOrGeneric = !cleaned
    || cleaned.length < 2
    || /instagram/i.test(cleaned)
    || /\b(clinica|consultorio|instituto|centro|espaco|saude|equipe)\b/i.test(normalizeAscii(cleaned));

  if (isClinicOrGeneric) {
    return hasExplicitDoctorCredential ? 'colega' : username || 'tudo bem';
  }

  const firstAndSecond = cleaned.split(/\s+/).slice(0, 2).join(' ');
  if (hasExplicitDoctorCredential) {
    const isFemale = /^(dra\.?|doutora)\b/i.test(rawName);
    return `${isFemale ? 'Dra.' : 'Dr(a).'} ${firstAndSecond}`;
  }
  return firstAndSecond;
}

export function buildInviteMessage({ fullName = '', username = '', bio = '', templateIndex = 0 }) {
  const greeting = formatGreetingName(fullName, username, bio);
  const template = INVITE_TEMPLATES[Math.abs(templateIndex) % INVITE_TEMPLATES.length];
  return sanitizeOutboundAnswer(template.replace('{greeting}', greeting));
}

// ── DETECÇÃO DE RESTRIÇÃO / BLOQUEIO / CHALLENGE DO INSTAGRAM ───────────────
export function detectInstagramRestriction({ url = '', bodyText = '' } = {}) {
  const u = String(url || '').toLowerCase();
  const text = normalizeAscii(bodyText || '');

  if (u.includes('/challenge/') || u.includes('/accounts/suspended/') || u.includes('/accounts/disabled/')) {
    return { restricted: true, reason: 'instagram_challenge_or_suspended' };
  }
  if (u.includes('/accounts/login')) {
    return { restricted: true, reason: 'session_expired_login_redirect' };
  }
  if (
    /try again later|tente novamente mais tarde|action blocked|acao bloqueada|restringimos certas atividades|we restrict certain activity|confirm it'?s you|confirme que e voce|conta suspensa|account suspended/.test(text)
  ) {
    return { restricted: true, reason: 'instagram_rate_limit_or_checkpoint' };
  }
  return { restricted: false, reason: null };
}

// ── LOG & ESTADO PERSISTENTE ────────────────────────────────────────────────
function rotateLogIfNeeded() {
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_BYTES) {
      fs.renameSync(LOG_FILE, `${LOG_FILE}.old`);
    }
  } catch (_) {}
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [IG-INVITER] ${msg}`;
  console.log(line);
  try {
    if (!fs.existsSync(path.dirname(LOG_FILE))) fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    rotateLogIfNeeded();
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRandomDelay(minSec, maxSec) {
  return Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
}

export function loadState(filePath = STATE_FILE) {
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        invitedProfiles: parsed.invitedProfiles || {},
        dailyCounters: parsed.dailyCounters || {},
        blockedUntil: parsed.blockedUntil || null,
        lastRestrictionReason: parsed.lastRestrictionReason || null,
      };
    } catch (_) {}
  }
  return {
    invitedProfiles: {},
    dailyCounters: {},
    blockedUntil: null,
    lastRestrictionReason: null,
  };
}

export function saveState(state, filePath = STATE_FILE) {
  try {
    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
  } catch (err) {
    log(`⚠️ Falha ao salvar estado: ${err.message}`);
  }
}

export function canSendToday(state, maxDaily, now = new Date()) {
  if (state.blockedUntil && Date.parse(state.blockedUntil) > now.getTime()) {
    return false;
  }
  const today = getBrasiliaDateKey(now);
  return (state.dailyCounters[today] || 0) < maxDaily;
}

export function recordInviteSent(state, username, profileData, { dryRun = false, filePath = STATE_FILE, now = new Date() } = {}) {
  // Dry-run NUNCA grava em invitedProfiles nem consome a cota diária
  if (dryRun) return false;
  const today = getBrasiliaDateKey(now);
  state.dailyCounters[today] = (state.dailyCounters[today] || 0) + 1;
  state.invitedProfiles[username.toLowerCase()] = {
    invitedAt: now.toISOString(),
    name: profileData.name || username,
    bio: (profileData.bio || '').slice(0, 240),
    status: 'invited',
  };
  saveState(state, filePath);
  return true;
}

// ── SUPABASE CRM (LAZY CLIENT) ──────────────────────────────────────────────
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function syncLeadToSupabase(username, profileData) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const cleanPhone = profileData.phone || `ig_${username.toLowerCase()}`;
    const { error } = await supabase.from('leads').insert({
      name: profileData.name || username,
      whatsapp: cleanPhone,
      source: 'instagram_direct',
      status: 'invited',
      condition_interest: profileData.specialty || 'Medicina Canabinoide / Integrativa',
      metadata: {
        instagram_url: `https://www.instagram.com/${username}/`,
        state: profileData.state || 'BR',
        bio: (profileData.bio || '').slice(0, 150),
        invited_at: new Date().toISOString(),
      },
    });
    if (error) {
      log(`⚠️ Supabase leads retornou erro para @${username}: ${error.message}`);
    } else {
      log(`✅ Lead @${username} sincronizado no CRM Supabase.`);
    }
  } catch (err) {
    log(`⚠️ Erro ao sincronizar lead @${username} no Supabase: ${err.message}`);
  }
}

// ── DIGITAÇÃO & ENVIO SEGURO NO DIRECT (COMPATÍVEL COM REACT/LEXICAL) ───────
async function typeAndSendDirectMessage(page, selector, messageText) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.click(selector);
  await sleep(600);

  const lines = messageText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
      await page.keyboard.type(lines[i], { delay: 18 });
    }
    if (i < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
  }

  await sleep(1200);

  // Tenta clicar explicitamente no botão "Enviar"/"Send"; fallback para Enter
  const clickedSend = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const sendBtn = btns.find((b) => {
      const t = (b.innerText || '').trim().toLowerCase();
      return t === 'enviar' || t === 'send';
    });
    if (sendBtn) {
      sendBtn.click();
      return true;
    }
    return false;
  });

  if (!clickedSend) {
    await page.keyboard.press('Enter');
  }

  await sleep(2500);
}

// ── CICLO ÚNICO DE EXECUÇÃO (ABRE CHROMIUM, EXECUTA, FECHA CHROMIUM) ────────
let activeBrowser = null;
let stopRequested = false;

export async function runInstagramInviterCycle(rawOptions = {}) {
  const cfg = { ...parseCliArgs(), ...rawOptions };
  const state = loadState();
  const now = new Date();
  const todayKey = getBrasiliaDateKey(now);

  if (state.blockedUntil && Date.parse(state.blockedUntil) > now.getTime()) {
    log(`🛑 Conta em cooldown de segurança até ${state.blockedUntil} (${state.lastRestrictionReason || 'restriction'}). Pulando ciclo.`);
    return { status: 'cooldown', sent: 0 };
  }

  const alreadySentToday = state.dailyCounters[todayKey] || 0;
  log(`🚀 Ciclo Instagram Direct Inviter | headless=${cfg.headless} | dryRun=${cfg.dryRun} | hoje=${alreadySentToday}/${cfg.maxDaily}`);

  if (!cfg.exportCookiesOnly && !canSendToday(state, cfg.maxDaily, now)) {
    log(`🛑 Limite diário de ${cfg.maxDaily} DMs já atingido (${todayKey}).`);
    return { status: 'daily_limit', sent: 0 };
  }

  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  const executablePath = resolveChromiumExecutablePath();
  if (executablePath) {
    log(`🧭 Usando Chromium do sistema: ${executablePath}`);
  }

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Crítico em VPS/containers com /dev/shm pequeno
    '--disable-gpu',
    '--no-zygote',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-renderer-backgrounding',
    '--disable-notifications',
    '--mute-audio',
    '--lang=pt-BR',
    '--window-size=1280,800',
    '--disable-blink-features=AutomationControlled',
  ];

  const browser = await puppeteer.launch({
    headless: cfg.headless,
    executablePath,
    userDataDir: SESSION_DIR,
    defaultViewport: { width: 1280, height: 800 },
    args: launchArgs,
  });
  activeBrowser = browser;

  let sentThisCycle = 0;

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' });

    // Otimização de RAM/banda na VPS: bloqueia vídeos e fontes externas pesadas
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'media' || resourceType === 'font') {
        req.abort().catch(() => {});
      } else {
        req.continue().catch(() => {});
      }
    });

    // Injeta cookies da VPS (env IG_SESSIONID ou scratch/instagram_cookies.json) antes de navegar
    const vpsCookies = loadCookiesForVps(cfg.cookiesFile, process.env);
    if (vpsCookies.length > 0) {
      log(`🍪 Carregando ${vpsCookies.length} cookie(s) de sessão para autenticação headless.`);
      await page.setCookie(...vpsCookies);
    }

    log('🌐 Acessando Instagram...');
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3500);

    const checkLoggedIn = () =>
      page.evaluate(() =>
        Boolean(
          document.querySelector(
            'svg[aria-label="Direct"], svg[aria-label="Mensagens"], svg[aria-label="Pesquisa"], svg[aria-label="Search"], a[href*="/direct/"]',
          ),
        ),
      );

    let isLoggedIn = await checkLoggedIn();

    if (!isLoggedIn && !cfg.headless) {
      log('⚠️ Sessão não autenticada. Faça login manualmente na janela aberta (aguardando até 2 minutos)...');
      for (let i = 0; i < 24 && !stopRequested; i++) {
        await sleep(5000);
        isLoggedIn = await checkLoggedIn();
        if (isLoggedIn) break;
      }
    }

    if (!isLoggedIn) {
      const pageState = await page.evaluate(() => ({
        url: window.location.href,
        bodyText: document.body?.innerText?.slice(0, 600) || '',
      }));
      const restriction = detectInstagramRestriction(pageState);
      log(
        `❌ Sessão do Instagram NÃO autenticada na VPS (${restriction.reason || 'sem_sessao'}). ` +
          `Exporte os cookies localmente com "--headed --export-cookies" ou configure IG_SESSIONID no .env da VPS.`,
      );
      return { status: 'not_authenticated', sent: 0 };
    }

    // Exporta cookies atualizados para facilitar reuso/backup na VPS
    const currentCookies = await page.cookies('https://www.instagram.com');
    if (cfg.exportCookiesOnly) {
      if (!fs.existsSync(path.dirname(cfg.cookiesFile))) fs.mkdirSync(path.dirname(cfg.cookiesFile), { recursive: true });
      fs.writeFileSync(cfg.cookiesFile, JSON.stringify(currentCookies, null, 2), { mode: 0o600 });
      log(`✅ Cookies salvos com permissão 0600 em: ${cfg.cookiesFile}`);
      log(`👉 Copie para a VPS: scp ${cfg.cookiesFile} root@SEU_IP_VPS:/opt/plantayraiz/scratch/instagram_cookies.json`);
      return { status: 'cookies_exported', sent: 0 };
    }

    log('✅ Sessão do Instagram autenticada!');

    // Embaralha hashtags a cada ciclo para diversificar descoberta
    const shuffledTags = [...cfg.hashtags].sort(() => Math.random() - 0.5).slice(0, 5);
    const candidateProfiles = [];

    for (const hashtag of shuffledTags) {
      if (stopRequested || candidateProfiles.length >= 30) break;
      log(`🔍 Mapeando perfis na hashtag #${hashtag}...`);

      try {
        await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await sleep(4000);

        const tagCheck = detectInstagramRestriction(
          await page.evaluate(() => ({ url: window.location.href, bodyText: document.body?.innerText?.slice(0, 500) || '' })),
        );
        if (tagCheck.restricted) {
          log(`🚨 Restrição detectada pelo Instagram (${tagCheck.reason}). Parando ciclo imediatamente por 24h.`);
          state.blockedUntil = new Date(Date.now() + COOLDOWN_ON_RESTRICTION_MS).toISOString();
          state.lastRestrictionReason = tagCheck.reason;
          saveState(state);
          return { status: 'restricted', sent: sentThisCycle };
        }

        const postLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')).map((a) => a.href);
          return Array.from(new Set(links)).slice(0, 12);
        });

        log(`   📸 ${postLinks.length} posts recentes em #${hashtag}.`);

        for (const postUrl of postLinks) {
          if (stopRequested || candidateProfiles.length >= 30) break;
          try {
            await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await sleep(2200);

            const authorInfo = await page.evaluate(() => {
              const userAnchor = document.querySelector('article header a[href^="/"], header a[href^="/"]');
              if (!userAnchor) return null;
              const href = userAnchor.getAttribute('href') || '';
              const username = href.replace(/^\/|\/$/g, '').split('/')[0].trim();
              return username && !['explore', 'p', 'reel', 'reels', 'accounts'].includes(username.toLowerCase())
                ? { username, profileUrl: `https://www.instagram.com/${username}/` }
                : null;
            });

            if (authorInfo?.username) {
              const uLower = authorInfo.username.toLowerCase();
              if (!state.invitedProfiles[uLower] && !candidateProfiles.some((c) => c.username.toLowerCase() === uLower)) {
                candidateProfiles.push(authorInfo);
              }
            }
          } catch (_) {}
        }
      } catch (err) {
        log(`   ⚠️ Erro na hashtag #${hashtag}: ${err.message}`);
      }
    }

    log(`📋 Candidatos novos mapeados neste ciclo: ${candidateProfiles.length}`);

    for (const candidate of candidateProfiles) {
      if (stopRequested) break;
      if (!canSendToday(state, cfg.maxDaily)) {
        log(`🛑 Limite diário de ${cfg.maxDaily} DMs atingido.`);
        break;
      }
      if (cfg.dryRun && sentThisCycle >= cfg.maxDaily) {
        log(`🧪 [DRY-RUN] Limite simulado de ${cfg.maxDaily} perfis atingido.`);
        break;
      }

      const username = candidate.username;
      log(`👉 Avaliando @${username}...`);

      try {
        await page.goto(`https://www.instagram.com/${username}/`, {
          waitUntil: 'domcontentloaded',
          timeout: 25000,
        });
        await sleep(3000);

        const profileSnap = await page.evaluate(() => {
          const nameEl = document.querySelector('header h1, header h2, header section span[dir="auto"]');
          const bioEl = document.querySelector('header section div:nth-of-type(3), [data-testid="user-bio"]');
          const metaDesc = document.querySelector('meta[name="description"]');
          return {
            url: window.location.href,
            bodyText: document.body?.innerText?.slice(0, 500) || '',
            name: nameEl?.innerText?.trim() || '',
            bio: bioEl?.innerText?.trim() || metaDesc?.getAttribute('content') || '',
          };
        });

        const restriction = detectInstagramRestriction(profileSnap);
        if (restriction.restricted) {
          log(`🚨 Restrição detectada (${restriction.reason}). Entrando em cooldown de 24h.`);
          state.blockedUntil = new Date(Date.now() + COOLDOWN_ON_RESTRICTION_MS).toISOString();
          state.lastRestrictionReason = restriction.reason;
          saveState(state);
          break;
        }

        if (!isDoctorProfile(profileSnap.bio, profileSnap.name)) {
          log(`⏭️ @${username} descartado (não é médico com credencial confirmada ou pertence a outra profissão/clínica).`);
          continue;
        }

        const inviteMessage = buildInviteMessage({
          fullName: profileSnap.name,
          username,
          bio: profileSnap.bio,
          templateIndex: sentThisCycle,
        });

        log(`🩺 Médico qualificado: @${username} (${profileSnap.name || 'sem nome'})`);

        if (cfg.dryRun) {
          sentThisCycle++;
          log(`🧪 [DRY-RUN #${sentThisCycle}] Simulado para @${username} (estado preservado, nenhuma DM enviada).`);
          continue;
        }

        const clickedMessageBtn = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
          const msgBtn = buttons.find((b) => {
            const t = (b.innerText || '').trim().toLowerCase();
            return t === 'mensagem' || t === 'enviar mensagem' || t === 'message';
          });
          if (msgBtn) {
            msgBtn.click();
            return true;
          }
          return false;
        });

        if (!clickedMessageBtn) {
          log(`⚠️ @${username} não exibe botão de Direct (perfil privado/restrito). Pulando.`);
          continue;
        }

        await sleep(3500);

        const dmRestriction = detectInstagramRestriction(
          await page.evaluate(() => ({ url: window.location.href, bodyText: document.body?.innerText?.slice(0, 500) || '' })),
        );
        if (dmRestriction.restricted) {
          log(`🚨 Restrição ao abrir Direct (${dmRestriction.reason}). Entrando em cooldown de 24h.`);
          state.blockedUntil = new Date(Date.now() + COOLDOWN_ON_RESTRICTION_MS).toISOString();
          state.lastRestrictionReason = dmRestriction.reason;
          saveState(state);
          break;
        }

        const messageInputSelector = 'div[role="textbox"][contenteditable="true"], textarea[placeholder*="Mensagem"], textarea[placeholder*="Message"]';
        await typeAndSendDirectMessage(page, messageInputSelector, inviteMessage);

        sentThisCycle++;
        recordInviteSent(state, username, profileSnap, { dryRun: false });
        await syncLeadToSupabase(username, profileSnap);
        log(`🎉 DM enviada para @${username} (${sentThisCycle} neste ciclo).`);

        if (canSendToday(state, cfg.maxDaily) && !stopRequested) {
          const delayMs = getRandomDelay(cfg.minDelaySec, cfg.maxDelaySec);
          log(`⏳ Jittering anti-bloqueio: aguardando ${(delayMs / 1000).toFixed(0)}s...`);
          await sleep(delayMs);
        }
      } catch (err) {
        log(`❌ Erro ao processar @${username}: ${err.message}`);
      }
    }

    log(`🏁 Ciclo concluído. Envios${cfg.dryRun ? ' simulados' : ''}: ${sentThisCycle}.`);
    return { status: 'ok', sent: sentThisCycle };
  } catch (err) {
    log(`❌ Erro geral no ciclo: ${err.message}`);
    return { status: 'error', sent: sentThisCycle, error: err.message };
  } finally {
    await browser.close().catch(() => {});
    activeBrowser = null;
  }
}

// ── MODO DAEMON PARA VPS (PM2) ──────────────────────────────────────────────
export async function runInstagramInviter(rawOptions = {}) {
  const cfg = { ...parseCliArgs(), ...rawOptions };

  if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  const releaseLock = acquireBrisaWorkerLock(LOCK_FILE);
  if (!releaseLock) {
    log('🛑 Outra instância do Instagram Direct Inviter já está em execução. Encerrando duplicata.');
    return { status: 'locked', sent: 0 };
  }

  const cleanup = async (signal) => {
    stopRequested = true;
    log(`🛑 Sinal ${signal} recebido. Encerrando Chromium e liberando lock...`);
    if (activeBrowser) {
      await activeBrowser.close().catch(() => {});
      activeBrowser = null;
    }
    releaseLock();
    process.exit(0);
  };

  process.once('SIGTERM', () => cleanup('SIGTERM'));
  process.once('SIGINT', () => cleanup('SIGINT'));
  process.once('exit', releaseLock);

  try {
    if (!cfg.daemon || cfg.exportCookiesOnly) {
      return await runInstagramInviterCycle(cfg);
    }

    log(`♻️ Modo DAEMON VPS ativo (janela Brasília ${cfg.startHourBrt}h–${cfg.endHourBrt}h | teto ${cfg.maxDaily}/dia | dryRun=${cfg.dryRun}).`);
    while (!stopRequested) {
      const now = new Date();
      if (!isWithinBusinessHours(now, cfg.startHourBrt, cfg.endHourBrt)) {
        log(`🌙 Fora da janela comercial (${getBrasiliaHour(now)}h BRT). Aguardando 30 minutos...`);
        await sleep(30 * 60 * 1000);
        continue;
      }

      const result = await runInstagramInviterCycle(cfg);
      if (stopRequested) break;

      if (result.status === 'not_authenticated') {
        log('⏸️ Aguardando 60 minutos antes de revalidar cookies/sessão...');
        await sleep(60 * 60 * 1000);
      } else if (result.status === 'daily_limit' || result.status === 'cooldown' || result.status === 'restricted') {
        log('😴 Cota diária/cooldown ativo. Verificando novamente em 60 minutos...');
        await sleep(60 * 60 * 1000);
      } else {
        log('⏱️ Ciclo encerrado com Chromium fechado (RAM liberada). Próximo ciclo em 90 minutos...');
        await sleep(90 * 60 * 1000);
      }
    }
    return { status: 'stopped', sent: 0 };
  } finally {
    releaseLock();
  }
}

// Execução direta via CLI
const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectCli && (process.argv.includes('--help') || process.argv.includes('-h'))) {
  console.log(`Uso: node scripts/agent_instagram_direct_inviter.mjs [opções]
  --live              envia DMs reais (padrão em --daemon é dry-run)
  --dry-run           simula sem enviar
  --once | --daemon   um ciclo ou contínuo
  --headed            abre navegador visível
  --export-cookies    loga e salva cookies (máquina local)
  --cookies <arq>     arquivo de cookies (padrão scratch/instagram_cookies.json)
  --max <n>           limite diário (padrão 25)
  --min-delay/--max-delay <s>, --start-hour/--end-hour <h>, --hashtags a,b
Env: IG_SESSIONID, IG_DAILY_LIMIT, IG_DRY_RUN, IG_DAEMON, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY`);
  process.exit(0);
}
if (isDirectCli) {
  runInstagramInviter().catch((err) => {
    log(`❌ Falha fatal: ${err.message}`);
    process.exit(1);
  });
}
