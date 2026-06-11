// Admin helper to logout + delete a stale Evolution instance.
// Call: POST /brisa-evolution-admin  body: { action:"delete", instance:"plantayraiz" }
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

let URL_BASE = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
if (URL_BASE && !/^https?:\/\//i.test(URL_BASE)) URL_BASE = `https://${URL_BASE}`;
const KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

async function call(path: string, method = "GET") {
  try {
    const r = await fetch(`${URL_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", apikey: KEY },
    });
    return { status: r.status, body: (await r.text()).slice(0, 800) };
  } catch (e) {
    return { status: 0, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!URL_BASE || !KEY) {
    return new Response(JSON.stringify({ ok: false, error: "no_creds" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let body: any = {};
  try { body = await req.json(); } catch {}
  const action = body.action || "list";
  const instance = encodeURIComponent(body.instance || "");
  const steps: Record<string, unknown> = {};

  if (action === "delete" && instance) {
    steps.restart = await call(`/instance/restart/${instance}`, "POST");
    await new Promise((r) => setTimeout(r, 2500));
    steps.logout = await call(`/instance/logout/${instance}`, "DELETE");
    await new Promise((r) => setTimeout(r, 2500));
    steps.delete1 = await call(`/instance/delete/${instance}`, "DELETE");
    await new Promise((r) => setTimeout(r, 1500));
    // try alternate method some Evolution forks accept
    steps.delete2 = await call(`/instance/delete/${instance}`, "POST");
    await new Promise((r) => setTimeout(r, 1500));
  }
  steps.fetchInstances = await call(`/instance/fetchInstances`);

  return new Response(JSON.stringify({ ok: true, action, instance: body.instance, steps }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
