import { requireServiceAuth } from "../_shared/service-auth.ts";
// Daily SRE audit — pings critical endpoints and dispatches Discord alert via sre-alert
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENDPOINTS = [
  { name: "frontend", url: "https://plantayraiz.com.br" },
  { name: "api_health_redirect", url: "https://plantayraiz.com.br/api/health" },
  { name: "edge_health", url: "https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/health" },
  { name: "api_subdomain", url: "https://api.plantayraiz.com.br" },
  { name: "n8n_subdomain", url: "https://n8n.plantayraiz.com.br" },
];

async function probe(url: string) {
  const t0 = performance.now();
  try {
    const r = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    return { status: r.status, latency_ms: Math.round(performance.now() - t0), ok: r.status < 500 };
  } catch (e) {
    return { status: 0, latency_ms: Math.round(performance.now() - t0), ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


  const results = await Promise.all(
    ENDPOINTS.map(async (e) => ({ ...e, ...(await probe(e.url)) }))
  );

  const failures = results.filter((r) => !r.ok);
  const severity = failures.length === 0 ? "success" : failures.length >= 3 ? "critical" : "warning";

  const context: Record<string, string> = {};
  for (const r of results) {
    context[r.name] = `HTTP ${r.status} • ${r.latency_ms}ms`;
  }

  const discordUrl = Deno.env.get("DISCORD_SRE_WEBHOOK_URL");
  if (discordUrl) {
    const title = severity === "success"
      ? "✅ Auditoria Diária Lovable: Sistema Validado"
      : `⚠️ Auditoria Diária: ${failures.length} endpoint(s) com falha`;

    const message = failures.length === 0
      ? "Todos os endpoints críticos responderam normalmente."
      : `Falhas: ${failures.map((f) => f.name).join(", ")}`;

    await fetch(discordUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Manus CEO • SRE Daily",
        embeds: [{
          title,
          description: message,
          color: severity === "success" ? 0x2ecc71 : severity === "critical" ? 0xe74c3c : 0xf39c12,
          timestamp: new Date().toISOString(),
          footer: { text: `daily-audit • plantayraiz.com.br` },
          fields: Object.entries(context).map(([name, value]) => ({ name, value, inline: true })),
        }],
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true, severity, results }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
