import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SB_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

async function checkContacts() {
  const supabase = createClient(SB_URL, SB_KEY);
  console.log("🔍 Verificando contatos cadastrados no banco de dados...");

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone, role');
  console.log(`Profiles com telefone:`, profiles?.filter(p => p.phone) || []);

  const { data: doctors } = await supabase.from('doctors').select('id, full_name, crm, is_approved');
  console.log(`Médicos cadastrados em 'doctors':`, doctors || []);
}

checkContacts();
