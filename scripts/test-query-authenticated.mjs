// scripts/test-query-authenticated.mjs
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  const email = `test-auth-${Math.random().toString(36).substring(7)}@example.com`;
  const password = "Password123!";
  
  console.log("Signing up temporary user:", email);
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      console.error("Sign up failed:", signUpError.message);
      return;
    }
    
    console.log("Sign up success. Logging in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error("Sign in failed:", signInError.message);
      return;
    }
    
    console.log("Sign in success. Session token acquired.");
    
    // Now try to select from doctors
    const { data: doctors, error: queryError } = await supabase
      .from('doctors')
      .select('*')
      .limit(5);
      
    if (queryError) {
      console.error("Query failed:", queryError.message, queryError.code);
    } else {
      console.log("Query success! Doctors returned:", doctors.length);
      console.log(doctors);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
