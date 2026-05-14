// Brisa Fuzzy Triage — calcula severidade e dispara push instantâneo ao Dr. Edilson
// quando red flags ou score >= 0.75 forem detectados ("furar a fila").
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const body = await req.json();
    const { whatsapp, lead_id, symptoms } = body || {};

    if (!symptoms || typeof symptoms !== "object") {
      return new Response(JSON.stringify({ error: "symptoms (object) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Compute fuzzy severity via DB function
    const { data: sev, error: sevErr } = await supabase.rpc("calculate_fuzzy_severity", { symptoms });
    if (sevErr) throw sevErr;

    const score = Number(sev?.score ?? 0);
    const isUrgent = Boolean(sev?.is_urgent);
    const redFlags: string[] = sev?.red_flags ?? [];

    // 2) Persist
    const { data: row, error: insErr } = await supabase
      .from("brisa_triage_severity")
      .insert({
        lead_id: lead_id ?? null,
        whatsapp: whatsapp ?? null,
        symptoms,
        severity_score: score,
        is_urgent: isUrgent,
        red_flags: redFlags,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    // 3) "Furar a fila": notifica Dr. Edilson se urgente
    let notified = false;
    if (isUrgent) {
      const masked = whatsapp ? whatsapp.replace(/(\d{4})(\d+)(\d{2})/, "$1****$3") : "n/d";
      const flagsTxt = redFlags.length ? redFlags.join(", ") : "score crítico sem termo específico";
      const msg = [
        "🚨 *TRIAGEM URGENTE — BRISA FUZZY*",
        `Score: *${(score * 100).toFixed(0)}%* (≥75% = prioridade)`,
        `Red flags: ${flagsTxt}`,
        `Paciente WhatsApp: ${masked}`,
        `ID triagem: ${row?.id}`,
        "",
        "_Atenda ASAP — paciente furou a fila por sintomas graves._",
      ].join("\n");

      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
          body: JSON.stringify({ phone: ADMIN_WHATSAPP, message: msg }),
        });
        notified = r.ok;
      } catch (_) {
        notified = false;
      }

      if (notified && row?.id) {
        await supabase
          .from("brisa_triage_severity")
          .update({ notified_doctor_at: new Date().toISOString() })
          .eq("id", row.id);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        triage_id: row?.id,
        severity_score: score,
        is_urgent: isUrgent,
        red_flags: redFlags,
        doctor_notified: notified,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    console.error("[brisa-fuzzy-triage]", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
