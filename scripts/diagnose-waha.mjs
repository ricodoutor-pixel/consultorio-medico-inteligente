import * as dotenv from 'dotenv';
dotenv.config();

const WAHA_API_URL = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'planta123';

async function diagnose() {
  const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
  console.log(`🏥 Diagnóstico da API WAHA: ${base}`);

  // 1. Version check
  try {
    const res = await fetch(`${base}/api/version`, { headers: { 'X-Api-Key': WAHA_API_KEY } });
    const data = await res.json();
    console.log(`✅ WAHA Versão:`, data);
  } catch (err) {
    console.error(`❌ Erro Versão:`, err.message);
  }

  // 2. Session status
  try {
    const res = await fetch(`${base}/api/sessions?all=true`, { headers: { 'X-Api-Key': WAHA_API_KEY } });
    const data = await res.json();
    console.log(`✅ Status Sessão:`, data[0]?.status, `Engine:`, data[0]?.engine || 'WEBJS');
  } catch (err) {
    console.error(`❌ Erro Sessões:`, err.message);
  }

  // 3. Restart session test if stuck
  console.log(`🔄 Reiniciando a sessão 'default' para destravar o Puppeteer...`);
  try {
    const res = await fetch(`${base}/api/sessions/default/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY }
    });
    const data = await res.text();
    console.log(`Resposta Restart: status ${res.status}`, data);
  } catch (err) {
    console.error(`❌ Erro Restart:`, err.message);
  }
}

diagnose();
