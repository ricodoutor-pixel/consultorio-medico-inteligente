import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

async function probe(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    return { ok: r.ok, status: r.status };
  } catch (_) {
    return { ok: false, status: 0 };
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("prescriptions")
    .select("id, signature_hash, signed_pdf_url, signature_date, status")
    .gte("signature_date", since)
    .not("signature_date", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  let valid = 0;
  let invalid = 0;
  const failures: any[] = [];

  for (const p of rows ?? []) {
    // SECURITY: SHA-512 oficial (128 hex chars) ou SHA-256 legado (64 hex chars)
    const hashStr = String(p.signature_hash || "").trim();
    const isHex = /^[a-fA-F0-9]+$/.test(hashStr);
    const hashOk = isHex && (hashStr.length === 128 || hashStr.length === 64);
    let pdfOk = false;
    let httpStatus: number | null = null;
    if (p.signed_pdf_url) {
      const r = await probe(p.signed_pdf_url);
      pdfOk = r.ok;
      httpStatus = r.status;
    }
    const isValid = hashOk && pdfOk;
    if (isValid) valid++;
    else {
      invalid++;
      failures.push({ id: p.id, hash_present: hashOk, http: httpStatus });
    }

    await supabase.from("prescription_hash_audit").insert({
      prescription_id: p.id,
      signature_hash: p.signature_hash,
      signed_pdf_url: p.signed_pdf_url,
      hash_present: hashOk,
      pdf_reachable: pdfOk,
      http_status: httpStatus,
      is_valid: isValid,
      notes: isValid ? "ok" : "missing_hash_or_unreachable",
    });
  }

  if (invalid > 0) {
    const msg = [
      `⚠️ *AUDITORIA ICP-Brasil — ${invalid} prescrição(ões) com problema*`,
      `_Janela: últimas 24h | Total auditado: ${rows?.length ?? 0}_`,
      "",
      ...failures.slice(0, 10).map((f) => `• ${f.id} — hash:${f.hash_present ? "✅" : "❌"} pdf:${f.http ?? "—"}`),
    ].join("\n");
    try {
      const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
      if (!shouldSilenceAdminAlert("prescription-hash-audit")) {
        await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
          body: JSON.stringify({ phone: ADMIN_WHATSAPP, message: msg }),
        });
      }
    } catch (_) {}

  }

  return new Response(JSON.stringify({ ok: true, audited: rows?.length ?? 0, valid, invalid }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
