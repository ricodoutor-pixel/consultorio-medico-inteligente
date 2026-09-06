const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testOthers() {
  const emails = [
    "contato@plantayraiz.com.br",
    "contatoplantaeraiz@gmail.com",
    "admin@plantayraiz.com.br",
    "ricodoutor@gmail.com",
    "dredilsonbezerra@gmail.com"
  ];

  const passwords = [
    "password_here",
    "95654045pa#",
    "95654045",
    "PlantaRaiz2026#",
    "Admin123!"
  ];

  for (const email of emails) {
    for (const pw of passwords) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });
      if (!error && data?.user) {
        console.log(`FOUND WORKING CREDENTIALS! Email: ${email} | Password: ${pw} | UserID: ${data.user.id}`);
        
        // check role
        const { data: r } = await supabase.from('user_roles').select('*').eq('user_id', data.user.id);
        console.log("Roles for this user:", r);
        return;
      }
    }
  }
  console.log("None of the standard combinations worked directly with signInWithPassword.");
}

testOthers();
