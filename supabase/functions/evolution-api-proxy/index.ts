import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
const INSTANCE_NAME = encodeURIComponent(Deno.env.get("EVOLUTION_INSTANCE") || "Enf Brisa Bot whats");
const ADMIN_WHATSAPP = (Deno.env.get("ADMIN_WHATSAPP") || "").replace(/\D/g, "");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error("Evolution API não configurada");
    }

    const body = await req.json().catch(() => ({}));
    const phoneRaw = String(body?.phone ?? "");
    const message = String(body?.message ?? "");

    // 1) Input validation
    const cleanPhone = phoneRaw.replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: "Invalid phone format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!message || message.length < 1 || message.length > 4096) {
      return new Response(JSON.stringify({ error: "Invalid message length (1-4096)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Allow-list: admin number OR a known contact
    const isAdmin = ADMIN_WHATSAPP && cleanPhone === ADMIN_WHATSAPP;
    let isKnown = isAdmin;
    if (!isKnown) {
      const [{ count: leadCount }, { count: otCount }, { count: ebookCount }] = await Promise.all([
        supabase.from("leads_contatos").select("id", { count: "exact", head: true }).eq("telefone", cleanPhone),
        supabase.from("orientacao_tecnica_orders").select("id", { count: "exact", head: true }).eq("patient_whatsapp", cleanPhone),
        supabase.from("ebook_funnel_log").select("id", { count: "exact", head: true }).eq("whatsapp", cleanPhone),
      ]);
      isKnown = (leadCount ?? 0) + (otCount ?? 0) + (ebookCount ?? 0) > 0;
    }
    if (!isKnown) {
      return new Response(JSON.stringify({ error: "Recipient not in allow-list" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Per-phone rate limit: 5 messages / 60s
    const { data: rlOk } = await supabase.rpc("check_edge_rate_limit", {
      p_bucket: "evolution_api_proxy",
      p_key: cleanPhone,
      p_max_hits: 5,
      p_window_seconds: 60,
    });
    if (rlOk === false) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Send
    const url = `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`;
    const payload = { number: cleanPhone, text: message, delay: 1200, linkPreview: true };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    return new Response(JSON.stringify({ success: response.ok, result }), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[evolution-api-proxy] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
