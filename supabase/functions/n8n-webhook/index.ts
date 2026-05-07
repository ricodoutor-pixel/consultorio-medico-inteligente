import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: accept either service-role bearer OR x-webhook-secret matching N8N_WEBHOOK_SECRET
  const webhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");
  const secretOk = !!webhookSecret && providedSecret === webhookSecret;
  if (!secretOk) {
    const unauth = requireServiceAuth(req, corsHeaders);
    if (unauth) return unauth;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");

    const body = await req.json();
    const { payload } = body;

    if (payload?.chat_log || payload?.lead_data) {
      await supabase.from("leads_contatos").insert({
        nome: payload.lead_data?.nome || "Anonimo",
        telefone: payload.lead_data?.telefone || "",
        tags: ["n8n_processed", payload.action],
        origem: "n8n_automation",
        categoria: payload.chat_log ? "IA_CHAT_LOG" : "LEAD"
      });
    }

    if (N8N_WEBHOOK_URL) {
      fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch((err) => console.error("[n8n-webhook] forward error:", err));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[n8n-webhook] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
