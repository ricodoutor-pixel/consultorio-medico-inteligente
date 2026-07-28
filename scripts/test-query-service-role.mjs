// scripts/test-query-service-role.mjs
const supabaseUrl = "https://tkxxoghzhvhjzdoomgss.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRreHhvZ2h6aHZoanpkb29tZ3NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA3Nzg0NiwiZXhwIjoyMDg3NjUzODQ2fQ.CakbSf2AraRH03BqvYhdkl0cKhV89hWN8phk3uyGalg";

async function queryTable(tableName) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*&limit=10`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    if (!res.ok) {
      const text = await res.text();
      console.log(`Failed to query ${tableName}: ${res.status} - ${text}`);
      return;
    }
    const data = await res.json();
    console.log(`Table ${tableName} size: ${data.length}`);
    if (data.length > 0) {
      console.log(data);
    }
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
  }
}

async function run() {
  await queryTable("doctors");
  await queryTable("profiles");
}

run();
