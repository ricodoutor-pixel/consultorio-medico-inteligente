const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, key);

async function inspectSchema() {
  const { data: p } = await supabase.from('profiles').select('*').limit(2);
  console.log("Colunas de profiles:", p ? Object.keys(p[0] || {}) : "Vazio");
  console.log("Amostra profiles:", p);

  const { data: prods } = await supabase.from('products').select('*').limit(2);
  console.log("Colunas de products:", prods ? Object.keys(prods[0] || {}) : "Vazio");
  console.log("Amostra products:", prods);

  const { data: kycDocs } = await supabase.from('doctor_kyc_documents').select('*').limit(2);
  console.log("Colunas de doctor_kyc_documents:", kycDocs ? Object.keys(kycDocs[0] || {}) : "Vazio");
}

inspectSchema();
