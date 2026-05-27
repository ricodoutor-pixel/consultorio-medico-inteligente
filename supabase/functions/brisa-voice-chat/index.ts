// 🎙️ Brisa Voice Chat — Push-to-Talk para idosos
// Recebe áudio (base64) → STT (ElevenLabs Scribe) → Gemini (Lovable AI) → TTS (ElevenLabs Sarah)
// Retorna { transcript, reply, audioBase64 } para o frontend tocar.

import { encodeBase64, decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BRISA_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah

const SYSTEM_PROMPT = `Você é a Enfermeira Brisa, da Planta y Raiz Ltda. 
Fala em português brasileiro, voz calorosa, calma e MUITO clara — atende idosos que não conseguem ler na tela.
REGRAS DE RESPOSTA:
- Máximo 2 frases curtas. Nunca mais de 40 palavras.
- Nunca use markdown, emojis, links ou listas. Só texto natural pra ser falado.
- Sempre confirme o que o paciente pediu antes de explicar ("Sim, com certeza, vou te ajudar...").
- Se o paciente perguntar sobre o resultado do batimento cardíaco, diga que está bom mas recomenda uma orientação técnica personalizada com o Dr. Edilson Bezerra por R$ 30 — ele vai saber orientar melhor.
- Se pedir pra medir pressão: explique que aqui medimos batimentos cardíacos pelo dedo na câmera, e oriente a apertar o botão vermelho "Iniciar Medição".
- Se pedir pra ler o resultado: leia o BPM informado e classifique (abaixo de 60 baixo, 60 a 100 normal, acima de 100 alto).
- Nunca dê diagnóstico. Sempre encaminhe ao Dr. Edilson em caso de dúvida clínica.`;

interface ChatBody {
  audioBase64: string;
  mimeType?: string;
  contextBpm?: number | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELEVEN_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!ELEVEN_KEY || !LOVABLE_KEY) {
      return json({ error: "missing_credentials" }, 500);
    }

    const body = (await req.json()) as ChatBody;
    if (!body.audioBase64) return json({ error: "audioBase64_required" }, 400);

    // 1) STT — ElevenLabs Scribe
    const audioBytes = decodeBase64(body.audioBase64);
    const audioBlob = new Blob([audioBytes], { type: body.mimeType || "audio/webm" });
    const sttForm = new FormData();
    sttForm.append("file", audioBlob, "audio.webm");
    sttForm.append("model_id", "scribe_v2");
    sttForm.append("language_code", "por");

    const sttRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVEN_KEY },
      body: sttForm,
    });
    if (!sttRes.ok) {
      const err = await sttRes.text();
      console.error("STT failed:", sttRes.status, err);
      return json({ error: "stt_failed", detail: err.slice(0, 200) }, 502);
    }
    const sttData = await sttRes.json();
    let transcript = (sttData.text || "").trim();
    let forcedReply = "";
    if (!transcript) {
      transcript = "[silêncio]";
      forcedReply = "Olá! Em que posso te ajudar hoje?";
    }

    let reply = forcedReply;
    if (!reply) {
      // 2) Gemini via Lovable AI Gateway
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
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
      });
      if (!aiRes.ok) {
        const err = await aiRes.text();
        console.error("AI failed:", aiRes.status, err);
        if (aiRes.status === 429) return json({ error: "rate_limited" }, 429);
        if (aiRes.status === 402) return json({ error: "payment_required" }, 402);
        return json({ error: "ai_failed" }, 502);
      }
      const aiData = await aiRes.json();
      reply = (aiData.choices?.[0]?.message?.content || "").trim();
      if (!reply) return json({ transcript, error: "empty_reply" }, 200);
    }

    // 3) TTS — ElevenLabs Sarah
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${BRISA_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: reply,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.85,
            style: 0.3,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      },
    );
    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      console.error("TTS failed:", ttsRes.status, err);
      return json({ transcript, reply, error: "tts_failed", detail: err.slice(0, 200) }, 502);
    }
    const ttsBuf = await ttsRes.arrayBuffer();
    const audioOutBase64 = encodeBase64(new Uint8Array(ttsBuf));

    return json({
      ok: true,
      transcript,
      reply,
      audioBase64: audioOutBase64,
      mimeType: "audio/mpeg",
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
