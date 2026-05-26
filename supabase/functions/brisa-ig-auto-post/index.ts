// Auto-publica 1 post no Instagram Business a cada 30 min.
// Após publicar no IG, espelha automaticamente no Facebook Page e no Threads.
// REGRA: zero menções a médicos específicos / CRM (ver _shared/auto-post-topics.ts).
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import {
  AUTO_POST_SYSTEM_PROMPT,
  pickImage,
  pickImageFromPool,
  pickTopic,
  sanitizeCaption,
  waitIgContainerReady,
} from "../_shared/auto-post-topics.ts";
import { generateGeminiImageForTopic, rehostExternalImage } from "../_shared/gemini-image-gen.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";
const THREADS_API = "https://graph.threads.net/v1.0";

async function generateCaption(topic: string): Promise<string> {
  const GEMINI_API_KEY =
    Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
    Deno.env.get("GEMINI_API_KEY") ||
    "";
  const base = `Acesse: plantayraiz.com.br 🌿 | WhatsApp Enf. Brisa: (11) 99136-3154`;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

  // 1) Tenta Lovable AI Gateway (preferido)
  if (LOVABLE_API_KEY) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: AUTO_POST_SYSTEM_PROMPT + "\n\nFormato: caption de Instagram, máx 1500 caracteres, 8-12 hashtags." },
            { role: "user", content: `Tópico: ${topic}\n\nEncerre com: ${base}` },
          ],
        }),
      });
      const j = await res.json();
      const text = j?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 30) return sanitizeCaption(text);
    } catch (e) {
      console.error("[ig-auto-post] Lovable AI caption error:", e);
    }
  }

  // 2) Fallback Gemini direto
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: AUTO_POST_SYSTEM_PROMPT + "\n\nFormato: caption de Instagram, máx 1500 caracteres, 8-12 hashtags." },
            { role: "user", content: `Tópico: ${topic}\n\nEncerre com: ${base}` },
          ],
        }),
      });
      const j = await res.json();
      const text = j?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 30) return sanitizeCaption(text);
    } catch (e) {
      console.error("[ig-auto-post] Gemini direct caption error:", e);
    }
  }

  return sanitizeCaption(`🌿 ${topic}\n\n${base}\n\n#CannabisMedicinal #PlantaYRaiz #Telemedicina #SaudeDigital #BemEstar`);
}


