import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, full_name').limit(20);
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}

run();
