// scripts/list-supabase-projects.mjs
const token = process.env.SUPABASE_TOKEN || "";

async function run() {
  try {
    const res = await fetch("https://api.supabase.com/v1/projects", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error! Status: ${res.status}, body: ${text}`);
      return;
    }
    
    const projects = await res.json();
    console.log("Projects list:");
    console.log(JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error("Failed to list projects:", error);
  }
}

run();
