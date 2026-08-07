import * as dotenv from 'dotenv';
dotenv.config();

const WAHA_API_URL = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'planta123';

async function checkStatus() {
  const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
  console.log(`🔎 Verificando status da sessão após o restart...`);
  
  try {
    const res = await fetch(`${base}/api/sessions?all=true`, { headers: { 'X-Api-Key': WAHA_API_KEY } });
    const data = await res.json();
    const session = data[0];
    console.log(`Status atual: ${session?.status}`);
    console.log(`Me:`, session?.me);
    return session?.status;
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

checkStatus();
