// 🌿 Planta y Raiz — Motor Autônomo WhatsApp Baileys com Enfª Brisa IA (Gemini 3.5)
// Execução independente, QR Code automático, resposta com Gemini 3.5 e disparo contínuo

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

let makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion;
try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default || baileys;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
} catch (e) {
  console.log("Aguardando instalação das dependências...");
}

const USER_TEST_PHONE = "5511987131241"; // Número do usuário para a 1ª mensagem
const PACING_SECONDS = 30; // Pacing de segurança entre mensagens

const AUTH_DIR = path.join(__dirname, 'baileys_auth_info');
const DATA_FILE = path.join(__dirname, 'campaign_data.json');
const PROGRESS_FILE = path.join(__dirname, 'campaign_progress.json');
const QR_OUTPUT_FILE = path.join(__dirname, 'brisa_qr.png');
const ARTIFACT_QR_FILE = "C:\\Users\\ricod\\.gemini\\antigravity\\brain\\f80a569b-8eec-4609-9c48-09637e2e828b\\brisa_qr.png";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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

// Resposta com IA Gemini 3.5 Flash para mensagens recebidas
async function getBrisaAiReply(userQuery) {
  if (!GEMINI_API_KEY) {
    return "Olá! Sou a Enfermeira Brisa da Planta y Raíz Ltda. Seja muito bem-vindo(a) à nossa plataforma de Telemedicina e Medicina Canabinoide!";
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Você é a Enfermeira Brisa, assistente virtual oficial e acolhedora da Planta y Raíz Ltda (Plataforma de Telemedicina, Consultório Virtual e Medicina Canabinoide).
Responda ao paciente/médico em tom profissional, empático e informativo.

Dúvida recebida: "${userQuery}"`
          }]
        }]
      })
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "Olá! Sou a Enfermeira Brisa da Planta y Raíz Ltda. Como posso ajudar com seus atendimentos e telemedicina hoje?";
  } catch (e) {
    return "Olá! Sou a Enfermeira Brisa da Planta y Raíz Ltda. Bem-vindo(a) ao nosso atendimento oficial de Telemedicina!";
  }
}

async function startBaileysBot() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAIZ — MOTOR AUTÔNOMO BAILEYS ENFª BRISA");
  console.log("=================================================\n");

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version = [2, 3000, 1017531287];
  try {
    const fetched = await fetchLatestBaileysVersion();
    version = fetched.version;
  } catch (e) {}

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ["Planta y Raíz Ltda", "Chrome", "120.0.0"],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 =========================================================");
      console.log("📱 QR CODE RECEBIDO COM SUCESSO!");
      console.log("👉 Escaneie o QR Code abaixo no seu WhatsApp:");
      console.log("=========================================================\n");

      // Gerar imagem do QR Code
      await QRCode.toFile(QR_OUTPUT_FILE, qr, { width: 400 });
      try {
        fs.copyFileSync(QR_OUTPUT_FILE, ARTIFACT_QR_FILE);
      } catch (e) {}

      console.log(`🖼️ Imagem do QR Code salva em: ${QR_OUTPUT_FILE}`);
    }

    if (connection === 'open') {
      console.log("\n✅ =========================================================");
      console.log("🎉 CONECTADO COM SUCESSO AO WHATSAPP!");
      console.log("=========================================================\n");

      // 1. Disparar a PRIMEIRA MENSAGEM DE TESTE para o número do usuário (5511987131241)
      const userJid = `${USER_TEST_PHONE}@s.whatsapp.net`;
      try {
        console.log(`🚀 Disparando 1ª Mensagem de Confirmação para seu WhatsApp (${USER_TEST_PHONE})...`);
        await sock.sendMessage(userJid, {
          text: `🌿 *Planta y Raíz Ltda — Conexão Estabelecida com Sucesso!*\n\nOlá! A conexão autônoma da Enfermeira Brisa IA foi ativada.\n\nIniciando agora o disparo contínuo de convites para a lista de médicos prescritores (${phonesList.length} contatos). O processo continuará até a conclusão da lista!`
        });
        console.log(`✅ 1ª Mensagem enviada com sucesso para ${USER_TEST_PHONE}!\n`);
      } catch (err) {
        console.warn(`⚠️ Não foi possível enviar 1ª mensagem para ${USER_TEST_PHONE}:`, err.message);
      }

      // 2. Iniciar o disparo em lote da campanha para a lista de médicos
      runCampaignLoop(sock);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('⚠️ Conexão encerrada. Reconectando:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startBaileysBot, 3000);
      }
    }
  });

  // Resposta automática via Gemini 3.5 para mensagens de entrada
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      const conversationText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      if (conversationText && remoteJid && !remoteJid.includes('@g.us')) {
        console.log(`📩 Mensagem recebida de ${remoteJid}: "${conversationText}"`);
        const replyText = await getBrisaAiReply(conversationText);
        await sock.sendMessage(remoteJid, { text: replyText });
        console.log(`🤖 Enfª Brisa IA respondeu para ${remoteJid}!`);
      }
    }
  });
}

async function runCampaignLoop(sock) {
  console.log(`📋 Total de Médicos na Lista: ${phonesList.length}`);
  console.log(`▶️ Continuando a partir do índice: ${progress.lastIndex}\n`);

  for (let i = progress.lastIndex; i < phonesList.length; i++) {
    const rawPhone = phonesList[i];
    const cleanPhone = rawPhone.replace(/\D/g, "");

    // Variações de JID para cel brasileiros (com e sem o 9º dígito)
    let jids = [`${cleanPhone}@s.whatsapp.net`];
    if (cleanPhone.startsWith("55") && cleanPhone.length === 13 && cleanPhone[4] === "9") {
      const without9 = cleanPhone.substring(0, 4) + cleanPhone.substring(5);
      jids.push(`${without9}@s.whatsapp.net`);
    } else if (cleanPhone.startsWith("55") && cleanPhone.length === 12) {
      const with9 = cleanPhone.substring(0, 4) + "9" + cleanPhone.substring(4);
      jids.push(`${with9}@s.whatsapp.net`);
    }

    let success = false;
    for (const jid of jids) {
      try {
        console.log(`[${i + 1}/${phonesList.length}] 📤 Enviando convite para ${cleanPhone} (${jid})...`);
        await sock.sendMessage(jid, { text: campaignMessage });
        console.log(`✅ [${i + 1}/${phonesList.length}] Sucesso -> ${cleanPhone}`);
        success = true;
        break;
      } catch (err) {
        console.warn(`⚠️ Tentativa ${jid} falhou:`, err.message);
      }
    }

    if (success) {
      progress.successfulCount++;
      progress.sentNumbers.push(cleanPhone);
    } else {
      progress.failedCount++;
      console.error(`❌ [${i + 1}/${phonesList.length}] Falha no envio para ${cleanPhone}`);
    }

    progress.lastIndex = i + 1;
    saveProgress();

    // Pacing de segurança (30s)
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

startBaileysBot();
