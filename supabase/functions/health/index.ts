// /api/health — Real health endpoint (substitui SPA fallback)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const BOOT_TIME = Date.now();
const VERSION = "5.1.0-omni";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = performance.now();
  let dbStatus: "up" | "down" = "down";
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const tPing = performance.now();
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1);
    dbLatencyMs = Math.round(performance.now() - tPing);
    if (error) {
      dbError = error.message;
    } else {
      dbStatus = "up";
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const uptimeSec = Math.floor((Date.now() - BOOT_TIME) / 1000);
  const overall = dbStatus === "up" ? "healthy" : "degraded";

  return new Response(
    JSON.stringify({
      status: overall,
      version: VERSION,
      service: "planta-y-raiz-edge",
      uptime_seconds: uptimeSec,
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: dbStatus, latency_ms: dbLatencyMs, error: dbError },
        edge_runtime: { status: "up", region: Deno.env.get("DENO_REGION") ?? "unknown" },
      },
      response_time_ms: Math.round(performance.now() - t0),
    }, null, 2),
    {
      status: overall === "healthy" ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
