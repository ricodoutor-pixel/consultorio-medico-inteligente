// 🏥 Fundoscopy AI Diagnosis — Edge Function
// Cruza dados do exame do paciente com banco de 30+ patologias
// Usa Gemini 2.5 Flash para diagnóstico baseado em evidências
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY =
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
  Deno.env.get("GEMINI_API_KEY") ||
  "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é um oftalmologista digital especialista em fundoscopia assistida por IA da Planta y Raiz — a mais completa clínica digital de medicina canabinoide do Brasil.

Você recebe dados de um exame de fundo de olho digital e um banco de dados com 30+ patologias detectáveis por fundoscopia. Sua missão é cruzar os achados do exame com o banco de patologias e fornecer um diagnóstico estruturado.

REGRAS ABSOLUTAS:
1. SEMPRE responda em português do Brasil (PT-BR).
2. SEMPRE inclua o aviso: "Este é um exame de triagem digital. Recomendamos SEMPRE confirmação presencial com oftalmologista."
3. NUNCA forneça prescrições, receitas ou diagnósticos definitivos.
4. SEMPRE mencione a conexão com cannabis medicinal quando relevante.
5. SEMPRE cite referências científicas quando disponíveis.
6. SEMPRE forneça uma seção "O que significa seu resultado?" em linguagem acessível ao paciente leigo.

FORMATO DE RESPOSTA (JSON):
{
  "risk_level": "baixo|moderado|alto|critico",
  "detected_pathologies": [
    {
      "name": "Nome da patologia",
      "probability": 0.75,
      "severity": "leve|moderada|severa",
      "findings": "Achados específicos encontrados",
      "icd10": "H36.0"
    }
  ],
  "clinical_findings": [
    "Achado 1",
    "Achado 2"
  ],
  "recommendations": [
    "Recomendação 1",
    "Recomendação 2"
  ],
  "cannabis_relevance": {
    "applicable": true,
    "description": "Como CBD/THC pode ajudar",
    "evidence_level": "alto|moderado|baixo"
  },
  "patient_explanation": {
    "title": "O que significa seu resultado?",
    "summary": "Explicação em linguagem acessível",
    "next_steps": "O que o paciente deve fazer agora"
  },
  "scientific_references": [
    "Referência 1",
    "Referência 2"
  ],
  "disclaimer": "Este é um exame de triagem digital..."
}`;

async function callGemini(messages: Array<{ role: string; content: string }>): Promise<string> {
  // Try Lovable gateway first, then Gemini direct
  const providers = [
    {
      name: "lovable",
      url: LOVABLE_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      model: "google/gemini-2.5-flash",
    },
    {
      name: "gemini",
      url: GEMINI_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GEMINI_API_KEY}`,
      },
      model: "gemini-2.5-flash",
    },
  ];

  for (const provider of providers) {
    if (!provider.headers.Authorization.replace("Bearer ", "")) continue;
    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: provider.headers,
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.3,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        console.error(`[fundoscopy-ai] ${provider.name} error: ${res.status}`);
        continue;
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "";
    } catch (e) {
      console.error(`[fundoscopy-ai] ${provider.name} fetch error:`, e);
      continue;
    }
  }
  throw new Error("All AI providers failed");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    const {
      exam_data,
      user_id,
      exam_type = "fundoscopy",
    } = body;

    // 1. Load pathology database
    const { data: pathologies, error: pathErr } = await sb
      .from("fundoscopy_pathologies")
      .select("*")
      .order("category");

    if (pathErr) {
      console.error("[fundoscopy-ai] DB error:", pathErr);
    }

    // 2. Build context for AI
    const pathologyContext = (pathologies || [])
      .map(
        (p: any) =>
          `[${p.category}] ${p.name_pt} (${p.icd10_code || "N/A"}): ${p.fundoscopy_findings}. Severidade: ${JSON.stringify(p.severity_levels)}. Cannabis: ${p.cannabis_connection || "Sem evidência direta."}`
      )
      .join("\n");

    const userPrompt = `
DADOS DO EXAME DO PACIENTE:
${JSON.stringify(exam_data, null, 2)}

BANCO DE PATOLOGIAS DETECTÁVEIS (${(pathologies || []).length} patologias):
${pathologyContext}

Analise os dados do exame acima, cruze com o banco de patologias e forneça o diagnóstico estruturado em JSON conforme as instruções do sistema.`;

    // 3. Call Gemini
    const aiResponse = await callGemini([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    let diagnosis;
    try {
      diagnosis = JSON.parse(aiResponse);
    } catch {
      diagnosis = {
        risk_level: "moderado",
        raw_response: aiResponse,
        patient_explanation: {
          title: "O que significa seu resultado?",
          summary: "A IA processou seus dados com sucesso. Consulte um oftalmologista para confirmação presencial.",
          next_steps: "Agende uma consulta presencial para exame completo."
        },
        disclaimer: "Este é um exame de triagem digital. Recomendamos SEMPRE confirmação presencial com oftalmologista."
      };
    }

    // 4. Save to database
    if (user_id) {
      const { error: saveErr } = await sb.from("diagnostic_exams").insert({
        user_id,
        exam_type,
        results: exam_data,
        ai_diagnosis: diagnosis,
        risk_level: diagnosis.risk_level || "baixo",
      });
      if (saveErr) console.error("[fundoscopy-ai] Save error:", saveErr);

      // Also save to fundoscopy_exams if it's a fundoscopy exam
      if (exam_type === "fundoscopy") {
        await sb.from("fundoscopy_exams").insert({
          user_id,
          ai_analysis: diagnosis,
          risk_level: diagnosis.risk_level || "baixo",
          cup_disc_ratio: exam_data?.cup_disc_ratio,
          vascular_tortuosity: exam_data?.vascular_tortuosity,
          macula_status: exam_data?.macula_status,
          optic_nerve_status: exam_data?.optic_nerve_status,
          recommendations: diagnosis.recommendations?.join("; ") || "",
          cannabis_relevance: diagnosis.cannabis_relevance?.description || "",
        }).then(({ error }) => {
          if (error) console.error("[fundoscopy-ai] Fundoscopy save error:", error);
        });
      }
    }

import { GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";

    // 5. Log to audit
    await sb.from("brisa_interaction_logs").insert({
      channel: "diagnostic-ai",
      user_ref: user_id || "anonymous",
      message_in: JSON.stringify(exam_data).slice(0, 1000),
      message_out: JSON.stringify(diagnosis).slice(0, 2000),
      provider: "gemini",
      model: GEMINI_PRIMARY_MODEL,
      status: "ok",
      http_status: 200,
      latency_ms: 0,
      meta: { exam_type },
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, diagnosis }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[fundoscopy-ai] Fatal:", e);
    return new Response(
      JSON.stringify({
        ok: false,
        error: e.message,
        diagnosis: {
          risk_level: "moderado",
          patient_explanation: {
            title: "Processamento em andamento",
            summary: "Não foi possível completar a análise automatizada neste momento. Recomendamos consulta presencial.",
            next_steps: "Tente novamente ou agende uma consulta com oftalmologista."
          },
          disclaimer: "Este é um exame de triagem digital."
        }
      }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
