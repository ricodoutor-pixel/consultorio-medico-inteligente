const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { createClient } = require('@supabase/supabase-js');

async function run() {
  console.log("=== BUSCA ESPECÍFICA: CHRIGOR KAYK SILVA DE OLIVEIRA ===");

  // 1. Procurar nos scripts de campanhas de email e listas
  const campaignFiles = [
    'scripts/send-brevo-campaign-2.mjs',
    'scripts/email_campaign_progress.json',
    'scripts/emails_concluidos.json',
    'scripts/check-leads.cjs',
    'scripts/clean-prescribers-list.mjs',
    'scripts/clean_email_list.mjs',
    'scripts/disparo.js',
    'scripts/disparo-convites.ts',
  ];

  for (const f of campaignFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const lower = content.toLowerCase();
      if (lower.includes('chrigor') || lower.includes('kayk') || lower.includes('oliveira')) {
        console.log(`[ARQUIVO] Encontrado em ${f}`);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.toLowerCase().includes('chrigor') || l.toLowerCase().includes('kayk')) {
            console.log(`Linha ${i+1}: ${l}`);
          }
        });
      }
    }
  }

  // 2. Buscar no Supabase com chave do env
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    const supabase = createClient(url, key);

    console.log("\n[SUPABASE PROFILES]");
    const { data: p1 } = await supabase.from('profiles').select('*').ilike('full_name', '%Chrigor%');
    console.log("Por nome 'Chrigor':", p1);

    const { data: p2 } = await supabase.from('profiles').select('*').ilike('full_name', '%Kayk%');
    console.log("Por nome 'Kayk':", p2);

    const { data: p3 } = await supabase.from('profiles').select('*').ilike('email', '%chrigor%');
    console.log("Por email 'chrigor':", p3);

    const { data: p4 } = await supabase.from('profiles').select('*').ilike('email', '%kayk%');
    console.log("Por email 'kayk':", p4);

    console.log("\n[SUPABASE LEADS_CONTATOS]");
    const { data: l1 } = await supabase.from('leads_contatos').select('*').ilike('nome', '%Chrigor%');
    console.log("Leads por nome 'Chrigor':", l1);
    const { data: l2 } = await supabase.from('leads_contatos').select('*').ilike('nome', '%Kayk%');
    console.log("Leads por nome 'Kayk':", l2);
  }

  // 3. Buscar no Brevo (API)
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    console.log("\n[BREVO CRM BUSCA]");
    try {
      // Buscar todos os contatos paginados ou filtrar
      let offset = 0;
      let limit = 50;
      let found = [];

      for (let page = 0; page < 10; page++) {
        const res = await fetch(`https://api.brevo.com/v3/contacts?limit=${limit}&offset=${offset}&sort=desc`, {
          headers: { 'api-key': brevoKey, 'accept': 'application/json' }
        });
        if (!res.ok) break;
        const data = await res.json();
        if (!data.contacts || data.contacts.length === 0) break;
        for (const c of data.contacts) {
          const s = JSON.stringify(c).toLowerCase();
          if (s.includes('chrigor') || s.includes('kayk')) {
            found.push(c);
          }
        }
        offset += limit;
      }
      console.log("Contatos encontrados no Brevo:", JSON.stringify(found, null, 2));
    } catch (e) {
      console.error("Erro Brevo:", e);
    }
  }
}

run();
