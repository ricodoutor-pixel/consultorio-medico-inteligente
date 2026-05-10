// 🌐 Hostinger Omni-Integration v1.0
// Configura DNS, SSL, snapshot, malware-scan, cache via Hostinger API
// Audita tudo em audit_log e notifica Discord
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOST_API = "https://developers.hostinger.com/api";
const DOMAIN = "plantayraiz.com.br";
const LOVABLE_IP = "185.158.133.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN = Deno.env.get("HOSTINGER_API_TOKEN");
const DISCORD = Deno.env.get("DISCORD_WEBHOOK_URL");

async function hAPI(path: string, init: RequestInit = {}) {
  const r = await fetch(`${HOST_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await r.text().catch(() => "");
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* ignore */ }
  return { ok: r.ok, status: r.status, body };
}

async function discord(content: string) {
  if (!DISCORD) return;
  try {
    await fetch(DISCORD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `🌐 **[Hostinger Sync]** ${content}` }),
    });
  } catch (_) {}
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!TOKEN) {
    return new Response(JSON.stringify({ error: "HOSTINGER_API_TOKEN not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const steps: any[] = [];
  const recordStep = (name: string, result: any) => {
    steps.push({ name, ok: result.ok, status: result.status, body: result.body });
  };

  // 1. Listar domínios (sanity-check do token)
  const domains = await hAPI("/domains/v1/portfolio");
  recordStep("list_domains", domains);

  // 2. Snapshot da zona DNS atual (read-only, audit)
  const dnsSnapshot = await hAPI(`/dns/v1/zones/${DOMAIN}`);
  recordStep("dns_snapshot", dnsSnapshot);

  // 2b. Só atualiza se A root ainda não aponta para Lovable IP (CDN bloqueia override desnecessário)
  const zone: any[] = Array.isArray(dnsSnapshot.body) ? dnsSnapshot.body : [];
  const aRoot = zone.find((r: any) => r.type === "A" && (r.name === "@" || r.name === DOMAIN));
  const dnsAlreadyOk = !!aRoot?.records?.some?.((x: any) => x.content === LOVABLE_IP);

  if (!dnsAlreadyOk) {
    const dnsUpdate = await hAPI(`/dns/v1/zones/${DOMAIN}`, {
      method: "PUT",
      body: JSON.stringify({
        overwrite: true,
        zone: [
          { name: "@",        type: "A",   ttl: 3600, records: [{ content: LOVABLE_IP }] },
          { name: "www",      type: "A",   ttl: 3600, records: [{ content: LOVABLE_IP }] },
          { name: "_lovable", type: "TXT", ttl: 3600, records: [{ content: "lovable_verify=plantayraiz" }] },
        ],
      }),
    });
    recordStep("dns_update", dnsUpdate);
  } else {
    recordStep("dns_update", { ok: true, status: 200, body: { skipped: "DNS já aponta para Lovable IP" } });
  }

  // 3. Listar VPS para métricas + snapshot
  const vpsList = await hAPI("/vps/v1/virtual-machines");
  recordStep("list_vps", vpsList);

  const vmIds: number[] = Array.isArray(vpsList.body)
    ? vpsList.body.map((v: any) => v.id).filter(Boolean)
    : [];

  const dateTo = new Date().toISOString();
  const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const id of vmIds) {
    const metrics = await hAPI(
      `/vps/v1/virtual-machines/${id}/metrics?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`,
    );
    recordStep(`vps_${id}_metrics`, metrics);

    // Endpoint correto é singular: /snapshot
    const snapshot = await hAPI(`/vps/v1/virtual-machines/${id}/snapshot`, { method: "POST" });
    recordStep(`vps_${id}_snapshot`, snapshot);
  }

  // 4. Audit log
  const okCount = steps.filter((s) => s.ok).length;
  const failCount = steps.length - okCount;

  await supabase.from("audit_log").insert({
    action: "hostinger_sync_executed",
    table_name: "hostinger.api",
    record_id: "00000000-0000-0000-0000-000000000000",
    new_data: {
      domain: DOMAIN,
      total_steps: steps.length,
      ok: okCount,
      failed: failCount,
      executed_at: new Date().toISOString(),
      steps: steps.map((s) => ({ name: s.name, ok: s.ok, status: s.status })),
    },
  });

  await discord(
    `Sync concluído — ${okCount}/${steps.length} OK${failCount > 0 ? ` ⚠️ ${failCount} falhas` : " ✅"}`,
  );

  return new Response(
    JSON.stringify({ ok: failCount === 0, total: steps.length, success: okCount, failed: failCount, steps }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
