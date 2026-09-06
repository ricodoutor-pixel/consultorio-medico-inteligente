const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkLeads() {
  const { data, error } = await supabase
    .from('leads_contatos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching leads:", error);
  } else {
    console.log("LEADS CONTATOS (Últimos 5):");
    console.log(JSON.stringify(data, null, 2));
  }
  process.exit(0);
}

checkLeads();
