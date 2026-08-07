import * as dotenv from 'dotenv';
dotenv.config();

const WAHA_API_URL = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'planta123';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

const targetPhone = '5511987131241';
const chatId = `${targetPhone}@c.us`;

// Single line message without newlines
const message = `Olá! Sou a Brisa 🌿 assistente virtual da clínica digital Planta y Raiz. Gostaríamos de convidá-lo(a) para conhecer nossa plataforma com cadastro 100% gratuito: https://plantayraiz.com.br`;

async function testSend() {
  console.log(`📡 Enviando mensagem em linha única via WAHA para ${chatId}...`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
    const res = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: WAHA_SESSION,
        chatId: chatId,
        text: message
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`Status HTTP: ${res.status}`);
    const data = await res.text();
    console.log(`Resposta:`, data);
  } catch (err) {
    console.error('❌ Erro na requisição:', err.message || err);
  }
}

testSend();
