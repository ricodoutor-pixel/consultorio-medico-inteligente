const API_KEY = "sk-28-ikQgSJAMhIEkYwH2LIR8X7PNeSHIjzs6ZCXqE";
const PROJECT_ID = "P3082818t1c0";

async function inspectSocialApi() {
  const queryParams = [
    "?q=findAll",
    "?q=list",
    "?q=findByUserId",
    "?q=findByOrgId",
    `?q=findByProjectId&projectId=${PROJECT_ID}`,
  ];

  for (const q of queryParams) {
    const url = `https://api.opus.pro/api/social-accounts${q}`;
    console.log(`Checking: ${url}`);
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text.slice(0, 300)}`);
  }

  // Also check schedule endpoints
  const scheduleEndpoints = [
    `https://api.opus.pro/api/social-posts`,
    `https://api.opus.pro/api/social-schedule`,
    `https://api.opus.pro/api/schedules`,
    `https://api.opus.pro/api/publish`,
  ];

  for (const url of scheduleEndpoints) {
    console.log(`\nChecking: ${url}`);
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Body: ${text.slice(0, 300)}`);
  }
}

inspectSocialApi();
