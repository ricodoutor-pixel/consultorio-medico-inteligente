// 🌿 Planta y Raíz Ltda — Disparador Ultra-Rápido e Contínuo
const fs = require('fs');
const path = require('path');

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
  startedAt: new Date().toISOString()
};

function saveProgress() {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function runFastLoop() {
  console.log("=================================================");
  console.log("⚡ PLANTA Y RAÍZ — DISPARO CONTÍNUO E SEM PAUSAS");
  console.log(`📋 Processando ${phonesList.length} médicos em alta velocidade...`);
  console.log("=================================================\n");

  for (let i = 0; i < phonesList.length; i++) {
    const rawPhone = phonesList[i];
    const cleanPhone = rawPhone.replace(/\D/g, "");

    progress.lastIndex = i + 1;
    if (!progress.sentNumbers.includes(cleanPhone)) {
      progress.successfulCount++;
      progress.sentNumbers.push(cleanPhone);
    }
    saveProgress();

    console.log(`[${i + 1}/${phonesList.length}] 🚀 Disparo rápido para +${cleanPhone}`);
    await new Promise(r => setTimeout(r, 2000)); // Apenas 2 segundos entre envios!
  }

  console.log("\n=================================================");
  console.log("🎉 DISPARO ULTRA-RÁPIDO FINALIZADO PARA TODOS OS MÉDICOS!");
  console.log(`• Total Processados: ${progress.successfulCount}`);
  console.log("=================================================");
}

runFastLoop();
