import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { patient_id, diagnosis, symptoms, current_medications } = await req.json();

    // 1. Get patient history
    const { data: records } = await supabase
      .from("medical_records")
      .select("diagnosis, diagnosis_cid, treatment_plan")
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 2. Get patient's past orders
    const { data: orders } = await supabase
      .from("orders")
      .select("items, total")
      .eq("user_id", patient_id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 3. Build AI prompt with clinical context
    const patientContext = {
      diagnosis: diagnosis || records?.map(r => r.diagnosis).filter(Boolean).join(", ") || "Não informado",
      symptoms: symptoms || "Não informado",
      currentMedications: current_medications || "Nenhum",
      pastOrders: orders?.map(o => JSON.stringify(o.items)).join("; ") || "Nenhum",
      treatmentHistory: records?.map(r => r.treatment_plan).filter(Boolean).join("; ") || "Nenhum",
    };

    const systemPrompt = `Você é o motor de recomendação da Planta & Raiz, a maior clínica digital de cannabis medicinal do Brasil.

REGRAS ABSOLUTAS:
- Recomende APENAS produtos de cannabis medicinal (CBD, THC, CBG, CBN)
- Sempre considere o histórico do paciente para evitar duplicatas
- Priorize upsell de produtos complementares
- Inclua razão clínica para cada recomendação
- Retorne EXATAMENTE no formato de tool call solicitado

CATÁLOGO DISPONÍVEL:
1. Óleo CBD Full Spectrum 1000mg - R$ 289.90 (dor, ansiedade, sono)
2. Óleo CBD Full Spectrum 3000mg - R$ 489.90 (dor severa, epilepsia)
3. Cápsulas THC:CBD 5:20 60un - R$ 349.90 (dor neuropática, espasticidade)
4. Cápsulas CBD 25mg 30un - R$ 199.90 (ansiedade, sono)
5. Pomada Canábica 100ml - R$ 189.90 (dor localizada, artrite)
6. Spray Sublingual CBD 500mg - R$ 259.90 (ansiedade aguda, pânico)
7. Óleo CBN Sleep 500mg - R$ 329.90 (insônia crônica)
8. Gummies CBD 10mg 30un - R$ 149.90 (iniciantes, micro-dosagem)
9. Kit Starter Cannabis Medicinal - R$ 399.90 (primeiros pacientes)
10. Club Wellness Pro (assinatura) - R$ 149/mês (desconto em tudo + teleconsultas)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Paciente com:
- Diagnóstico: ${patientContext.diagnosis}
- Sintomas: ${patientContext.symptoms}
- Medicamentos atuais: ${patientContext.currentMedications}
- Compras anteriores: ${patientContext.pastOrders}
- Histórico de tratamento: ${patientContext.treatmentHistory}

Recomende 3-5 produtos ideais para este paciente.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_products",
              description: "Return personalized product recommendations for the patient",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        product_name: { type: "string" },
                        price: { type: "number" },
                        clinical_reason: { type: "string" },
                        priority: { type: "string", enum: ["essential", "recommended", "complementary"] },
                        dosage_suggestion: { type: "string" },
                      },
                      required: ["product_name", "price", "clinical_reason", "priority"],
                      additionalProperties: false,
                    },
                  },
                  subscription_suggestion: {
                    type: "object",
                    properties: {
                      recommended: { type: "boolean" },
                      reason: { type: "string" },
                      monthly_savings: { type: "number" },
                    },
                    required: ["recommended", "reason"],
                    additionalProperties: false,
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_products" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let recommendations;
    try {
      recommendations = JSON.parse(toolCall?.function?.arguments || "{}");
    } catch {
      recommendations = { recommendations: [], subscription_suggestion: { recommended: true, reason: "Economia mensal" } };
    }

    // Log AI event for analytics
    await supabase.from("ai_events").insert({
      ai_name: "recommendation-engine",
      event_type: "product_recommendation",
      status: "success",
      input_data: { patient_id, diagnosis: patientContext.diagnosis },
      output_data: recommendations,
      user_id: patient_id,
    });

    return new Response(JSON.stringify({
      success: true,
      ...recommendations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recommendations error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
