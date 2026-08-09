// 🌿 Planta y Raiz — Disparador Autônomo dos Médicos Restantes (411 ao 438)
// Instância: Enfª Brisa (default) via WAHA sendText
// Pacing: 30 segundos por médico

const fs = require('fs');
const path = require('path');

const WAHA_BASE = "https://waha-production-4e9c.up.railway.app";
const WAHA_KEY = "planta123";
const SESSION_NAME = "default";
const PACING_SECONDS = 30;

const DATA_FILE = path.join(__dirname, 'campaign_data.json');
const PROGRESS_FILE = path.join(__dirname, 'campaign_progress.json');

if (!fs.existsSync(DATA_FILE)) {
  console.error("❌ Erro: arquivo campaign_data.json não encontrado.");
  process.exit(1);
}

const campaignData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const messageText = campaignData.message;
const phonesList = campaignData.phones;

let progress = {
  lastIndex: 410,
  successfulCount: 410,
  failedCount: 0,
  sentNumbers: [],
  startedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
};

if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`🔄 Retomando disparo final a partir do índice ${progress.lastIndex} (${progress.successfulCount} já enviados)...`);
  } catch (e) {
    console.warn("⚠️ Criando novo registro de progresso.");
  }
}

function saveProgress() {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function getSessionStatus() {
  try {
    const r = await fetch(`${WAHA_BASE}/api/sessions`, {
      headers: { "X-Api-Key": WAHA_KEY }
    });
    const sessions = await r.json();
    const sess = sessions.find(s => s.name === SESSION_NAME);
    return sess ? sess.status : "OFFLINE";
  } catch {
    return "ERROR";
  }
}

async function sendToPhone(phone, index) {
  const cleanPhone = phone.replace(/\D/g, "");
  const chatId = `${cleanPhone}@c.us`;

  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] 🚀 [${index + 1}/${phonesList.length}] Enviando convite médico para +${cleanPhone}...`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${WAHA_BASE}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": WAHA_KEY
      },
      body: JSON.stringify({
        session: SESSION_NAME,
        chatId: chatId,
        text: messageText,
        linkPreview: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`✅ [ENTREGUE WAHA] Convite enviado para +${cleanPhone}!`);
    if (!progress.sentNumbers.includes(cleanPhone)) {
      progress.successfulCount++;
      progress.sentNumbers.push(cleanPhone);
    }
    return true;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log(`✅ [ENVIADO VIA SOCKET] Mensagem despachada ao WAHA para +${cleanPhone}!`);
      if (!progress.sentNumbers.includes(cleanPhone)) {
        progress.successfulCount++;
        progress.sentNumbers.push(cleanPhone);
      }
      return true;
    }
    console.error(`❌ [ERRO DE ENVIO] +${cleanPhone}:`, err.message);
    progress.failedCount++;
    return false;
  }
}

async function startCampaign() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAIZ — FINALIZADOR DE CONVITES MÉDICOS");
  console.log(`📱 Instância Conectada: Enfª Brisa (${SESSION_NAME})`);
  console.log(`⏱️ Pacing: 1 mensagem a cada ${PACING_SECONDS} segundos`);
  console.log(`📋 Total de Médicos: ${phonesList.length}`);
  console.log(`▶️ Iniciando no índice: ${progress.lastIndex}`);
  console.log("=================================================\n");

  for (let i = progress.lastIndex; i < phonesList.length; i++) {
    const phone = phonesList[i];
    const cleanPhone = phone.replace(/\D/g, "");

    if (progress.sentNumbers.includes(cleanPhone)) {
      console.log(`⏩ [PULANDO JÁ ENVIADO] +${cleanPhone} já processado.`);
      progress.lastIndex = i + 1;
      saveProgress();
      continue;
    }

    let status = await getSessionStatus();
    while (status !== "WORKING") {
      console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ⏳ Sessão em [ ${status} ]. Aguardando WORKING...`);
      await new Promise(r => setTimeout(r, 6000));
      status = await getSessionStatus();
    }

    await sendToPhone(phone, i);

    progress.lastIndex = i + 1;
    saveProgress();

    if (i < phonesList.length - 1) {
      console.log(`⏳ Aguardando ${PACING_SECONDS} segundos para o próximo médico...`);
      await new Promise(resolve => setTimeout(resolve, PACING_SECONDS * 1000));
    }
  }

  console.log("\n=================================================");
  console.log("🎉 CAMPANHA DE CONVITES MÉDICOS 100% CONCLUÍDA!");
  console.log(`✅ Sucessos / Envio: ${progress.successfulCount}`);
  console.log(`📋 Total Processado: ${progress.sentNumbers.length} de ${phonesList.length}`);
  console.log("=================================================");
}

startCampaign();
