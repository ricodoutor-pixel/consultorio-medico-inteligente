import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Definição das ferramentas (Tools) para o Function Calling
const tools = [
  {
    name: "create_payment",
    description: "Cria um link de pagamento para orientação técnica ou produtos.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number" },
        description: { type: "string" },
        patient_email: { type: "string" }
      },
      required: ["amount", "description"]
    }
  },
  {
    name: "check_doctor_availability",
    description: "Verifica quais médicos estão online para atendimento imediato.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "get_scientific_evidence",
    description: "Busca na base de 40k artigos evidências sobre cannabis para uma condição específica.",
    parameters: {
      type: "object",
      properties: {
        condition: { type: "string", description: "A doença ou sintoma (ex: ansiedade, dor crônica)" }
      },
      required: ["condition"]
    }
  },
  // Note: dispatch_whatsapp_message is intentionally NOT exposed to the user-facing
  // orchestrator to prevent prompt-injection-driven WhatsApp spam. Internal/admin flows
  // should call evolution-api-proxy directly with the service role key.
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Authenticate caller (user JWT or service-role)
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isServiceRole = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
  if (!isServiceRole) {
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { userInput: rawInput, context: rawContext = {}, phone } = await req.json();

    // Sanitize: cap length, strip control chars, JSON-stringify context safely.
    const sanitize = (s: unknown, max = 2000) =>
      String(s ?? "")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .slice(0, max);
    const userInput = sanitize(rawInput, 2000);
    let contextStr = "{}";
    try { contextStr = sanitize(JSON.stringify(rawContext ?? {}), 4000); } catch { contextStr = "{}"; }

    const systemPrompt = `Você é a Enfª Brisa, a Orquestradora CEO da Planta y Raiz.
Sua missão é gerenciar o atendimento de ponta a ponta com autonomia total.
Você tem acesso a ferramentas de pagamento, disponibilidade médica e base científica (RAG).
NUNCA use o termo 'Consulta', use sempre 'Orientação Técnica'.
Seja acolhedora, técnica e eficiente.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: `Contexto: ${contextStr}\n\nUsuário: ${userInput}` }] }],
        tools: [{ function_declarations: tools }]
      }),
    });

    const data = await response.json();
    const candidate = data.candidates[0];
    const functionCall = candidate.content.parts.find((p: any) => p.functionCall);

    if (functionCall) {
      const { name, args } = functionCall.functionCall;
      console.log(`Brisa chamando ferramenta: ${name}`, args);

      // Lógica de execução das ferramentas
      let toolResult;
      switch (name) {
        case "create_payment": {
          // Server-side guard against prompt-injection-driven tool calls:
          // bound amount and force currency before invoking the payment function.
          const amt = Number((args as any)?.amount);
          if (!Number.isFinite(amt) || amt < 1 || amt > 5000) {
            toolResult = { error: "Valor de pagamento fora do intervalo permitido (1–5000)" };
            break;
          }
          const safeArgs = { ...(args as any), amount: amt, currency: "BRL" };
          const { data: payData } = await supabase.functions.invoke("create-payment", { body: safeArgs });
          toolResult = payData;
          break;
        }
        case "check_doctor_availability":
          const { data: doctors } = await supabase.from("professionals").select("name, category").eq("is_online", true);
          toolResult = doctors;
          break;
        case "get_scientific_evidence":
          const { data: evidence } = await supabase.functions.invoke("scientific-rag", { body: args });
          toolResult = evidence;
          break;
      }

      // Retornar resposta com o resultado da ferramenta para a IA processar o texto final
      return new Response(JSON.stringify({ success: true, toolCalled: name, result: toolResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const textResponse = candidate.content.parts[0].text;
    return new Response(JSON.stringify({ success: true, response: textResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[brisa-ceo-orchestrator] error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
