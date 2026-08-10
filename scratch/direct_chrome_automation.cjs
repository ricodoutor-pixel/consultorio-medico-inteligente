// 🌿 Planta y Raiz — Automador Direto WhatsApp Web (Infalível via Keyboard Enter)

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE_DIR = path.join(__dirname, 'whatsapp_chrome_profile');
const USER_TEST_PHONE = "5511987131241"; // 1ª mensagem de teste
const PACING_SECONDS = 30; // Pacing de 30s entre disparos

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

async function runDirectAutomation() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAIZ — AUTOMADOR DIRETO WHATSAPP CHROME");
  console.log("⚡ Abrindo navegador dedicado para WhatsApp Web...");
  console.log("=================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: PROFILE_DIR,
    headless: false,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  console.log("🌐 Navegando para WhatsApp Web...");
  await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded' });

  console.log("⏳ Aguardando leitura do QR Code ou sessão ativa do WhatsApp Web...");
  try {
    await page.waitForSelector('footer div[contenteditable="true"], div[contenteditable="true"], canvas', { timeout: 120000 });
  } catch (e) {}

  console.log("\n🚀 Enviando 1ª Mensagem de Teste para seu número (5511987131241)...");
  const firstSuccess = await sendMessage(page, USER_TEST_PHONE, `🌿 *Planta y Raíz Ltda — Automação Conectada!*\n\nOlá! A automação via WhatsApp Web em execução foi ativada.\nIniciando disparo contínuo da campanha para ${phonesList.length} médicos cadastrados!`);

  if (firstSuccess) {
    console.log(`✅ 1ª Mensagem enviada com SUCESSO para ${USER_TEST_PHONE}!\n`);
  } else {
    console.warn(`⚠️ Não foi possível enviar 1ª mensagem para ${USER_TEST_PHONE}. Continuando com a lista...\n`);
  }

  console.log(`📋 Total de Médicos na Lista: ${phonesList.length}`);
  console.log(`▶️ Iniciando no índice: ${progress.lastIndex}\n`);

  for (let i = progress.lastIndex; i < phonesList.length; i++) {
    const rawPhone = phonesList[i];
    const cleanPhone = rawPhone.replace(/\D/g, "");

    console.log(`[${i + 1}/${phonesList.length}] 📤 Enviando convite para ${cleanPhone}...`);
    const success = await sendMessage(page, cleanPhone, campaignMessage);

    if (success) {
      progress.successfulCount++;
      progress.sentNumbers.push(cleanPhone);
      console.log(`✅ [${i + 1}/${phonesList.length}] Sucesso -> ${cleanPhone}`);
    } else {
      progress.failedCount++;
      console.error(`❌ [${i + 1}/${phonesList.length}] Falha no envio -> ${cleanPhone}`);
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

async function sendMessage(page, phone, messageText) {
  try {
    const encodedText = encodeURIComponent(messageText);
    await page.goto(`https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`, { waitUntil: 'domcontentloaded' });

    // Esperar a caixa de entrada de mensagem carregar
    const textInputSelector = 'footer div[contenteditable="true"], div[contenteditable="true"]';
    await page.waitForSelector(textInputSelector, { timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // Focar no campo de mensagem e disparar a mensagem com Enter
    await page.click(textInputSelector);
    await new Promise(r => setTimeout(r, 500));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    return true;
  } catch (err) {
    console.warn(`⚠️ Falha ao disparar para ${phone}:`, err.message);
    return false;
  }
}

runDirectAutomation();
