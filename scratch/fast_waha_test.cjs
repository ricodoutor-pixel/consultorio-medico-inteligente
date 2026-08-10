const WAHA_URL = 'https://waha-production-4e9c.up.railway.app';
const API_KEY = 'planta123';
const USER_PHONE = '5511987131241';

async function sendFastTest() {
  console.log("⚡ Testando envio para o seu número...");
  const chats = [`5511987131241@c.us`, `551187131241@c.us`];

  for (const chatId of chats) {
    try {
      console.log(`📤 Tentando ChatId: ${chatId}...`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${WAHA_URL}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': API_KEY
        },
        body: JSON.stringify({
          session: 'default',
          chatId: chatId,
          text: `🌿 *Planta y Raíz Ltda — Automação Ativa com Sucesso!*\n\nOlá! A conexão autônoma da Enfermeira Brisa IA no servidor oficial já está 100% ativa e operando sem necessidade de QR code ou código.\n\nIniciando agora o disparo contínuo da campanha para a lista de médicos prescritores!`,
          linkPreview: false
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      const data = await res.json();
      console.log(`STATUS (${chatId}):`, res.status, JSON.stringify(data));
      if (res.ok) {
        console.log(`✅ MENSAGEM ENTREGUE COM SUCESSO PARA ${chatId}!`);
        break;
      }
    } catch (e) {
      console.warn(`⚠️ Falhou ${chatId}:`, e.message);
    }
  }
}

sendFastTest();
