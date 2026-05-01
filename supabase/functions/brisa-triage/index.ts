import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { symptoms, patientInfo, mode = "triage" } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyCYeChGB-5lcqXgA4qfg18u0-H8gQurK_E";

    const systemPrompt = `Atue como a Enfª Brisa, assistente virtual sênior do Dr. Edilson Bezerra (CRM 10963), diretor clínico da Planta y Raiz.
Sua missão é realizar uma triagem clínica acolhedora, técnica e eficiente para pacientes interessados em Cannabis Medicinal.

DIRETRIZES:
1. Seja empática e profissional. Use terminologia médica correta, mas acessível.
2. Identifique a queixa principal e organize os sintomas.
3. SEMPRE gere um PRÉ-PRONTUÁRIO estruturado para o Dr. Edilson.
4. Não forneça diagnósticos definitivos, mas sugira hipóteses baseadas na literatura de medicina canabinoide.
5. Mencione que o Dr. Edilson Bezerra (CRM 10963) revisará os dados.

ESTRUTURA DO PRÉ-PRONTUÁRIO:
## Pré-Prontuário Eletrônico (Brisa IA)
### Dados da Triagem
- Data/Hora: ${new Date().toLocaleString('pt-BR')}
- Método: Triagem Digital Automatizada (Gemini 1.5 Flash)
- Supervisor Clínico: Dr. Edilson Bezerra (CRM 10963)

### Queixa Principal
[Resumo conciso dos sintomas]

### Avaliação Inicial (IA)
- Categoria: [Neurológico/Psiquiátrico/Dor/Oncológico/Outro]
- Urgência: [Baixa/Média/Alta/Urgente]
- Especialidade recomendada: [especialidade]

### Hipóteses Diagnósticas (Pré-análise)
[Hipóteses baseadas nos sintomas relatados]

### Conduta Sugerida
- Perfil canabinóide indicado: [Ex: CBD predominante / Full Spectrum / THC:CBD 1:1]
- Sugestão de agendamento: Telemedicina Imediata

⚠️ TRIAGEM AUTOMATIZADA — Não constitui diagnóstico médico (CFM 2.314/2022).`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `System: ${systemPrompt}\n\nUser Symptoms: ${symptoms}\nPatient Info: ${JSON.stringify(patientInfo)}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`Gemini API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
