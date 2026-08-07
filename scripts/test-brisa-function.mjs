import * as dotenv from 'dotenv';
dotenv.config();

const SB_URL = process.env.VITE_SUPABASE_URL || 'https://shmbwdjuddvquszwkvuq.supabase.co';
const SB_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Webhook endpoint to test Brisa function
const EDGE_URL = 'https://tkxxoghzhvhjzdoomgss.supabase.co/functions/v1/brisa-bot';

async function testBrisaWebhook() {
  console.log(`🌐 Testando Edge Function Brisa em: ${EDGE_URL}`);
  
  const testPayload = {
    event: 'message',
    payload: {
      id: 'test_msg_id_' + Date.now(),
      from: '5511987131241@c.us',
      fromMe: false,
      body: 'Olá Brisa! Sou médico e gostaria de saber mais informações sobre como me cadastrar e como funciona a plataforma.',
      senderName: 'Dr. Teste'
    }
  };

  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_ANON_KEY,
        'Authorization': `Bearer ${SB_ANON_KEY}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`Status HTTP: ${res.status}`);
    const text = await res.text();
    console.log(`Resposta da Brisa:`, text);
  } catch (err) {
    console.error('❌ Erro no teste do Webhook:', err.message || err);
  }
}

testBrisaWebhook();
