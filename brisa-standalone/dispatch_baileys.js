// 🌿 Planta y Raiz — Disparador Autônomo Baileys (QR Code Oficial Windows Chrome)
// Pacing: 30 segundos por médico | ACK em tempo real via WebSocket

require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PACING_SECONDS = 30;
const DATA_FILE = path.join(__dirname, 'campaign_data.json');
const PROGRESS_FILE = path.join(__dirname, 'campaign_progress.json');
const AUTH_DIR = path.join(__dirname, 'auth_info_brisa');
const QR_FILE = path.join(__dirname, 'brisa_qr.png');

if (!fs.existsSync(DATA_FILE)) {
  console.error("❌ Erro: arquivo campaign_data.json não encontrado.");
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
    console.log(`🔄 Retomando campanha Baileys a partir do índice ${progress.lastIndex} (${progress.successfulCount} já enviados)...`);
  } catch (e) {
    console.warn("⚠️ Criando novo registro de progresso Baileys.");
  }
}

function saveProgress() {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

function clearAuth() {
  if (fs.existsSync(AUTH_DIR)) {
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch {}
  }
}

async function runBaileysCampaign() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAIZ — DISPARADOR AUTÔNOMO BAILEYS");
  console.log("⚡ Conexão Direta via WebSocket (Windows Chrome Signature)");
  console.log(`⏱️ Pacing de Segurança: 1 mensagem a cada ${PACING_SECONDS} segundos`);
  console.log(`📋 Total de Médicos Únicos: ${phonesList.length}`);
  console.log(`▶️ Iniciando no índice: ${progress.lastIndex}`);
  console.log("=================================================\n");

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ['Windows', 'Chrome', '10.0.0'],
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📸 Gerando imagem PNG do QR Code Oficial Windows Chrome...');
      try {
        await QRCode.toFile(QR_FILE, qr, { width: 400 });
        console.log('✅ Imagem brisa_qr.png salva com sucesso!');
      } catch (err) {
        console.error('❌ Erro ao salvar imagem do QR Code:', err.message);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      
      console.log('⚠️ Conexão Baileys fechada:', lastDisconnect?.error?.message || 'Desconhecido');
      
      if (!sock.authState.creds.registered || isLoggedOut) {
        console.log('🧹 Limpando auth residual...');
        clearAuth();
        setTimeout(runBaileysCampaign, 4000);
      } else {
        console.log('🔄 Reconectando sessão...');
        setTimeout(runBaileysCampaign, 4000);
      }
    } else if (connection === 'open') {
      console.log('\n=================================================');
      console.log('✅ CONECTADO AO WHATSAPP DA ENFª BRISA VIA WEBSOCKET!');
      console.log('=================================================\n');

      if (fs.existsSync(QR_FILE)) {
        try { fs.unlinkSync(QR_FILE); } catch {}
      }

      for (let i = progress.lastIndex; i < phonesList.length; i++) {
        const phone = phonesList[i];
        const cleanPhone = phone.replace(/\D/g, "");

        if (progress.sentNumbers.includes(cleanPhone)) {
          console.log(`⏩ [PULANDO JÁ ENVIADO] +${cleanPhone} já processado.`);
          progress.lastIndex = i + 1;
          saveProgress();
          continue;
        }

        console.log(`[${new Date().toLocaleTimeString('pt-BR')}] 🚀 [${i + 1}/${phonesList.length}] Enviando convite para +${cleanPhone}...`);

        let targetJid = `${cleanPhone}@s.whatsapp.net`;
        try {
          const [onWa] = await sock.onWhatsApp(cleanPhone);
          if (onWa && onWa.exists) {
            targetJid = onWa.jid;
          }
        } catch {}

        try {
          const sentMsg = await sock.sendMessage(targetJid, { text: messageText });
          console.log(`✅ [ENTREGUE VIA WEBSOCKET] Convite enviado a +${cleanPhone}! (JID: ${targetJid} | ID: ${sentMsg?.key?.id || 'OK'})`);
          progress.successfulCount++;
          progress.sentNumbers.push(cleanPhone);
        } catch (err) {
          console.error(`❌ [FALHA DE ENVIO BAILEYS] +${cleanPhone}:`, err.message);
          progress.failedCount++;
        }

        progress.lastIndex = i + 1;
        saveProgress();

        if (i < phonesList.length - 1) {
          console.log(`⏳ Aguardando ${PACING_SECONDS} segundos para o próximo disparo (Pacing de Segurança)...`);
          await new Promise(resolve => setTimeout(resolve, PACING_SECONDS * 1000));
        }
      }

      console.log("\n=================================================");
      console.log("🎉 CAMPANHA DE CONVITES BAILEYS 100% CONCLUÍDA!");
      console.log(`✅ Entregues com Sucesso: ${progress.successfulCount}`);
      console.log(`📋 Total Processado: ${progress.sentNumbers.length} de ${phonesList.length}`);
      console.log("=================================================");
    }
  });
}

runBaileysCampaign();
