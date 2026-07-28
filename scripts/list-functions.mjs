// scripts/list-functions.mjs
const token = process.env.SUPABASE_TOKEN || "";

async function run() {
  try {
    const res = await fetch("https://api.supabase.com/v1/projects/shmbwdjuddvquszwkvuq/functions", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error! Status: ${res.status}, body: ${text}`);
      return;
    }
    
    const fns = await res.json();
    console.log("Functions list:");
    console.log(fns);
  } catch (error) {
    console.error("Failed to list functions:", error);
  }
}

run();
