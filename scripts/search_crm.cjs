const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function search() {
  console.log('Searching for Diego Araldi in CRM...');
  
  const { data: leads, error } = await supabase
    .from('pacientes_leads')
    .select('*');
    
  if (error) console.error('Error fetching pacientes_leads:', error.message);
  else {
    const matches = leads.filter(l => 
      (l.nome && l.nome.toLowerCase().includes('diego')) ||
      (l.telefone && l.telefone.includes('8834')) ||
      (l.email && l.email.toLowerCase().includes('diego')) ||
      (l.metadata && JSON.stringify(l.metadata).includes('27671'))
    );
    console.log('Matches in pacientes_leads:', matches);
  }

  const { data: crm, error: errCrm } = await supabase
    .from('leads_contatos')
    .select('*');

  if (errCrm) console.error('Error fetching leads_contatos:', errCrm.message);
  else if (crm) {
    const matches = crm.filter(c => 
      (c.nome && c.nome.toLowerCase().includes('diego')) ||
      (c.telefone && c.telefone.includes('8834'))
    );
    console.log('Matches in leads_contatos:', matches);
  }
}

search();
