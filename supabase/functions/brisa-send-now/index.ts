import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  const instance = "brisa-bot-v2";
  const number = "5511987131241";
  const text = "🌿 Enf Brisa ON ✅\n\nPlanta y Raiz 100% operacional — " + new Date().toLocaleString("pt-BR");

  async function tryFetch(label: string, ep: string, init: RequestInit, timeout = 30000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(ep, { ...init, signal: ctrl.signal });
      const body = await r.text();
      return { label, ep, status: r.status, body: body.slice(0, 800) };
    } catch (e) {
      return { label, ep, error: e instanceof Error ? e.message : String(e) };
    } finally {
      clearTimeout(t);
    }
  }

  const headers = { "Content-Type": "application/json", apikey: key };

  const state = await tryFetch("state", `${url}/instance/connectionState/${instance}`, { method: "GET", headers }, 15000);
  const fetchInst = await tryFetch("instances", `${url}/instance/fetchInstances?instanceName=${instance}`, { method: "GET", headers }, 15000);
  const send1 = await tryFetch("sendText", `${url}/message/sendText/${instance}`, {
    method: "POST", headers, body: JSON.stringify({ number, text }),
  }, 30000);
  const send2 = await tryFetch("sendText-textMessage", `${url}/message/sendText/${instance}`, {
    method: "POST", headers, body: JSON.stringify({ number, textMessage: { text } }),
  }, 30000);

  return new Response(JSON.stringify({ url, instance, state, fetchInst, send1, send2 }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
