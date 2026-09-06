const API_KEY = "sk-28-ikQgSJAMhIEkYwH2LIR8X7PNeSHIjzs6ZCXqE";
const PROJECT_ID = "P3082818t1c0";

async function fetchAllData() {
  console.log("📥 Buscando todos os clipes do projeto", PROJECT_ID);

  const res = await fetch(`https://api.opus.pro/api/exportable-clips?q=findByProjectId&projectId=${PROJECT_ID}`, {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Erro ao buscar clipes:", res.status, await res.text());
    return;
  }

  const json = await res.json();
  const clips = json.data || [];
  console.log(`\n🎉 Total de clipes encontrados: ${clips.length}`);

  clips.forEach((clip, index) => {
    console.log(`\n----------------------------------------`);
    console.log(`🎬 Clipe #${index + 1}: ID ${clip.id}`);
    console.log(`Título / Score: Score ${clip.viralityScore || 'N/A'}`);
    console.log(`Duração: ${clip.durationMs ? (clip.durationMs / 1000).toFixed(1) + 's' : 'N/A'}`);
    console.log(`Headline / Título: ${clip.title || clip.headline || 'Sem título'}`);
    console.log(`URL Vídeo CDN: ${clip.uriForPreview || clip.downloadUrl}`);
    console.log(`Hook / Rationale: ${clip.hook || clip.rationale || ''}`);
  });

  // Salvar lista em JSON para orquestração
  const fs = await import("fs");
  fs.writeFileSync("opus-clips-catalog.json", JSON.stringify(clips, null, 2), "utf-8");
  console.log("\n💾 Catálogo salvo com sucesso em opus-clips-catalog.json");
}

fetchAllData();
