import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.HOSTINGER_API_KEY || 'a3da008aa3e5b42f6684bb528086c343701ce123d58ee6e3ae2b4a37dc6e952f';

async function testHostingerAPI() {
  console.log("🧪 Testando envio via Hostinger API / Resend API com a chave fornecida...");

  // Test Hostinger API v1 endpoint
  try {
    const res = await fetch('https://api.hostinger.com/v1/emails/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'contato@plantayraiz.com.br',
        to: 'aridasilvaavelar13@gmail.com',
        subject: 'Teste de Envio Planta y Raiz',
        html: '<p>Teste de envio via API Hostinger</p>'
      })
    });
    console.log(`Resposta Hostinger API /v1/emails/send: Status ${res.status}`);
    const text = await res.text();
    console.log(`Body:`, text);
  } catch (err) {
    console.error("❌ Erro Hostinger API:", err.message);
  }

  // Test Resend API endpoint in case key is for Resend/Hostinger integration
  try {
    const res2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'contato@plantayraiz.com.br',
        to: ['aridasilvaavelar13@gmail.com'],
        subject: 'Teste de Envio Planta y Raiz',
        html: '<p>Teste de envio via Resend</p>'
      })
    });
    console.log(`\nResposta Resend API: Status ${res2.status}`);
    const text2 = await res2.text();
    console.log(`Body:`, text2);
  } catch (err) {
    console.error("❌ Erro Resend API:", err.message);
  }
}

testHostingerAPI();
