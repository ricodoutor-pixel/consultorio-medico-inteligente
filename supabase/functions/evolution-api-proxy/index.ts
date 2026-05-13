import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL"); // Ex: https://sua-instancia.com
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
const INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE") || "Brisa_CEO";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Service-role only: prevents any authenticated user from sending arbitrary WhatsApp messages.
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const { phone, message, mediaUrl, type = "text" } = await req.json();

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error("Evolution API não configurada");
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const url = `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`;

    const payload = {
      number: cleanPhone,
      options: {
        delay: 1200,
        presence: "composing",
        linkPreview: true
      },
      textMessage: {
        text: message
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[evolution-api-proxy] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
