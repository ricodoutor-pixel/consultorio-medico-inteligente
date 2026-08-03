import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  console.log("Searching for Dra. Suelen in doctors table...");
  // Try to find the doctor
  const { data: profiles, error: fetchErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', '%Suelen%');
    
  if (fetchErr) {
    console.error("Error fetching profile:", fetchErr);
    process.exit(1);
  }

  let doctorId = null;
  let doctorName = null;

  if (profiles && profiles.length > 0) {
    doctorId = profiles[0].id;
    doctorName = profiles[0].full_name;
    console.log(`Found Suelen in profiles: ${doctorName} (ID: ${doctorId})`);
  } else {
    console.log("Dra. Suelen not found in 'doctors' table by name. Let's try finding the mock doctor by id.");
    const { data: docById, error: fetchIdErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', 'mock-suelen');
      
    if (docById && docById.length > 0) {
       console.log("Found mock doctor by id.");
       doctorId = docById[0].id;
       doctorName = docById[0].full_name;
    } else {
       console.log("Could not find Dra. Suelen in the database.");
       process.exit(1);
    }
  }

  if (doctorId) {
    // Update is_online to false in doctors
    const { data: updateData, error: updateErr } = await supabase
      .from('doctors')
      .update({ is_online: false, consultation_price: 150 })
      .eq('id', doctorId)
      .select();
      
    if (updateErr) {
       console.error("Error updating status:", updateErr);
    } else {
       console.log("Successfully updated doctors table. Updated record:", updateData);
    }
  }

  console.log("Done.");
}

run();
