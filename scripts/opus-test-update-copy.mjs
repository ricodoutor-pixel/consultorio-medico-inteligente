const API_KEY = "sk-28-ikQgSJAMhIEkYwH2LIR8X7PNeSHIjzs6ZCXqE";
const PROJECT_ID = "P3082818t1c0";

async function testUpdateEndpoints() {
  const catalog = JSON.parse(await (await import("fs")).promises.readFile("opus-clips-catalog.json", "utf-8"));
  console.log(`Testando atualização de metadados para clipe: ${catalog[0].id}`);

  const endpoints = [
    { method: "POST", url: `https://api.opus.pro/api/clip-projects/${PROJECT_ID}/regenerate-copy` },
    { method: "POST", url: `https://api.opus.pro/api/clip-projects/${PROJECT_ID}/social-copy` },
    { method: "PUT", url: `https://api.opus.pro/api/exportable-clips/${catalog[0].id}` },
    { method: "PATCH", url: `https://api.opus.pro/api/exportable-clips/${catalog[0].id}` },
  ];

  for (const ep of endpoints) {
    try {
      console.log(`\n📡 Chamando ${ep.method} ${ep.url}...`);
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instruction: "Adicione o link plantayraiz.com.br e WhatsApp (11) 99136-3154",
          prompt: "Adicione o link plantayraiz.com.br e WhatsApp (11) 99136-3154",
        }),
      });
      console.log(`Status: ${res.status}`);
      const txt = await res.text();
      console.log(`Resposta: ${txt.slice(0, 200)}`);
    } catch (e) {
      console.error(e.message);
    }
  }
}

testUpdateEndpoints();
