// scripts/test-query-tkxx.mjs
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.SUPABASE_URL; // tkxxoghzhvhjzdoomgss
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY; // tkxx key

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/doctors?limit=5`, {
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
    console.log("Success! Data size:", data.length);
    console.log(data);
  } catch (error) {
    console.error("Failed to query:", error);
  }
}

run();
