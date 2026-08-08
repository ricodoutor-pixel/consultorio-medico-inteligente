import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
const WAHA_API_URL = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'planta123';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

const INVITATION_MESSAGE = `Olá!\n\nSou a Brisa 🌿, assistente virtual da clínica digital Planta y Raiz. Estamos ampliando nossa plataforma de telemedicina e ecossistema de saúde focada em tratamentos naturais.\n\nGostaríamos de convidá-lo(a) para conhecer nossa plataforma. Somos uma clínica com infraestrutura completa e cadastro 100% gratuito para pacientes, médicos e parceiros!\n\nPara saber mais e fazer seu cadastro gratuitamente, acesse: https://plantayraiz.com.br\n\nQualquer dúvida, estou à disposição!`;

async function sendWAHA(chatId, text) {
  try {
    const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
      signal: controller.signal,
    });
    clearTimeout(tId);

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, status: response.status, error: body };
    }
    const data = await response.json();
    return { ok: true, status: response.status, data };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

async function runCampaign() {
  if (!SB_URL || !SB_KEY) {
    console.error("❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou PUBLISHABLE_KEY) são necessários no .env");
    process.exit(1);
  }

  const supabase = createClient(SB_URL, SB_KEY);
  
  console.log("🔍 Buscando lista de contatos nos bancos (Profiles e Doctors)...");
  
  const [profilesRes, doctorsRes] = await Promise.allSettled([
    supabase.from('profiles').select('id, full_name, phone').not('phone', 'is', null),
    supabase.from('doctors').select('id, full_name, phone').not('phone', 'is', null),
  ]);

  let profilesList = profilesRes.status === 'fulfilled' && profilesRes.value.data ? profilesRes.value.data : [];
  let doctorsList = doctorsRes.status === 'fulfilled' && doctorsRes.value.data ? doctorsRes.value.data : [];
  
  const targetFirstPhone = '5511987131241';
  let formattedList = [];

  // Primeiro da lista: Celular de teste do usuário
  formattedList.push({
    full_name: 'Seu Telefone Pessoal (Teste)',
    phone: targetFirstPhone
  });

  // Adicionar contatos da tabela Profiles
  for (const p of profilesList) {
    if (!p || !p.phone) continue;
    const clean = p.phone.replace(/\D/g, '');
    if (clean.length < 10) continue;
    if (clean === targetFirstPhone) continue;
    formattedList.push({
      full_name: p.full_name || 'Paciente/Usuário',
      phone: clean
    });
  }

  // Adicionar contatos da tabela Doctors
  for (const d of doctorsList) {
    if (!d || !d.phone) continue;
    const clean = d.phone.replace(/\D/g, '');
    if (clean.length < 10) continue;
    if (clean === targetFirstPhone) continue;
    formattedList.push({
      full_name: d.full_name || 'Dr.(a)',
      phone: clean
    });
  }

  // Deduplicar por número de telefone
  const uniqueList = [];
  const seen = new Set();
  for (const item of formattedList) {
    if (!seen.has(item.phone)) {
      seen.add(item.phone);
      uniqueList.push(item);
    }
  }

  console.log(`✅ Total de ${uniqueList.length} contatos prontos para a campanha.`);
  console.log(`🚀 Primeiro envio configurado para: ${targetFirstPhone}`);
  console.log(`⏱️ Intervalo estrito: 30 segundos entre mensagens.\n`);

  let sentCount = 0;
  let errorCount = 0;

  for (let i = 0; i < uniqueList.length; i++) {
    const profile = uniqueList[i];
    const phone = profile.phone;
    const chatId = `${phone}@c.us`;
    const nowStr = new Date().toLocaleTimeString('pt-BR');

    console.log(`[${nowStr}] [${i + 1}/${uniqueList.length}] 🚀 Enviando convite para ${profile.full_name} (${phone})...`);
    
    const result = await sendWAHA(chatId, INVITATION_MESSAGE);
    
    if (result.ok) {
      console.log(`   ✅ Enviado com sucesso! (ChatID: ${chatId})`);
      sentCount++;
    } else {
      console.log(`   ❌ Falha ao enviar: ${result.status || ''} - ${result.error}`);
      errorCount++;
    }
    
    if (i < uniqueList.length - 1) {
      console.log(`   ⏳ Aguardando 30 segundos para o próximo envio...`);
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  console.log("\n🎉 Campanha de Convites finalizada com sucesso!");
  console.log(`Total enviados com sucesso: ${sentCount}`);
  console.log(`Total falhas: ${errorCount}`);
}

runCampaign();
