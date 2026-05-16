// Edge function: brisa-google-review-request
// Roda diariamente via pg_cron. Para cada orientação técnica concluída há >24h
// que ainda não recebeu pedido de avaliação Google, envia mensagem via Twilio WhatsApp
// pela Enfª Brisa e marca google_review_requested_at.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_FROM = "whatsapp:+551191363154"; // Enfª Brisa

// Link curto da página de avaliação no Google Meu Negócio da Planta y Raiz.
// Substitua pelo link real (Google Business → "Compartilhar avaliação").
const GOOGLE_REVIEW_URL = "https://g.page/r/plantayraiz/review";

function buildMessage(firstName: string) {
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  return `${greeting} 👋 Aqui é a Enfª Brisa da Planta y Raiz 💚

Como foi sua Orientação Técnica com o Dr. Edilson? Espero que tenha ajudado!

Se puder, sua avaliação de 30 segundos no Google nos ajuda MUITO a alcançar outras pessoas que precisam:
⭐ ${GOOGLE_REVIEW_URL}

Obrigada por confiar na gente! Qualquer dúvida, é só me chamar aqui. 🌱`;
}

async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("[google-review] Twilio não configurado — apenas log");
    console.log("[google-review] msg → ", to, body.substring(0, 60));
    return true; // simula sucesso em dev
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const params = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: `whatsapp:+${to.replace(/\D/g, "")}`,
    Body: body,
  });
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!r.ok) {
    console.error("[google-review] Twilio erro:", r.status, await r.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Busca orientações concluídas há entre 24h e 14 dias sem review enviada
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
      const ok = await sendWhatsApp(o.patient_whatsapp, message);

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

    return new Response(JSON.stringify({ ok: true, sent, failed, total: orders.length }), {
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
