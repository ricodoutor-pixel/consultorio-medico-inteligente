const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables'); // Or just fetch from a known table and guess
  // Actually we can't easily list tables from anon key.
  // But let's check 'crm_leads', 'pacientes_leads', 'leads_contatos', 'doctors', 'profiles'
  const tables = ['crm_leads', 'leads_crm', 'pacientes_leads', 'leads_contatos', 'doctors_public', 'profiles', 'pacientes', 'leads'];
  
  for (const t of tables) {
    console.log('Trying table:', t);
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t} exists, rows:`, data.length);
    }
  }
}
listTables();
