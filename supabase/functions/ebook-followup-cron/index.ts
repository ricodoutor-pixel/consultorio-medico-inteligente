// Cron diário — envia follow-up 24h após captura do ebook oferecendo a Orientação Técnica R$30
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from("ebook_funnel_log")
    .select("id, whatsapp, name")
    .is("followup_sent_at", null)
    .not("pdf_sent_at", "is", null)
    .lt("created_at", cutoff)
    .gt("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
    .limit(50);

  if (error) {
    console.error("[ebook-followup] query error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const lead of leads || []) {
    const firstName = (lead.name || "").split(" ")[0] || "amigo(a)";
    const msg =
      `Oi ${firstName}! 🌿 Aqui é a Brisa novamente.\n\n` +
      `Espero que o *Guia de Cannabis Medicinal* esteja sendo útil. 📘\n\n` +
      `🎁 *Cupom exclusivo para você:* a *Orientação Técnica* do Dr. Edilson Bezerra (CRM-CE 10963) ` +
      `(CRM-PR 49354) sai por apenas *R$30* — análise personalizada do seu caso, ` +
      `indicação de óleo e protocolo ANVISA RDC 660/2022 incluso.\n\n` +
      `👉 Garanta agora: https://plantayraiz.com.br/orientacao-tecnica\n\n` +
      `Posso te ajudar a agendar agora mesmo? Responda *SIM* que eu cuido de tudo. 💚`;

    try {
      const wa = await fetch(`${supabaseUrl}/functions/v1/evolution-api-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ phone: lead.whatsapp, message: msg }),
      });
      if (wa.ok) {
        await supabase
          .from("ebook_funnel_log")
          .update({ followup_sent_at: new Date().toISOString() })
          .eq("id", lead.id);
        sent++;
      } else {
        failed++;
        console.error("[ebook-followup] WA failed for", lead.id, await wa.text());
      }
    } catch (e) {
      failed++;
      console.error("[ebook-followup] error:", e);
    }
  }

  return new Response(JSON.stringify({ ok: true, eligible: leads?.length || 0, sent, failed }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
