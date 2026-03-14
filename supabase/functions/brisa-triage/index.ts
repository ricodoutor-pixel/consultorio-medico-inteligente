import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, patientInfo, mode } = await req.json();

    if (!symptoms) {
      return new Response(JSON.stringify({ error: "Sintomas são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Brisa AI Nurse - Triage & Pre-Medical Record Generation
    const systemPrompt = mode === "match_doctor" 
      ? `Você é Brisa, enfermeira IA da Planta & Raiz. Analise os sintomas e retorne um JSON com:
{
  "specialty": "especialidade médica recomendada",
  "urgency": "baixa|media|alta|urgente",
  "keywords": ["palavras-chave da condição"],
  "suggested_conditions": ["possíveis condições"],
  "pre_record": "resumo clínico para o médico"
}
APENAS o JSON, sem markdown.`
      : `Você é Brisa, enfermeira virtual IA da Planta & Raiz, especializada em cannabis medicinal.
Sua função é realizar triagem inicial de pacientes, sendo acolhedora e profissional.

Ao receber sintomas do paciente, gere um PRÉ-PRONTUÁRIO estruturado:

## Pré-Prontuário Eletrônico (Brisa IA)

### Dados da Triagem
- Data/Hora: [timestamp]
- Método: Triagem Digital Automatizada

### Queixa Principal
[resumo dos sintomas relatados]

### Avaliação Inicial (IA)
- Categoria: [Neurológico/Psiquiátrico/Dor/Oncológico/Outro]
- Urgência: [Baixa/Média/Alta/Urgente]
- Especialidade recomendada: [especialidade]

### Histórico Coletado
${patientInfo ? `- Nome: ${patientInfo.nome || 'Não informado'}
- Idade: ${patientInfo.idade || 'Não informada'}
- Medicamentos: ${patientInfo.medicamentos || 'Nenhum relatado'}
- Alergias: ${patientInfo.alergias || 'Nenhuma relatada'}` : '- Dados pessoais não fornecidos'}

### Hipóteses Diagnósticas (Pré-análise)
[2-3 hipóteses baseadas nos sintomas]

### Conduta Sugerida
- Tipo de consulta: [Presencial/Telemedicina]
- Exames complementares sugeridos: [se aplicável]
- Perfil canabinóide indicado: [CBD predominante / THC:CBD equilibrado / etc]

### Observações para o Médico
[notas relevantes para o prescritor]

⚠️ TRIAGEM AUTOMATIZADA — Não constitui diagnóstico médico (CFM 2.314/2022).
Gerado por: Brisa IA — Enfermeira Virtual Planta & Raiz`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Sintomas do paciente: ${symptoms}` },
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
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    if (mode === "match_doctor") {
      // Parse JSON response for doctor matching
      try {
        const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const matchData = JSON.parse(cleaned);
        return new Response(JSON.stringify({ success: true, match: matchData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // Fallback keyword matching
        const fallback = findSpecialtyByKeywords(symptoms);
        return new Response(JSON.stringify({ success: true, match: fallback }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, preRecord: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brisa-triage error:", e);
    return new Response(JSON.stringify({ error: "Erro interno na triagem" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function findSpecialtyByKeywords(symptoms: string): any {
  const lower = symptoms.toLowerCase();
  const map: Record<string, { specialty: string; urgency: string; keywords: string[] }> = {
    "ansiedade|pânico|insônia|depressão|estresse": {
      specialty: "Psiquiatria",
      urgency: "media",
      keywords: ["saúde mental", "ansiedade"],
    },
    "dor crônica|fibromialgia|artrite|lombalgia": {
      specialty: "Neurologia / Dor",
      urgency: "media",
      keywords: ["dor crônica", "manejo da dor"],
    },
    "epilepsia|convulsão|tremor|parkinson": {
      specialty: "Neurologia",
      urgency: "alta",
      keywords: ["neurológico", "epilepsia"],
    },
    "câncer|oncologia|quimioterapia|tumor": {
      specialty: "Oncologia",
      urgency: "alta",
      keywords: ["oncologia", "suporte"],
    },
    "autismo|tdah|déficit de atenção": {
      specialty: "Neuropediatria",
      urgency: "media",
      keywords: ["neurodesenvolvimento"],
    },
  };

  for (const [pattern, data] of Object.entries(map)) {
    if (new RegExp(pattern).test(lower)) {
      return { ...data, suggested_conditions: [pattern.split("|")[0]], pre_record: `Triagem automática: ${data.specialty}` };
    }
  }

  return {
    specialty: "Clínica Geral - Cannabis Medicinal",
    urgency: "baixa",
    keywords: ["cannabis medicinal", "avaliação geral"],
    suggested_conditions: ["Avaliação inicial"],
    pre_record: "Paciente para avaliação geral de cannabis medicinal",
  };
}
