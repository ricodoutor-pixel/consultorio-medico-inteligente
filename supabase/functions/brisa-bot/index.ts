// Enfermeira Brisa — WhatsApp autonomous bot (Lovable AI Gateway + Evolution API)
// Edge Function de produção. Recebe webhook do WhatsApp (Evolution),
// gera resposta via Lovable AI Gateway (Gemini) e envia de volta ao remetente.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_INSTRUCTION =
  "Você é a Enfermeira Brisa, da clínica Planta y Raiz. Assistente virtual especializada em Cannabis Medicinal e saúde integrativa. Tom acolhedor, empático, técnico e profissional. Responde com clareza, segurança e ética dentro das normas da ANVISA (RDC 660/327). Nunca promete cura. Para dosagem específica em patologias graves, oriente a buscar o médico prescritor. Quando o paciente perguntar valor: a Orientação Técnica custa R$30 (BR) ou US$10 (internacional), realizada pelo Dr. Edilson Bezerra (CRM 10963), com PDF carimbado gov.br. Sempre incentive o paciente a finalizar pelo site plantayraiz.com.br ou enviar comprovante aqui mesmo.";

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") ?? "https://api-whatsapp.plantayraiz.com.br").replace(/\/$/, "");
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "brisa-bot-v2";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

function extractText(data: any): string {
  return (
    data?.message?.conversation ??
    data?.message?.extendedTextMessage?.text ??
    data?.message?.imageMessage?.caption ??
    data?.text ??
    ""
  );
}

async function generateReply(userText: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userText },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Lovable AI failed ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

async function sendWhatsApp(token: string, remoteJid: string, text: string) {
  const number = String(remoteJid).split("@")[0].replace(/\D/g, "");
  const url = `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: token },
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
    return new Response(JSON.stringify({
      ok: true,
      service: "brisa-bot",
      instance: EVOLUTION_INSTANCE,
      evolution: EVOLUTION_API_URL,
      ai_ready: !!LOVABLE_API_KEY,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  if (!LOVABLE_API_KEY || !EVOLUTION_API_KEY) {
    console.error("[brisa-bot] missing env: LOVABLE_API_KEY/EVOLUTION_API_KEY");
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

    const reply = (await generateReply(text)) ||
      "Olá! Sou a Enfª Brisa 🌿 da Planta y Raiz. Estou com instabilidade técnica no momento — em instantes te respondo.";

    await sendWhatsApp(EVOLUTION_API_KEY, remoteJid, reply);

    console.log(`[brisa-bot] replied -> ${remoteJid} | in:"${text.slice(0,80)}" | out:"${reply.slice(0,80)}"`);
    return new Response(JSON.stringify({ ok: true, remoteJid, replied: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[brisa-bot] error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
