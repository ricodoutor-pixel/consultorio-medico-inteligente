const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { createClient } = require('@supabase/supabase-js');

async function main() {
  console.log("=== INICIANDO BUSCA POR: CHRIGOR KAYK SILVA DE OLIVEIRA ===");
  const term = "chrigor";
  const term2 = "kayk";

  // 1. Buscar em arquivos locais (.json, .csv, .txt, .js, .mjs, .cjs)
  console.log("\n[1] Buscando em arquivos locais do projeto...");
  function searchDir(dir) {
    let matches = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        matches = matches.concat(searchDir(fullPath));
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.toLowerCase().includes(term) || content.toLowerCase().includes(term2)) {
            matches.push(fullPath);
          }
        } catch (e) {}
      }
    }
    return matches;
  }

  const localMatches = searchDir('.');
  console.log("Arquivos locais encontrados com correspondência:", localMatches);
  for (const file of localMatches) {
    console.log(`\n--- Conteúdo em ${file} ---`);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(term) || line.toLowerCase().includes(term2)) {
        console.log(`Linha ${idx + 1}: ${line.slice(0, 300)}`);
      }
    });
  }

  // 2. Buscar no Supabase
  console.log("\n[2] Buscando no banco de dados Supabase...");
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    const supabase = createClient(url, key);

    // a. Profiles
    const { data: profs, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term2}%,email.ilike.%${term2}%`);
    console.log("Supabase profiles encontrados:", profs, profErr || "");

    // b. Doctors
    const { data: docs, error: docErr } = await supabase
      .from('doctors')
      .select('*');
    const matchedDocs = docs?.filter(d => JSON.stringify(d).toLowerCase().includes(term) || JSON.stringify(d).toLowerCase().includes(term2));
    console.log("Supabase doctors encontrados:", matchedDocs, docErr || "");

    // c. Leads / contatos
    const { data: leads, error: leadErr } = await supabase
      .from('leads_contatos')
      .select('*')
      .or(`nome.ilike.%${term}%,email.ilike.%${term}%,nome.ilike.%${term2}%,email.ilike.%${term2}%`);
    console.log("Supabase leads_contatos encontrados:", leads, leadErr || "");
  }

  // 3. Buscar no Brevo (API)
  console.log("\n[3] Buscando no CRM Brevo...");
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      // Buscar contatos com filtro ou listar
      const res = await fetch(`https://api.brevo.com/v3/contacts?limit=50&sort=desc`, {
        headers: {
          'api-key': brevoKey,
          'accept': 'application/json'
        }
      });
      const data = await res.json();
      console.log(`Total de contatos recentes retornados no Brevo: ${data.contacts?.length || 0}`);
      
      // Buscar por query ou iterar
      let foundInBrevo = [];
      if (data.contacts) {
        for (const c of data.contacts) {
          const str = JSON.stringify(c).toLowerCase();
          if (str.includes(term) || str.includes(term2) || str.includes("oliveira")) {
            if (str.includes(term) || str.includes(term2)) {
              foundInBrevo.push(c);
            }
          }
        }
      }

      // Tentar busca específica de contato no Brevo
      const searchRes = await fetch(`https://api.brevo.com/v3/contacts?filter=${encodeURIComponent(term)}`, {
        headers: { 'api-key': brevoKey, 'accept': 'application/json' }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        console.log("Busca direta no Brevo:", searchData);
      }

      console.log("Contatos encontrados no Brevo:", foundInBrevo);
    } catch (e) {
      console.error("Erro na busca do Brevo:", e);
    }
  }

  console.log("\n=== BUSCA CONCLUÍDA ===");
}

main();
