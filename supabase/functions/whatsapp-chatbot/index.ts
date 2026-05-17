import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Deep Links Map ───
const DEEP_LINKS: Record<string, { url: string; label: string }> = {
  shopping: { url: "https://plantayraiz.com.br/shopping", label: "Shopping de Óleos" },
  preco: { url: "https://plantayraiz.com.br/planos", label: "Planos e Preços" },
  agendar: { url: "https://plantayraiz.com.br/falar-com-especialista", label: "Agendar Consulta" },
  triagem: { url: "https://plantayraiz.com.br/quiz-triagem", label: "Quiz de Triagem" },
  afiliado: { url: "https://plantayraiz.com.br/dashboard/parceiro", label: "Área do Parceiro" },
  reembolso: { url: "https://plantayraiz.com.br/ajuda", label: "Suporte / Reembolso" },
  anvisa: { url: "https://plantayraiz.com.br/como-funciona", label: "Importação ANVISA" },
  receita: { url: "https://plantayraiz.com.br/como-funciona", label: "Prescrições" },
  urgente: { url: "https://plantayraiz.com.br/falar-com-especialista", label: "Consulta Urgente" },
  geral: { url: "https://plantayraiz.com.br", label: "Planta & Raiz" },
};

import { BRISA_PERSONA } from "../_shared/brisa-persona.ts";

const BRISA_SYSTEM_PROMPT = BRISA_PERSONA + `

// === COMPLEMENTO WHATSAPP CHATBOT (canal Evolution + RAG legal) ===
RDC 660/2022, RDC 327/2019, CFM 2.314/2022 e LGPD são base regulatória obrigatória.
Mensagens CURTAS (3-4 frases) com no máximo 2 emojis.
NUNCA recomende doses/tratamentos específicos — você prepara o caminho para o médico.
Mascare CPF/telefone de terceiros (LGPD). Registre todas as interações para auditoria.
Em emergência real: SAMU 192 / 190 imediato, depois retorne ao cadastro.
`;

const MAX_CONTEXT_MESSAGES = 20;
const AI_LATENCY_WARN_MS = 2000;

