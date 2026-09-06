// Brisa Evolution Reconnect — força reconnect na instância ativa para gerar novo QR.
// Use quando o Baileys cai com "Connection Closed" / disconnectionReasonCode 401.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

let URL_BASE = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
if (URL_BASE && !/^https?:\/\//i.test(URL_BASE)) URL_BASE = `https://${URL_BASE}`;
const KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz_nova";

async function call(path: string, method = "GET", body?: unknown) {
  const r = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", apikey: KEY },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: (await r.text()).slice(0, 1500) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;
  if (!URL_BASE || !KEY) {
    return new Response(JSON.stringify({ ok: false, error: "no_evolution_creds" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const inst = encodeURIComponent(INSTANCE);
  const steps: Record<string, unknown> = {};
  steps.before = await call(`/instance/connectionState/${inst}`);
  steps.restart = await call(`/instance/restart/${inst}`, "POST").catch((e) => ({ error: String(e) }));
  await new Promise((r) => setTimeout(r, 1500));
  steps.connect = await call(`/instance/connect/${inst}`).catch((e) => ({ error: String(e) }));
  await new Promise((r) => setTimeout(r, 1000));
  steps.after = await call(`/instance/connectionState/${inst}`);

  // Try to extract QR base64 if returned
  let qr: string | null = null;
  try {
    const j = JSON.parse((steps.connect as any).body);
    qr = j?.base64 || j?.qrcode?.base64 || j?.code || null;
  } catch {}

  return new Response(JSON.stringify({
    ok: true,
    instance: INSTANCE,
    qr_base64: qr,
    qr_manager_url: `${URL_BASE}/manager`,
    steps,
    next: "Escaneie o QR no WhatsApp +55 11 99136-3154 (Aparelhos conectados).",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
