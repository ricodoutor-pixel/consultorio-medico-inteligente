const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, key);

async function checkProfile() {
  const { data: p1 } = await supabase.from('profiles').select('*').ilike('full_name', '%Chrigor%');
  const { data: p2 } = await supabase.from('profiles').select('*').ilike('phone', '%982962929%');
  console.log("Profiles encontrados no banco:", p1, p2);
}

checkProfile();
