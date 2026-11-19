/**
 * 🌿 Planta y Raíz Ltda — Agente Autônomo Instagram Direct Inviter
 * Script: scripts/agent_instagram_direct_inviter.mjs
 * 
 * Função:
 * 1. Prospecção ativa e envio de convites de Médico Sócio Prescritor via Instagram Direct.
 * 2. Varredura inteligente de hashtags canábicas e integrativas brasileiras.
 * 3. Blindagem anti-bloqueio (jittering de 2 a 5 minutos, limite diário seguro de 25 DMs/dia).
 * 4. Desduplicação persistente em JSON local e sincronização automática com Supabase leads_crm.
 * 5. Sessão persistente de navegador (cookies preservados em scratch/instagram_session).
 * 
 * Uso:
 *   node scripts/agent_instagram_direct_inviter.mjs
 *   node scripts/agent_instagram_direct_inviter.mjs --dry-run
 *   node scripts/agent_instagram_direct_inviter.mjs --max 15
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIGURAÇÕES ───────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://shmbwdjuddvquszwkvuq.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';

const SESSION_DIR = path.join(__dirname, '../scratch/instagram_session');
const STATE_FILE = path.join(__dirname, '../scratch/instagram_invited_doctors.json');
const LOG_FILE = path.join(__dirname, '../scratch/instagram_inviter.log');

const DEFAULT_DAILY_LIMIT = 25; // Limite seguro para evitar restrições de spam no Instagram
const MIN_DELAY_SECONDS = 120;  // 2 minutos mínimo entre envios
const MAX_DELAY_SECONDS = 300;  // 5 minutos máximo entre envios

// Hashtags de busca para médicos e prescritores de cannabis no Brasil
const HASHTAGS = [
  'medicinacanabinoide',
  'prescritorcannabis',
  'medicocanabidiol',
  'cannabismedicinalbrasil',
  'medicinaintegrativabrasil',
  'psiquiatriaintegrativa',
  'neurologiaintegrativa',
  'endocanabinologia',
  'medicinadador',
  'dorcronica'
];

// ── TEMPLATES DE MENSAGEM HUMANIZADOS ───────────────────────────────────────
const INVITE_TEMPLATES = [
  `Olá, Dr(a). {name}! Tudo bem com você? Aqui é o Dr. Edilson Bezerra, diretor médico da Planta y Raíz (telemedicina canabinoide).

Gostaria de convidar o colega para fazer parte do nosso corpo clínico de Médicos Sócios Prescritores.

Nossa plataforma foi desenhada por médicos para oferecer:
• 93% de repasse líquido via PIX instantâneo (taxa fixa de apenas 7%);
• Prontuário CFM com emissão de receitas ICP-Brasil / Gov.br com QR Code aceito em farmácias e importações ANVISA (RDC 660);
• Consultório virtual sem mensalidade ou taxa de adesão obrigatória;
• Pacientes próprios e total autonomia na sua conduta clínica.

👉 Para ativar seu consultório gratuito em 2 minutos:
https://www.plantayraiz.com.br/cadastro-profissional

Caso queira tirar qualquer dúvida ou agendar uma rápida conversa direta, fico à disposição por aqui ou no WhatsApp da coordenação: (11) 99136-3154.

Um abraço cordial,
Dr. Edilson Bezerra | Planta y Raíz Ltda`,

  `Prezado(a) Dr(a). {name}, espero encontrá-lo(a) bem! Sou o Dr. Edilson Bezerra, diretor técnico da Planta y Raíz.

Acompanho seu trabalho na medicina e gostaria de estender um convite institucional para integrar nossa plataforma de telemedicina canabinoide como Médico Sócio Prescritor.

Nossos diferenciais para o médico:
• Você retém 93% do valor da consulta (recebimento imediato no PIX);
• Emissão de prescrições e laudos com assinatura digital válida em todo o Brasil;
• Triagem prévia de pacientes pela Enfermeira Brisa IA;
• Consultório digital gratuito e sem fidelidade.

Podemos liberar seu perfil na vitrine médica hoje mesmo:
👉 https://www.plantayraiz.com.br/cadastro-profissional

Será uma honra ter você conosco! Se preferir, me envie seu WhatsApp que nossa coordenação médica entra em contato direto.`,
];

// ── UTILITÁRIOS ─────────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [IG-INVITER] ${msg}`;
  console.log(line);
  try {
    if (!fs.existsSync(path.dirname(LOG_FILE))) fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRandomDelay(minSec = MIN_DELAY_SECONDS, maxSec = MAX_DELAY_SECONDS) {
  return Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (_) {}
  }
  return {
    invitedProfiles: {}, // username -> { invitedAt, name, status }
    dailyCounters: {}    // 'YYYY-MM-DD' -> count
  };
}

function saveState(state) {
  try {
    if (!fs.existsSync(path.dirname(STATE_FILE))) fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {}
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function canSendToday(state, maxDaily) {
  const today = getTodayKey();
  const currentCount = state.dailyCounters[today] || 0;
  return currentCount < maxDaily;
}

function recordInviteSent(state, username, profileData) {
  const today = getTodayKey();
  state.dailyCounters[today] = (state.dailyCounters[today] || 0) + 1;
  state.invitedProfiles[username.toLowerCase()] = {
    invitedAt: new Date().toISOString(),
    name: profileData.name || username,
    bio: profileData.bio || '',
    status: 'invited'
  };
  saveState(state);
}

// ── INTEGRAÇÃO CRM SUPABASE ────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncLeadToSupabase(username, profileData) {
  try {
    const cleanPhone = profileData.phone || `ig_${username}`;
    await supabase.from('leads_crm').upsert({
      name: profileData.name || `Dr(a). ${username}`,
      phone: cleanPhone,
      instagram_url: `https://www.instagram.com/${username}/`,
      specialty: profileData.specialty || 'Medicina Canabinoide / Integrativa',
      state: profileData.state || 'BR',
      source: 'instagram_direct',
      status: 'invited',
      notes: `Convite enviado via Instagram Direct em ${new Date().toLocaleDateString('pt-BR')}. Bio: ${profileData.bio?.slice(0, 150) || ''}`,
      last_contact_at: new Date().toISOString()
    }, { onConflict: 'phone', ignoreDuplicates: false });
    log(`✅ Lead @${username} registrado no CRM Supabase como 'invited'.`);
  } catch (err) {
    log(`⚠️ Não foi possível salvar lead no Supabase: ${err.message}`);
  }
}

// ── EXTRAÇÃO E PARSER DE PERFIS ─────────────────────────────────────────────
function isDoctorProfile(bio, name = '') {
  const text = `${bio} ${name}`.toLowerCase();
  const doctorKeywords = [
    'crm', 'médic', 'medic', 'doutor', 'dr.', 'dra.', 'psiquiatr',
    'neurolog', 'oncolog', 'cannabis', 'canabinoid', 'integrativ',
    'dor crônica', 'reumatolog', 'pediatr', 'endocanabinoid'
  ];
  return doctorKeywords.some(kw => text.includes(kw));
}

function extractName(fullName, username) {
  if (fullName && fullName.length > 2 && !fullName.includes('Instagram')) {
    return fullName.replace(/dr\.?|dra\.?|médico|medica/gi, '').trim();
  }
  return username;
}

// ── AGENTE DE ENVIO DIRETO NO INSTAGRAM ─────────────────────────────────────
export async function runInstagramInviter(options = {}) {
  const isDryRun = options.dryRun || process.argv.includes('--dry-run');
  const maxDaily = options.max || DEFAULT_DAILY_LIMIT;
  const state = loadState();

  log(`🚀 Iniciando Agente Instagram Direct Inviter...`);
  log(`⚙️ Configuração: Limite Diário = ${maxDaily} DMs | Dry-Run = ${isDryRun ? 'SIM (Apenas simulação)' : 'NÃO (Envio real)'}`);

  const todayKey = getTodayKey();
  const alreadySentToday = state.dailyCounters[todayKey] || 0;
  log(`📊 Disparos já realizados hoje (${todayKey}): ${alreadySentToday}/${maxDaily}`);

  if (!canSendToday(state, maxDaily)) {
    log(`🛑 Limite diário de segurança atingido (${alreadySentToday}/${maxDaily}). Aguardando próximo ciclo.`);
    return;
  }

  // Inicializa Puppeteer com perfil persistente
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false, // Visível para o usuário caso precise confirmar login/2FA
    userDataDir: SESSION_DIR,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-notifications',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

  try {
    log(`🌐 Acessando Instagram...`);
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(3000);

    // Checar se está logado
    const isLoggedIn = await page.evaluate(() => {
      return Boolean(document.querySelector('svg[aria-label="Direct"], svg[aria-label="Mensagens"], svg[aria-label="Search"], a[href*="/direct/"]'));
    });

    if (!isLoggedIn) {
      log(`⚠️ Instagram NÃO está logado na sessão persistente.`);
      log(`👉 Por favor, faça login manualmente na janela do navegador que se abriu.`);
      log(`⏳ Aguardando até 2 minutos pelo login...`);

      let loggedInAfterWait = false;
      for (let i = 0; i < 24; i++) {
        await sleep(5000);
        loggedInAfterWait = await page.evaluate(() => {
          return Boolean(document.querySelector('svg[aria-label="Direct"], svg[aria-label="Mensagens"], a[href*="/direct/"]'));
        });
        if (loggedInAfterWait) break;
      }

      if (!loggedInAfterWait) {
        log(`❌ Tempo limite de login esgotado. Execute novamente após realizar o login.`);
        await browser.close();
        return;
      }
      log(`✅ Login detectado com sucesso! Sessão salva.`);
    } else {
      log(`✅ Sessão do Instagram ativa e autenticada!`);
    }

    // Coletar perfis candidatos através das hashtags
    const candidateProfiles = [];

    for (const hashtag of HASHTAGS) {
      if (candidateProfiles.length >= 40) break;
      log(`🔍 Mapeando médicos na hashtag #${hashtag}...`);

      try {
        await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(4000);

        // Extrai links de postagens
        const postLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/p/"]')).map(a => a.href);
          return Array.from(new Set(links)).slice(0, 15);
        });

        log(`   📸 Encontrados ${postLinks.length} posts recentes na hashtag #${hashtag}.`);

        for (const postUrl of postLinks) {
          try {
            await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await sleep(2500);

            const authorInfo = await page.evaluate(() => {
              const userAnchor = document.querySelector('header a[href^="/"], a[role="link"][href^="/"]');
              if (!userAnchor) return null;
              const href = userAnchor.getAttribute('href') || '';
              const username = href.replace(/\//g, '').trim();
              return username ? { username, profileUrl: `https://www.instagram.com/${username}/` } : null;
            });

            if (authorInfo && authorInfo.username && !authorInfo.username.includes('explore')) {
              const uLower = authorInfo.username.toLowerCase();
              if (!state.invitedProfiles[uLower] && !candidateProfiles.some(c => c.username.toLowerCase() === uLower)) {
                candidateProfiles.push(authorInfo);
                log(`   🎯 Candidato adicionado: @${authorInfo.username}`);
              }
            }
          } catch (_) {}
        }
      } catch (err) {
        log(`   ⚠️ Erro ao consultar hashtag #${hashtag}: ${err.message}`);
      }
    }

    log(`📋 Total de médicos candidatos novos para convidar: ${candidateProfiles.length}`);

    // Loop de Envio dos Convites
    for (const candidate of candidateProfiles) {
      if (!canSendToday(state, maxDaily)) {
        log(`🛑 Limite diário de ${maxDaily} DMs atingido. Encerrando ciclo.`);
        break;
      }

      const username = candidate.username;
      log(`\n======================================================`);
      log(`👉 Avaliando perfil: @${username}...`);

      try {
        await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await sleep(3000);

        // Extrair Bio e Nome
        const profileData = await page.evaluate(() => {
          const nameEl = document.querySelector('header h1, header h2, section h1');
          const bioEl = document.querySelector('header section div:nth-of-type(3), [data-testid="user-bio"]');
          const metaDesc = document.querySelector('meta[name="description"]');
          return {
            name: nameEl?.innerText?.trim() || '',
            bio: bioEl?.innerText?.trim() || metaDesc?.getAttribute('content') || ''
          };
        });

        // Validar se é médico / prescritor
        if (!isDoctorProfile(profileData.bio, profileData.name)) {
          log(`⏭️ Perfil @${username} não aparenta ser prescritor/médico pela bio. Pulando.`);
          continue;
        }

        const displayName = extractName(profileData.name, username);
        const template = INVITE_TEMPLATES[Math.floor(Math.random() * INVITE_TEMPLATES.length)];
        const inviteMessage = template.replace('{name}', displayName);

        log(`👨‍⚕️ Médico confirmado: ${displayName} (@${username})`);
        log(`📝 Mensagem preparada:\n${inviteMessage.slice(0, 150)}...`);

        if (isDryRun) {
          log(`🧪 [DRY-RUN] Simulação concluída para @${username}. Mensagem não disparada.`);
          recordInviteSent(state, username, profileData);
          continue;
        }

        // Tentar clicar no botão "Enviar mensagem" / Direct
        const clickedMessageBtn = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
          const msgBtn = buttons.find(b => {
            const t = b.innerText.toLowerCase();
            return t === 'mensagem' || t === 'enviar mensagem' || t === 'message';
          });
          if (msgBtn) {
            msgBtn.click();
            return true;
          }
          return false;
        });

        if (!clickedMessageBtn) {
          log(`⚠️ Botão de mensagem não encontrado no perfil @${username} (perfil pode ser fechado ou restringir DMs).`);
          continue;
        }

        await sleep(4000);

        // Digitar e Enviar Mensagem no Direct
        const messageInputSelector = 'div[role="textbox"][contenteditable="true"], textarea[placeholder*="Mensagem"]';
        await page.waitForSelector(messageInputSelector, { timeout: 15000 });

        await page.click(messageInputSelector);
        await sleep(1000);

        // Digitação humanizada
        await page.keyboard.sendCharacter('');
        await page.evaluate((sel, text) => {
          const el = document.querySelector(sel);
          if (el) {
            el.focus();
            document.execCommand('insertText', false, text);
          }
        }, messageInputSelector, inviteMessage);

        await sleep(2000);
        await page.keyboard.press('Enter');
        await sleep(3000);

        log(`🎉 Convite enviado com sucesso para @${username}!`);

        // Registrar no estado local e no Supabase CRM
        recordInviteSent(state, username, profileData);
        await syncLeadToSupabase(username, profileData);

        // Jittering de segurança entre mensagens
        const delayMs = getRandomDelay();
        log(`⏳ Jittering de segurança anti-bloqueio: aguardando ${(delayMs / 1000).toFixed(0)}s antes do próximo médico...`);
        await sleep(delayMs);

      } catch (err) {
        log(`❌ Falha no fluxo para @${username}: ${err.message}`);
      }
    }

    log(`🏁 Ciclo do Agente Instagram Direct concluído.`);

  } catch (err) {
    log(`❌ Erro geral no agente: ${err.message}`);
  } finally {
    await browser.close();
  }
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('agent_instagram_direct_inviter.mjs')) {
  runInstagramInviter();
}
