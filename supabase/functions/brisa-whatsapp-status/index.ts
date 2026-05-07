import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Daily WhatsApp Status posts - automated content rotation
const STATUS_TEMPLATES = [
  {
    text: "🌿 Sabia que a Cannabis Medicinal pode ajudar com ansiedade, insônia e dor crônica? Conheça nossos especialistas! 👉 https://plantayraiz.com.br/falar-com-especialista",
    day: 0, // Sunday
  },
  {
    text: "💚 Segunda é dia de cuidar da saúde! Agende sua teleconsulta com médicos especializados em Cannabis Medicinal. Tudo online e seguro 🔒 👉 https://plantayraiz.com.br/falar-com-especialista",
    day: 1,
  },
  {
    text: "🧠 Você sabia? O CBD tem propriedades neuroprotetoras comprovadas cientificamente. Descubra qual tratamento é ideal para você! 👉 https://plantayraiz.com.br/quiz-triagem",
    day: 2,
  },
  {
    text: "🛒 Novos produtos no Shopping! Óleos Full Spectrum, Broad Spectrum e Isolados com entrega em todo Brasil 🇧🇷 👉 https://plantayraiz.com.br/shopping",
    day: 3,
  },
  {
    text: "💰 Ganhe dinheiro indicando a Planta & Raiz! Comissões de até 3 gerações. Seja um parceiro! 👉 https://plantayraiz.com.br/dashboard/parceiro",
    day: 4,
  },
  {
    text: "🌱 Sexta de bem-estar! Conheça nossos planos a partir de R$ 29,90/mês com descontos exclusivos em consultas e produtos 👉 https://plantayraiz.com.br/planos",
    day: 5,
  },
  {
    text: "✨ Fim de semana é hora de investir em qualidade de vida! A importação pela ANVISA ficou mais fácil. Saiba como funciona 👉 https://plantayraiz.com.br/como-funciona",
    day: 6,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Brisa Status] Missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    const template = STATUS_TEMPLATES[dayOfWeek];

    // Generate dynamic content with AI for variety
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Você é a Brisa, enfermeira da Planta & Raiz. Reescreva o texto abaixo para WhatsApp Status (máximo 200 caracteres), mantendo o link original intacto, tom acolhedor e profissional. Use 1-2 emojis. Responda APENAS com o texto reescrito.",
          },
          { role: "user", content: template.text },
        ],
      }),
    });

    let statusText = template.text;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const generated = aiData.choices?.[0]?.message?.content;
      if (generated && generated.includes("plantayraiz.com.br")) {
        statusText = generated;
      }
    }

    console.log(`[Brisa Status] Posting daily status (day ${dayOfWeek}): ${statusText.substring(0, 60)}...`);

    // Log the status post
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("ai_events").insert({
      ai_name: "brisa_coo",
      event_type: "whatsapp_status_post",
      status: "completed",
      input_data: { day: dayOfWeek, template: template.text },
      output_data: { posted_text: statusText },
    });

    return new Response(JSON.stringify({
      success: true,
      day: dayOfWeek,
      status_text: statusText,
      posted_at: today.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Brisa Status] Error:", e);
    return new Response(JSON.stringify({ error: "Status post failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
