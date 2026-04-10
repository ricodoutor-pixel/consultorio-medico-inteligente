import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const { subscriber, data } = payload;

    if (!subscriber?.phone || !subscriber?.name) {
      return new Response(JSON.stringify({ error: "nome e telefone são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const phone = subscriber.phone.replace(/\D/g, "");
    const nome = subscriber.name.trim();
    const origem = data?.origem || "chat";
    const tags = data?.tags || [];

    // Save lead to database (service role bypasses RLS)
    const { error: dbError } = await supabase.from("leads_contatos").insert({
      nome,
      telefone: phone,
      origem,
      tags,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return new Response(JSON.stringify({ error: "Erro ao salvar lead", details: dbError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ManyChat integration placeholder - configure later
    console.log("Lead saved successfully:", { nome, phone, origem, tags });

    return new Response(JSON.stringify({
      success: true,
      db_saved: true,
      nome,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
