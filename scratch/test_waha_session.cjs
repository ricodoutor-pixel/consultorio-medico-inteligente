const WAHA_URL = 'https://waha-production-4e9c.up.railway.app';
const API_KEY = 'planta123';
const USER_PHONE = '5511987131241';

async function checkSession() {
  try {
    const res = await fetch(`${WAHA_URL}/api/sessions`, {
      headers: { 'X-Api-Key': API_KEY }
    });
    const sessions = await res.json();
    console.log("WAHA SESSIONS:", JSON.stringify(sessions, null, 2));

    // Enviar mensagem de teste direta
    const sendRes = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: `${USER_PHONE}@c.us`,
        text: '🌿 *Planta y Raíz Ltda — Teste de Conexão Enfª Brisa*\n\nConexão com servidor WAHA verificada com sucesso!'
      })
    });
    const sendData = await sendRes.json();
    console.log("SEND TEST RESULT:", JSON.stringify(sendData, null, 2));
  } catch (err) {
    console.error("WAHA ERROR:", err.message);
  }
}

checkSession();