function timer() {
  const start = Date.now();
  return () => Date.now() - start;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Webhook signature verification — Evolution API only (Twilio removido)
  const evoSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
  const evoProvided = req.headers.get("x-evolution-secret") || req.headers.get("apikey") || "";
  if (!evoSecret || evoProvided !== evoSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const totalTimer = timer();

  try {
    let from = "";
    let messageBody = "";
    let toNumber = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      from = (formData.get("From") as string) || "";
      messageBody = (formData.get("Body") as string) || "";
      toNumber = (formData.get("To") as string) || "";
    } else {
      const body = await req.json();
      from = body.From || body.from || "";
      messageBody = body.Body || body.body || body.message || "";
      toNumber = body.To || body.to || "";
    }

    console.log(`[Brisa COO] From: ${from} | Msg: ${messageBody.substring(0, 80)}`);

    if (!messageBody) {
      return twimlResponse("🌿 Olá! Sou a Brisa, Diretora Operacional da Planta & Raiz. Como posso ajudar você hoje?");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("[Brisa COO] CRITICAL: GEMINI_API_KEY missing");
      return twimlResponse("🌿 Estou passando por uma manutenção rápida. Tente novamente em 1 minuto ou acesse plantayraiz.com.br 💚");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const phoneClean = from.replace("whatsapp:", "").replace(/\D/g, "");

    // ─── (a) Busca de contexto no Supabase ───
    const dbTimer = timer();
    const [convResult, affiliateResult] = await Promise.all([
      supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("phone_number", phoneClean)
        .maybeSingle(),
      // Check if lead came via affiliate link
      supabase
        .from("leads_contatos")
        .select("tags")
        .eq("telefone", phoneClean)
        .maybeSingle(),
    ]);
    const conv = convResult.data;
    const dbMs = dbTimer();
    console.log(`[Brisa COO][Telemetry] DB context: ${dbMs}ms`);

    const previousMessages: Array<{ role: string; content: string }> = conv?.messages || [];
    previousMessages.push({ role: "user", content: messageBody });
    const contextMessages = previousMessages.slice(-MAX_CONTEXT_MESSAGES);

    const sentiment = detectSentiment(messageBody);
    const intent = detectIntent(messageBody);

    // ─── Opt-out detection: respect no_followup requests ───
    const optOutKeywords = ["parar", "não quero", "cancelar lembrete", "não me mande", "opt out", "sair", "desinscrever"];
    const isOptOut = optOutKeywords.some(k => messageBody.toLowerCase().includes(k));
    if (isOptOut) {
      const existingTags: string[] = affiliateResult.data?.tags || [];
      if (!existingTags.includes("no_followup")) {
        await supabase.from("leads_contatos").upsert({
          telefone: phoneClean,
          nome: phoneClean,
          origem: "whatsapp_brisa_coo",
          tags: [...existingTags, "no_followup"],
        }, { onConflict: "telefone" });
      }
      return twimlResponse("🌿 Entendido! Seus lembretes foram desativados. Se precisar de algo, é só me chamar aqui. Estou sempre disponível! 💚");
    }

    // ─── Affiliate tagging: detect ref= in message ───
    const refMatch = messageBody.match(/ref[=:\s]+([A-Z0-9-]+)/i);
    let affiliateTags: string[] = affiliateResult.data?.tags || [];
    if (refMatch) {
      const affiliateCode = refMatch[1];
      if (!affiliateTags.includes(`affiliate:${affiliateCode}`)) {
        affiliateTags = [...affiliateTags, `affiliate:${affiliateCode}`, "brisa_assisted"];
      }
    }

    // ─── (b) Resposta da Lovable AI Gateway ───
    const aiTimer = timer();
    let brisaReply: string;
    try {
      const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: BRISA_SYSTEM_PROMPT },
            ...contextMessages,
          ],
        }),
      });
      const aiMs = aiTimer();
      console.log(`[Brisa COO][Telemetry] AI Gateway: ${aiMs}ms | Status: ${aiResponse.status}`);

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error(`[Brisa COO] AI error ${aiResponse.status}: ${errText}`);
        throw new Error(`AI_GATEWAY_${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      brisaReply = aiData.choices?.[0]?.message?.content || "🌿 Desculpe, não consegui processar. Tente novamente!";
    } catch (aiErr) {
      const aiMs = aiTimer();
      console.error(`[Brisa COO] AI call failed after ${aiMs}ms:`, aiErr);
      // Fallback with deep link based on detected intent
      const link = DEEP_LINKS[intent] || DEEP_LINKS.geral;
      brisaReply = `🌿 Estou com uma lentidão momentânea! Enquanto isso, acesse ${link.label}: ${link.url} 💚\nVolto em 1 minutinho!`;
      previousMessages.push({ role: "assistant", content: brisaReply });
      await persistConversation(supabase, phoneClean, previousMessages, messageBody, sentiment, intent, affiliateTags);
      return twimlResponse(brisaReply);
    }

    previousMessages.push({ role: "assistant", content: brisaReply });

    // ─── Persist conversation + affiliate tags ───
    await persistConversation(supabase, phoneClean, previousMessages, messageBody, sentiment, intent, affiliateTags);

    // ─── Clinical Handoff: Generate triage summary on scheduling intent ───
    if (intent === "agendar" && previousMessages.length >= 4) {
      await generateClinicalSummary(supabase, phoneClean, previousMessages);
    }

    // ─── (c) Evolution API send (Enfª Brisa) ───
    const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "Brisa_CEO";

    if (EVO_URL && EVO_KEY && from) {
      const evoTimer = timer();
      try {
        const phoneNumber = (from || "").replace(/\D/g, "");
        const evoResp = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVO_KEY },
          body: JSON.stringify({ number: phoneNumber, text: brisaReply, delay: 1200 }),
        });
        const evoMs = evoTimer();
        const evoData = await evoResp.json().catch(() => ({}));
        console.log(`[Brisa COO][Telemetry] Evolution: ${evoMs}ms | ID: ${evoData?.key?.id || evoData?.messageId || "N/A"}`);
      } catch (evoErr) {
        const evoMs = evoTimer();
        console.error(`[Brisa COO] Evolution failed after ${evoMs}ms:`, evoErr);
      }
    }

    // ─── Health Check ───
    const totalMs = totalTimer();
    console.log(`[Brisa COO][Telemetry] Total: ${totalMs}ms`);
    if (totalMs > AI_LATENCY_WARN_MS) {
      console.warn(`[Brisa COO][HEALTH] ⚠️ High latency: ${totalMs}ms (threshold: ${AI_LATENCY_WARN_MS}ms)`);
    }

    return twimlResponse(brisaReply);
  } catch (e) {
    const totalMs = totalTimer();
    console.error(`[Brisa COO] Unhandled error after ${totalMs}ms:`, e);
    return twimlResponse("🌿 Tivemos um imprevisto técnico. Por favor, tente novamente em 1 minuto ou acesse plantayraiz.com.br — estamos aqui por você! 💚");
  }
});

// ─── Clinical Handoff: Consolidate WhatsApp history into triage summary ───
async function generateClinicalSummary(
  supabase: ReturnType<typeof createClient>,
  phone: string,
  messages: Array<{ role: string; content: string }>
) {
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return;

    const summaryPrompt = `Analise o histórico de conversa abaixo entre a enfermeira Brisa e um paciente via WhatsApp.
Gere um RESUMO CLÍNICO DE TRIAGEM conciso para o médico, contendo:
- **Sintomas Relatados**: lista dos sintomas mencionados
- **Duração**: há quanto tempo o paciente apresenta os sintomas
- **Intensidade**: leve/moderada/severa (baseado nas palavras do paciente)
- **Tratamentos Anteriores**: medicamentos ou terapias mencionadas
- **Interesse em Cannabis**: o que o paciente sabe/espera do tratamento
- **Nível de Urgência**: baixa/média/alta
- **Observações da Brisa**: qualquer insight relevante da conversa

Histórico:
${messages.map(m => `[${m.role}]: ${m.content}`).join("\n")}

Responda APENAS com o resumo clínico formatado. Sem saudações.`;

    const aiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: summaryPrompt }],
      }),
    });

    if (aiResp.ok) {
      const data = await aiResp.json();
      const summary = data.choices?.[0]?.message?.content || "";
      
      if (summary) {
        // Store clinical summary linked to phone
        await supabase.from("whatsapp_conversations").update({
          clinical_summary: summary,
          clinical_summary_at: new Date().toISOString(),
        }).eq("phone_number", phone);

        console.log(`[Brisa COO] Clinical summary generated for ${phone.substring(0, 6)}***`);
      }
    }
  } catch (err) {
    console.error("[Brisa COO] Clinical summary error:", err);
  }
}

// ─── Helpers ───

async function persistConversation(
  supabase: ReturnType<typeof createClient>,
  phoneClean: string,
  messages: Array<{ role: string; content: string }>,
  rawMessage: string,
  sentiment: string,
  intent: string,
  affiliateTags: string[]
) {
  try {
    await supabase
      .from("whatsapp_conversations")
      .upsert({
        phone_number: phoneClean,
        messages: messages.slice(-50),
        last_intent: intent,
        sentiment,
        updated_at: new Date().toISOString(),
      }, { onConflict: "phone_number" });

    const tags = [intent, `sentiment:${sentiment}`];
    if (affiliateTags.length > 0) {
      tags.push(...affiliateTags.filter(t => t.startsWith("affiliate:") || t === "brisa_assisted"));
    }

    await supabase.from("leads_contatos").upsert({
      telefone: phoneClean,
      nome: phoneClean,
      origem: "whatsapp_brisa_coo",
      tags,
    }, { onConflict: "telefone" });
  } catch (err) {
    console.error("[Brisa COO] Persist error:", err);
  }
}

function twimlResponse(message: string): Response {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
  );
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const intents: Record<string, string[]> = {
    agendar: ["agendar", "consulta", "marcar", "horario", "agenda", "quero consultar", "medico"],
    receita: ["receita", "prescricao", "renovar", "medicamento", "remedio"],
    preco: ["preco", "valor", "quanto custa", "plano", "assinatura"],
    triagem: ["sintoma", "dor", "ansiedade", "insonia", "depressao", "epilepsia", "fibromialgia"],
    urgente: ["urgente", "emergencia", "dor forte", "crise"],
    shopping: ["comprar", "produto", "oleo", "cbd", "shopping"],
    reembolso: ["reembolso", "cancelar", "devolver", "estorno"],
    anvisa: ["anvisa", "importacao", "importar", "rdc", "autorizacao"],
    afiliado: ["afiliado", "indicar", "comissao", "ganhar", "parceiro"],
  };
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(k => lower.includes(k))) return intent;
  }
  return "geral";
}

function detectSentiment(message: string): string {
  const lower = message.toLowerCase();
  const negative = ["dor", "sofrendo", "ruim", "péssimo", "horrível", "triste", "mal", "pior", "desespero", "angústia", "não aguento"];
  const positive = ["obrigado", "obrigada", "ótimo", "maravilh", "bom", "melhor", "feliz", "aliviado", "excelente", "parabéns"];
  
  if (negative.some(w => lower.includes(w))) return "negative";
  if (positive.some(w => lower.includes(w))) return "positive";
  return "neutral";
}
