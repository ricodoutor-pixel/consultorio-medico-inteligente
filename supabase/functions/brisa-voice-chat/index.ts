// 🎙️ Brisa Voice Chat — Gemini no bastidor
// Recebe transcript do navegador → Gemini (Lovable AI) → retorna texto curto para o frontend falar com voz nativa.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é a Enfermeira Brisa, da Planta y Raiz Ltda. 
Fala em português brasileiro, de forma calorosa, calma e MUITO clara — atende idosos que não conseguem ler na tela.
REGRAS DE RESPOSTA:
- Máximo 2 frases curtas. Nunca mais de 35 palavras.
- Nunca use markdown, emojis, links ou listas. Só texto natural pra ser falado.
- Sempre confirme o que o paciente pediu antes de explicar.
- Se o paciente perguntar sobre o resultado do batimento cardíaco, diga que está bom mas recomenda uma orientação técnica personalizada com o Dr. Edilson Bezerra por R$ 30 — ele vai saber orientar melhor.
- Se pedir pra medir pressão: explique que aqui medimos batimentos cardíacos pelo dedo na câmera, e oriente a apertar o botão vermelho "Iniciar Medição".
- Se pedir pra ler o resultado: leia o BPM informado e classifique (abaixo de 60 baixo, 60 a 100 normal, acima de 100 alto).
- Nunca diga que houve erro técnico, falha de sistema ou que você não conseguiu ouvir.
- Nunca dê diagnóstico. Sempre encaminhe ao Dr. Edilson em caso de dúvida clínica.`;

interface ChatBody {
  transcript?: string;
  contextBpm?: number | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_KEY) {
      return json({ error: "missing_credentials" }, 500);
    }

    const body = (await req.json()) as ChatBody;
    const transcript = (body.transcript || "").trim();
    if (!transcript) {
      return json({
        ok: true,
        transcript: "[silêncio]",
        reply: "Olá! Em que posso ajudar hoje?",
      });
    }

    const contextMsg = body.contextBpm
      ? `\n[Contexto: o último BPM medido do paciente foi ${body.contextBpm}.]`
      : "";
    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextMsg },
      ...(body.history || []).slice(-6),
      { role: "user", content: transcript },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        response_format: { type: "text" },
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("AI failed:", aiRes.status, err);
      if (aiRes.status === 429) return json({ error: "rate_limited" }, 429);
      if (aiRes.status === 402) return json({ error: "payment_required" }, 402);
      return json({ error: "ai_failed" }, 502);
    }

    const aiData = await aiRes.json();
    const rawReply = (aiData.choices?.[0]?.message?.content || "").trim();
    const reply = rawReply.replace(/\s+/g, " ").slice(0, 240) || "Sim, estou aqui com você. Em que posso ajudar agora?";

    return json({
      ok: true,
      transcript,
      reply,
    });
  } catch (e) {
    console.error("[brisa-voice-chat] error:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
