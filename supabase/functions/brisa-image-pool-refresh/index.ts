// Gera 20 imagens novas/semana via Lovable AI (Gemini 3 Flash Image),
// salva no bucket `social-posts` e popula `brisa_image_pool`.
// Roda via cron semanal (segunda 04:00 UTC).
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THEMES = [
  { theme: "telemedicina", prompt: "Médica jovem brasileira em consulta de telemedicina via laptop, ambiente clínico moderno, luz natural, cores verde menta e branco, fotorrealista, vertical 1080x1080" },
  { theme: "cannabis_medicinal", prompt: "Frasco de óleo CBD farmacêutico sobre fundo verde sage com folhas de cannabis desfocadas, design clean, fotografia editorial premium, 1080x1080" },
  { theme: "paciente_idoso", prompt: "Idoso brasileiro sorrindo segurando smartphone com app de saúde, ambiente residencial aconchegante, luz dourada, fotorrealista, 1080x1080" },
  { theme: "anvisa_compliance", prompt: "Mesa de escritório com documentos ANVISA, carimbo oficial, computador exibindo certificado digital, cores institucionais azul/verde, fotorrealista, 1080x1080" },
  { theme: "familia_bem_estar", prompt: "Família brasileira multigeracional sorrindo em casa, ambiente natural com plantas, luz suave de tarde, fotografia lifestyle premium, 1080x1080" },
  { theme: "enfermeira_acolhimento", prompt: "Enfermeira brasileira sorridente em uniforme verde claro, atendendo paciente por videochamada, ambiente clínico humanizado, fotorrealista, 1080x1080" },
  { theme: "ciencia_endocanabinoide", prompt: "Diagrama 3D do sistema endocanabinoide humano com receptores CB1/CB2 brilhando, fundo escuro azul-petróleo, infográfico médico premium, 1080x1080" },
  { theme: "marketplace_produtos", prompt: "Caixa de medicamento canabinoide brasileiro com selo de qualidade, embalagem premium verde e dourada, fundo neutro estúdio, fotografia produto, 1080x1080" },
  { theme: "consulta_video", prompt: "Tela de smartphone mostrando consulta médica por vídeo, mão segurando dispositivo, ambiente moderno minimalista, fotorrealista, 1080x1080" },
  { theme: "natureza_planta", prompt: "Folha de cannabis fresca em close-up macro com gotas de orvalho, fundo verde profundo desfocado, luz natural cinematográfica, 1080x1080" },
];

async function generateImage(prompt: string, lovableKey: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!r.ok) {
      console.error("[image-pool] AI gen failed", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    const img = j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!img?.startsWith("data:image")) return null;
    const [meta, b64] = img.split(",");
    const mime = meta.match(/data:([^;]+)/)?.[1] || "image/png";
    return { b64, mime };
  } catch (e) {
    console.error("[image-pool] gen error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const lovableKey = Deno.env.get("LOVABLE_API_KEY") || "";
  if (!lovableKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Math.max(Number(body.count ?? 20), 1), 30);

  const results: Array<{ theme: string; image_url?: string; error?: string }> = [];
  // 2 variações por tema, embaralhadas, primeiras `count`
  const jobs = THEMES.flatMap((t) => [
    { ...t, prompt: t.prompt + " — variação A, ângulo frontal" },
    { ...t, prompt: t.prompt + " — variação B, ângulo lateral, paleta complementar" },
  ]).sort(() => Math.random() - 0.5).slice(0, count);

  for (const job of jobs) {
    const img = await generateImage(job.prompt, lovableKey);
    if (!img) { results.push({ theme: job.theme, error: "gen_failed" }); continue; }
    const bytes = Uint8Array.from(atob(img.b64), (c) => c.charCodeAt(0));
    const ext = img.mime.includes("jpeg") ? "jpg" : "png";
    const filename = `pool/${Date.now()}_${job.theme}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("social-posts").upload(filename, bytes, {
      contentType: img.mime, upsert: false,
    });
    if (upErr) { results.push({ theme: job.theme, error: upErr.message }); continue; }
    const { data: pub } = supabase.storage.from("social-posts").getPublicUrl(filename);
    await supabase.from("brisa_image_pool").insert({
      image_url: pub.publicUrl, prompt: job.prompt, theme: job.theme,
    });
    results.push({ theme: job.theme, image_url: pub.publicUrl });
  }

  await supabase.from("ai_events").insert({
    ai_name: "brisa_image_pool", event_type: "weekly_refresh", status: "completed",
    output_data: { requested: count, generated: results.filter((r) => r.image_url).length },
  });

  return new Response(JSON.stringify({ ok: true, generated: results.filter((r) => r.image_url).length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
