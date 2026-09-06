const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function searchAndDelete() {
  console.log('Searching leads_crm...');
  
  const { data: leads, error } = await supabase
    .from('leads_crm')
    .select('*');
    
  if (error) {
    console.error('Error fetching leads_crm:', error.message);
    return;
  }
  
  const matches = leads.filter(l => 
    (l.nome && l.nome.toLowerCase().includes('araldi')) ||
    (l.telefone && l.telefone.includes('8834')) ||
    (l.telefone && l.telefone.includes('4788343778')) ||
    (l.telefone && l.telefone.includes('49999119928')) ||
    (l.email && l.email.toLowerCase().includes('arald'))
  );
  
  console.log('Found matches:', matches);
  
  for (const match of matches) {
    console.log(`Deleting ID ${match.id} (${match.nome} / ${match.telefone})...`);
    const { error: delErr } = await supabase
      .from('leads_crm')
      .delete()
      .eq('id', match.id);
      
    if (delErr) {
      console.error('Delete error:', delErr.message);
    } else {
      console.log('Successfully deleted', match.id);
    }
  }
}

searchAndDelete();
