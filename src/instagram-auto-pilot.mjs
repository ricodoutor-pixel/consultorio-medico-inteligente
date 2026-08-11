// 🌿 Planta y Raiz — Piloto Automático do Instagram (@plantayraizltda)
// Abre uma janela automatizada dedicada para seguir médicos com segurança e autonomia

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const STATE_FILE = path.resolve('./instagram_followed_state.json');

// Lista completa de perfis de médicos, prescritores e especialistas canabinoides no Brasil
const DOCTOR_HANDLES = [
  "drandrecavallini", "dr.carolinanocetti", "drmariogrieco", "dra.paulatrezena", "dr.eduardofaveret",
  "dramarianamaciel", "dr.renanabdalla", "drapatriciamontagner", "drpedromellopierro", "dra.amandageneroso",
  "drwellington_dor", "drajulianaramos", "dr.lucaszanetti", "draflaviaguimaraes", "drrodrigomesquita",
  "drbernardoalthoff", "dravanessamatalon", "dr.marceloschaurich", "dracamilalourenco", "drgabrielrezende",
  "draleticiavasconcelos", "drfernandobaggio", "dramarianacosta", "drrafaelbecker", "dradenisezanata",
  "drgustavolinden", "drcarlosportela", "drafernandanogueira", "drtiagoguimaraes", "drarenatabittencourt",
  "drviniciusandrade", "dratatianabarreto", "drhenriquealbuquerque", "drabeatrizvasconcelos", "cannabismedicinalbrasil",
  "medicinacanabinoide_br", "sociedadecanabica", "medicinaintegrativabr", "neurologiacanabinoide", "dorcronica_integrativa",
  "doutoresdocannabis", "clinicaverdemed", "institutoendocanabico", "fitoterapiamedica_br", "endocanabinologia"
];

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {}
  }
  return { followed: {}, count: 0 };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runAutoPilot() {
  console.log('================================================================');
  console.log('🌿 [Planta y Raiz] PILOTO AUTOMÁTICO DO INSTAGRAM INICIADO');
  console.log('🎯 META: Subir "A seguir" até o público médico qualificado');
  console.log('================================================================');

  const state = loadState();
  const sessionDir = path.resolve('./.ig_session_profile');

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: sessionDir,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  
  console.log('📍 Acessando Instagram...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
  await sleep(5000);

  for (let i = 0; i < DOCTOR_HANDLES.length; i++) {
    const handle = DOCTOR_HANDLES[i];

    if (state.followed[handle] && state.followed[handle].success) {
      console.log(`⏩ [Pular] @${handle} já processado anteriormente.`);
      continue;
    }

    console.log(`\n------------------------------------------------------------`);
    console.log(`[Médico ${i + 1}/${DOCTOR_HANDLES.length}] Navegando para: instagram.com/${handle}/`);

    try {
      await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(3000);

      // Procura e clica no botão Seguir
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => {
          const text = (b.innerText || b.textContent || '').trim().toLowerCase();
          return text === 'seguir' || text === 'follow';
        });
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        state.count = (state.count || 0) + 1;
        state.followed[handle] = { success: true, at: new Date().toISOString() };
        console.log(`✅ [SEGUIDO] @${handle} seguido com sucesso! (Total novos: ${state.count})`);
      } else {
        console.log(`ℹ️ [Info] Perfil @${handle} já está sendo seguido ou botão não disponível.`);
        state.followed[handle] = { success: true, at: new Date().toISOString() };
      }
    } catch (err) {
      console.error(`❌ [Erro] Falha ao processar @${handle}:`, err.message);
    }

    saveState(state);

    // Intervalo de segurança anti-bloqueio entre 20 e 35 segundos
    const wait = Math.floor(20 + Math.random() * 15);
    console.log(`⏳ Aguardando ${wait}s para o próximo médico...`);
    await sleep(wait * 1000);
  }

  console.log('================================================================');
  console.log('🎉 [FINALIZADO] Ciclo de médicos concluído com sucesso!');
  console.log('================================================================');
}

runAutoPilot().catch(e => console.error('[FATAL]:', e));
