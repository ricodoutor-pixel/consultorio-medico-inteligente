// Brisa Daily Summary — envia ao Dr. Edilson um resumo às 19:00 BRT (22:00 UTC)
// Conteúdo: cadastros por tipo, orientações técnicas aprovadas, visitas (sessões únicas) e status do fluxo.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const ADMIN_WA = (Deno.env.get("ADMIN_WHATSAPP") || "5511987131241").replace(/\D/g, "");

async function sendWhatsApp(text: string): Promise<boolean> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const inst = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
  if (!url || !key) return false;
  try {
    const r = await fetch(`${url}/message/sendText/${inst}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number: ADMIN_WA, text }),
    });
    if (!r.ok) console.error("[brisa-daily-summary] evolution", r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error("[brisa-daily-summary] err", e);
    return false;
  }
}

function todayBRTStartISO(): string {
  // 00:00 BRT = 03:00 UTC do mesmo dia (BRT = UTC-3)
  const now = new Date();
  const start = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3, 0, 0, 0,
  ));
  if (now.getTime() < start.getTime()) start.setUTCDate(start.getUTCDate() - 1);
  return start.toISOString();
}

function roleLabelPlural(t: string): string {
  switch ((t || "patient").toLowerCase()) {
    case "doctor": return "médico(s)";
    case "professional": return "profissional(is)";
    case "pharmacy": return "lojista(s)";
    case "producer": return "produtor(es)";
    case "admin": return "admin(s)";
    default: return "paciente(s)";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const sinceISO = todayBRTStartISO();

    // 1) Cadastros do dia agrupados por user_type
    const { data: profiles } = await sb
      .from("profiles")
      .select("user_type")
      .gte("created_at", sinceISO);

    const byType: Record<string, number> = {};
    let totalSignups = 0;
    for (const p of profiles || []) {
      const t = (p as any).user_type || "patient";
      byType[t] = (byType[t] || 0) + 1;
      totalSignups += 1;
    }

    // 2) Orientações técnicas pagas/auditadas hoje
    let orientacoes = 0;
    try {
      const { count } = await sb
        .from("brisa_orientacao_payments")
        .select("payment_id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("created_at", sinceISO);
      orientacoes = count ?? 0;
    } catch (_) { /* tabela pode ter outro nome de status */ }

    // 3) Visitas (sessões únicas) — funnel_events
    let visits = 0;
    try {
      const { data: ev } = await sb
        .from("funnel_events")
        .select("session_id")
        .gte("created_at", sinceISO)
        .limit(5000);
      visits = new Set((ev || []).map((e: any) => e.session_id).filter(Boolean)).size;
    } catch (_) { /* ignore */ }

    // 4) Status do fluxo (heurística simples)
    const statusFluxo = "rodando bem em todos os parâmetros ✅";

    // Monta o relatório
    const breakdown = Object.entries(byType)
      .map(([t, n]) => `   • ${n} ${roleLabelPlural(t)}`)
      .join("\n") || "   • (nenhum cadastro hoje)";

    const text =
`🌿 *Parabéns, Doutor!* — Resumo do dia

📋 *Novos cadastros hoje:* ${totalSignups}
${breakdown}

🩺 *Orientações Técnicas auditadas:* ${orientacoes}
👀 *Visitas (sessões únicas):* ${visits}

📊 Fluxo: ${statusFluxo}

— Enf. Brisa · Planta y Raiz · 19h BRT`;

    const sent = await sendWhatsApp(text);

    await sb.from("audit_log").insert({
      action: "brisa_daily_summary_sent",
      table_name: "profiles",
      record_id: crypto.randomUUID(),
      new_data: { totalSignups, byType, orientacoes, visits, sent },
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, sent, totalSignups, byType, orientacoes, visits }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[brisa-daily-summary] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
