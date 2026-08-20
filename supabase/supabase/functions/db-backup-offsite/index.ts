// Daily encrypted off-site backup of critical tables → GitHub Release (private repo)
// AES-256-GCM via SHA-256(BRISA_CEO_SECRET_KEY). No JWT (cron-invoked).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPO = "ricodoutor-pixel/consultorio-medico-inteligente";
const CRITICAL_TABLES = [
  "profiles",
  "user_roles",
  "doctors",
  "consultations",
  "prescriptions",
  "prescription_hash_audit",
  "orders",
  "orientacao_tecnica_orders",
  "subscriptions",
  "affiliate_wallets",
  "audit_log",
  "financial_reconciliation",
  "whatsapp_brisa_log",
  "manus_ceo_reports",
  "error_autohealing",
  "system_settings",
];

async function deriveKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt"]);
}

async function encryptAesGcm(plain: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain),
  );
  // [iv(12) | ciphertext+tag]
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const ghToken =
    Deno.env.get("GITHUB_BACKUP_TOKEN") ||
    Deno.env.get("GITHUB_TOKEN") ||
    Deno.env.get("GH_TOKEN");
  const encSecret = Deno.env.get("BRISA_CEO_SECRET_KEY");

  if (!ghToken) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_github_token", hint: "set GITHUB_BACKUP_TOKEN" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!encSecret) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_BRISA_CEO_SECRET_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const startedAt = new Date();
  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const tag = `backup-${stamp}`;

  // Dump tables to NDJSON
  const stats: Record<string, number> = {};
  const chunks: string[] = [];
  for (const table of CRITICAL_TABLES) {
    try {
      let from = 0;
      const PAGE = 1000;
      let total = 0;
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .range(from, from + PAGE - 1);
        if (error) {
          chunks.push(JSON.stringify({ __error: table, message: error.message }) + "\n");
          break;
        }
        if (!data || data.length === 0) break;
        for (const row of data) {
          chunks.push(JSON.stringify({ __t: table, ...row }) + "\n");
        }
        total += data.length;
        if (data.length < PAGE) break;
        from += PAGE;
      }
      stats[table] = total;
    } catch (e) {
      stats[table] = -1;
      chunks.push(JSON.stringify({ __exception: table, message: String(e) }) + "\n");
    }
  }

  const ndjson = new TextEncoder().encode(chunks.join(""));
  const key = await deriveKey(encSecret);
  const encrypted = await encryptAesGcm(ndjson, key);

  // Manifest (clear text, small)
  const manifest = {
    tag,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    repo: REPO,
    table_counts: stats,
    plain_bytes: ndjson.length,
    encrypted_bytes: encrypted.length,
    cipher: "AES-256-GCM (iv|ct||tag), key=SHA256(BRISA_CEO_SECRET_KEY)",
  };

  // 1) Create GitHub Release
  const ghHeaders = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const releaseRes = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
    method: "POST",
    headers: { ...ghHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      tag_name: tag,
      name: `Encrypted DB Backup ${stamp}`,
      body: "Automated encrypted backup. AES-256-GCM. Do not share.",
      draft: false,
      prerelease: true,
    }),
  });

  if (!releaseRes.ok) {
    const txt = await releaseRes.text();
    return new Response(
      JSON.stringify({ ok: false, error: "github_release_failed", status: releaseRes.status, body: txt }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const release = await releaseRes.json();
  const uploadUrlBase = (release.upload_url as string).replace("{?name,label}", "");

  // 2) Upload encrypted asset
  const upRes = await fetch(`${uploadUrlBase}?name=db-${stamp}.bin.enc`, {
    method: "POST",
    headers: { ...ghHeaders, "Content-Type": "application/octet-stream" },
    body: encrypted,
  });
  const upJson = upRes.ok ? await upRes.json() : { error: await upRes.text() };

  // 3) Upload manifest
  await fetch(`${uploadUrlBase}?name=manifest-${stamp}.json`, {
    method: "POST",
    headers: { ...ghHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(manifest, null, 2),
  });

  // 4) Audit log
  await supabase.from("audit_log").insert({
    record_id: crypto.randomUUID(),
    action: "db_backup_offsite",
    table_name: "_system",
    new_data: {
      tag,
      release_url: release.html_url,
      table_counts: stats,
      encrypted_bytes: encrypted.length,
      asset_ok: upRes.ok,
    },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      tag,
      release_url: release.html_url,
      table_counts: stats,
      encrypted_bytes: encrypted.length,
      asset_ok: upRes.ok,
      asset_response: upJson?.name || upJson?.error || null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
