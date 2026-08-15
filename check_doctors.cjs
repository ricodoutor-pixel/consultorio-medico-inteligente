const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDoctors() {
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('*, profiles(full_name, avatar_url)')
  
  if (error) {
    console.error('Error fetching doctors:', error);
    return;
  }
  
  console.log('Doctors found:', doctors.length);
  doctors.forEach(d => {
    console.log(`Doctor: ${d.profiles?.full_name || d.full_name} | ID: ${d.id} | user_id: ${d.user_id} | Avatar: ${d.profiles?.avatar_url || d.photo_url || d.avatar_url || 'N/A'}`);
  });
}

checkDoctors();
