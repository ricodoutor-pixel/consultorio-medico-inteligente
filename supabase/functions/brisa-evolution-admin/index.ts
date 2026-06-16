// Admin helper for Evolution instance maintenance on Railway.
// Call: POST /brisa-evolution-admin  body: { action:"list|state|connect|restart|logout|delete", instance:"plantayraiz_nova" }
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

let URL_BASE = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
if (URL_BASE && !/^https?:\/\//i.test(URL_BASE)) URL_BASE = `https://${URL_BASE}`;
const KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

async function call(path: string, method = "GET", body?: unknown) {
  try {
    const r = await fetch(`${URL_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", apikey: KEY },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: (await r.text()).slice(0, 800) };
  } catch (e) {
    return { status: 0, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;
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

  if (action === "state" && instance) {
    steps.connectionState = await call(`/instance/connectionState/${instance}`);
  }

  if (action === "connect" && instance) {
    steps.connect = await call(`/instance/connect/${instance}`);
    await new Promise((r) => setTimeout(r, 1000));
    steps.connectionState = await call(`/instance/connectionState/${instance}`);
  }

  if (action === "restart" && instance) {
    steps.restart = await call(`/instance/restart/${instance}`, "POST");
    await new Promise((r) => setTimeout(r, 1500));
    steps.connectionState = await call(`/instance/connectionState/${instance}`);
  }

  if (action === "logout" && instance) {
    steps.logout = await call(`/instance/logout/${instance}`, "DELETE");
    await new Promise((r) => setTimeout(r, 1500));
    steps.connectionState = await call(`/instance/connectionState/${instance}`);
  }

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

  if (action === "setWebhook" && instance) {
    const url = body.url as string;
    const events = (body.events as string[]) || [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED",
    ];
    // Try Evolution v2 shape first
    steps.setWebhook_v2 = await call(`/webhook/set/${instance}`, "POST", {
      webhook: { url, enabled: true, webhookByEvents: false, webhookBase64: false, events },
    });
    // Fallback v1 shape
    steps.setWebhook_v1 = await call(`/webhook/set/${instance}`, "POST", {
      url, enabled: true, webhook_by_events: false, events,
    });
    steps.getWebhook = await call(`/webhook/find/${instance}`);
  }

  if (action === "getWebhook" && instance) {
    steps.getWebhook = await call(`/webhook/find/${instance}`);
  }

  steps.fetchInstances = await call(`/instance/fetchInstances`);

  return new Response(JSON.stringify({ ok: true, action, instance: body.instance, steps }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
