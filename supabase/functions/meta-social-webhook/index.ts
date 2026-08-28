import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";

const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "planta_meta_webhook_2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://tkxxoghzhvhjzdoomgss.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY") || "";

serve(async (req: Request) => {
  const url = new URL(req.url);

  // 1. GET: Validação de Webhook da Meta (Instagram / Facebook App)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
      console.log("✅ Webhook Meta verificado com sucesso!");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2. OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  // 3. POST: Ingestão de Directs e Comentários do Instagram/Facebook
  try {
    const body = await req.json().catch(() => ({}));
    console.log("📥 Payload Meta Webhook recebido:", JSON.stringify(body).slice(0, 300));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const entries = body.entry || [];

    for (const entry of entries) {
      // Directs do Instagram (messaging)
      if (entry.messaging) {
        for (const msg of entry.messaging) {
          const senderId = msg.sender?.id;
          const text = msg.message?.text || "";

          if (text) {
            // Disparar captação de lead via brisa-lead-hunter
            await supabase.functions.invoke("brisa-lead-hunter", {
              body: {
                text,
                origem: "instagram_dm",
                canal_username: senderId,
              },
            }).catch((e) => console.warn("[meta-social-webhook] Erro ao invocar lead-hunter:", e));
          }
        }
      }

      // Comentários em Posts (changes)
      if (entry.changes) {
        for (const change of entry.changes) {
          const value = change.value || {};
          const commentText = value.message || value.text || "";
          const fromUser = value.from?.username || value.from?.name || value.from?.id || "";

          if (commentText) {
            await supabase.functions.invoke("brisa-lead-hunter", {
              body: {
                text: `${fromUser}: ${commentText}`,
                origem: "instagram_comment",
                canal_username: fromUser,
              },
            }).catch((e) => console.warn("[meta-social-webhook] Erro lead-hunter:", e));
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, received: true }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[meta-social-webhook] Erro:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
