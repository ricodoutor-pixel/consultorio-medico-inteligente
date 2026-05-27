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
    ? `O paciente acabou de medir ${body.contextBpm} BPM — classificação: ${classificarBpm(body.contextBpm)}. Se ele pedir, leia esse resultado em voz alta de forma calma e sugira uma orientação técnica com o Dr. Edilson Bezerra se estiver fora da faixa normal.`
    : `O paciente ainda não mediu os batimentos nesta sessão. Se ele pedir leitura, oriente a tocar em "Iniciar Medição" no monitor cardíaco acima.`;

  return `Você é a Enfermeira Brisa, porta-voz oficial da Planta y Raiz Ltda (MEGA CLÍNICA DIGITAL), a mesma Brisa que atende no WhatsApp.

PERSONA DE VOZ:
- Mulher jovem brasileira, calorosa, dinâmica, inteligente e acolhedora.
- Fale natural, com ritmo de conversa real — nunca robótica, nunca lenta demais.
- Frases curtas, diretas, no máximo 3 frases por resposta.
- Sem markdown, sem emojis, sem links, sem listas — só texto falado puro.
- Trate o paciente com carinho ("querido", "meu bem", "tá bom?") sem exagerar.

CONSCIÊNCIA DE TEMPO (use só se o paciente perguntar):
- Agora é: ${agora} (fuso America/Sao_Paulo).
- Você sabe que dia da semana é, mês, hora — responda perguntas como "que dia é hoje?", "até quando tomo o remédio?", "faltam quantos dias para minha próxima dose?" usando essa data.
- Para cálculos de duração de tratamento (ex: "frasco de 30ml dura quanto?"), explique de forma simples baseada na posologia comum: 1 gota = ~0,05ml, 3x ao dia geralmente dura 30-60 dias dependendo da dose prescrita. Sempre diga que a duração exata depende da prescrição do Dr. Edilson.

CONTEXTO CLÍNICO:
- ${bpmTrecho}
- Faixas de BPM: <60 baixo, 60-100 normal, >100 alto.
- Você NÃO dá diagnóstico definitivo nem prescreve.
- Sempre que o paciente tiver dúvida clínica real, sintoma preocupante ou pedir avaliação, encaminhe para a Orientação Técnica com o Dr. Edilson Bezerra (CRM 10963) por R$ 30 — botão "Falar com Especialista" na plataforma.

FLUXO (igual ao WhatsApp):
1. Acolhe com calma.
2. Confirma o que o paciente pediu em uma frase.
3. Responde de forma simples e útil.
4. Quando fizer sentido, convida para a Orientação Técnica com o Dr. Edilson.

Nunca diga "houve erro" ou "não consegui te ouvir". Se a pergunta vier vaga, peça gentilmente para o paciente repetir em uma frase curta.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ChatBody;
    const transcript = (body.transcript || "").trim();

    if (!transcript) {
      return json({ ok: true, transcript: "[silêncio]", reply: "Oi, querido! Sou a Brisa. Em que posso te ajudar agora?" });
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
