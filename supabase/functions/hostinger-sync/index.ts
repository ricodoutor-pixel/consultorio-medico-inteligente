// 🌐 Hostinger Omni-Integration v2.0 — DNS Overwrite + VPS Audit
// Aplica zona DNS completa (Lovable + Resend + VPS subdomains + Meta/Google + VAPID)
// Auto-fetch VPS IP. Placeholders para códigos de verificação (editar depois).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOST_API = "https://developers.hostinger.com/api";
const DOMAIN = "plantayraiz.com.br";
const LOVABLE_IP = "185.158.133.1";

// Placeholders — substituir no painel Hostinger ou via update_secret depois
const LOVABLE_VERIFY = Deno.env.get("LOVABLE_VERIFY_CODE") ?? "PLACEHOLDER_LOVABLE_VERIFY";
const GOOGLE_VERIFY = Deno.env.get("GOOGLE_SITE_VERIFICATION") ?? "PLACEHOLDER_GOOGLE_CODE";
const META_VERIFY = Deno.env.get("FACEBOOK_DOMAIN_VERIFICATION") ?? "PLACEHOLDER_META_CODE";

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
      body: JSON.stringify({ content: `🌐 **[Hostinger Sync v2]** ${content}` }),
    });
  } catch (_) {}
}

function buildZoneRecords(vpsIp: string) {
  return [
    // 🌐 Hospedagem Lovable (root + www)
    { type: "A", name: "@", ttl: 3600, records: [{ content: LOVABLE_IP }] },
    { type: "A", name: "www", ttl: 3600, records: [{ content: LOVABLE_IP }] },
    { type: "TXT", name: "_lovable", ttl: 300, records: [{ content: `lovable_verify=${LOVABLE_VERIFY}` }] },
    { type: "CNAME", name: "cdn", ttl: 3600, records: [{ content: "cdn.hostinger.com." }] },

    // 📧 E-mail Hostinger + Resend
    { type: "MX", name: "@", ttl: 3600, records: [
      { content: "mx1.hostinger.com.", priority: 10 },
      { content: "mx2.hostinger.com.", priority: 20 },
    ]},
    { type: "TXT", name: "@", ttl: 3600, records: [
      { content: "v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all" },
    ]},
    { type: "TXT", name: "_dmarc", ttl: 3600, records: [
      { content: "v=DMARC1; p=quarantine; rua=mailto:dmarc@plantayraiz.com.br" },
    ]},
    { type: "CNAME", name: "resend._domainkey", ttl: 3600, records: [{ content: "dkim.resend.com." }] },

    // ⚙️ Subdomínios soberanos (VPS)
    { type: "A", name: "n8n", ttl: 3600, records: [{ content: vpsIp }] },
    { type: "A", name: "assinaturas", ttl: 3600, records: [{ content: vpsIp }] },
    { type: "A", name: "analytics", ttl: 3600, records: [{ content: vpsIp }] },
    { type: "A", name: "api", ttl: 3600, records: [{ content: vpsIp }] },

    // 💬 Verificações Meta + Google
    { type: "TXT", name: "@", ttl: 3600, records: [
      { content: `google-site-verification=${GOOGLE_VERIFY}` },
      { content: `facebook-domain-verification=${META_VERIFY}` },
    ]},

    // 🛡️ VAPID Push
    { type: "TXT", name: "_vapid_subject", ttl: 3600, records: [
      { content: "mailto:contato@plantayraiz.com.br" },
    ]},
  ];
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

  // 1. Sanity-check token
  const domains = await hAPI("/domains/v1/portfolio");
  recordStep("list_domains", domains);

  // 2. VPS list — pega IP público da primeira VM ativa
  const vpsList = await hAPI("/vps/v1/virtual-machines");
  recordStep("list_vps", vpsList);
  const vms: any[] = Array.isArray(vpsList.body) ? vpsList.body : [];
  const primaryVm = vms[0];
  const vpsIp =
    primaryVm?.ipv4?.[0]?.address ||
    primaryVm?.public_ip ||
    primaryVm?.ip ||
    LOVABLE_IP; // fallback
  recordStep("vps_ip_resolved", { ok: !!vpsIp, status: 200, body: { vpsIp, vmId: primaryVm?.id } });

  // 3. Snapshot da zona atual (audit pre-overwrite)
  const before = await hAPI(`/dns/v1/zones/${DOMAIN}`);
  recordStep("dns_snapshot_before", before);

  // 4. Overwrite total da zona
  const records = buildZoneRecords(vpsIp);
  const put = await hAPI(`/dns/v1/zones/${DOMAIN}`, {
    method: "PUT",
    body: JSON.stringify({ overwrite: true, zone: records }),
  });
  recordStep("dns_overwrite", put);

  // 5. Snapshot pós-aplicação
  const after = await hAPI(`/dns/v1/zones/${DOMAIN}`);
  recordStep("dns_snapshot_after", after);

  // 6. VPS metrics + snapshot semanal (continua igual)
  const dateTo = new Date().toISOString();
  const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  for (const vm of vms) {
    const metrics = await hAPI(
      `/vps/v1/virtual-machines/${vm.id}/metrics?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`,
    );
    recordStep(`vps_${vm.id}_metrics`, metrics);
    const snap = await hAPI(`/vps/v1/virtual-machines/${vm.id}/snapshot`, { method: "POST" });
    recordStep(`vps_${vm.id}_snapshot`, snap);
  }

  // 7. Audit
  const okCount = steps.filter((s) => s.ok).length;
  const failCount = steps.length - okCount;

  await supabase.from("audit_log").insert({
    action: "hostinger_sync_v2_executed",
    table_name: "hostinger.api",
    record_id: "00000000-0000-0000-0000-000000000000",
    new_data: {
      domain: DOMAIN,
      vps_ip: vpsIp,
      total_steps: steps.length,
      ok: okCount,
      failed: failCount,
      placeholders: {
        lovable_verify: LOVABLE_VERIFY.startsWith("PLACEHOLDER"),
        google_verify: GOOGLE_VERIFY.startsWith("PLACEHOLDER"),
        meta_verify: META_VERIFY.startsWith("PLACEHOLDER"),
      },
      executed_at: new Date().toISOString(),
      steps: steps.map((s) => ({ name: s.name, ok: s.ok, status: s.status })),
    },
  });

  await discord(
    `Sync v2 concluído — ${okCount}/${steps.length} OK${failCount ? ` ⚠️ ${failCount} falhas` : " ✅"} | VPS IP: \`${vpsIp}\``,
  );

  return new Response(
    JSON.stringify({ ok: failCount === 0, vpsIp, total: steps.length, success: okCount, failed: failCount, steps }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
