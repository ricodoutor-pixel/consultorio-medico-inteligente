// scripts/test-edge-auth.mjs
const url = "https://tkxxoghzhvhjzdoomgss.supabase.co/functions/v1/admin-send-invites";
const auth = "Bearer DISPATCH_AGORA";

async function run() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": auth,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ testOnly: true })
    });
    
    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Response:", body);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
