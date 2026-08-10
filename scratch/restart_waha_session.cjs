const WAHA_URL = 'https://waha-production-4e9c.up.railway.app';
const API_KEY = 'planta123';
const USER_PHONE = '5511987131241';

async function restartAndSend() {
  console.log("🔄 Reiniciando a sessão WAHA no servidor Railway...");
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions/default/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY
      }
    });
    const data = await res.json();
    console.log("RESTART SESSION RESULT:", JSON.stringify(data, null, 2));

    console.log("⏳ Aguardando 10 segundos para a sessão reconectar...");
    await new Promise(r => setTimeout(r, 10000));

    // Verificar se re-estabeleceu a sessão
    const sessRes = await fetch(`${WAHA_URL}/api/sessions`, { headers: { 'X-Api-Key': API_KEY } });
    const sessData = await sessRes.json();
    console.log("SESSION STATUS AFTER RESTART:", JSON.stringify(sessData, null, 2));

  } catch (err) {
    console.error("ERRO AO REINICIAR WAHA:", err.message);
  }
}

restartAndSend();
