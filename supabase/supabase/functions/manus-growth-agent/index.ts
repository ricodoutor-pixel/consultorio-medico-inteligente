// 🤖 Manus Growth CEO — Agente Autônomo de Crescimento Orgânico
// Roda diariamente: diagnóstico GSC → otimização on-page → distribuição social → auto-auditoria
// Versionado em GitHub para auditoria permanente.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!; // usada APENAS para connector GSC (não-IA)
const GEMINI_AI_KEY =
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
  Deno.env.get("GEMINI_API_KEY") ||
  "";
const GEMINI_AI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GSC_API_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY")!;
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";
const SITE = "sc-domain:plantayraiz.com.br";
const SITE_ENC = encodeURIComponent(SITE);

const GUARDRAIL_REGEX = /CRM\s*10963|Dr\.?\s*Edilson|RDC\s*660/i;

interface GscRow { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }

// ============ FASE 0: META BASELINE (visitantes Published) ============
async function loadTargets(supa: any) {
  const { data } = await supa.from("marketing_kpi_targets").select("*").eq("scope", "global").maybeSingle();
  return data ?? {
    baseline_visitors: 118, daily_new_visitors_target: 100,
    signup_conversion_target: 0.5, orientacao_conversion_target: 0.3, lead_nurture_target: 0.2,
  };
}

async function snapshotVisitors(supa: any, kpi: any) {
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = `${today}T00:00:00Z`;

  // visitantes únicos hoje (conversion_events captura sessões da plataforma)
  const { data: events } = await supa.from("conversion_events")
    .select("event_type, session_id, user_id")
    .gte("created_at", dayStart);

  const sessions = new Set<string>();
  let signups = 0, orientacao = 0, leads = 0;
  for (const e of events ?? []) {
    if (e.session_id) sessions.add(e.session_id);
    if (e.event_type === "form_submit") signups++;
    if (e.event_type === "quiz_completed") orientacao++;
    if (e.event_type === "whatsapp_click" || e.event_type === "quiz_started") leads++;
  }

  const visitors_total = sessions.size;
  const visitors_new = Math.max(0, visitors_total); // proxy diário
  const target = kpi.daily_new_visitors_target;
  const delta = visitors_new - target;
  const row = {
    snapshot_date: today,
    visitors_total, visitors_new, signups,
    orientacao_starts: orientacao, leads,
    target_new_visitors: target,
    delta_vs_target: delta,
    on_track: delta >= 0,
  };
  await supa.from("marketing_daily_snapshot").upsert(row, { onConflict: "snapshot_date" });
  return row;
}

