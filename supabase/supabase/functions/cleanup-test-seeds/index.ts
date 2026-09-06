import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

/**
 * Cleanup test/QA seeds across the platform.
 * Service-role only. Logs each deletion batch to public.audit_log.
 */

type Target = {
  table: string;
  nameCol?: string;
  phoneCol?: string;
  emailCol?: string;
};

const TARGETS: Target[] = [
  { table: "profiles", nameCol: "full_name" },
  { table: "leads_contatos", nameCol: "nome", phoneCol: "telefone" },
  { table: "pacientes_leads", nameCol: "nome", phoneCol: "whatsapp" },
  { table: "orientacao_tecnica_orders", nameCol: "patient_name", phoneCol: "patient_whatsapp", emailCol: "patient_email" },
  { table: "doctors", nameCol: "specialty", phoneCol: "crm" },
];

const TEST_NAME_PATTERNS = ["teste%", "test %", "% test", "%qa %", "% qa%", "%e2e%", "%dummy%", "%fake%", "%placeholder%"];
const TEST_PHONES = [
  "5511999998888",
  "11999998888",
  "5500000000000",
  "00000000000",
  "11111111111",
  "5511111111111",
  "1234567890",
  "0123456789",
];
const TEST_EMAIL_PATTERNS = ["%@example.com", "%@test.%", "%+test@%", "%qa@%"];
const TEST_CRMS = ["123456", "000000", "111111", "999999"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json().catch(() => ({}));
  const dryRun: boolean = body?.dry_run === true;

  const report: Record<string, { matched: number; deleted: number; samples: any[]; filters: string[] }> = {};

  for (const t of TARGETS) {
    const filters: string[] = [];
    const orParts: string[] = [];

    if (t.nameCol) {
      for (const p of TEST_NAME_PATTERNS) {
        orParts.push(`${t.nameCol}.ilike.${p}`);
      }
      filters.push(`${t.nameCol} ILIKE ANY (${TEST_NAME_PATTERNS.join(", ")})`);
    }
    if (t.phoneCol) {
      // doctors uses crm in phoneCol slot
      if (t.table === "doctors") {
        orParts.push(`${t.phoneCol}.in.(${TEST_CRMS.join(",")})`);
        filters.push(`${t.phoneCol} IN (${TEST_CRMS.join(", ")})`);
      } else {
        orParts.push(`${t.phoneCol}.in.(${TEST_PHONES.join(",")})`);
        filters.push(`${t.phoneCol} IN (${TEST_PHONES.join(", ")})`);
      }
    }
    if (t.emailCol) {
      for (const p of TEST_EMAIL_PATTERNS) {
        orParts.push(`${t.emailCol}.ilike.${p}`);
      }
      filters.push(`${t.emailCol} ILIKE ANY (${TEST_EMAIL_PATTERNS.join(", ")})`);
    }

    if (orParts.length === 0) continue;
    const orExpr = orParts.join(",");

    // Preview matches
    const { data: matched, error: selErr } = await (supabase as any)
      .from(t.table)
      .select("id, created_at")
      .or(orExpr)
      .limit(500);

    if (selErr) {
      report[t.table] = { matched: 0, deleted: 0, samples: [], filters: [...filters, `ERROR: ${selErr.message}`] };
      continue;
    }

    const ids = (matched ?? []).map((r: any) => r.id);
    let deleted = 0;
    if (!dryRun && ids.length > 0) {
      const { error: delErr } = await (supabase as any).from(t.table).delete().in("id", ids);
      if (delErr) {
        report[t.table] = { matched: ids.length, deleted: 0, samples: matched ?? [], filters: [...filters, `DELETE_ERROR: ${delErr.message}`] };
        continue;
      }
      deleted = ids.length;
    }

    report[t.table] = {
      matched: ids.length,
      deleted,
      samples: (matched ?? []).slice(0, 5),
      filters,
    };
  }

  await supabase.from("audit_log").insert({
    action: dryRun ? "test_seeds_dry_run" : "test_seeds_cleanup",
    table_name: "multi",
    record_id: "00000000-0000-0000-0000-000000000000",
    new_data: report as any,
  }).then(() => {}, () => {});

  return new Response(
    JSON.stringify({ ok: true, dry_run: dryRun, report, executed_at: new Date().toISOString() }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
});
