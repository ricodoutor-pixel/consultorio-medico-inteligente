import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
  console.log('--- DOCTORS ---');
  const { data: doctors, error: drError } = await supabase.from('doctors').select('*');
  console.log('Doctors error:', drError?.message);
  console.log('Doctors count:', doctors?.length);
  if (doctors?.length) console.log(doctors);

  console.log('\n--- USERS (PROFILES) ---');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(10);
  console.log('Profiles:', profiles?.map(p => ({ id: p.id, email: p.email, full_name: p.full_name, role: p.role })));

  console.log('\n--- B2B ORDERS ---');
  const { data: b2b, error: b2bError } = await supabase.from('b2b_orders').select('*').limit(1);
  console.log('B2B error:', b2bError?.message || 'Table exists');

  console.log('\n--- PRODUCTS ---');
  const { data: prod, error: prodError } = await supabase.from('products').select('*').limit(1);
  console.log('Products error:', prodError?.message || 'Table exists');
}

checkDB();
