// 🎙️ Brisa Voice Chat — Gemini no bastidor (porta-voz oficial Planta y Raiz)
// Mesma persona do fluxo WhatsApp, com consciência de tempo e leitura de BPM.

import { processar_triagem_brisa } from "../_shared/brisa-ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatBody {
  transcript?: string;
  contextBpm?: number | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  now?: { iso?: string; human?: string; timezone?: string };
}

function classificarBpm(bpm: number): string {
  if (bpm < 50) return "bradicardia (abaixo de 50)";
  if (bpm < 60) return "abaixo do normal (50-59)";
  if (bpm <= 100) return "normal e saudável (60-100)";
  if (bpm <= 120) return "elevado (101-120)";
  return "taquicardia (acima de 120)";
}

function montarSystemPrompt(body: ChatBody): string {
  const agora = body.now?.human
    || new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  const bpmTrecho = body.contextBpm
    ? `O paciente acabou de medir ${body.contextBpm} BPM — classificação: ${classificarBpm(body.contextBpm)}. Se ele pedir, leia esse resultado em voz alta de forma calma e sugira uma orientação técnica com o Dr. Edilson Bezerra (CRM-CE 10963) se estiver fora da faixa normal.`
    : `O paciente ainda não mediu os batimentos nesta sessão. Se ele pedir leitura, oriente a tocar em "Iniciar Medição" no monitor cardíaco acima.`;

  return `Você é a Enfermeira Brisa, porta-voz oficial da Planta y Raiz Ltda (MEGA CLÍNICA DIGITAL).

PERSONA DE VOZ:
- Enfermeira brasileira profissional, educada, gentil e formal.
- Tom acolhedor mas SEMPRE institucional — como uma enfermeira de hospital de referência.
- Fale natural, com ritmo de conversa real, nunca robótica.
- Frases curtas, diretas, no máximo 3 frases por resposta.
- Sem markdown, sem emojis, sem links, sem listas — só texto falado puro.
- PROIBIDO usar termos íntimos ou afetivos: "querido", "querida", "amor", "meu bem", "meu coração", "fofo", "linda", "gata", "delícia", "tá bom?", "viu?".
- Use tratamento formal e respeitoso: "o senhor", "a senhora", "por favor", "com licença", "fico à disposição".

CONSCIÊNCIA DE TEMPO (use só se o paciente perguntar):
- Agora é: ${agora} (fuso America/Sao_Paulo).
- Responda perguntas sobre data, dia da semana, duração de tratamento usando essa referência.
- Para duração de frasco (ex: 30ml), explique de forma simples: 1 gota ≈ 0,05ml; a duração exata depende da prescrição médica.

CONTEXTO CLÍNICO:
- ${bpmTrecho}
- Faixas de BPM: <60 baixo, 60-100 normal, >100 alto.
- Você NÃO dá diagnóstico definitivo nem prescreve.
- Para dúvida clínica real, sintoma preocupante ou avaliação, encaminhe à Orientação Técnica com o Dr. Edilson Bezerra (CRM-CE 10963) por R$ 30 no botão "Falar com Especialista".

FLUXO:
1. Cumprimente de forma profissional.
2. Confirme o pedido do paciente em uma frase.
3. Responda de forma clara e útil.
4. Quando fizer sentido, oriente a Orientação Técnica com o Dr. Edilson.

Nunca diga "houve erro" ou "não consegui te ouvir". Se a pergunta vier vaga, peça com educação para o paciente repetir em uma frase curta.`;
}

// Per-IP rate limit: 30 req/min
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 30;
const MAX_TRANSCRIPT = 1000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const cur = ipHits.get(ip);
  if (!cur || cur.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (cur.count >= RL_MAX) return false;
  cur.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    if (!rateLimit(ip)) {
      return json({ ok: false, error: "rate_limited" }, 429);
    }

    const body = (await req.json()) as ChatBody;
    const transcript = (body.transcript || "").trim().slice(0, MAX_TRANSCRIPT);

    if (!transcript) {
      return json({ ok: true, transcript: "[silêncio]", reply: "Olá, sou a Enfermeira Brisa. Em que posso ajudar hoje?" });
    }

    const systemPrompt = montarSystemPrompt(body);

    const result = await processar_triagem_brisa(
      transcript,
      "monitor-cardiaco-web",
      "web_voice",
      {
        history: (body.history || []).slice(-6),
        systemPrompt,
        model: "google/gemini-2.5-flash",
        log: false,
      },
    );

    const reply = (result.reply || "Estou aqui com você. Pode me contar de novo o que está sentindo?")
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 320);

    return json({ ok: true, transcript, reply });
  } catch (e) {
    console.error("[brisa-voice-chat] error:", e);
    return json({ ok: true, reply: "Tive um probleminha agora, mas estou de volta. Pode repetir sua pergunta?" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
