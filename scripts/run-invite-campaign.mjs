import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carrega as vars de ambiente do .env
dotenv.config();

const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
const WAHA_API_URL = (process.env.WAHA_API_URL || 'waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'planta123';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

const INVITATION_MESSAGE = `Olá!\n\nSou a Brisa 🌿, assistente virtual da clínica digital Planta y Raiz. Estamos ampliando nossa plataforma de telemedicina e ecossistema de saúde focada em tratamentos naturais.\n\nGostaríamos de convidá-lo(a) para conhecer nossa plataforma. Somos uma clínica com infraestrutura completa e cadastro 100% gratuito para pacientes, médicos e parceiros!\n\nPara saber mais e fazer seu cadastro gratuitamente, acesse: https://plantayraiz.com.br\n\nQualquer dúvida, estou à disposição!`;

async function sendWAHA(chatId, text) {
  try {
    const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
    const response = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const body = await response.text();
      return { ok: false, status: response.status, error: body };
    }
    return { ok: true, status: response.status };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

async function runCampaign() {
  if (!SB_URL || !SB_KEY) {
    console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários no .env");
    process.exit(1);
  }

  const supabase = createClient(SB_URL, SB_KEY);
  
  console.log("🔍 Buscando lista de contatos (Profiles)...");
  const { data: profilesData, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .not('phone', 'is', null);

  if (error) {
    console.error("Erro ao buscar no DB:", error.message);
    process.exit(1);
  }

  let profilesList = profilesData || [];
  console.log(`✅ Encontrados ${profilesList.length} contatos com telefone.`);

  let sentCount = 0;
  let errorCount = 0;

  for (let i = 0; i < profilesList.length; i++) {
    const profile = profilesList[i];
    if (!profile || !profile.phone) continue;
    
    const phoneNum = profile.phone;
    if (!phoneNum) continue;
    
    const phone = phoneNum.replace(/\\D/g, '');
    if (phone.length < 10) continue; 
    
    const chatId = phone.includes("@") ? phone : `${phone}@c.us`;

    console.log(`[${i+1}/${profilesList.length}] 🚀 Enviando para ${profile.full_name || 'Usuário'} (${phone})...`);
    
    const result = await sendWAHA(chatId, INVITATION_MESSAGE);
    
    if (result.ok) {
      console.log(`   ✅ Sucesso!`);
      sentCount++;
    } else {
      console.log(`   ❌ Falha: ${result.status} - ${result.error}`);
      errorCount++;
    }
    
    if (i < doctorsList.length - 1) {
      console.log(`   ⏳ Aguardando 30 segundos para o próximo envio...`);
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  console.log("\\n🎉 Campanha finalizada!");
  console.log(`Total enviados: ${sentCount}`);
  console.log(`Total falhas: ${errorCount}`);
}

runCampaign();
