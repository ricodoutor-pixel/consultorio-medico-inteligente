const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data: profs, count: pCount } = await supabase.from('profiles').select('id, user_type', { count: 'exact' });
  const { data: docs, count: dCount } = await supabase.from('doctors').select('id, verified_by_admin', { count: 'exact' });
  const { data: kyc, count: kCount } = await supabase.from('doctor_kyc_documents').select('id', { count: 'exact' });
  const { data: leads, count: lCount } = await supabase.from('leads_contatos').select('id', { count: 'exact' });
  
  console.log(JSON.stringify({
    totalProfiles: pCount || (profs ? profs.length : 0),
    totalDoctors: dCount || (docs ? docs.length : 0),
    totalKycDocs: kCount || (kyc ? kyc.length : 0),
    totalLeads: lCount || (leads ? leads.length : 0)
  }));
}

run();
