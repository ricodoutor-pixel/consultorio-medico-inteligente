import * as dotenv from 'dotenv';
dotenv.config();

const WAHA_API_URL = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'planta123';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

const formats = [
  '5511987131241@c.us',
  '551187131241@c.us',
  '5511987131241@s.whatsapp.net'
];

async function testFormats() {
  const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;

  for (const chatId of formats) {
    console.log(`\n🧪 Testando formato: ${chatId}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`${base}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': WAHA_API_KEY
        },
        body: JSON.stringify({
          session: WAHA_SESSION,
          chatId: chatId,
          text: `Teste de formato WAHA para ${chatId}`
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`   Status: ${res.status}`);
      const data = await res.text();
      console.log(`   Resposta: ${data.substring(0, 150)}...`);
      if (res.ok) {
        console.log(`   🎉 FORMATO FUNCIONAL DETECTADO: ${chatId}`);
        break;
      }
    } catch (err) {
      console.log(`   ❌ Erro/Timeout (${chatId}): ${err.message}`);
    }
  }
}

testFormats();
