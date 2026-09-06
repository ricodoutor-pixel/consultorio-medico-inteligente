import { GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT authenticity
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await anonClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;

    const { answers, patientData, appointmentId } = await req.json();

    if (!answers || !patientData) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // Build clinical context from triage answers
    const triageText = `
Paciente: ${patientData.nome}, CPF: ${patientData.cpf}, Nascimento: ${patientData.dataNascimento}
1. Queixa principal: ${answers[1] || "Não informado"}
2. Duração do problema: ${answers[2] || "Não informado"}
3. Uso prévio de cannabis: ${answers[3] || "Não informado"}
4. Alergias: ${answers[4] || "Nenhuma"}
5. Medicamentos atuais: ${answers[5] || "Nenhum"}
6. Histórico familiar: ${answers[6] || "Não informado"}
7. Comorbidades: ${Array.isArray(answers[7]) ? answers[7].join(", ") : answers[7] || "Nenhuma"}
8. Objetivo do tratamento: ${answers[8] || "Não informado"}
9. Preferência THC/CBD: ${answers[9] || "Equilibrado"}
10. Disponibilidade: ${answers[10] || "Flexível"}
`.trim();

    const systemPrompt = `Você é um assistente médico da Planta & Raiz, especializado em cannabis medicinal.
Gere um RESUMO CLÍNICO estruturado a partir da triagem do paciente, seguindo este formato:

## Resumo Clínico Pré-Consulta

### Queixa Principal
[resumo da queixa]

### Histórico Relevante
- Duração: [tempo]
- Comorbidades: [lista]
- Medicamentos atuais: [lista]
- Alergias: [lista]
- Histórico familiar: [relevante]

### Experiência Prévia com Cannabis
[detalhes]

### Objetivo Terapêutico
[objetivo do paciente]

### Sugestão de Abordagem (Pré-análise)
- Perfil canabinóide sugerido: [CBD:THC ratio]
- Possíveis cepas indicadas: [2-3 sugestões]
- Via de administração sugerida: [oral/sublingual/inalatória]
- Considerações especiais: [interações, contraindicações]

### Score de Prioridade
[Baixa/Média/Alta/Urgente] — [justificativa breve]

⚠️ AVISO: Esta pré-análise é automatizada e NÃO constitui diagnóstico. A avaliação final é responsabilidade exclusiva do médico prescritor (CFM 2.314/2022).

Responda APENAS com o resumo clínico, sem comentários adicionais. Máximo 400 palavras.`;


    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GEMINI_PRIMARY_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: triageText },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "Resumo não disponível.";

    // Optionally save to medical_records if appointmentId provided — verify ownership first
    if (appointmentId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: appt } = await supabase
        .from("appointments")
        .select("id, patient_id, doctor_id")
        .eq("id", appointmentId)
        .maybeSingle();

      if (!appt || appt.patient_id !== userId) {
        return new Response(JSON.stringify({ error: "Consulta não encontrada ou não autorizada" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("medical_records").upsert({
        appointment_id: appointmentId,
        patient_id: appt.patient_id,
        doctor_id: appt.doctor_id,
        chief_complaint: answers[1] || "",
        notes: summary,
        diagnosis_cid: null,
        vitals: {
          triage_answers: answers,
          triage_date: new Date().toISOString(),
          patient_info: { nome: patientData.nome },
        },
      }, { onConflict: "appointment_id" });
    }

    return new Response(JSON.stringify({ summary, triageData: triageText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("triage-summary error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
