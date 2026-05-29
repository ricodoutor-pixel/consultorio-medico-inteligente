// Pool Sanitizer — suspende médicos com fraud_score < 50.
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
const FRAUD_THRESHOLD = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Find active doctors with fraud_score < threshold
  const { data: risky, error } = await supabase
    .from("doctors")
    .select("id, user_id, crm, fraud_score, suspended_at")
    .lt("fraud_score", FRAUD_THRESHOLD)
    .is("suspended_at", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const suspended: any[] = [];
  for (const d of risky ?? []) {
    const { error: updErr } = await supabase
      .from("doctors")
      .update({
        suspended_at: new Date().toISOString(),
        suspension_reason: `Auto-suspensão: fraud_score=${d.fraud_score} < ${FRAUD_THRESHOLD}`,
        is_online: false,
      })
      .eq("id", d.id);
    if (!updErr) {
      suspended.push(d);
      await supabase.from("audit_log").insert({
        action: "doctor_auto_suspended",
        table_name: "doctors",
        record_id: d.id,
        new_data: { fraud_score: d.fraud_score, threshold: FRAUD_THRESHOLD, crm: d.crm },
      });
    }
  }

  if (suspended.length > 0) {
    const lines = suspended.slice(0, 10).map((d) => `• CRM ${d.crm ?? "?"} — score ${d.fraud_score}`);
    const msg = [
      `⚠️ *POOL SANITIZER — ${suspended.length} médico(s) suspenso(s)*`,
      `_Fraud score abaixo de ${FRAUD_THRESHOLD}_`,
      "",
      ...lines,
      "",
      "_Revisar em /admin/doctors_",
    ].join("\n");
    try {
      const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
      if (!shouldSilenceAdminAlert("pool-sanitizer")) {
        await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
          body: JSON.stringify({ phone: ADMIN_WHATSAPP, message: msg }),
        });
      }
    } catch (_) {}

  }

  return new Response(JSON.stringify({ ok: true, scanned: risky?.length ?? 0, suspended: suspended.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
