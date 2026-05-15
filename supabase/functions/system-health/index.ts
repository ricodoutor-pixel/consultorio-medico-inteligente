import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const getFirstEnv = (...names: string[]) => {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

      // 2. ManyChat check
      const mcStart = Date.now();
      const MANYCHAT_API_KEY = Deno.env.get("MANYCHAT_API_KEY");
      if (MANYCHAT_API_KEY) {
        try {
          const mcRes = await fetch("https://api.manychat.com/fb/page/getInfo", {
            headers: { Authorization: `Bearer ${MANYCHAT_API_KEY}` },
          });
          const mcBody = await mcRes.text();
          checks.manychat = { ok: mcRes.ok, responseTime: Date.now() - mcStart, status: mcRes.status };
        } catch (e: any) {
          checks.manychat = { ok: false, responseTime: Date.now() - mcStart, error: e.message };
        }
      } else {
        checks.manychat = { ok: false, responseTime: 0, error: "API key not configured" };
      }

      // 3. Mercado Pago check
      const mpStart = Date.now();
      const MP_TOKEN = getFirstEnv("MERCADO_PAGO_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN", "MERCADO_PAGO_API_KEY");
      if (MP_TOKEN) {
        try {
          const mpRes = await fetch("https://api.mercadopago.com/v1/payment_methods", {
            headers: { Authorization: `Bearer ${MP_TOKEN}` },
          });
          const mpBody = await mpRes.text();
          checks.mercadopago = { ok: mpRes.ok, responseTime: Date.now() - mpStart, status: mpRes.status };
        } catch (e: any) {
          checks.mercadopago = { ok: false, responseTime: Date.now() - mpStart, error: e.message };
        }
      } else {
        checks.mercadopago = { ok: false, responseTime: 0, error: "Access token not configured" };
      }

      // 4. Edge Functions check (self-test)
      checks.edge_functions = { ok: true, responseTime: 0, note: "Running from edge function" };

      // 5. Automation stats
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
