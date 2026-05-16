// Auto-publica 1 post no Facebook Page a cada 30 min (via pg_cron).
// Fluxo: pega próximo item APROVADO em manus_social_queue (platform=facebook).
// Se a fila estiver vazia, gera dinamicamente via Gemini (Lovable AI) e publica.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v19.0";

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

async function generatePost(): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const topic = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
  const base = `Acesse: https://plantayraiz.com.br/login | WhatsApp Enf. Brisa: (11) 99136-3154`;

  if (!LOVABLE_API_KEY) {
    return `🌱 Planta y Raiz — Mega Clínica Digital de Cannabis Medicinal com Dr. Edilson Bezerra (CRM 10963).\n\n${topic}\n\nOrientação Técnica por R$ 30 (PIX). ${base}\n\n#CannabisMedicinal #PlantaYRaiz #SaúdeDigital`;
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é a Enf. Brisa da Planta y Raiz. Escreva 1 post para Facebook (máx 600 caracteres), tom acolhedor e científico, com emojis sutis, encerrando SEMPRE com o link https://plantayraiz.com.br/login e WhatsApp (11) 99136-3154. Inclua 3 hashtags. Mencione Dr. Edilson Bezerra CRM 10963 quando fizer sentido. Disclaimer ANVISA RDC 660/2022 implícito." },
          { role: "user", content: `Tópico: ${topic}` },
        ],
      }),
    });
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    if (text && text.includes("plantayraiz.com.br")) return text;
  } catch (e) {
    console.error("[fb-auto-post] AI gen error:", e);
  }
  return `🌿 ${topic}\n\nOrientação Técnica R$30 via PIX. ${base}\n\n#CannabisMedicinal #PlantaYRaiz #Telemedicina`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");
  const fbToken = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") || Deno.env.get("FACEBOOK_GRAPH_API_TOKEN");

  if (!pageId || !fbToken) {
    return new Response(JSON.stringify({ error: "FB credentials missing" }), {
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

  if (queued) {
    message = (queued.caption || queued.script || "").trim();
    if (queued.hashtags?.length) message += "\n\n" + queued.hashtags.map((t: string) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    imageUrl = queued.image_url || null;
  } else {
    message = await generatePost();
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
