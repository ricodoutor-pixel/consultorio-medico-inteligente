import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/ai-gateway/, "");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // --- Auth helper ---
  async function getAuthenticatedUserId(): Promise<string | null> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return null;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    return user?.id ?? null;
  }

  async function requireAdmin(): Promise<Response | string> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return userId;
  }

  async function requireAuth(): Promise<Response | string> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return userId;
  }

  try {
    // --- /status (public) ---
    if (path === "/status" || path === "") {
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- /logs (admin only) ---
    if (path === "/logs") {
      const result = await requireAdmin();
      if (result instanceof Response) return result;

      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await serviceClient
        .from("ai_events")
        .select("id, ai_name, event_type, status, created_at, duration_ms")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify({ logs: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- /dashboard (admin only) ---
    if (path === "/dashboard") {
      const result = await requireAdmin();
      if (result instanceof Response) return result;

      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

      const [profiles, doctors, appointments, prescriptions, aiRegistry] = await Promise.all([
        serviceClient.from("profiles").select("id", { count: "exact", head: true }),
        serviceClient.from("doctors").select("id", { count: "exact", head: true }),
        serviceClient.from("appointments").select("id", { count: "exact", head: true }),
        serviceClient.from("prescriptions").select("id", { count: "exact", head: true }),
        serviceClient.from("ai_registry").select("name, status, last_heartbeat"),
      ]);

      return new Response(JSON.stringify({
        total_users: profiles.count ?? 0,
        total_doctors: doctors.count ?? 0,
        total_appointments: appointments.count ?? 0,
        total_prescriptions: prescriptions.count ?? 0,
        ai_agents: aiRegistry.data ?? [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- /orchestrate (authenticated) ---
    if (path === "/orchestrate") {
      const result = await requireAuth();
      if (result instanceof Response) return result;
      const userId = result;

      const body = await req.json();
      const { action } = body;

      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

      // Only allow users to query their own data
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      return new Response(JSON.stringify({
        success: true,
        action,
        user: { id: userId, name: profile?.full_name },
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
