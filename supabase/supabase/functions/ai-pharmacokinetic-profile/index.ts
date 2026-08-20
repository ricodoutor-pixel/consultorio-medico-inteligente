import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Predição farmacocinética grátis baseada nas respostas da triagem (Módulo 3).
 * Saída: metabolismo (Lento|Normal|Rápido), sensibilidade, proporção molecular sugerida,
 * minuta de titulação. Usa Lovable AI Gateway (gemini-3-flash-preview).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user (JWT must verify; anon/publishable key not accepted)
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub as string | undefined;
    if (claimsErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-user rate limit (10 calls / 5 min)
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: rlOk } = await admin.rpc("check_edge_rate_limit", {
      p_bucket: "ai_pharmacokinetic_profile",
      p_key: userId,
      p_max_hits: 10,
      p_window_seconds: 300,
    });
    if (rlOk === false) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Google Gemini DIRETO (sem Lovable AI Gateway).
    const GEMINI_API_KEY =
      Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
      Deno.env.get("GEMINI_API_KEY") ||
      "";
    if (!GEMINI_API_KEY) throw new Error("No Google Gemini key configured");

    const body = await req.json().catch(() => ({}));
    const sanitize = (v: unknown, max = 2000) =>
      String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, max);

    const triageAnswers = sanitize(JSON.stringify(body.triage_answers ?? {}), 4000);
    const medications = sanitize(body.current_medications, 500);
    const age = Number(body.age) || null;
    const weight = Number(body.weight) || null;
    const symptom = sanitize(body.main_symptom, 300);
    const intensity = Number(body.intensity) || null;

    const systemPrompt = `Você é um farmacologista clínico especialista em cannabis medicinal da Planta y Raiz.
Sua tarefa: prever o perfil metabólico provável do paciente (Lento|Normal|Rápido), estimar sensibilidade
a fitocanabinoides considerando interações com medicamentos contínuos, e sugerir proporção molecular CBD:THC
e esquema de titulação inicial. NUNCA prescreve — apenas sugere minuta para o médico revisar.
Responda em PT-BR, em formato JSON estrito conforme schema.`;

    const userMsg = `Dados do paciente:
- Idade: ${age ?? "n/i"}
- Peso: ${weight ?? "n/i"} kg
- Sintoma principal: ${symptom}
- Intensidade (0-10): ${intensity ?? "n/i"}
- Medicamentos contínuos: ${medications || "nenhum"}
- Respostas detalhadas da triagem: ${triageAnswers}

Gere a predição farmacocinética.`;

    const payload = {
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      tools: [{
        type: "function",
        function: {
          name: "pharmacokinetic_prediction",
          description: "Predição farmacocinética para cannabis medicinal",
          parameters: {
            type: "object",
            properties: {
              metabolic_profile: { type: "string", enum: ["Lento", "Normal", "Rápido"] },
              sensitivity: { type: "string", enum: ["Alta", "Média", "Baixa"] },
              drug_interactions: { type: "array", items: { type: "string" } },
              suggested_ratio: { type: "string", description: "Ex: CBD Full Spectrum 20:1" },
              titration_plan: { type: "string", description: "Ex: 2 gotas a cada 12h por 7 dias" },
              clinical_rationale: { type: "string" },
              doctor_minute: { type: "string", description: "Minuta de prescrição para o médico" },
              disclaimers: { type: "array", items: { type: "string" } },
            },
            required: ["metabolic_profile", "sensitivity", "suggested_ratio", "titration_plan", "clinical_rationale", "doctor_minute"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "pharmacokinetic_prediction" } },
    };

    // Chamada direta ao Google Gemini (OpenAI-compat). Sem fallback gateway.
    let r: Response;
    try {
      r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      throw new Error(`Google Gemini network error: ${String(e)}`);
    }

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Google Gemini rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errBody = await r.text().catch(() => "");
      throw new Error(`Google Gemini error: ${r.status} ${errBody.slice(0, 200)}`);
    }

    const result = await r.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const prediction = JSON.parse(toolCall?.function?.arguments || "{}");

    // Log non-PII telemetry
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("ai_events").insert({
        ai_name: "pharmacokinetic-profile",
        event_type: "prediction",
        status: "success",
        input_data: { age, weight, intensity, symptom },
        output_data: prediction,
      });
    } catch (_) { /* best-effort */ }

    return new Response(JSON.stringify({ success: true, prediction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-pharmacokinetic-profile error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
