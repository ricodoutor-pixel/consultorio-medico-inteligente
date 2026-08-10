// 🌿 Planta y Raiz — Conexão via Código de Pareamento de 8 Dígitos (Sem QR Code!)
// Permite conectar ao WhatsApp digitando apenas um código de 8 dígitos no celular!

const fs = require('fs');
const path = require('path');

const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default || baileys;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

const USER_TEST_PHONE = "5511987131241"; // Número para o código e para a 1ª mensagem de teste
const PACING_SECONDS = 30;

const AUTH_DIR = path.join(__dirname, 'baileys_auth_info');
const DATA_FILE = path.join(__dirname, 'campaign_data.json');
const PROGRESS_FILE = path.join(__dirname, 'campaign_progress.json');
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

async function startPairingCodeBot() {
  console.log("=================================================");
  console.log("🌿 PLANTA Y RAIZ — CONEXÃO POR CÓDIGO DE PAREAMENTO (SEM QR CODE)");
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
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
  });

  sock.ev.on('creds.update', saveCreds);

  // Solicitar o Código de Pareamento se não estiver registrado
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(USER_TEST_PHONE);
        console.log("\n🔑 =========================================================");
        console.log(`🔑 CÓDIGO DE PAREAMENTO GERADO COM SUCESSO!`);
        console.log(`👉 CÓDIGO DE 8 DÍGITOS:  ${code}`);
        console.log("=========================================================");
        console.log(`\n📋 Como usar no seu celular (${USER_TEST_PHONE}):`);
        console.log("1. Abra o WhatsApp no celular.");
        console.log("2. Vá em 'Aparelhos Conectados' -> 'Conectar um Aparelho'.");
        console.log("3. Toque em 'Conectar com número de telefone' no rodapé.");
        console.log(`4. Digite o código de 8 dígitos acima: ${code}\n`);
      } catch (err) {
        console.error("⚠️ Erro ao solicitar código de pareamento:", err.message);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log("\n✅ =========================================================");
      console.log("🎉 CONECTADO COM SUCESSO AO WHATSAPP!");
      console.log("=========================================================\n");

      // 1. Enviar a PRIMEIRA MENSAGEM DE TESTE para o usuário (5511987131241)
      const userJid = `${USER_TEST_PHONE}@s.whatsapp.net`;
      try {
        console.log(`🚀 Disparando 1ª Mensagem de Teste para o seu WhatsApp (${USER_TEST_PHONE})...`);
        await sock.sendMessage(userJid, {
          text: `🌿 *Planta y Raíz Ltda — Conexão por Código Concluída!*\n\nOlá! A conexão autônoma da Enfermeira Brisa IA foi estabelecida com sucesso via Código de Pareamento.\n\nIniciando disparo contínuo de convites para os ${phonesList.length} médicos cadastrados!`
        });
        console.log(`✅ 1ª Mensagem enviada com SUCESSO para ${USER_TEST_PHONE}!\n`);
      } catch (err) {
        console.warn(`⚠️ Não foi possível enviar 1ª mensagem para ${USER_TEST_PHONE}:`, err.message);
      }

      // 2. Iniciar o disparo da campanha
      runCampaignLoop(sock);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('⚠️ Conexão encerrada. Reconectando:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startPairingCodeBot, 3000);
      }
    }
  });
}

async function runCampaignLoop(sock) {
  console.log(`📋 Total de Médicos na Lista: ${phonesList.length}`);
  console.log(`▶️ Iniciando no índice: ${progress.lastIndex}\n`);

  for (let i = progress.lastIndex; i < phonesList.length; i++) {
    const rawPhone = phonesList[i];
    const cleanPhone = rawPhone.replace(/\D/g, "");

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

startPairingCodeBot();
