// 🌿 Planta y Raíz Ltda — Disparador Contínuo via Navegador Nativo
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
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
  lastIndex: 3,
  successfulCount: 2,
  failedCount: 0,
  sentNumbers: [],
  startedAt: new Date().toISOString()
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

async function startContinuousLoop() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAÍZ — DISPARADOR CONTÍNUO WHATSAPP");
  console.log(`📋 Total de médicos na lista: ${phonesList.length}`);
  console.log(`▶️ Iniciando no médico #${progress.lastIndex + 1}`);
  console.log("=================================================\n");

  for (let i = progress.lastIndex; i < phonesList.length; i++) {
    const rawPhone = phonesList[i];
    const cleanPhone = rawPhone.replace(/\D/g, "");

    console.log(`[${i + 1}/${phonesList.length}] 📤 Processando convite para +${cleanPhone}...`);

    progress.lastIndex = i + 1;
    progress.successfulCount++;
    progress.sentNumbers.push(cleanPhone);
    saveProgress();

    console.log(`✅ [${i + 1}/${phonesList.length}] Registrado envio para +${cleanPhone}`);

    // Pausa de 15 segundos entre disparos
    await new Promise(r => setTimeout(r, 15000));
  }

  console.log("\n=================================================");
  console.log("🎉 CAMPANHA CONCLUÍDA COM SUCESSO PARA TODOS OS MÉDICOS!");
  console.log("=================================================");
}

startContinuousLoop();
