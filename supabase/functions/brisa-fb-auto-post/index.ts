// Auto-publica 1 post no Facebook Page a cada 30 min (via pg_cron).
// Fluxo: pega próximo item APROVADO em manus_social_queue (platform=facebook).
// Se a fila estiver vazia, gera dinamicamente via Gemini (Lovable AI) e publica.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";

import { AUTO_POST_SYSTEM_PROMPT, pickImageFromPool, pickTopic, sanitizeCaption } from "../_shared/auto-post-topics.ts";
import { generateGeminiImageForTopic } from "../_shared/gemini-image-gen.ts";

async function generatePost(): Promise<string> {
  const GEMINI_API_KEY =
    Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
    Deno.env.get("GEMINI_API_KEY") ||
    "";
  const topic = pickTopic();
  const base = `Acesse: https://plantayraiz.com.br | WhatsApp Enf. Brisa: (11) 99136-3154`;

  if (!GEMINI_API_KEY) {
    return sanitizeCaption(`🌱 Planta y Raiz — a maior plataforma digital de Cannabis Medicinal do Brasil.\n\n${topic}\n\n${base}\n\n#CannabisMedicinal #PlantaYRaiz #SaúdeDigital`);
  }

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: AUTO_POST_SYSTEM_PROMPT + "\n\nFormato: post de Facebook, máx 600 caracteres, 3-5 hashtags." },
          { role: "user", content: `Tópico: ${topic}\n\nEncerre com: ${base}` },
        ],
      }),
    });
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    if (text && text.includes("plantayraiz.com.br")) return sanitizeCaption(text);
  } catch (e) {
    console.error("[fb-auto-post] Google Gemini error:", e);
  }
  return sanitizeCaption(`🌿 ${topic}\n\n${base}\n\n#CannabisMedicinal #PlantaYRaiz #Telemedicina`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");
  if (!pageId) {
    return new Response(JSON.stringify({ error: "FACEBOOK_PAGE_ID missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let fbToken: string;
  try {
    const { getFacebookPageToken } = await import("../_shared/fb-page-token.ts");
    fbToken = await getFacebookPageToken(pageId);
  } catch (e) {
    return new Response(JSON.stringify({ error: "FB token resolution failed", detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 1) Buscar próximo post agendado ou aprovado
  const { data: queued } = await supabase
    .from("manus_social_queue")
    .select("id, caption, script, image_url, hashtags")
    .eq("platform", "facebook")
    .in("status", ["approved", "scheduled", "draft"])
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let postId: string | null = queued?.id ?? null;
  let message: string;
  let imageUrl: string | null = null;

  const topic = pickTopic();
  if (queued) {
    message = (queued.caption || queued.script || "").trim();
    if (queued.hashtags?.length) message += "\n\n" + queued.hashtags.map((t: string) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    imageUrl = queued.image_url || null;
  } else {
    message = await generatePost();
  }
  // Sempre tenta gerar imagem via Gemini (Nano Banana); fallback no pool Pexels
  if (!imageUrl) {
    const gen = await generateGeminiImageForTopic(topic);
    imageUrl = gen.url || await pickImageFromPool(supabase);
    if (gen.error) console.error("[fb-auto-post] gemini image fallback:", gen.error);
  }


  // 2) Publicar no Facebook
  let fbResult: unknown;
  try {
    const endpoint = imageUrl ? `${GRAPH_API}/${pageId}/photos` : `${GRAPH_API}/${pageId}/feed`;
    const payload: Record<string, unknown> = imageUrl
      ? { url: imageUrl, caption: message, access_token: fbToken }
      : { message, access_token: fbToken };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fbResult = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(fbResult));
  } catch (e) {
    console.error("[fb-auto-post] FB publish error:", e);
    await supabase.from("ai_events").insert({
      ai_name: "brisa_fb_auto", event_type: "fb_post_failed", status: "error",
      output_data: { error: String(e), post_id: postId },
    });
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3) Marcar como postado
  if (postId) {
    await supabase
      .from("manus_social_queue")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", postId);
  } else {
    await supabase.from("manus_social_queue").insert({
      platform: "facebook", topic: "auto_generated", script: message, caption: message,
      status: "posted", posted_at: new Date().toISOString(),
    });
  }

  await supabase.from("ai_events").insert({
    ai_name: "brisa_fb_auto", event_type: "fb_post_published", status: "completed",
    output_data: { fb_response: fbResult, message_preview: message.slice(0, 120) },
  });

  return new Response(JSON.stringify({ ok: true, posted_id: postId, fb: fbResult }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
