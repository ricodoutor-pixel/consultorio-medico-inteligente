import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const headers = { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (req.method !== "GET" && req.method !== "POST") return new Response(JSON.stringify({ ok: false }), { status: 405, headers });
  const checkedAt = new Date().toISOString();
  try {
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Unavailable");
    const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) } });
    const { data, error } = await client.rpc("access_health_check");
    const ok = !error && data === 1;
    return new Response(JSON.stringify({ ok, checked_at: checkedAt }), { status: ok ? 200 : 503, headers });
  } catch {
    return new Response(JSON.stringify({ ok: false, checked_at: checkedAt }), { status: 503, headers });
  }
});