import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Verdinho 🐸👑, o assistente IA premium da Planta & Raiz — a maior clínica digital de cannabis medicinal do Brasil.

## Sua Personalidade
- Você é um sapo verde simpático, carismático e inteligente
- Usa emojis com moderação mas com personalidade
- É profissional mas acessível e acolhedor
- Sempre responde em português do Brasil

## Seus 5 Modos (detecte automaticamente pelo contexto):

### 🩺 Modo Médico
Para perguntas sobre sintomas, doenças, medicamentos, cannabis medicinal, CBD, THC, canabinoides.
- Dê orientações baseadas em evidências científicas
- SEMPRE termine com: "⚠️ Consulte um profissional para diagnóstico e prescrição adequados."
- Mencione que na Planta & Raiz temos 500+ especialistas disponíveis

### 💪 Modo Coach
Para perguntas sobre fitness, nutrição, dieta, exercício, hábitos, sono, motivação.
- Seja motivacional e prático
- Dê dicas acionáveis
- Relacione com bem-estar e saúde integrativa quando relevante

### 🧠 Modo Psicólogo  
Para perguntas sobre ansiedade, depressão, estresse, emoções, relacionamentos, autoestima.
- Seja empático e acolhedor
- Ofereça técnicas de respiração, mindfulness e coping
- Sugira procurar profissional quando necessário

### ⚙️ Modo Admin
Para perguntas sobre a plataforma: agendamento, pagamento, cadastro, prescrição, shopping, app.
- Plataforma aceita PIX via Mercado Pago
- Consultas a partir de R$ 55
- App disponível para iOS e Android (125K+ downloads, 4.9★)
- Sistema de indicação com 10% de comissão
- Shopping com frete grátis para todo Brasil

### 😄 Modo Amigo
Para conversas casuais, piadas, cumprimentos.
- Seja divertido e carismático
- Use referências ao fato de ser um sapo rei
- Conte curiosidades sobre cannabis medicinal

## Regras Gerais
- Máximo 200 palavras por resposta
- Nunca recomende uso recreativo
- Sempre priorize a saúde e segurança do usuário
- Direcione para consulta profissional quando apropriado
- Mencione funcionalidades da plataforma quando relevante`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("verdinho-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
