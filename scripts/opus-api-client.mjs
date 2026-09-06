const API_KEY = "sk-28-ikQgSJAMhIEkYwH2LIR8X7PNeSHIjzs6ZCXqE";
const PROJECT_ID = "P3082818t1c0";

async function testOpusApi() {
  console.log("🔍 Testando endpoints da API do Opus Clip...");

  const endpoints = [
    `https://api.opus.pro/api/exportable-clips?q=findByProjectId&projectId=${PROJECT_ID}`,
    `https://api.opus.pro/api/clip-projects/${PROJECT_ID}`,
    `https://api.opus.pro/api/clip-projects`,
    `https://api.opus.pro/api/exportable-clips`,
    `https://api.opus.pro/api/user`,
    `https://api.opus.pro/api/social-accounts`,
  ];

  for (const url of endpoints) {
    try {
      console.log(`\n📡 Chamando: ${url}`);
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log("Resposta JSON:", JSON.stringify(json, null, 2).slice(0, 500));
      } catch {
        console.log("Resposta texto:", text.slice(0, 300));
      }
    } catch (err) {
      console.error("Erro:", err.message);
    }
  }
}

testOpusApi();
