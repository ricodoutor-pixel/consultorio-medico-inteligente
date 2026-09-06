const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function search() {
  console.log('Searching for Diego Araldi...');
  
  const searchTerms = ['Diego', 'Araldi', '27671', '8834', '3778'];

  // Search doctors_public
  const { data: doctors, error: errDocs } = await supabase
    .from('doctors_public')
    .select('*');
    
  if (errDocs) console.error('Error fetching doctors_public:', errDocs.message);
  else {
    const matches = doctors.filter(d => 
      (d.full_name && d.full_name.toLowerCase().includes('diego')) ||
      (d.crm && d.crm.includes('27671'))
    );
    console.log('Matches in doctors_public:', matches);
  }

  // Search profiles (if readable)
  const { data: profiles, error: errProf } = await supabase
    .from('profiles')
    .select('id, full_name, phone');
    
  if (errProf) console.error('Error fetching profiles:', errProf.message);
  else if (profiles) {
    const matches = profiles.filter(p => 
      (p.full_name && p.full_name.toLowerCase().includes('diego')) ||
      (p.phone && p.phone.includes('8834'))
    );
    console.log('Matches in profiles:', matches);
  }
}

search();
