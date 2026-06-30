// Diagnostic: list instances + connection state for the configured instance.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let url = Deno.env.get("EVOLUTION_API_URL") || "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  const instance = Deno.env.get("EVOLUTION_INSTANCE") || "brisa-bot-v2";
  const base = url.replace(/\/$/, "");
  const headers = { apikey: key };

  async function fetchJ(u: string) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(u, { headers, signal: ctrl.signal });
      const txt = await r.text().catch(() => "");
      return { status: r.status, body: txt.slice(0, 1500) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    } finally { clearTimeout(t); }
  }

  const [state, list] = await Promise.all([
    fetchJ(`${base}/instance/connectionState/${encodeURIComponent(instance)}`),
    fetchJ(`${base}/instance/fetchInstances`),
  ]);

  return new Response(JSON.stringify({ base, instance, state, list }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
