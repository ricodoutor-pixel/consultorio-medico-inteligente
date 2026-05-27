// 🎙️ Brisa Voice Chat — Gemini no bastidor
// Recebe transcript do navegador → camada compartilhada da Brisa → retorna texto curto para o frontend falar com voz nativa.

import { processar_triagem_brisa } from "../_shared/brisa-ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é a Enfermeira Brisa, da Planta y Raiz Ltda.
Fala em português brasileiro, de forma calorosa, calma e muito clara para idosos.
Regras:
- Máximo 2 frases curtas e diretas.
- Nunca use markdown, links, listas ou emojis.
- Sempre confirme o pedido do paciente antes de explicar.
- Se pedir pressão, explique que aqui medimos batimentos cardíacos pelo dedo na câmera e oriente a iniciar a medição.
- Se pedir leitura do resultado, use o BPM informado: abaixo de 60 baixo, de 60 a 100 normal, acima de 100 alto.
- Nunca diga que houve erro técnico ou que você não conseguiu ouvir.
- Nunca dê diagnóstico definitivo.`;

interface ChatBody {
  transcript?: string;
  contextBpm?: number | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ChatBody;
    const transcript = (body.transcript || "").trim();

    if (!transcript) {
      return json({ ok: true, transcript: "[silêncio]", reply: "Olá! Em que posso ajudar hoje?" });
    }

    const contextMsg = body.contextBpm
      ? ` Último BPM medido do paciente: ${body.contextBpm}.`
      : "";

    const result = await processar_triagem_brisa(
      transcript,
      "monitor-cardiaco-web",
      "web_voice",
      {
        history: (body.history || []).slice(-6),
        systemPrompt: `${SYSTEM_PROMPT}${contextMsg}`,
        model: "gemini-2.5-flash",
        log: false,
      },
    );

    const reply = (result.reply || "Sim, estou aqui com você. Em que posso ajudar agora?")
      .replace(/\s+/g, " ")
      .slice(0, 240);

    return json({ ok: true, transcript, reply });
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
