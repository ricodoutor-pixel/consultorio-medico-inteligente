import { requireServiceAuth } from "../_shared/service-auth.ts";
// SRE Alert dispatcher → Discord webhook
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertBody {
  title?: string;
  message?: string;
  severity?: "info" | "success" | "warning" | "critical";
  context?: Record<string, unknown>;
}

const COLOR = {
  info: 0x3498db,
  success: 0x2ecc71,
  warning: 0xf39c12,
  critical: 0xe74c3c,
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const url = Deno.env.get("DISCORD_SRE_WEBHOOK_URL");
  if (!url) {
    return new Response(JSON.stringify({ error: "DISCORD_SRE_WEBHOOK_URL not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: AlertBody = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const severity = body.severity ?? "info";
  const title = body.title ?? "🛰️ Planta y Raiz SRE Alert";
  const message = body.message ?? "Sem detalhes.";

  const fields = body.context
    ? Object.entries(body.context).map(([name, value]) => ({
        name: name.slice(0, 256),
        value: String(value).slice(0, 1024),
        inline: true,
      }))
    : [];

  const payload = {
    username: "Manus CEO • SRE",
    embeds: [{
      title: title.slice(0, 256),
      description: message.slice(0, 4000),
      color: COLOR[severity],
      timestamp: new Date().toISOString(),
      footer: { text: `severity=${severity} • plantayraiz.com.br` },
      fields,
    }],
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const txt = await r.text();
    return new Response(JSON.stringify({ ok: false, status: r.status, body: txt }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, dispatched_at: new Date().toISOString() }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
