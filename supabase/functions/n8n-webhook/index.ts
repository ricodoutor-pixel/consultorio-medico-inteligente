import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");

    const body = await req.json();
    const { action, payload } = body;

    // Salvar log de conversa/lead se houver
    if (payload?.chat_log || payload?.lead_data) {
      await supabase.from("leads_contatos").insert({
        nome: payload.lead_data?.nome || "Anonimo",
        telefone: payload.lead_data?.telefone || "",
        tags: ["n8n_processed", payload.action],
        origem: "n8n_automation",
        categoria: payload.chat_log ? "IA_CHAT_LOG" : "LEAD"
      });
    }

    // Encaminhar para n8n se configurado
    if (N8N_WEBHOOK_URL) {
      fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(console.error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
