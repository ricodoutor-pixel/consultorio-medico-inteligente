import * as dotenv from 'dotenv';
dotenv.config();

const WAHA_API_URL = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'planta123';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

const phone = '5511987131241';

async function checkPhone() {
  const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
  
  console.log(`🔎 Verificando número ${phone} no WhatsApp...`);
  
  // 1. Try GET /api/contacts/check-exists
  try {
    const url = `${base}/api/contacts/check-exists?session=${WAHA_SESSION}&phone=${phone}`;
    console.log(`GET ${url}`);
    const res = await fetch(url, {
      headers: { 'X-Api-Key': WAHA_API_KEY }
    });
    console.log(`Status check-exists: ${res.status}`);
    const data = await res.json();
    console.log(`Resultado check-exists:`, data);
  } catch (err) {
    console.error('❌ Erro check-exists:', err.message || err);
  }

  // 2. Try POST /api/sendText with timeout 40s to see if WEBJS completes
  console.log(`\n🚀 Tentando sendText com timeout de 40s...`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
      },
      body: JSON.stringify({
        session: WAHA_SESSION,
        chatId: `${phone}@c.us`,
        text: `Olá! 🌿 Convite de teste Planta y Raiz enviado para Dra./Sr(a).`
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`Status sendText: ${res.status}`);
    const body = await res.text();
    console.log(`Resposta sendText:`, body);
  } catch (err) {
    console.error('❌ Erro sendText:', err.message || err);
  }
}

checkPhone();
