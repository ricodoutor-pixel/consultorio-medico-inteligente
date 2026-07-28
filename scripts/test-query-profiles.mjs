// scripts/test-query-profiles.mjs
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=5`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`HTTP error! status: ${res.status}, body: ${text}`);
      return;
    }
    
    const data = await res.json();
    console.log("Success! Profiles data size:", data.length);
    console.log(data);
  } catch (error) {
    console.error("Failed to query:", error);
  }
}

run();
