// Enfermeira Brisa — WAHA WhatsApp bot (Supabase Edge Function)
// Recebe webhook do WAHA, gera resposta via Google Gemini e envia de volta.
import { corsHeaders as baseCors } from "npm:@supabase/supabase-js@2/cors";

const corsHeaders = {
  ...baseCors,
  "Access-Control-Allow-Headers":
    (baseCors["Access-Control-Allow-Headers"] || "") + ", x-webhook-secret",
};

const WAHA_API_URL = Deno.env.get("WAHA_API_URL") || "";
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY") || "";
const WAHA_SESSION = Deno.env.get("WAHA_SESSION") || "default";
const WAHA_WEBHOOK_SECRET = Deno.env.get("WAHA_WEBHOOK_SECRET") || "";


const GEMINI_MODEL = "gemini-1.5-pro";

const SYSTEM_PROMPT = `Você é a Enfermeira Brisa, assistente virtual oficial da clínica Planta y Raíz (plataforma de intermediação em telemedicina canábica, CNAE 6209-1/00).

TOM: acolhedora, empática, técnica, profissional. Respostas curtas (até 4 linhas), em português brasileiro, estilo WhatsApp.

PAPEL:
- Acolher pacientes, tirar dúvidas básicas sobre cannabis medicinal (RDC 660/2022, RDC 327/2019, CFM 2.314/2022).
- Orientar sobre a Orientação Técnica (teleconsulta): R$30 (Brasil) ou US$10 (internacional) com Dr. Edilson Bezerra (CRM 10963).
- Encaminhar para agendamento em https://plantayraiz.com.br/oferta-especial.
- Em emergência/sintoma grave: oriente SAMU 192 ou pronto-socorro IMEDIATAMENTE.

LIMITES:
- A Planta y Raíz NÃO vende, NÃO entrega, NÃO prescreve, NÃO fabrica produtos. Apenas conecta paciente ↔ médico ↔ farmácia parceira.
- Nunca prometa cura. Nunca prescreva. Nunca dê dosagem específica — encaminhe ao médico.`;

function extractWahaMessage(payload: any): {
  chatId: string;
  text: string;
  fromMe: boolean;
  isGroup: boolean;
  isStatus: boolean;
  event: string;
} {
  const event = String(payload?.event ?? "").toLowerCase();
  const data = payload?.payload ?? payload?.data ?? payload ?? {};
  const chatId: string =
    data?.from ?? data?.chatId ?? data?.key?.remoteJid ?? "";
  const text: string =
    data?.body ??
    data?.text ??
    data?.message?.conversation ??
    data?.message?.extendedTextMessage?.text ??
    "";
  const fromMe: boolean = !!(data?.fromMe ?? data?.key?.fromMe);
  const isGroup = typeof chatId === "string" && chatId.endsWith("@g.us");
  const isStatus = chatId === "status@broadcast";
  return { chatId, text, fromMe, isGroup, isStatus, event };
}

async function askGemini(userText: string): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY não configurada");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim() ?? "";
  if (!reply) throw new Error("Gemini retornou resposta vazia");
  return reply;
}

async function sendWaha(chatId: string, text: string) {
  const res = await fetch(`${WAHA_API_URL}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": WAHA_API_KEY,
    },
    body: JSON.stringify({
      session: WAHA_SESSION,
      chatId,
      text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WAHA send ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, service: "brisa-waha-bot" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { chatId, text, fromMe, isGroup, isStatus, event } = extractWahaMessage(payload);

    // Anti-loop / filtro de eventos irrelevantes
    if (
      fromMe ||
      isGroup ||
      isStatus ||
      !chatId ||
      !text ||
      (event && !event.includes("message"))
    ) {
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: { fromMe, isGroup, isStatus, event, hasText: !!text } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let reply: string;
    try {
      reply = await askGemini(text);
    } catch (err) {
      console.error("[brisa-waha-bot] gemini error:", err);
      reply =
        "Olá! Sou a Enfª Brisa 🌿 da Planta y Raíz. Estou com uma instabilidade técnica no momento — em instantes te respondo. Para iniciar sua Orientação Técnica (R$30): https://plantayraiz.com.br/oferta-especial";
    }

    try {
      await sendWaha(chatId, reply);
    } catch (err) {
      console.error("[brisa-waha-bot] waha send error:", err);
      return new Response(
        JSON.stringify({ ok: false, stage: "send", error: err instanceof Error ? err.message : String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[brisa-waha-bot] ${chatId} in:"${text.slice(0, 80)}" out:"${reply.slice(0, 80)}"`);
    return new Response(
      JSON.stringify({ ok: true, chatId, replied: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[brisa-waha-bot] fatal:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
