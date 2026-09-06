const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function search() {
  console.log('Fetching all CRM contacts...');
  
  const { data: crm, error: errCrm } = await supabase
    .from('leads_contatos')
    .select('*');

  if (errCrm) console.error('Error fetching leads_contatos:', errCrm.message);
  else if (crm) {
    const d = crm.find(c => c.telefone && c.telefone.includes('8834'));
    console.log('Phone match:', d);
    const m = crm.find(c => c.nome && c.nome.toLowerCase().includes('araldi'));
    console.log('Name match:', m);
    console.log('Total contacts:', crm.length);
  }
}

search();
