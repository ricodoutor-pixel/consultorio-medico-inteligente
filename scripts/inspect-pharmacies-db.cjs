const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, key);

async function inspect() {
  console.log("=== VERIFICANDO TABELAS NO SUPABASE ===");

  // 1. Verificar profiles com user_type ou role de pharmacy/farmacia/lojista
  const { data: p, error: pe } = await supabase.from('profiles').select('*').or('user_type.eq.pharmacy,signup_role.eq.farmacia,role.eq.lojista,role.eq.dispensario,user_type.eq.lojista').limit(10);
  console.log("Profiles farmacia/lojista:", p, pe);

  // 2. Verificar se existe tabela pharmacies ou lojistas ou stores
  const tables = ['pharmacies', 'lojistas', 'stores', 'vendor_profiles', 'products', 'doctor_kyc_documents', 'pharmacy_kyc_documents'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(3);
    console.log(`Tabela '${t}':`, error ? `Erro: ${error.message}` : `OK (${data?.length} linhas)`);
  }
}

inspect();