// ============ FASE 1: DIAGNÓSTICO ============
async function diagnose(supa: any, runId: string) {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  const res = await fetch(
    `https://connector-gateway.lovable.dev/google_search_console/webmasters/v3/sites/${SITE_ENC}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GSC_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: start, endDate: end,
        dimensions: ["page", "query"],
        rowLimit: 500,
      }),
    },
  );
  if (!res.ok) throw new Error(`GSC ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const rows: GscRow[] = data.rows || [];

  // snapshot completo
  const snapshots = rows.map((r) => ({
    snapshot_date: end,
    url: r.keys[0],
    query: r.keys[1],
    clicks: r.clicks, impressions: r.impressions,
    ctr: Number(r.ctr.toFixed(4)), position: Number(r.position.toFixed(2)),
  }));
  if (snapshots.length) {
    await supa.from("manus_growth_kpis").upsert(snapshots, { onConflict: "snapshot_date,url,query", ignoreDuplicates: false });
  }

  // alvos: posição 4–15, mínimo 50 impressões
  const targets = rows
    .filter((r) => r.position >= 4 && r.position <= 15 && r.impressions >= 50)
    .sort((a, b) => b.impressions * (1 - a.ctr) - a.impressions * (1 - b.ctr))
    .slice(0, 10);

  await supa.from("manus_growth_logs").insert({
    run_id: runId, phase: "diagnose", action: "gsc_analysis",
    after_state: { rows_analyzed: rows.length, targets: targets.length, period: { start, end } },
    status: "ok",
  });

  return { targets, total: rows.length };
}

// ============ FASE 2: OTIMIZAÇÃO ON-PAGE ============
async function optimize(supa: any, runId: string, targets: GscRow[]) {
  let optimized = 0;
  for (const t of targets.slice(0, 5)) {
    const url = t.keys[0];
    const query = t.keys[1];
    const route = new URL(url).pathname;

    try {
      const ai = await fetch(GEMINI_AI_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${GEMINI_AI_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-pro",
          messages: [
            { role: "system", content: `Você é o SEO Architect da Planta y Raiz (telemedicina canábica BR). Gere JSON com {meta_title (max 60), meta_description (max 155), h1, h2_list (array 3 strings), schema_org_snippet (objeto MedicalBusiness/Physician com priceCurrency:'BRL')}. OBRIGATÓRIO incluir no body: "Dr. Edilson", "CRM-PR 49354", "RDC 660". Foco na palavra-chave: "${query}". Moeda sempre BRL.` },
            { role: "user", content: `Rota: ${route}\nKeyword alvo: ${query}\nPosição atual: ${t.position}\nCTR: ${(t.ctr * 100).toFixed(2)}%\nImpressões: ${t.impressions}\nOtimize.` },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!ai.ok) throw new Error(`Google Gemini ${ai.status}`);
      const aiData = await ai.json();
      const content = aiData.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      // GUARDRAIL: validar disclaimer
      const fullText = JSON.stringify(parsed);
      if (!GUARDRAIL_REGEX.test(fullText)) {
        await supa.from("manus_growth_logs").insert({
          run_id: runId, phase: "optimize", url, action: "guardrail_blocked",
          status: "blocked", error_message: "Disclaimer CRM/RDC ausente",
        });
        continue;
      }

      await supa.from("manus_seo_overrides").upsert({
        route, meta_title: parsed.meta_title, meta_description: parsed.meta_description,
        h1: parsed.h1, h2_list: parsed.h2_list, schema_org: parsed.schema_org_snippet,
        created_by_run: runId, updated_at: new Date().toISOString(),
      }, { onConflict: "route" });

      await supa.from("manus_growth_logs").insert({
        run_id: runId, phase: "optimize", url, action: "seo_override_written",
        before_state: { position: t.position, ctr: t.ctr },
        after_state: { meta_title: parsed.meta_title, target_query: query },
        status: "ok",
      });
      optimized++;
    } catch (e) {
      await supa.from("manus_growth_logs").insert({
        run_id: runId, phase: "optimize", url, action: "optimize_failed",
        status: "error", error_message: String((e as Error).message).slice(0, 500),
      });
    }
  }
  return optimized;
}

// ============ FASE 3: DISTRIBUIÇÃO SOCIAL ============
async function distribute(supa: any, runId: string, targets: GscRow[]) {
  if (!targets.length) return 0;
  const topQueries = targets.slice(0, 3).map((t) => t.keys[1]).join(", ");

  const ai = await fetch(GEMINI_AI_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${GEMINI_AI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: `Gere JSON {posts: [{platform: 'instagram'|'facebook'|'tiktok'|'youtube', topic, script, caption, hashtags: string[]}]} — 1 post por plataforma. Tom acolhedor, citar Dr. Edilson CRM-PR 49354 e RDC 660. Mencionar Planta y Raiz.` },
        { role: "user", content: `Dores top-pesquisadas hoje: ${topQueries}. Gere posts para captar esse tráfego.` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!ai.ok) return 0;
  const aiData = await ai.json();
  const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || '{"posts":[]}');
  const posts = (parsed.posts || []).filter((p: any) => GUARDRAIL_REGEX.test(JSON.stringify(p)));


  if (posts.length) {
    await supa.from("manus_social_queue").insert(
      posts.map((p: any) => ({
        platform: p.platform, topic: p.topic, script: p.script,
        caption: p.caption, hashtags: p.hashtags, status: "draft",
        created_by_run: runId,
      })),
    );
  }
  await supa.from("manus_growth_logs").insert({
    run_id: runId, phase: "distribute", action: "social_posts_generated",
    after_state: { count: posts.length, top_queries: topQueries }, status: "ok",
  });
  return posts.length;
}

// ============ FASE 4: AUDITORIA + WHATSAPP ============
async function audit(
  supa: any, runId: string,
  m: { analyzed: number; optimized: number; posts: number },
  kpi: any, snap: any,
) {
  const signupRate = snap.visitors_total > 0 ? (snap.signups / snap.visitors_total) : 0;
  const otRate = snap.visitors_total > 0 ? (snap.orientacao_starts / snap.visitors_total) : 0;
  const onTrackIcon = snap.on_track ? "🟢" : "🔴";

  const md = [
    `🤖 *Manus Growth CEO — ${new Date().toLocaleDateString("pt-BR")}*`,
    ``,
    `${onTrackIcon} *Visitantes Published hoje:* ${snap.visitors_new} / meta ${snap.target_new_visitors} (Δ ${snap.delta_vs_target >= 0 ? "+" : ""}${snap.delta_vs_target})`,
    `📐 Baseline: ${kpi.baseline_visitors} | Total dia: ${snap.visitors_total}`,
    `📈 Conversão cadastro: ${(signupRate * 100).toFixed(1)}% (meta ${(kpi.signup_conversion_target * 100).toFixed(0)}%)`,
    `🩺 Orientação técnica: ${(otRate * 100).toFixed(1)}% (meta ${(kpi.orientacao_conversion_target * 100).toFixed(0)}%) — ${snap.orientacao_starts}`,
    `🌱 Leads p/ nutrição: ${snap.leads} (meta ${(kpi.lead_nurture_target * 100).toFixed(0)}%)`,
    ``,
    `🔍 Páginas GSC analisadas: ${m.analyzed}`,
    `✏️ SEO overrides escritos: ${m.optimized}`,
    `📱 Posts sociais gerados: ${m.posts}`,
    ``,
    snap.on_track
      ? `✅ No caminho certo — manter estratégia atual e dobrar nos posts que converteram.`
      : `⚠️ Abaixo da meta — Manus vai amplificar SEO + posts virais nas próximas 24h até bater +${snap.target_new_visitors}/dia.`,
    ``,
    `📊 Dashboard: /admin/growth`,
  ].join("\n");

  try {
    const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
    if (!shouldSilenceAdminAlert("manus-growth-agent")) {
      await fetch(`${SUPABASE_URL}/functions/v1/evolution-api-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE}` },
        body: JSON.stringify({ phone: ADMIN_WHATSAPP, message: md, type: "text" }),
      });
    }
  } catch (_) { /* silent */ }


  return md;
}

// ============ SERVE ============
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: service role, cron secret, or authenticated admin user
  const auth = req.headers.get("Authorization") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  let okAuth = auth === `Bearer ${SERVICE_ROLE}` || cronSecret === SERVICE_ROLE;
  if (!okAuth && auth.startsWith("Bearer ")) {
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (user) {
      const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
      okAuth = !!isAdmin;
    }
  }
  if (!okAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: run } = await supa.from("manus_growth_runs")
    .insert({ status: "running", triggered_by: cronSecret ? "cron" : "manual" })
    .select("id").single();
  const runId = run!.id;

  try {
    const kpi = await loadTargets(supa);
    const snap = await snapshotVisitors(supa, kpi);
    await supa.from("manus_growth_logs").insert({
      run_id: runId, phase: "diagnose", action: "visitors_snapshot",
      after_state: snap, status: "ok",
    });
    const { targets, total } = await diagnose(supa, runId);
    // Se abaixo da meta, prioriza mais páginas + posts
    const optimized = await optimize(supa, runId, snap.on_track ? targets : [...targets, ...targets].slice(0, 8));
    const posts = await distribute(supa, runId, targets);
    const summary = await audit(supa, runId, { analyzed: total, optimized, posts }, kpi, snap);

    await supa.from("manus_growth_runs").update({
      status: "success", finished_at: new Date().toISOString(),
      pages_analyzed: total, pages_optimized: optimized, posts_generated: posts,
      summary_md: summary,
    }).eq("id", runId);

    return new Response(JSON.stringify({ success: true, runId, analyzed: total, optimized, posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = String((e as Error).message);
    await supa.from("manus_growth_runs").update({
      status: "failed", finished_at: new Date().toISOString(),
      errors_count: 1, summary_md: `❌ ${msg}`,
    }).eq("id", runId);
    return new Response(JSON.stringify({ error: msg, runId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
