// Brisa Crisis Alert — monitora sentimento médio das mensagens da Brisa
// nos últimos 7 dias e dispara alerta WhatsApp ao admin se < 0.4 ou
// > 50% das mensagens forem marcadas como negativas.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

function maskPhone(p?: string | null) {
  if (!p) return "***";
  const s = String(p).replace(/\D/g, "");
  if (s.length < 6) return "***";
  return `${s.slice(0, 4)}****${s.slice(-2)}`;
}

async function sendWhatsApp(message: string) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ phone: ADMIN_WHATSAPP, message, type: "text" }),
    });
    return r.ok;
  } catch (e) {
    console.error("[brisa-crisis] sendWhatsApp", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: rows } = await supabase
      .from("whatsapp_brisa_log")
      .select("phone, message, sentiment_score, is_negative, created_at")
      .gte("created_at", since)
      .not("sentiment_score", "is", null);

    const total = rows?.length ?? 0;
    if (total === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_scored_messages" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const avg = rows!.reduce((s: number, r: any) => s + Number(r.sentiment_score || 0), 0) / total;
    const negCount = rows!.filter((r: any) => r.is_negative === true).length;
    const negPct = (negCount / total) * 100;

    const triggered = avg < 0.4 || negPct > 50;

    if (!triggered) {
      return new Response(
        JSON.stringify({ ok: true, triggered: false, avg, negPct, total }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const samples = rows!
      .filter((r: any) => r.is_negative)
      .sort((a: any, b: any) => Number(a.sentiment_score) - Number(b.sentiment_score))
      .slice(0, 5)
      .map((r: any) => `• [${maskPhone(r.phone)}] ${String(r.message || "").slice(0, 90)}…`);

    const md = [
      `🚨 *ALERTA DE CRISE — BRISA*`,
      `_Sentimento médio negativo nos últimos 7 dias_`,
      ``,
      `• Mensagens analisadas: ${total}`,
      `• Sentimento médio: ${avg.toFixed(2)}`,
      `• % negativas: ${negPct.toFixed(1)}%`,
      ``,
      `*Top 5 trechos críticos:*`,
      ...samples,
      ``,
      `_Ação recomendada: revisar prompts da Brisa e contatar pacientes._`,
    ].join("\n");

    await sendWhatsApp(md);

    await supabase.from("audit_log").insert({
      action: "brisa_crisis_alert",
      table_name: "whatsapp_brisa_log",
      new_data: { avg, negPct, total, samples_count: samples.length },
    });

    return new Response(
      JSON.stringify({ ok: true, triggered: true, avg, negPct, total }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[brisa-crisis-alert] error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
