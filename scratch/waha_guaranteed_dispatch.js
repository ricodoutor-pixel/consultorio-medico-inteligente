// 🌿 Planta y Raiz — Disparador Autônomo WAHA Garantido (Sessão Enfª Brisa Conectada)
// Pacing: 30s | Dual-JID para Números Brasileiros | Zero Chromium Heavy Lookups

const fs = require('fs');
const path = require('path');

const WAHA_URL = 'https://waha-production-4e9c.up.railway.app';
const API_KEY = 'planta123';
const PACING_SECONDS = 30;

const DATA_FILE = path.join(__dirname, 'campaign_data.json');
const PROGRESS_FILE = path.join(__dirname, 'campaign_progress.json');

if (!fs.existsSync(DATA_FILE)) {
  console.error("❌ Erro: campaign_data.json não encontrado.");
  process.exit(1);
}

const campaignData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const messageText = campaignData.message;
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
    console.log(`🔄 Retomando campanha WAHA a partir do índice ${progress.lastIndex} (${progress.successfulCount} já enviados)...`);
  } catch (e) {
    console.warn("⚠️ Criando novo registro de progresso WAHA.");
  }
}

function saveProgress() {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function sendWahaText(chatId, text) {
  const res = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY
    },
    body: JSON.stringify({
      session: 'default',
      chatId: chatId,
      text: text,
      linkPreview: false
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  }
  return data;
}

function getPhoneVariations(phone) {
  const clean = phone.replace(/\D/g, "");
  const variations = [];

  // Formato primário ex: 5511991363154@c.us
  variations.push(`${clean}@c.us`);

  // Se for celular brasileiro com 13 dígitos (55 + DDD2 + 9 + 8dígitos), criar variação sem o 9 (12 dígitos)
  if (clean.startsWith("55") && clean.length === 13 && clean[4] === "9") {
    const without9 = clean.substring(0, 4) + clean.substring(5);
    variations.push(`${without9}@c.us`);
  }
  // Se for celular brasileiro com 12 dígitos sem o 9 (55 + DDD2 + 8dígitos), criar variação com o 9 (13 dígitos)
  else if (clean.startsWith("55") && clean.length === 12) {
    const with9 = clean.substring(0, 4) + "9" + clean.substring(4);
    variations.push(`${with9}@c.us`);
  }

  return variations;
}

async function runWahaCampaign() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAIZ — DISPARADOR AUTÔNOMO WAHA ENFª BRISA");
  console.log("⚡ Conexão WAHA Ativa (PushName: Enf.Brisa Planta y Raíz Ltda)");
  console.log(`⏱️ Pacing de Segurança: 1 mensagem a cada ${PACING_SECONDS} segundos`);
  console.log(`📋 Total de Médicos Únicos: ${phonesList.length}`);
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

    const variations = getPhoneVariations(phone);
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] 🚀 [${i + 1}/${phonesList.length}] Enviando convite médico para +${cleanPhone}...`);

    let sent = false;
    for (const chatId of variations) {
      try {
        const result = await sendWahaText(chatId, messageText);
        console.log(`   ✅ [ENTREGUE VIA WAHA] JID: ${chatId} | Msg ID: ${result.id || 'OK'}`);
        sent = true;
        break; // Enviado com sucesso
      } catch (err) {
        console.warn(`   ⚠️ Variação ${chatId} falhou (${err.message}), tentando próxima variação se houver...`);
      }
    }

    if (sent) {
      progress.successfulCount++;
      progress.sentNumbers.push(cleanPhone);
    } else {
      console.error(`❌ [FALHA COMPLETA] Não foi possível enviar para +${cleanPhone}`);
      progress.failedCount++;
    }

    progress.lastIndex = i + 1;
    saveProgress();

    if (i < phonesList.length - 1) {
      console.log(`⏳ Aguardando ${PACING_SECONDS}s para o próximo médico...`);
      await new Promise(resolve => setTimeout(resolve, PACING_SECONDS * 1000));
    }
  }

  console.log("\n=================================================");
  console.log("🎉 CAMPANHA DE CONVITES MÉDICOS CONCLUÍDA!");
  console.log(`✅ Entregues com Sucesso: ${progress.successfulCount}`);
  console.log(`📋 Total Processado: ${progress.sentNumbers.length} de ${phonesList.length}`);
  console.log("=================================================");
}

runWahaCampaign();
