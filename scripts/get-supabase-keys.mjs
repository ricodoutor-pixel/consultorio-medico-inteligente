// scripts/get-supabase-keys.mjs
import fs from 'fs';
import path from 'path';

const token = process.env.SUPABASE_TOKEN || "";

async function fetchKeys(projectRef) {
  console.log(`Fetching keys for project: ${projectRef}...`);
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error! Status: ${res.status}, body: ${text}`);
      return;
    }
    
    const keys = await res.json();
    console.log(`Keys for ${projectRef}:`);
    console.log(JSON.stringify(keys, null, 2));
  } catch (error) {
    console.error(`Failed for ${projectRef}:`, error);
  }
}

async function run() {
  await fetchKeys("shmbwdjuddvquszwkvuq");
  await fetchKeys("tkxxoghzhvhjzdoomgss");
}

run();