// ============================================================
// FACEBOOK MIRROR — publica a mesma imagem + caption na Page
// ============================================================
async function mirrorToFacebook(pageId: string, imageUrl: string, message: string): Promise<unknown> {
  try {
    const { getFacebookPageToken } = await import("../_shared/fb-page-token.ts");
    const fbToken = await getFacebookPageToken(pageId);
    const r = await fetch(`${GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption: message, access_token: fbToken }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return { ok: true, fb: j };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ============================================================
// THREADS MIRROR — exige THREADS_ACCESS_TOKEN + THREADS_USER_ID
// (token específico do Threads via graph.threads.net)
// ============================================================
async function mirrorToThreads(imageUrl: string, message: string): Promise<unknown> {
  const token = Deno.env.get("THREADS_ACCESS_TOKEN") || "";
  const userId = Deno.env.get("THREADS_USER_ID") || "";
  if (!token || !userId) {
    return { ok: false, skipped: true, reason: "THREADS_ACCESS_TOKEN/THREADS_USER_ID não configurados" };
  }
  try {
    // 1) Criar container IMAGE
    const r1 = await fetch(`${THREADS_API}/${userId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "IMAGE",
        image_url: imageUrl,
        text: message.slice(0, 500),
        access_token: token,
      }),
    });
    const j1 = await r1.json();
    if (!r1.ok || !j1.id) throw new Error(`container: ${JSON.stringify(j1)}`);

    // 2) Publicar
    await new Promise((r) => setTimeout(r, 2000));
    const r2 = await fetch(`${THREADS_API}/${userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: j1.id, access_token: token }),
    });
    const j2 = await r2.json();
    if (!r2.ok) throw new Error(`publish: ${JSON.stringify(j2)}`);
    return { ok: true, threads: j2 };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

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

  // Override manual via body { caption, image_url } — Admin "Publicar Agora"
  let manualCaption = "";
  let manualImageUrl = "";
  try {
    if (req.method === "POST") {
      const body = await req.clone().json().catch(() => ({}));
      manualCaption = (body?.caption || "").toString().trim();
      manualImageUrl = (body?.image_url || body?.media_url || "").toString().trim();
    }
  } catch { /* ignore */ }

  // 1) Próximo IG na fila (pulado se houver override manual)
  const { data: queued } = manualCaption
    ? { data: null as any }
    : await supabase
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

  const topic = pickTopic();
  let geminiError: string | undefined;

  if (manualCaption) {
    caption = sanitizeCaption(manualCaption);
    if (manualImageUrl) {
      imageUrl = manualImageUrl;
    } else {
      const gen = await generateGeminiImageForTopic(caption.slice(0, 200));
      if (gen.url) imageUrl = gen.url;
      else { geminiError = gen.error; imageUrl = await pickImageFromPool(supabase); }
    }
  } else if (queued) {
    caption = sanitizeCaption((queued.caption || queued.script || "").trim());
    if (queued.hashtags?.length)
      caption += "\n\n" + queued.hashtags.map((t: string) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    if (queued.image_url) {
      imageUrl = queued.image_url;
    } else {
      const gen = await generateGeminiImageForTopic(caption.slice(0, 200) || topic);
      if (gen.url) imageUrl = gen.url;
      else { geminiError = gen.error; imageUrl = await pickImageFromPool(supabase); }
    }
  } else {
    caption = await generateCaption(topic);
    const gen = await generateGeminiImageForTopic(topic);
    if (gen.url) imageUrl = gen.url;
    else { geminiError = gen.error; imageUrl = await pickImageFromPool(supabase); }
  }

  if (geminiError) console.error("[ig-auto-post] gemini image fallback:", geminiError);

  // Re-hospedar imagens externas (Pexels etc.) no bucket público para evitar
  // timeout do container IG ao baixar de domínios com cookies/rate-limit.
  if (imageUrl && !imageUrl.includes("supabase.co/storage/")) {
    const rehosted = await rehostExternalImage(imageUrl);
    if (rehosted !== imageUrl) {
      console.log("[ig-auto-post] rehosted external image →", rehosted);
      imageUrl = rehosted;
    }
  }


  // 2) IG container
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

  // 2.5) Aguardar container FINISHED (evita erro 9007 "Media ID is not available")
  const waitRes = await waitIgContainerReady(containerId!, token);
  if (!waitRes.ready) {
    await supabase.from("ai_events").insert({
      ai_name: "brisa_ig_auto", event_type: "ig_container_not_ready", status: "error",
      output_data: { container_id: containerId, final_status: waitRes.finalStatus, image_url: imageUrl },
    });
    return new Response(JSON.stringify({ ok: false, stage: "wait", final_status: waitRes.finalStatus }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3) IG publish
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

  // 4) Mirror — FB nativo via Meta (cross-post automático IG→FB).
  //    Removido mirrorToFacebook para evitar duplicação.
  const fbMirror = { ok: true, skipped: true, reason: "native Meta IG→FB cross-post" };
  const threadsMirror = await mirrorToThreads(imageUrl, caption);
  void pageId;

  // 5) Marcar como postado
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
    ai_name: "brisa_ig_auto",
    event_type: "ig_post_published",
    status: "completed",
    output_data: {
      ig_response: igResult,
      container_id: containerId,
      caption_preview: caption.slice(0, 120),
      fb_mirror: fbMirror,
      threads_mirror: threadsMirror,
    },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      posted_id: postId,
      container_id: containerId,
      ig: igResult,
      fb_mirror: fbMirror,
      threads_mirror: threadsMirror,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
