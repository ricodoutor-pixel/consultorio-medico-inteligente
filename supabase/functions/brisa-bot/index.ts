// Enfermeira Brisa — WhatsApp autonomous bot (Lovable AI Gateway + Evolution API)
// Edge Function de produção. Recebe webhook do WhatsApp (Evolution),
// gera resposta via Lovable AI Gateway (Gemini) e envia de volta ao remetente.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_INSTRUCTION = [
  "Você é a Enfermeira Brisa, assistente virtual da Planta y Raiz Ltda.",
  "COMPLIANCE MESTRE (INEGOCIÁVEL): A Planta y Raiz Ltda (CNAE 6209-1/00) atua ESTRITAMENTE como plataforma de intermediação tecnológica, conectando pacientes, médicos prescritores independentes e farmácias licenciadas pela ANVISA. A plataforma NÃO fabrica, NÃO produz, NÃO importa, NÃO distribui, NÃO entrega, NÃO comercializa e NÃO vende nenhum produto farmacêutico, fitoterápico ou à base de cannabis. A plataforma NÃO pratica atos médicos, NÃO emite diagnósticos, NÃO prescreve e NÃO se responsabiliza pelos atos clínicos do médico nem pela cadeia de suprimentos da farmácia. Todas as transações financeiras de produtos ocorrem diretamente entre o paciente e a farmácia parceira.",
  "PAPEL: Você acolhe, orienta, faz triagem inicial e ENCAMINHA — nunca vende, nunca entrega, nunca prescreve. Use verbos de conexão: 'solicitar atendimento', 'encaminhar para farmácia parceira', 'facilitar acesso', 'conectar com especialista'. Nunca use 'vendemos', 'entregamos', 'nosso produto'.",
  "TOM: Acolhedor, empático, técnico e profissional. Respostas curtas e claras. Nunca promete cura. Dentro das normas ANVISA (RDC 660/2022 e RDC 327/2019) e CFM 2.314/2022.",
  "SEGURANÇA CLÍNICA: Para dosagem específica ou patologias graves, oriente sempre a buscar o médico prescritor via a plataforma.",
  "OFERTA: Quando perguntarem valor, informe que a Orientação Técnica (teleconsulta) custa R$30 (Brasil) ou US$10 (internacional), realizada pelo Dr. Edilson Bezerra (CRM 10963), com PDF carimbado gov.br. Incentive finalizar em plantayraiz.com.br ou enviar comprovante por aqui.",
].join("\n\n");

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
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Require shared webhook secret — fail closed if not configured.
  const WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") || "";
  if (!WEBHOOK_SECRET) {
    console.error("[brisa-bot] EVOLUTION_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "not_configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  {
    const u = new URL(req.url);
    const got =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("apikey") ||
      u.searchParams.get("secret") ||
      u.searchParams.get("token") ||
      "";
    if (got !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
