// ============================================================================
// BRISA SILENCE WATCHDOG — Anti-Ponto Cego
// Dispara CRITICAL no Discord SRE + WhatsApp ADMIN quando whatsapp_brisa_log
// fica > 60min sem nenhum inbound em horário comercial (08-22 BRT).
// Cron: a cada 10 minutos.
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SILENCE_MINUTES = 120;

async function sendWhatsAppAdmin(text: string) {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const inst = Deno.env.get("EVOLUTION_INSTANCE");
  const to = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";
  if (!url || !key || !inst) return false;
  try {
    const r = await fetch(`${url}/message/sendText/${inst}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number: to.replace(/\D/g, ""), text }),
    });
    return r.ok;
  } catch (e) {
    console.error("[silence-watchdog] whatsapp", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Janela comercial BRT (UTC-3): 08-22h => UTC 11-01h
  const nowUtcHour = new Date().getUTCHours();
  const inBusiness = nowUtcHour >= 11 || nowUtcHour <= 1;
  if (!inBusiness) {
    return new Response(JSON.stringify({ ok: true, skipped: "off_hours", utcHour: nowUtcHour }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Última mensagem inbound
  const { data: last, error } = await supabase
    .from("whatsapp_brisa_log")
    .select("created_at")
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lastAt = last?.created_at ? new Date(last.created_at) : null;
  const minutesSilent = lastAt
    ? Math.floor((Date.now() - lastAt.getTime()) / 60000)
    : 99999;

  if (minutesSilent < SILENCE_MINUTES) {
    return new Response(JSON.stringify({ ok: true, silent_minutes: minutesSilent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Deduplica: não realertar se já alertamos nos últimos 30min
  const dedupSince = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: recentAlert } = await supabase
    .from("audit_log")
    .select("id")
    .eq("action", "brisa_silence_alert")
    .gte("created_at", dedupSince)
    .limit(1)
    .maybeSingle();

  if (recentAlert) {
    return new Response(JSON.stringify({ ok: true, deduped: true, silent_minutes: minutesSilent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const title = "🔕 SILÊNCIO ANORMAL DA BRISA";
  const desc = `Sem mensagens inbound há *${minutesSilent} min* (limite ${SILENCE_MINUTES}min).\nÚltima inbound: ${lastAt ? lastAt.toISOString() : "NUNCA"}\n\nProvável causa: Evolution API desconectada / webhook quebrado / VPS down.\n\nChecklist:\n1) curl ${Deno.env.get("EVOLUTION_API_URL") || "https://api.plantayraiz.com.br"}/instance/connectionState/Brisa_CEO\n2) Verificar QR Code em /manager\n3) Reconfigurar webhook se preciso`;

  // Discord SRE
  try {
    await supabase.functions.invoke("sre-alert", {
      body: {
        level: "CRITICAL",
        title,
        description: desc,
        fields: [
          { name: "Silêncio (min)", value: String(minutesSilent), inline: true },
          { name: "Última inbound", value: lastAt ? lastAt.toISOString() : "—", inline: true },
        ],
      },
    });
  } catch (e) { console.error("[silence-watchdog] sre-alert", e); }

  // WhatsApp ADMIN
  await sendWhatsAppAdmin(`🚨 *${title}*\n\n${desc}`);

  await supabase.from("audit_log").insert({
    action: "brisa_silence_alert",
    table_name: "whatsapp_brisa_log",
    new_data: { silent_minutes: minutesSilent, last_inbound: lastAt },
  });

  return new Response(JSON.stringify({ ok: true, alerted: true, silent_minutes: minutesSilent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
