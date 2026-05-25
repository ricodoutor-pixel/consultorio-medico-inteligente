// Gera N (default 12) imagens IA com tema "Vida social 45-65 anos + CBD/Cannabis Medicinal",
// salva no bucket social-posts, agenda em manus_social_queue (1 por hora a partir de agora)
// e dispara brisa-fb-auto-post imediatamente para publicar o primeiro.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCENES = [
  { scene: "Casal de 55 anos sorrindo numa caminhada matinal em parque arborizado de São Paulo, roupa esportiva leve, luz dourada, fotorrealista, vertical 1080x1080", topic: "dor_articular", hook: "Caminhar de novo sem dor nos joelhos." },
  { scene: "Mulher 50 anos praticando yoga ao ar livre no quintal de casa com plantas tropicais, sorriso sereno, manhã ensolarada, fotorrealista 1080x1080", topic: "ansiedade_sono", hook: "CBD ajuda a relaxar e dormir profundamente." },
  { scene: "Homem 60 anos brasileiro tocando violão na varanda com netos ouvindo, ambiente familiar acolhedor, luz quente de fim de tarde, fotorrealista 1080x1080", topic: "qualidade_vida", hook: "Voltar a fazer o que ama, sem dor crônica." },
  { scene: "Grupo de amigos 50-60 anos jantando ao ar livre com vinho e risadas, mesa rústica iluminada por luzes pendentes, fotorrealista 1080x1080", topic: "vida_social", hook: "Vida social ativa começa com bem-estar." },
  { scene: "Mulher 58 anos dançando salsa num espaço cultural brasileiro, vestido colorido, luz cinematográfica, alegria, fotorrealista 1080x1080", topic: "mobilidade", hook: "Mobilidade e disposição de volta com CBD." },
  { scene: "Homem 62 anos pescando ao amanhecer num lago calmo do interior do Brasil, expressão serena, paleta verde-azulada suave, fotorrealista 1080x1080", topic: "ansiedade", hook: "Calma mental que você pensou que tinha perdido." },
  { scene: "Casal 55-65 anos andando de bicicleta lado a lado em ciclovia urbana arborizada, sorrindo, fotografia lifestyle premium, fotorrealista 1080x1080", topic: "dor_muscular", hook: "Menos dor muscular, mais aventura." },
  { scene: "Avó 60 anos brincando no chão com neto pequeno na sala de casa, almofadas e plantas, luz natural suave, fotorrealista 1080x1080", topic: "qualidade_vida", hook: "Brincar com os netos sem pagar o preço depois." },
  { scene: "Homem 55 anos meditando à beira-mar no nordeste brasileiro, postura serena, paleta dourada e azul, fotorrealista 1080x1080", topic: "bem_estar", hook: "Equilíbrio do corpo e da mente, naturalmente." },
  { scene: "Grupo de mulheres 50-60 anos rindo num clube de leitura num café aconchegante de bairro, xícaras de café e livros, fotorrealista 1080x1080", topic: "humor_social", hook: "Mais energia para os encontros que você ama." },
  { scene: "Casal de 60 anos cozinhando juntos uma receita saudável numa cozinha moderna brasileira, sorrisos, ervas frescas, fotorrealista 1080x1080", topic: "vitalidade", hook: "Vitalidade na rotina, todos os dias." },
  { scene: "Homem 58 anos jogando futebol descontraído com amigos num campo de várzea no fim de tarde, alegria, suor leve, fotorrealista 1080x1080", topic: "dor_cronica", hook: "Voltar a jogar a pelada sem medo da dor." },
];

const HASHTAGS = [
  "CannabisMedicinal", "CBD", "DorCronica", "VidaPlena50Mais",
  "PlantaYRaiz", "Telemedicina", "QualidadeDeVida", "SaudeIntegrativa",
];

