import { GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";
// 🩺 telemed-exam-report — relatório clínico fiel a partir dos exames digitais
// Cruza todos os exames do paciente (diagnostic_exams) com o banco de patologias
// e devolve um relatório estruturado gerado pela IA (Gemini via Lovable AI Gateway).
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const SYSTEM_PROMPT = `Você é o assistente clínico da Planta y Raiz, apoiando um MÉDICO durante uma teleconsulta.
Você recebe os exames digitais reais do paciente (monitor cardíaco, oximetria, fundoscopia, dermatoscopia, ausculta, tremorometria, urinálise, acuidade visual, mobilidade, atividade física) e um banco de patologias de referência.

REGRAS:
1. Responda SEMPRE em português do Brasil.
2. Use APENAS os dados fornecidos. Se um dado não existir, escreva "não avaliado" — NUNCA invente valores.
3. Não prescreva medicamentos nem forneça diagnóstico definitivo: a conduta é do médico responsável.
4. Cite relevância canabinoide apenas quando houver plausibilidade clínica.
5. Finalize com: "Triagem digital de apoio. A conduta final é do médico responsável."

FORMATO (texto corrido, com estes títulos):
RELATÓRIO CLÍNICO DIGITAL
1. Dados do paciente e exames considerados
2. Achados objetivos por exame (com valores e datas)
3. Correlação com o banco de patologias (probabilidade e gravidade)
4. Nível de risco global (baixo/moderado/alto/crítico)
5. Sugestões de investigação complementar
6. Relevância canabinoide (se aplicável)
7. Aviso legal`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    // --- Autenticação obrigatória ---
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ ok: false, error: "Unauthorized" }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, error: "Unauthorized" }, 401);
    const requester = userData.user;

    const { patient_id, patient_name } = await req.json().catch(() => ({}));

    // Quem pode ver exames de outro usuário? Somente médico verificado ou admin.
    let targetUserId = requester.id;
    if (patient_id && patient_id !== requester.id) {
      const [{ data: doctor }, { data: isAdmin }] = await Promise.all([
        admin.from("doctors").select("id").eq("user_id", requester.id).maybeSingle(),
        admin.rpc("has_role", { _user_id: requester.id, _role: "admin" }),
      ]);
      if (!doctor && !isAdmin) return json({ ok: false, error: "Forbidden" }, 403);
      targetUserId = patient_id;
    }

    // --- Dados clínicos reais ---
    const [{ data: exams }, { data: pathologies }] = await Promise.all([
      admin
        .from("diagnostic_exams")
        .select("exam_type, results, ai_diagnosis, risk_level, created_at")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(40),
      admin.from("fundoscopy_pathologies").select("name_pt, category, icd10_code, fundoscopy_findings, cannabis_connection").limit(60),
    ]);

    if (!exams || exams.length === 0) {
      return json({ ok: false, error: "Nenhum exame digital registrado para este paciente ainda." }, 404);
    }

    if (!LOVABLE_API_KEY) return json({ ok: false, error: "AI não configurada" }, 500);

    const pathologyContext = (pathologies || [])
      .map((p: any) => `[${p.category}] ${p.name_pt} (${p.icd10_code || "N/A"}): ${p.fundoscopy_findings}. Cannabis: ${p.cannabis_connection || "sem evidência direta"}`)
      .join("\n");

    const userPrompt = `PACIENTE: ${patient_name || targetUserId}

EXAMES DIGITAIS (${exams.length} registros, mais recentes primeiro):
${JSON.stringify(exams, null, 2)}

BANCO DE PATOLOGIAS DE REFERÊNCIA:
${pathologyContext || "(indisponível)"}

Gere o relatório clínico no formato definido.`;


    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: `google/${GEMINI_PRIMARY_MODEL}`,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      const body = await aiRes.text();
      console.error(`[telemed-exam-report] AI error ${aiRes.status}: ${body}`);
      if (aiRes.status === 429) return json({ ok: false, error: "Limite de uso da IA atingido. Tente novamente em instantes." }, 429);
      if (aiRes.status === 402) return json({ ok: false, error: "Créditos de IA esgotados. Adicione créditos no workspace." }, 402);
      return json({ ok: false, error: "Falha na análise de IA", details: body }, aiRes.status);
    }

    const aiData = await aiRes.json();
    const report = aiData?.choices?.[0]?.message?.content || "";

    await admin.from("brisa_interaction_logs").insert({
      channel: "telemed-report",
      user_ref: requester.id,
      message_in: `exames=${exams.length} paciente=${targetUserId}`,
      message_out: report.slice(0, 2000),
      provider: "lovable",
      model: `google/${GEMINI_PRIMARY_MODEL}`,
      status: "ok",
      http_status: 200,
      latency_ms: 0,
      meta: { patient_id: targetUserId },
    }).then(() => {}, () => {});

    return json({ ok: true, report, exams_count: exams.length });
  } catch (e: any) {
    console.error("[telemed-exam-report] Fatal:", e);
    return json({ ok: false, error: e?.message || "Erro interno" }, 500);
  }
});
