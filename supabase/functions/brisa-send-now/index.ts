import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;
  const u = new URL(req.url);
  const mode = u.searchParams.get("mode") || "state";
  const url = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  const instance = "brisa-bot-v2";
  const number = "5511987131241";
  const text = "🌿 Enf Brisa ON ✅ — Planta y Raiz operacional " + new Date().toLocaleString("pt-BR");
  const headers = { "Content-Type": "application/json", apikey: key };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    let ep = "", init: RequestInit;
    if (mode === "state") { ep = `${url}/instance/connectionState/${instance}`; init = { method: "GET", headers, signal: ctrl.signal }; }
    else if (mode === "fetch") { ep = `${url}/instance/fetchInstances`; init = { method: "GET", headers, signal: ctrl.signal }; }
    else { ep = `${url}/message/sendText/${instance}`; init = { method: "POST", headers, body: JSON.stringify({ number, text }), signal: ctrl.signal }; }
    const r = await fetch(ep, init);
    const body = await r.text();
    return new Response(JSON.stringify({ mode, ep, status: r.status, body: body.slice(0, 1500) }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ mode, error: e instanceof Error ? e.message : String(e) }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally { clearTimeout(t); }
});
