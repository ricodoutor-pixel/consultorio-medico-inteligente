import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables if running in Node.js context (like Hostinger deploy)
if (typeof process !== 'undefined' && process.env) {
  dotenv.config();
}

const supabaseUrl = process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL;
const supabaseAnonKey = process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Ensure your .env variables are properly set.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
