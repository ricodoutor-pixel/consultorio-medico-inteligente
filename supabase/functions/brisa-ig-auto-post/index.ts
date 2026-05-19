// Auto-publica 1 post no Instagram Business a cada 30 min (via pg_cron).
// Fluxo: pega próximo item APROVADO em manus_social_queue (platform=instagram).
// Se a fila estiver vazia, gera dinamicamente via Gemini (Lovable AI) e publica.
// IG exige image_url (Graph API IG Container -> media_publish).
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";

const DEFAULT_IMAGES = [
  "https://plantayraiz.com.br/og-image.jpg",
  "https://plantayraiz.com.br/assets/brisa-mascote.jpg",
];

const FALLBACK_TOPICS = [
  "Cannabis Medicinal para dor crônica - Dr. Edilson Bezerra CRM 10963",
  "Tratamento de ansiedade com canabinoides - RDC 660/2022",
  "Sistema Endocanabinoide e insônia - ciência aplicada",
  "Importação ANVISA RDC 660 com frete grátis Planta y Raiz",
  "Orientação Técnica R$30 - acompanhamento com Enf. Brisa 24h",
  "Queda capilar e CBD - pesquisas recentes",
  "Telemedicina Cannabis - como funciona pela Planta y Raiz",
  "Selo gov.br e prescrição digital ICP-Brasil",
];

async function generateCaption(): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const topic = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
  const base = `Link na bio 🌿 plantayraiz.com.br | Enf. Brisa: (11) 99136-3154`;

  if (!LOVABLE_API_KEY) {
    return `🌱 Planta y Raiz — Mega Clínica Digital de Cannabis Medicinal com Dr. Edilson Bezerra (CRM 10963).\n\n${topic}\n\nOrientação Técnica R$30 (PIX). ${base}\n\n#CannabisMedicinal #PlantaYRaiz #SaúdeDigital #Telemedicina`;
  }
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é a Enf. Brisa da Planta y Raiz. Escreva 1 caption para Instagram (máx 1500 caracteres), tom acolhedor e científico, com emojis sutis, mencionando o link na bio plantayraiz.com.br e WhatsApp (11) 99136-3154. Use 8-12 hashtags relevantes ao tema. Mencione Dr. Edilson Bezerra CRM 10963 quando fizer sentido. Disclaimer ANVISA RDC 660/2022 implícito." },
          { role: "user", content: `Tópico: ${topic}` },
        ],
      }),
    });
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    if (text && text.length > 30) return text;
  } catch (e) {
    console.error("[ig-auto-post] AI gen error:", e);
  }
  return `🌿 ${topic}\n\nOrientação Técnica R$30 via PIX. ${base}\n\n#CannabisMedicinal #PlantaYRaiz #Telemedicina #SaudeDigital`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  // Canonical IDs for @plantayraiz (Planta y Raiz Ltda). Env vars used only if they match expected format.
  const CANONICAL_IG_ID = "17841440895941034";
  const CANONICAL_PAGE_ID = "1104301376097224";
  const envIg = (Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID") || "").trim();
  const envPage = (Deno.env.get("FACEBOOK_PAGE_ID") || "").trim();
  const igUserId = /^\d{15,17}$/.test(envIg) && envIg !== "1283674517188119" ? envIg : CANONICAL_IG_ID;
  const pageId = /^\d{10,20}$/.test(envPage) ? envPage : CANONICAL_PAGE_ID;

  let token: string;
  try {
    const { getFacebookPageToken } = await import("../_shared/fb-page-token.ts");
    token = await getFacebookPageToken(pageId);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Token resolution failed", detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 1) Próximo IG na fila
  const { data: queued } = await supabase
    .from("manus_social_queue")
    .select("id, caption, script, image_url, hashtags")
    .eq("platform", "instagram")
    .in("status", ["approved", "scheduled", "draft"])
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let postId: string | null = queued?.id ?? null;
  let caption: string;
  let imageUrl: string;

  if (queued) {
    caption = (queued.caption || queued.script || "").trim();
    if (queued.hashtags?.length)
      caption += "\n\n" + queued.hashtags.map((t: string) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    imageUrl = queued.image_url || DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
  } else {
    caption = await generateCaption();
    imageUrl = DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
  }

  // 2) Criar IG Media Container
  let containerId: string | null = null;
  try {
    const r1 = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
    });
    const j1 = await r1.json();
    if (!r1.ok) throw new Error(JSON.stringify(j1));
    containerId = j1.id;
  } catch (e) {
    console.error("[ig-auto-post] container error:", e);
    await supabase.from("ai_events").insert({
      ai_name: "brisa_ig_auto", event_type: "ig_container_failed", status: "error",
      output_data: { error: String(e), post_id: postId, image_url: imageUrl },
    });
    return new Response(JSON.stringify({ ok: false, stage: "container", error: String(e) }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3) Publicar
  let igResult: unknown;
  try {
    const r2 = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: token }),
    });
    igResult = await r2.json();
    if (!r2.ok) throw new Error(JSON.stringify(igResult));
  } catch (e) {
    console.error("[ig-auto-post] publish error:", e);
    await supabase.from("ai_events").insert({
      ai_name: "brisa_ig_auto", event_type: "ig_publish_failed", status: "error",
      output_data: { error: String(e), post_id: postId, container_id: containerId },
    });
    return new Response(JSON.stringify({ ok: false, stage: "publish", error: String(e) }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4) Marcar postado
  if (postId) {
    await supabase
      .from("manus_social_queue")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", postId);
  } else {
    await supabase.from("manus_social_queue").insert({
      platform: "instagram", topic: "auto_generated", script: caption, caption,
      image_url: imageUrl, status: "posted", posted_at: new Date().toISOString(),
    });
  }

  await supabase.from("ai_events").insert({
    ai_name: "brisa_ig_auto", event_type: "ig_post_published", status: "completed",
    output_data: { ig_response: igResult, container_id: containerId, caption_preview: caption.slice(0, 120) },
  });

  return new Response(JSON.stringify({ ok: true, posted_id: postId, container_id: containerId, ig: igResult }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
