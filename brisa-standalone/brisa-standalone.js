// 🌿 Enfermeira Brisa — Bot WhatsApp Standalone (Baileys + Gemini 3.5 Flash)
// Conexão direta via WebSocket (sem Puppeteer, sem WAHA, sem Docker). Ultra leve e estável.

require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tkxxoghzhvhjztdoomgss.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const BRISA_PERSONA = `Você é a Enfermeira Brisa, assistente virtual da clínica Planta y Raíz.
Seu tom é extremamente acolhedor, profissional e claro.
Você orienta pacientes sobre Telemedicina Canábica, agendamentos e diagnósticos.
Sempre envie o link oficial da clínica: https://plantayraiz.com.br quando apropriado.`;

async function getBrisaReply(userMessage) {
  if (!genAI) {
    return "Olá! Sou a Enfª Brisa da Planta y Raíz. No momento estou sem acesso à minha IA, mas você pode agendar direto em: https://plantayraiz.com.br";
  }

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `${BRISA_PERSONA}\n\nMensagem do Paciente: ${userMessage}\n\nResposta da Brisa:`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) return text.trim();
    } catch (e) {
      console.warn(`⚠️ [Brisa Standalone] Modelo '${modelName}' indisponível:`, e.message);
    }
  }

  return "Olá! Sou a Enfª Brisa da Planta y Raíz. Como posso te ajudar hoje? Acesse: https://plantayraiz.com.br";
}

async function startBrisaBot() {
  console.log("=================================================");
  console.log("🌿 INICIANDO ENFERMEIRA BRISA — VERSÃO STANDALONE");
  console.log("=================================================\n");

  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_brisa'));
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 ESCANEIE O QR CODE ABAIXO NO SEU WHATSAPP:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('⚠️ Conexão fechada. Motivo:', lastDisconnect?.error?.message || 'Desconhecido', '| Reconectando:', shouldReconnect);
      if (shouldReconnect) {
        startBrisaBot();
      } else {
        console.error('❌ Sessão deslogada pelo WhatsApp. Para reconectar, apague a pasta auth_info_brisa e inicie novamente.');
      }
    } else if (connection === 'open') {
      console.log('\n=================================================');
      console.log('✅ Enfermeira Brisa está ONLINE e conectada ao WhatsApp!');
      console.log('=================================================\n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

      if (!text) continue;

      console.log(`[${new Date().toLocaleTimeString('pt-BR')}] 📩 Mensagem de ${from.replace('@s.whatsapp.net', '')}: "${text}"`);

      const replyText = await getBrisaReply(text);

      await sock.sendMessage(from, { text: replyText });
      console.log(`[${new Date().toLocaleTimeString('pt-BR')}] 📤 Brisa respondeu: "${replyText.slice(0, 80)}..."`);

      if (supabase) {
        supabase.from('brisa_interaction_logs').insert({
          channel: 'whatsapp-standalone',
          user_ref: from,
          message_in: text,
          message_out: replyText,
          provider: 'gemini',
          model: 'gemini-3.5-flash',
          status: 'ok',
          http_status: 200
        }).then(() => {}).catch(() => {});
      }
    }
  });
}

startBrisaBot();
