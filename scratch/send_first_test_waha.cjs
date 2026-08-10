const WAHA_URL = 'https://waha-production-4e9c.up.railway.app';
const API_KEY = 'planta123';
const USER_PHONE = '5511987131241';

async function sendTestMessage() {
  console.log("🚀 Disparando 1ª Mensagem de Teste via Servidor Ativo WAHA (Enf. Brisa)...");
  try {
    const res = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY
      },
      body: JSON.stringify({
        session: 'default',
        chatId: `${USER_PHONE}@c.us`,
        text: `🌿 *Planta y Raíz Ltda — Automação Ativa com Sucesso!*\n\nOlá! A conexão autônoma da Enfermeira Brisa IA no servidor oficial já está 100% ativa e operando sem necessidade de QR code ou código.\n\nIniciando agora o disparo contínuo da campanha para a lista de médicos prescritores!`,
        linkPreview: false
      })
    });
    const data = await res.json();
    console.log("RESULTADO DO ENVIO:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERRO:", err.message);
  }
}

sendTestMessage();
