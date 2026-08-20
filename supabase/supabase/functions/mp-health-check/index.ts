// MP Health Check — pinga API do Mercado Pago a cada 2 min.
// 3 falhas consecutivas (ou latência > 5s) → ativa mp_contingency_mode.
// Volta normal quando responde OK.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";
const LATENCY_THRESHOLD_MS = 5000;

async function notifyAdmin(msg: string) {
  const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
  if (shouldSilenceAdminAlert("mp-health-check")) return;
  try {

    await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ phone: ADMIN_WHATSAPP, message: msg }),
    });
  } catch (_) {}
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Ping MP
  const start = Date.now();
  let ok = false;
  let httpStatus = 0;
  let latency = 0;
  try {
    const r = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
      signal: AbortSignal.timeout(LATENCY_THRESHOLD_MS + 2000),
    });
    httpStatus = r.status;
    latency = Date.now() - start;
    // MP API alive = qualquer resposta HTTP (mesmo 401/403) abaixo do limite de latência.
    // Falha real = timeout, erro de rede ou 5xx.
    ok = httpStatus < 500 && latency < LATENCY_THRESHOLD_MS;
    await r.text();
  } catch (e) {
    latency = Date.now() - start;
    ok = false;
    httpStatus = 0;
  }

  // Read current state
  const { data: stateRow } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "mp_health_state")
    .maybeSingle();
  const state = (stateRow?.value as any) ?? { fail_streak: 0, ok_streak: 0 };

  let fail_streak = Number(state.fail_streak ?? 0);
  let ok_streak = Number(state.ok_streak ?? 0);
  if (ok) {
    ok_streak += 1;
    fail_streak = 0;
  } else {
    fail_streak += 1;
    ok_streak = 0;
  }

  await supabase.from("system_settings").upsert({
    key: "mp_health_state",
    value: { fail_streak, ok_streak, last_check: new Date().toISOString(), latency, ok, http: httpStatus },
    description: "Estado atual do health-check do Mercado Pago",
  });

  // Read contingency flag
  const { data: contRow } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "mp_contingency_mode")
    .maybeSingle();
  const contEnabled = !!(contRow?.value as any)?.enabled;

  // Activate
  if (!contEnabled && fail_streak >= 3) {
    await supabase.from("system_settings").upsert({
      key: "mp_contingency_mode",
      value: { enabled: true, since: new Date().toISOString(), reason: `3 falhas consecutivas (last latency ${latency}ms, http ${httpStatus})` },
    });
    await notifyAdmin(`🔴 *Modo Contingência ATIVADO*\nMercado Pago fora do ar.\nLatência: ${latency}ms | HTTP: ${httpStatus}\nCheckout exibindo PIX estático.`);
  }

  // Recover
  if (contEnabled && ok_streak >= 2) {
    await supabase.from("system_settings").upsert({
      key: "mp_contingency_mode",
      value: { enabled: false, since: null, reason: "Recuperado automaticamente após 2 checks OK." },
    });
    await notifyAdmin(`🟢 *Modo Contingência DESATIVADO*\nMercado Pago restabelecido (${latency}ms).`);
  }

  return new Response(JSON.stringify({ ok, latency, httpStatus, fail_streak, ok_streak, contingency: contEnabled }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
