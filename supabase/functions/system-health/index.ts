import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const getFirstEnv = (...names: string[]) => {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return null;
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { action } = await req.json();

    if (action === "health") {
      const checks: Record<string, any> = {};
      const start = Date.now();

      // 1. Database check
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from("profiles").select("id").limit(1);
      checks.database = { ok: !dbError, responseTime: Date.now() - dbStart, error: dbError?.message };

      // 2. Evolution API check (WhatsApp Brisa — sistema principal)
      const evStart = Date.now();
      const EV_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
      const EV_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
      const EV_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

      if (EV_URL && EV_KEY) {
        try {
          const base = EV_URL.startsWith("http") ? EV_URL : `https://${EV_URL}`;
          const evRes = await fetch(
            `${base}/instance/connectionState/${encodeURIComponent(EV_INSTANCE)}`,
            {
              headers: { apikey: EV_KEY },
              signal: AbortSignal.timeout(6_000),
            }
          );
          const evData = evRes.ok ? await evRes.json() : null;
          checks.evolution_api = {
            ok: evRes.ok && evData?.instance?.state === "open",
            responseTime: Date.now() - evStart,
            status: evRes.status,
            state: evData?.instance?.state || "unknown",
            instance: EV_INSTANCE,
          };
        } catch (e: any) {
          checks.evolution_api = {
            ok: false,
            responseTime: Date.now() - evStart,
            error: e.message,
          };
        }
      } else {
        checks.evolution_api = {
          ok: false,
          responseTime: 0,
          error: "EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados",
        };
      }

      // 3. Gemini API check
      const gemStart = Date.now();
      const GEMINI_KEY = getFirstEnv("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY");
      if (GEMINI_KEY) {
        try {
          const gemRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`,
            { signal: AbortSignal.timeout(5_000) }
          );
          checks.gemini_api = {
            ok: gemRes.ok,
            responseTime: Date.now() - gemStart,
            status: gemRes.status,
          };
        } catch (e: any) {
          checks.gemini_api = { ok: false, responseTime: Date.now() - gemStart, error: e.message };
        }
      } else {
        checks.gemini_api = { ok: false, responseTime: 0, error: "GEMINI_API_KEY não configurada" };
      }

      // 4. Mercado Pago check
      const mpStart = Date.now();
      const MP_TOKEN = getFirstEnv("MERCADO_PAGO_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN", "MERCADO_PAGO_API_KEY");
      if (MP_TOKEN) {
        try {
          const mpRes = await fetch("https://api.mercadopago.com/v1/payment_methods", {
            headers: { Authorization: `Bearer ${MP_TOKEN}` },
            signal: AbortSignal.timeout(5_000),
          });
          checks.mercadopago = { ok: mpRes.ok, responseTime: Date.now() - mpStart, status: mpRes.status };
        } catch (e: any) {
          checks.mercadopago = { ok: false, responseTime: Date.now() - mpStart, error: e.message };
        }
      } else {
        checks.mercadopago = { ok: false, responseTime: 0, error: "Access token not configured" };
      }

      // 5. Edge Functions check (self-test)
      checks.edge_functions = { ok: true, responseTime: 0, note: "Running from edge function" };

      // 6. Automation stats
      const { data: pendingJobs } = await supabase
        .from("job_queue")
        .select("id", { count: "exact" })
        .eq("status", "pending");

      const { data: failedJobs } = await supabase
        .from("job_queue")
        .select("id", { count: "exact" })
        .eq("status", "failed");

      const { count: doctorsOnline } = await supabase
        .from("doctors")
        .select("id", { count: "exact", head: true })
        .eq("is_online", true);

      const { count: todayAppointments } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_at", new Date().toISOString().split("T")[0]);

      checks.automations = {
        pending_jobs: pendingJobs?.length ?? 0,
        failed_jobs: failedJobs?.length ?? 0,
        doctors_online: doctorsOnline ?? 0,
        today_appointments: todayAppointments ?? 0,
      };

      const allOk = checks.database?.ok && checks.mercadopago?.ok;
      return new Response(
        JSON.stringify({
          status: allOk ? "healthy" : "degraded",
          checks,
          totalResponseTime: Date.now() - start,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
