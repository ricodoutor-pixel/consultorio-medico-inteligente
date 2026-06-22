// Enfermeira Brisa — WhatsApp autonomous bot (Gemini + Evolution API)
// Edge Function de produção. Recebe webhook do WhatsApp (Evolution),
// gera resposta via Gemini 1.5 Flash e envia de volta ao remetente.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const SYSTEM_INSTRUCTION =
  "Você é a Enfermeira Brisa, uma assistente virtual especializada em Cannabis Medicinal e saúde integrativa. Seu tom é acolhedor, empático, técnico e extremamente profissional. Você sempre responde com clareza, segurança e ética, orientando sobre o uso terapêutico de cannabis dentro das normas brasileiras, sem prometer curas milagrosas. Se a pergunta for sobre dosagem específica para patologias graves, oriente sempre a busca por um médico prescritor.";

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") ?? "https://api.evolution-api.com").replace(/\/$/, "");
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "plantayraiz";

function extractText(data: any): string {
  return (
    data?.message?.conversation ??
    data?.message?.extendedTextMessage?.text ??
    data?.message?.imageMessage?.caption ??
    data?.text ??
    ""
  );
}

async function sendWhatsApp(token: string, remoteJid: string, text: string) {
  const number = String(remoteJid).split("@")[0].replace(/\D/g, "");
  const url = `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: token, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ number, text, options: { delay: 1200, presence: "composing" } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Evolution send failed ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "brisa-bot" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
  if (!GEMINI_API_KEY || !WHATSAPP_API_TOKEN) {
    console.error("[brisa-bot] missing env: GEMINI_API_KEY/WHATSAPP_API_TOKEN");
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any = {};
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const event = String(payload?.event ?? payload?.type ?? "").toLowerCase();
    const data = payload?.data ?? payload;
    const remoteJid: string = data?.key?.remoteJid ?? data?.remoteJid ?? "";
    const fromMe: boolean = !!data?.key?.fromMe;
    const text = extractText(data);

    // Ignora eventos não-textuais, mensagens de grupos, próprias, ou eventos de status
    if (
      (event && !event.includes("message")) ||
      fromMe ||
      !remoteJid ||
      !text ||
      remoteJid.endsWith("@g.us") ||
      remoteJid === "status@broadcast"
    ) {
      return new Response(JSON.stringify({ ok: true, ignored: true, event }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(text);
    const reply = result?.response?.text?.()?.trim() ||
      "Olá! Sou a Enfª Brisa 🌿. Estou com instabilidade no momento, mas já anotei sua mensagem.";

    await sendWhatsApp(WHATSAPP_API_TOKEN, remoteJid, reply);

    return new Response(JSON.stringify({ ok: true, remoteJid, replied: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[brisa-bot] error:", err);
    // 200 para o webhook não reenviar indefinidamente
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
