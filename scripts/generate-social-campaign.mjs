import fs from "fs";
import path from "path";

const API_KEY = "sk-28-ikQgSJAMhIEkYwH2LIR8X7PNeSHIjzs6ZCXqE";
const PROJECT_ID = "P3082818t1c0";

async function buildCampaign() {
  console.log("🚀 Construindo Campanha de 43 Vídeos com Link e WhatsApp...");

  let clips = [];
  try {
    const raw = fs.readFileSync("opus-clips-catalog.json", "utf-8");
    clips = JSON.parse(raw);
  } catch {
    console.log("Baixando lista de clipes da API...");
    const res = await fetch(`https://api.opus.pro/api/exportable-clips?q=findByProjectId&projectId=${PROJECT_ID}`, {
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    });
    const json = await res.json();
    clips = json.data || [];
  }

  console.log(`🎬 Total de clipes carregados: ${clips.length}`);

  const campaign = clips.map((clip, index) => {
    const title = clip.title || clip.headline || `Clipe #${index + 1} — Planta y Raíz`;
    const duration = clip.durationMs ? Math.round(clip.durationMs / 1000) : 60;
    const videoUrl = clip.uriForPreview || clip.downloadUrl || "";

    const copy = `🌿 ${title}

Você sabia que a medicina canabinoide está transformando vidas no Brasil com embasamento científico e respaldo legal?

🩺 Na Planta y Raíz, você tem acesso a:
✓ Consultas online com médicos prescritores especializados
✓ Prontuário CFM e prescrição digital ICP-Brasil
✓ Acompanhamento humanizado com a Enfermeira Brisa 24/7
✓ Linha completa de tratamentos regulamentados

🔗 Agende sua consulta ou saiba mais:
👉 https://plantayraiz.com.br

📲 Fale diretamente com nossa equipe no WhatsApp:
👉 (11) 99136-3154 (ou link na bio)

#plantayraiz #cannabismedicinal #telemedicina #saudeintegrativa #cbd #bemestar #shorts #tiktok`;

    const scheduledDate = new Date(Date.now() + (index + 1) * 2 * 60 * 60 * 1000).toISOString(); // a cada 2 horas

    return {
      id: clip.id,
      index: index + 1,
      title,
      durationSeconds: duration,
      videoUrl,
      copy,
      targetPlatforms: ["YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels"],
      scheduledAt: scheduledDate,
      status: "ready_for_dispatch",
      officialLink: "https://plantayraiz.com.br",
      officialWhatsapp: "+55 11 99136-3154",
    };
  });

  fs.writeFileSync("opus-social-campaign.json", JSON.stringify(campaign, null, 2), "utf-8");
  console.log(`\n✅ Campanha gerada com sucesso para os 43 vídeos!`);
  console.log(`📄 Arquivo salvo: opus-social-campaign.json`);
}

buildCampaign();
