const dotenv = require('dotenv');
dotenv.config();

async function auditBrevo() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log("No Brevo API key found");
    return;
  }

  try {
    console.log("1. Checking Brevo Account info...");
    const accRes = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey }
    });
    console.log("Account status:", accRes.status, await accRes.json());

    console.log("\n2. Checking Transactional Email Statistics (last 30 days)...");
    const statsRes = await fetch("https://api.brevo.com/v3/smtp/statistics/reports?days=30", {
      headers: { "api-key": apiKey }
    });
    console.log("Stats status:", statsRes.status, await statsRes.json());

    console.log("\n3. Checking Transactional Email Logs (last 10 events)...");
    const logsRes = await fetch("https://api.brevo.com/v3/smtp/statistics/events?limit=10&sort=desc", {
      headers: { "api-key": apiKey }
    });
    console.log("Logs status:", logsRes.status, await logsRes.json());

  } catch (e) {
    console.error("Brevo audit error:", e.message);
  }
}

auditBrevo();
