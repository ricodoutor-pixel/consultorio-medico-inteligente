// 🌿 Planta y Raiz — Robô Seguidor de Médicos no Instagram (@plantayraizltda)
// Acessa os perfis dos médicos selecionados e clica no botão "Seguir" com intervalos seguros

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const STATE_FILE = path.resolve('./instagram_followed_state.json');

// Lista de perfis de médicos, prescritores e especialistas canabinoides/integrativos no Brasil
const DOCTOR_IG_PROFILES = [
  "drandrecavallini",
  "dr.carolinanocetti",
  "drmariogrieco",
  "dra.paulatrezena",
  "dr.eduardofaveret",
  "dramarianamaciel",
  "dr.renanabdalla",
  "drapatriciamontagner",
  "drpedromellopierro",
  "dra.amandageneroso",
  "drwellington_dor",
  "drajulianaramos",
  "dr.lucaszanetti",
  "draflaviaguimaraes",
  "drrodrigomesquita",
  "drbernardoalthoff",
  "dravanessamatalon",
  "dr.marceloschaurich",
  "dracamilalourenco",
  "drgabrielrezende",
  "draleticiavasconcelos",
  "drfernandobaggio",
  "dramarianacosta",
  "drrafaelbecker",
  "dradenisezanata",
  "drgustavolinden",
  "drcarlosportela",
  "drafernandanogueira",
  "drtiagoguimaraes",
  "drarenatabittencourt",
  "drviniciusandrade",
  "dratatianabarreto",
  "drhenriquealbuquerque",
  "drabeatrizvasconcelos",
  "cannabismedicinalbrasil",
  "medicinacanabinoide_br",
  "sociedadecanabica",
  "medicinaintegrativabr",
  "neurologiacanabinoide",
  "dorcronica_integrativa",
  "doutoresdocannabis",
  "clinicaverdemed",
  "institutoendocanabico",
  "fitoterapiamedica_br",
  "endocanabinologia"
];

function loadFollowState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {}
  }
  return { followed: {}, total_followed: 0, started_at: new Date().toISOString() };
}

function saveFollowState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('[IG-Follower] Erro ao salvar estado:', e.message);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runInstagramFollower() {
  console.log('================================================================');
  console.log('🌿 [Planta y Raiz] INICIANDO AGENTE SEGUIDOR NO INSTAGRAM');
  console.log('🎯 CONTA ATIVA: @plantayraizltda');
  console.log('🛡️ CADÊNCIA DE SEGURANÇA: 60-90 segundos por perfil');
  console.log('================================================================');

  const state = loadFollowState();
  console.log(`[Queue] Perfis na fila: ${DOCTOR_IG_PROFILES.length}`);
  console.log(`[Queue] Já seguidos anteriormente: ${Object.keys(state.followed).length}`);

  let browser;
  try {
    // Tenta conectar ao Chrome existente com a sessão aberta do Instagram
    const response = await fetch('http://127.0.0.1:9222/json/version').catch(() => null);
    if (response && response.ok) {
      const data = await response.json();
      browser = await puppeteer.connect({ browserWSEndpoint: data.webSocketDebuggerUrl });
      console.log('✅ [Browser] Conectado com sucesso à janela aberta do Chrome!');
    } else {
      console.log('ℹ️ [Browser] Abrindo navegador autônomo com persistência...');
      browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  } catch (err) {
    console.log('ℹ️ [Browser] Iniciando modo padrão:', err.message);
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  }

  const page = (await browser.pages())[0] || (await browser.newPage());

  for (let i = 0; i < DOCTOR_IG_PROFILES.length; i++) {
    const username = DOCTOR_IG_PROFILES[i];

    if (state.followed[username] && state.followed[username].success) {
      console.log(`⏩ [Pular] Perfil @${username} já foi seguido.`);
      continue;
    }

    console.log(`\n------------------------------------------------------------`);
    console.log(`[Seguindo ${i + 1}/${DOCTOR_IG_PROFILES.length}] Acessando: instagram.com/${username}/`);
    console.log(`Timestamp: ${new Date().toLocaleTimeString('pt-BR')}`);

    try {
      await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3000);

      // Procura pelo botão de "Seguir" / "Follow"
      const followButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const targetBtn = buttons.find(b => {
          const text = (b.innerText || b.textContent || '').trim().toLowerCase();
          return text === 'seguir' || text === 'follow';
        });
        if (targetBtn) {
          targetBtn.click();
          return true;
        }
        return false;
      });

      if (followButton) {
        console.log(`✅ [Sucesso] Botão 'Seguir' clicado com sucesso no perfil @${username}!`);
        state.followed[username] = {
          username,
          success: true,
          action: 'followed',
          timestamp: new Date().toISOString()
        };
        state.total_followed = (state.total_followed || 0) + 1;
      } else {
        console.log(`ℹ️ [Aviso] Botão 'Seguir' não encontrado ou já está sendo seguido em @${username}.`);
        state.followed[username] = {
          username,
          success: true,
          action: 'already_following_or_not_found',
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      console.error(`❌ [Erro] Falha ao interagir com @${username}:`, err.message);
      state.followed[username] = {
        username,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }

    saveFollowState(state);

    // Intervalo de segurança randômico entre 60 e 90 segundos para evitar blocks da Meta
    const waitSeconds = Math.floor(60 + Math.random() * 30);
    console.log(`⏳ [Segurança] Aguardando ${waitSeconds}s antes do próximo médico...`);
    await sleep(waitSeconds * 1000);
  }

  console.log('================================================================');
  console.log('🎉 [CONCLUÍDO] Todos os perfis da fila foram processados!');
  console.log(`📊 Total de Perfis Seguidos: ${state.total_followed}`);
  console.log('================================================================');
}

runInstagramFollower().catch(e => console.error('[FATAL IG FOLLOWER]:', e));
