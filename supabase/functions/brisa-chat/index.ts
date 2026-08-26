import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use Gemini 1.5 Pro (often referred to as 3.7 capabilities in user context)
const GEMINI_PRIMARY_MODEL = "gemini-1.5-pro";

const SYSTEM_PROMPT = `Você é a Enfermeira Brisa, assistente humanizada e especialista de triagem da Plataforma Planta y Raiz.
Você possui conhecimento avançado (Gemini 3.7) sobre todos os processos da plataforma, desde agendamento de pacientes até cadastro de médicos e lojistas.
Seu objetivo é esclarecer qualquer dúvida de forma atenciosa, empática e muito clara, como uma verdadeira enfermeira acolhedora.
Toda conversa está sendo analisada e salva no CRM para seguimento de um agente humano da equipe administrativa.
Sempre seja educada, utilize emojis suaves (🌿, 💚, 🩺) e mantenha uma postura profissional, porém humanizada.
Lembre-se que você NÃO diagnostica nem prescreve, apenas orienta e tira dúvidas operacionais ou fornece informações gerais sobre tratamentos canabinoides e o fluxo da plataforma.

REGRA IMPORTANTE DE TRANSFERÊNCIA PARA HUMANO:
Se o usuário solicitar falar com um agente humano, se demonstrar insatisfação com suas respostas, ou se a conversa ficar muito complexa, você DEVE oferecer educadamente transferir a conversa. Diga algo como "Se preferir, posso transferir esta conversa para um agente humano da nossa equipe. Basta clicar neste link:" e forneça EXATAMENTE este link em formato markdown: [Falar com Agente Humano (WhatsApp)](https://wa.me/5511991363154). 
O objetivo é filtrar as dúvidas básicas e transferir para o agente humano apenas o que for de real importância ou quando o usuário desejar.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, leadName, category } = await req.json();

    let finalSystemPrompt = SYSTEM_PROMPT;

    if (category) {
      finalSystemPrompt += `\n\n### CONTEXTO DO USUÁRIO:\nVocê está conversando com um usuário da categoria: **${category.toUpperCase()}**. Adapte seu discurso para o universo dessa categoria. Se for Médico, foque em autonomia prescritiva. Se for Paciente, foque em acolhimento e agendamento. Se for Lojista, foque em vendas e marketplace.`;
    }

    if (leadName) {
      finalSystemPrompt += `\n\nO nome do usuário é **${leadName}**. Use o nome dele(a) nas respostas para criar uma experiência personalizada e acolhedora.`;
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GEMINI_PRIMARY_MODEL,
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