function buildCaption(hook: string): string {
  const cta = "👉 Acesse https://plantayraiz.com.br ou fale com a Enf. Brisa: (11) 99136-3154";
  const body = `${hook}\n\nO CBD (canabidiol) é estudado para alívio de dores musculares e articulares, melhora do sono e redução da ansiedade — comum a partir dos 45 anos. Receita médica regulamentada pela ANVISA (RDC 660/2022), 100% legal e digital.\n\n${cta}`;
  return body + "\n\n" + HASHTAGS.slice(0, 6).map((h) => `#${h}`).join(" ");
}

async function genImage(prompt: string, geminiKey: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      },
    );
    if (!r.ok) { console.error("[seniors] Google Gemini fail", r.status, await r.text()); return null; }
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts || [];
    const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData;
    if (!inline?.data) return null;
    return { b64: inline.data, mime: inline.mimeType || "image/png" };
  } catch (e) { console.error("[seniors] gen err", e); return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const unauth = requireServiceAuth(req, cors);
  if (unauth) return unauth;

  const geminiKey =
    Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
    Deno.env.get("GEMINI_API_KEY") ||
    "";
  if (!geminiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY missing" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({}));
  const count = Math.min(Math.max(Number(body.count ?? 12), 1), 12);
  const platform = (body.platform as string) || "facebook";
  const intervalMin = Number(body.interval_minutes ?? 60);
  const postFirstNow = body.post_first_now !== false;

  const now = Date.now();
  const results: Array<{ idx: number; ok: boolean; image_url?: string; queue_id?: string; error?: string }> = [];

  for (let i = 0; i < count; i++) {
    const scene = SCENES[i % SCENES.length];
    const img = await genImage(scene.scene, lovableKey);
    if (!img) { results.push({ idx: i, ok: false, error: "image_gen_failed" }); continue; }
    const bytes = Uint8Array.from(atob(img.b64), (c) => c.charCodeAt(0));
    const ext = img.mime.includes("jpeg") ? "jpg" : "png";
    const filename = `seniors-campaign/${Date.now()}_${i}_${scene.topic}.${ext}`;
    const { error: upErr } = await supabase.storage.from("social-posts").upload(filename, bytes, { contentType: img.mime, upsert: false });
    if (upErr) { results.push({ idx: i, ok: false, error: `upload: ${upErr.message}` }); continue; }
    const { data: pub } = supabase.storage.from("social-posts").getPublicUrl(filename);

    const caption = buildCaption(scene.hook);
    // i=0 → agora; i=1 → +60min; etc
    const scheduled_for = new Date(now + i * intervalMin * 60_000).toISOString();
    const { data: ins, error: insErr } = await supabase.from("manus_social_queue").insert({
      platform,
      topic: `seniors_${scene.topic}`,
      script: caption,
      caption,
      hashtags: HASHTAGS,
      image_url: pub.publicUrl,
      status: i === 0 && postFirstNow ? "approved" : "scheduled",
      scheduled_for,
    }).select("id").single();
    if (insErr) { results.push({ idx: i, ok: false, image_url: pub.publicUrl, error: `insert: ${insErr.message}` }); continue; }
    results.push({ idx: i, ok: true, image_url: pub.publicUrl, queue_id: ins!.id });
  }

  // Dispara publicação imediata do primeiro
  let immediatePost: unknown = null;
  if (postFirstNow && platform === "facebook") {
    try {
      const cronSecret = Deno.env.get("BRISA_CEO_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/brisa-fb-auto-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret, Authorization: `Bearer ${cronSecret}` },
        body: "{}",
      });
      immediatePost = { status: r.status, body: await r.json().catch(() => ({})) };
    } catch (e) { immediatePost = { error: String(e) }; }
  }

  await supabase.from("ai_events").insert({
    ai_name: "brisa_seniors_campaign",
    event_type: "campaign_created",
    status: "completed",
    output_data: {
      generated: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      platform,
      interval_minutes: intervalMin,
      immediate_post: immediatePost,
    },
  });

  return new Response(JSON.stringify({
    ok: true,
    generated: results.filter((r) => r.ok).length,
    platform,
    interval_minutes: intervalMin,
    first_post_response: immediatePost,
    items: results,
  }), { headers: { ...cors, "Content-Type": "application/json" } });
});
