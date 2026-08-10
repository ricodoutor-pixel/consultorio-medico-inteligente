// 🌿 Planta y Raiz — Automador Direto via Navegador WhatsApp Web (Sem QR Code)
// Utiliza a sessão ativa do WhatsApp Web no Chrome do usuário

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
const USER_TEST_PHONE = "5511987131241"; // 1ª mensagem de teste
const PACING_SECONDS = 30; // Pacing entre disparos

const DATA_FILE = path.join(__dirname, 'campaign_data.json');
const PROGRESS_FILE = path.join(__dirname, 'campaign_progress.json');

if (!fs.existsSync(DATA_FILE)) {
  console.error("❌ Erro: campaign_data.json não encontrado.");
  process.exit(1);
}

const campaignData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const campaignMessage = campaignData.message;
const phonesList = campaignData.phones;

let progress = {
  lastIndex: 0,
  successfulCount: 0,
  failedCount: 0,
  sentNumbers: [],
  startedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
};

if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch (e) {}
}

function saveProgress() {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function runBrowserAutomation() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAIZ — AUTOMADOR DIRETO WHATSAPP WEB");
  console.log("⚡ Conectando diretamente ao WhatsApp Web ativo...");
  console.log("=================================================\n");

  let browser;
  try {
    // Tenta conectar à instância aberta no Chrome via porta 9222
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
    console.log("✅ Conectado ao Chrome em execução via Debug Port 9222!");
  } catch (e) {
    console.log("ℹ️ Conectando via perfil ativo do Chrome...");
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      userDataDir: USER_DATA_DIR,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=9222']
    });
  }

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('web.whatsapp.com'));
  if (!page) {
    page = await browser.newPage();
    await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });
  }

  console.log("⏳ Aguardando carregamento da sessão do WhatsApp Web...");
  await page.waitForSelector('div[contenteditable="true"]', { timeout: 60000 }).catch(() => {
    console.log("ℹ️ Navegando na aba do WhatsApp Web...");
  });

  // 1. Enviar a PRIMEIRA MENSAGEM DE TESTE para o usuário (5511987131241)
  console.log(`\n🚀 Enviando 1ª Mensagem de Teste para o seu número (${USER_TEST_PHONE})...`);
  const firstSuccess = await sendMessageToPhone(page, USER_TEST_PHONE, `🌿 *Planta y Raíz Ltda — Automação Conectada com Sucesso!*\n\nOlá! A automação via WhatsApp Web em execução foi ativada.\nIniciando disparo contínuo da campanha para ${phonesList.length} médicos cadastrados!`);
  
  if (firstSuccess) {
    console.log(`✅ 1ª Mensagem de teste enviada com SUCESSO para ${USER_TEST_PHONE}!\n`);
  } else {
    console.warn(`⚠️ Não foi possível enviar 1ª mensagem para ${USER_TEST_PHONE}. Continuando campanha...\n`);
  }

  // 2. Disparar a campanha para a lista de médicos
  console.log(`📋 Total de Médicos na Lista: ${phonesList.length}`);
  console.log(`▶️ Iniciando no índice: ${progress.lastIndex}\n`);

  for (let i = progress.lastIndex; i < phonesList.length; i++) {
    const rawPhone = phonesList[i];
    const cleanPhone = rawPhone.replace(/\D/g, "");

    console.log(`[${i + 1}/${phonesList.length}] 📤 Enviando convite via WhatsApp Web para ${cleanPhone}...`);
    const success = await sendMessageToPhone(page, cleanPhone, campaignMessage);

    if (success) {
      progress.successfulCount++;
      progress.sentNumbers.push(cleanPhone);
      console.log(`✅ [${i + 1}/${phonesList.length}] Enviado com sucesso -> ${cleanPhone}`);
    } else {
      progress.failedCount++;
      console.error(`❌ [${i + 1}/${phonesList.length}] Falha no envio para ${cleanPhone}`);
    }

    progress.lastIndex = i + 1;
    saveProgress();

    if (i < phonesList.length - 1) {
      console.log(`⏳ Aguardando ${PACING_SECONDS}s de pacing de segurança...\n`);
      await new Promise(r => setTimeout(r, PACING_SECONDS * 1000));
    }
  }

  console.log("\n=================================================");
  console.log("🎉 DISPARO DE CAMPANHA CONCLUÍDO COM SUCESSO!");
  console.log(`• Enviados com sucesso: ${progress.successfulCount}`);
  console.log(`• Falhas: ${progress.failedCount}`);
  console.log("=================================================");
}

async function sendMessageToPhone(page, phone, text) {
  try {
    const encodedText = encodeURIComponent(text);
    const targetUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Aguardar o botão de enviar (send button) carregar
    const sendButtonSelector = 'button span[data-icon="send"], span[data-icon="send"], button[aria-label="Enviar"]';
    await page.waitForSelector(sendButtonSelector, { timeout: 25000 });
    await new Promise(r => setTimeout(r, 1500));

    // Clicar no botão de enviar
    const sendBtn = await page.$(sendButtonSelector);
    if (sendBtn) {
      await sendBtn.click();
      await new Promise(r => setTimeout(r, 3000));
      return true;
    }

    // Fallback: Pressionar Enter no campo de texto
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    return true;
  } catch (err) {
    console.warn(`⚠️ Erro ao enviar para ${phone}:`, err.message);
    return false;
  }
}

runBrowserAutomation();
