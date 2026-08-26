// 🌿 Enf. Brisa — Chat Web (modal in-app)
// Público (visitantes não logados), protegido por rate-limit de IP.
// Persiste leads em public.leads_contatos com service role e responde via Gemini.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { callGeminiApiWithFallback, GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";
import { BRISA_PERSONA } from "../_shared/brisa-persona.ts";
import { rateLimit, clientIp, assertPayloadSize } from "../_shared/ai-guard.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ||
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Categoria = "paciente" | "medico" | "lojista" | "ebook" | "suporte";

const CONTEXTO: Record<Categoria, string> = {
  paciente:
    "A pessoa é PACIENTE. Objetivo: acolher, entender o sintoma principal e conduzir para a Orientação Técnica de R$30 (primeiro passo obrigatório).",
  medico:
    "A pessoa é MÉDICO(A) PRESCRITOR(A). Objetivo: explicar as vantagens de prescrever pela plataforma, o Plano Médico de R$99/mês (assinatura digital inclusa) e conduzir ao cadastro profissional.",
  lojista:
    "A pessoa é LOJISTA/PARCEIRO. Objetivo: explicar o Shopping da plataforma, a comissão de 5% e conduzir ao cadastro de lojista (Plano Lojista R$99/mês).",
  ebook:
    "A pessoa quer o E-BOOK gratuito e a biblioteca científica. Objetivo: entregar o material e convidar para a Orientação Técnica de R$30.",
  suporte:
    "A pessoa precisa de SUPORTE com a plataforma. Objetivo: resolver a dúvida com objetividade e, se necessário, encaminhar ao atendimento humano.",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const digits = (v: string) => (v || "").replace(/\D/g, "");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const ip = clientIp(req);
    const limited = await rateLimit({
      bucket: "brisa_chat_web",
      key: ip,
      maxHits: 30,
      windowSeconds: 60,
      cors: corsHeaders,
    });
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const categoria = (["paciente", "medico", "lojista", "ebook", "suporte"] as const)
      .includes(body?.categoria) ? (body.categoria as Categoria) : "paciente";
    const lead = body?.lead ?? {};
    const messages: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(body?.messages) ? body.messages.slice(-20) : [];
    const userMessage = String(body?.message ?? "").trim();

    const tooBig = assertPayloadSize(userMessage, 4000, corsHeaders);
    if (tooBig) return tooBig;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Onboarding/CRM — persiste lead quando nome + telefone chegam
    let leadSaved = false;
    const nome = String(lead?.nome ?? "").trim();
    const telefone = digits(String(lead?.telefone ?? ""));
    if (body?.saveLead && nome.length >= 2 && telefone.length >= 10) {
      const { error } = await admin.from("leads_contatos").insert({
        nome,
        email: String(lead?.email ?? "").trim() || null,
        telefone,
        // origem é validada por trigger (allowed: chat, whatsapp, instagram, web, ...)
        origem: "chat",
        categoria,
        tags: ["novo_cadastro", categoria, "brisa_chat_modal"],
      });
      if (error) console.error("[brisa-chat] lead insert error:", error.message);

      else leadSaved = true;
    }

    if (!userMessage) return json({ leadSaved, reply: null });

    if (!GEMINI_API_KEY) {
      return json({
        leadSaved,
        reply:
          "Estou com uma instabilidade na minha conexão agora. Me manda sua dúvida no WhatsApp que eu te respondo na hora 🌿",
      });
    }

    // 2) IA — resposta humanizada
    const history = messages
      .map((m) => `${m.role === "user" ? "Pessoa" : "Brisa"}: ${m.content}`)
      .join("\n");

    const prompt = `${BRISA_PERSONA}

━━━━━━━━━━━━━━━━━━━━━━━━━━
CANAL: chat do site (modal). Respostas curtas, 1 a 4 linhas.
CONTEXTO: ${CONTEXTO[categoria]}
DADOS DA PESSOA: nome=${nome || "desconhecido"}${lead?.email ? `, email=${lead.email}` : ""}${telefone ? `, whatsapp=${telefone}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━

HISTÓRICO:
${history || "(início da conversa)"}

Pessoa: ${userMessage}
Brisa:`;

    const res = await callGeminiApiWithFallback(
      GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 400 },
      },
      GEMINI_PRIMARY_MODEL,
    );

    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Deixa eu confirmar isso aqui no sistema e já te retorno 🌿";

    return json({ leadSaved, reply, model: res.usedModel });
  } catch (err) {
    console.error("[brisa-chat] error:", err);
    return json({ error: (err as Error).message ?? "Erro interno" }, 500);
  }
});
