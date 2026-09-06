// 🌐 Hostinger Omni-Integration v3.0 — UPSERT seguro
// Adiciona APENAS o que falta (subdomínios VPS + VAPID + Google/Meta placeholders)
// NUNCA sobrescreve Lovable Email, CDN Hostinger, DKIMs, SPF, DMARC, MX existentes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOST_API = "https://developers.hostinger.com/api";
const DOMAIN = "plantayraiz.com.br";

const GOOGLE_VERIFY = Deno.env.get("GOOGLE_SITE_VERIFICATION") ?? "PENDING_GOOGLE_CODE";
const META_VERIFY = Deno.env.get("FACEBOOK_DOMAIN_VERIFICATION") ?? "PENDING_META_CODE";

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
      body: JSON.stringify({ content: `🌐 **[Hostinger Sync v3 UPSERT]** ${content}` }),
    });
  } catch (_) {}
}

// Registros que vamos garantir (SEM mexer em nada existente)
function desiredRecords(vpsIp: string) {
  return [
    // VPS subdomains
    { type: "A", name: "n8n", ttl: 3600, records: [{ content: vpsIp }] },
    { type: "A", name: "assinaturas", ttl: 3600, records: [{ content: vpsIp }] },
    { type: "A", name: "analytics", ttl: 3600, records: [{ content: vpsIp }] },
    { type: "A", name: "api", ttl: 3600, records: [{ content: vpsIp }] },
    // Push VAPID
    { type: "TXT", name: "_vapid_subject", ttl: 3600, records: [{ content: "mailto:contato@plantayraiz.com.br" }] },
    // Google Search Console
    { type: "TXT", name: "@", ttl: 3600, records: [{ content: `google-site-verification=${GOOGLE_VERIFY}` }] },
    // Meta Business / CAPI
    { type: "TXT", name: "@", ttl: 3600, records: [{ content: `facebook-domain-verification=${META_VERIFY}` }] },
  ];
}

// Verifica se um registro alvo já existe na zona atual (idempotência)
function alreadyExists(zone: any[], target: { type: string; name: string; records: any[] }) {
  const targetContent = target.records[0]?.content?.toString() ?? "";
  return zone.some((r) =>
    r.type === target.type &&
    r.name === target.name &&
    Array.isArray(r.records) &&
    r.records.some((x: any) => {
      const c = String(x.content ?? "").replace(/^"|"$/g, "");
      return c === targetContent || c.includes(targetContent.split("=")[0] ?? "@@@");
    }),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


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

  // 1. Sanity-check
  recordStep("list_domains", await hAPI("/domains/v1/portfolio"));

  // 2. VPS — auto-fetch IP
  const vpsList = await hAPI("/vps/v1/virtual-machines");
  recordStep("list_vps", vpsList);
  const vms: any[] = Array.isArray(vpsList.body) ? vpsList.body : [];
  const primaryVm = vms[0];
  const vpsIp = primaryVm?.ipv4?.[0]?.address || primaryVm?.public_ip || primaryVm?.ip;
  recordStep("vps_ip_resolved", { ok: !!vpsIp, status: vpsIp ? 200 : 500, body: { vpsIp, vmId: primaryVm?.id } });
  if (!vpsIp) {
    return new Response(JSON.stringify({ error: "no VPS IP", steps }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Snapshot zona atual
  const before = await hAPI(`/dns/v1/zones/${DOMAIN}`);
  recordStep("dns_snapshot_before", { ok: before.ok, status: before.status, body: { count: Array.isArray(before.body) ? before.body.length : 0 } });
  const zone: any[] = Array.isArray(before.body) ? before.body : [];

  // 4. UPSERT — aplica só o que falta
  const desired = desiredRecords(vpsIp);
  const toApply: any[] = [];
  const skipped: any[] = [];
  for (const d of desired) {
    if (alreadyExists(zone, d)) {
      skipped.push({ type: d.type, name: d.name, reason: "already_present" });
    } else {
      toApply.push(d);
    }
  }
  recordStep("plan", { ok: true, status: 200, body: { will_add: toApply.length, skipped: skipped.length, skipped_details: skipped } });

  // PUT com overwrite:false → merge (a Hostinger anexa em vez de substituir)
  if (toApply.length > 0) {
    const merge = await hAPI(`/dns/v1/zones/${DOMAIN}`, {
      method: "PUT",
      body: JSON.stringify({ overwrite: false, zone: toApply }),
    });
    recordStep("dns_upsert", merge);
  } else {
    recordStep("dns_upsert", { ok: true, status: 204, body: { note: "nada a fazer, zona já completa" } });
  }

  // 5. Snapshot pós-upsert
  const after = await hAPI(`/dns/v1/zones/${DOMAIN}`);
  recordStep("dns_snapshot_after", { ok: after.ok, status: after.status, body: { count: Array.isArray(after.body) ? after.body.length : 0 } });

  // 6. VPS metrics + snapshot semanal
  const dateTo = new Date().toISOString();
  const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  for (const vm of vms) {
    const m = await hAPI(`/vps/v1/virtual-machines/${vm.id}/metrics?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`);
    recordStep(`vps_${vm.id}_metrics`, { ok: m.ok, status: m.status, body: { has_data: !!m.body } });
    const s = await hAPI(`/vps/v1/virtual-machines/${vm.id}/snapshot`, { method: "POST" });
    recordStep(`vps_${vm.id}_snapshot`, s);
  }

  // 7. Audit log
  const okCount = steps.filter((s) => s.ok).length;
  const failCount = steps.length - okCount;
  await supabase.from("audit_log").insert({
    action: "hostinger_sync_v3_upsert",
    table_name: "hostinger.api",
    record_id: "00000000-0000-0000-0000-000000000000",
    new_data: {
      domain: DOMAIN, vps_ip: vpsIp,
      total_steps: steps.length, ok: okCount, failed: failCount,
      added: toApply.length, skipped: skipped.length,
      pending_codes: {
        google: GOOGLE_VERIFY.startsWith("PENDING"),
        meta: META_VERIFY.startsWith("PENDING"),
      },
      executed_at: new Date().toISOString(),
      steps: steps.map((s) => ({ name: s.name, ok: s.ok, status: s.status })),
    },
  });

  await discord(
    toApply.length > 0
      ? `✅ Injeção cirúrgica de DNS concluída. Subdomínios VPS ativos no IP ${vpsIp}. (+${toApply.length} novos, ${skipped.length} já presentes, ${okCount}/${steps.length} OK)`
      : `🟢 DNS já 100% sincronizado — nada a adicionar. ${skipped.length} registros validados. VPS ${vpsIp}.`,
  );

  return new Response(
    JSON.stringify({ ok: failCount === 0, vpsIp, added: toApply.length, skipped: skipped.length, steps }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
