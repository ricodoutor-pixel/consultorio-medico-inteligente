// Public health snapshot — feeds /status page (no auth required)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Status = "operational" | "degraded" | "outage";

function classify(latencyMs: number, isUp: boolean): Status {
  if (!isUp) return "outage";
  if (latencyMs > 2000) return "degraded";
  return "operational";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1) Mercado Pago contingency flag
    const { data: contingency } = await supabase
      .from("system_settings")
      .select("value, updated_at")
      .eq("key", "mp_contingency_mode")
      .maybeSingle();

    // 2) Brisa queue (mensagens últimas 1h)
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: brisaInbound } = await supabase
      .from("whatsapp_brisa_log")
      .select("*", { count: "exact", head: true })
      .eq("direction", "inbound")
      .gte("created_at", sinceHour);

    // 3) Erros críticos abertos
    const { count: criticalErrors } = await supabase
      .from("error_autohealing")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .in("severity", ["high", "critical"]);

    // 4) Cron health
    const { data: crons } = await supabase.rpc("get_cron_health", { _window_hours: 26 });
    const cronTotal = (crons || []).length;
    const cronOverdue = (crons || []).filter((c: any) => c.is_overdue).length;

    // 5) Latency (DB ping)
    const t0 = performance.now();
    await supabase.from("system_settings").select("key").limit(1);
    const dbLatency = Math.round(performance.now() - t0);

    const mpStatus: Status = contingency?.value === true || contingency?.value === "true"
      ? "outage"
      : "operational";

    const services = [
      { name: "API & Database", status: classify(dbLatency, true) },
      { name: "Pagamentos (Mercado Pago)", status: mpStatus },
      {
        name: "Enfª Brisa (WhatsApp)",
        status: ((brisaInbound ?? 0) > 0 ? "operational" : "degraded") as Status,
      },
      {
        name: "Auditoria & Crons",
        status: (cronOverdue === 0
          ? "operational"
          : cronOverdue > 2
          ? "outage"
          : "degraded") as Status,
      },
      {
        name: "Detecção de Erros (AI Healing)",
        status: ((criticalErrors ?? 0) === 0 ? "operational" : "degraded") as Status,
      },
    ];

    const overall: Status = services.some(s => s.status === "outage")
      ? "outage"
      : services.some(s => s.status === "degraded") ? "degraded" : "operational";

    return new Response(
      JSON.stringify({
        ok: true,
        overall,
        services,
        generated_at: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30",
        },
      },
    );
  } catch (e) {
    console.error("[status-public] error:", e);
    return new Response(
      JSON.stringify({ ok: false, overall: "outage", error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
