// Edge function: brisa-google-review-request
// Roda diariamente via pg_cron. Para cada orientação técnica concluída há >24h
// que ainda não recebeu pedido de avaliação Google, envia mensagem via Evolution API
// (Enfª Brisa) através do edge function evolution-api-proxy e marca
// google_review_requested_at.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Link curto da página de avaliação no Google Meu Negócio da Planta y Raiz.
const GOOGLE_REVIEW_URL = "https://g.page/r/plantayraiz/review";

function buildMessage(firstName: string) {
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  return `${greeting} 👋 Aqui é a Enfª Brisa da Planta y Raiz 💚

Como foi sua Orientação Técnica com o Dr. Edilson? Espero que tenha ajudado!

Se puder, sua avaliação de 30 segundos no Google nos ajuda MUITO a alcançar outras pessoas que precisam:
⭐ ${GOOGLE_REVIEW_URL}

Obrigada por confiar na gente! Qualquer dúvida, é só me chamar aqui. 🌱`;
}

async function sendWhatsAppViaEvolution(to: string, body: string): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: to.replace(/\D/g, ""), message: body }),
    });
    if (!r.ok) {
      console.error("[google-review] evolution-api-proxy erro:", r.status, await r.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[google-review] evolution-api-proxy exception:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: orders, error } = await supabase
      .from("orientacao_tecnica_orders")
      .select("id, patient_name, patient_whatsapp, dispatched_at")
      .is("google_review_requested_at", null)
      .not("dispatched_at", "is", null)
      .lt("dispatched_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .gt("dispatched_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .neq("patient_name", "ANONIMIZADO")
      .limit(50);

    if (error) throw error;
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, note: "nenhuma orientação elegível" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const o of orders) {
      const firstName = (o.patient_name || "").split(" ")[0];
      const message = buildMessage(firstName);
      const ok = await sendWhatsAppViaEvolution(o.patient_whatsapp, message);

      if (ok) {
        await supabase
          .from("orientacao_tecnica_orders")
          .update({ google_review_requested_at: new Date().toISOString() })
          .eq("id", o.id);
        sent++;
      } else {
        failed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, total: orders.length, channel: "evolution-api" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[google-review] erro:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
