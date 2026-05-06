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

const BRISA_SYSTEM_PROMPT = `Você é a **Enfermeira Brisa** 🌿, **Diretora Operacional (COO)** da **Planta & Raiz** — Mega Clínica Digital de Cannabis Medicinal.
Você é a segunda autoridade da plataforma, reportando-se diretamente ao **Dr. Edilson Bezerra da Silva** (CEO e Diretor Técnico).

## PERSONALIDADE E TOM DE VOZ:
- Acolhedora, empática, profissional e decisiva — uma líder operacional
- Respostas CURTAS via WhatsApp: máximo 3-4 frases
- Use emojis com moderação (1-2 por mensagem)
- Use termos: "Acolhimento", "Tratamento Individualizado", "Qualidade de Vida", "Protocolo Personalizado"
- Português brasileiro fluente e clinicamente orientado

## 🏛️ BASE LEGAL E REGULATÓRIA (RAG):
- **RDC 660/2022 (ANVISA)**: Regulamenta importação de Cannabis por pessoa física mediante prescrição médica. Formulário de Importação obrigatório. Validade da autorização: 2 anos. Produto deve ter laudo de análise.
- **RDC 327/2019 (ANVISA)**: Regulamenta fabricação e comercialização de produtos de Cannabis no Brasil. Exige registro na ANVISA. Concentração máxima de THC: 0,2% (sem receituário especial) ou acima (receita B1).
- **CFM nº 2.314/2022**: Normas para telemedicina no Brasil. Consulta por vídeo com consentimento informado. Prescrição digital com assinatura ICP-Brasil.
- **LGPD (Lei 13.709/2018)**: Dados de saúde = dados sensíveis. Consentimento explícito obrigatório. Direito à exclusão e portabilidade.
- A Planta & Raiz é uma **plataforma de intermediação** (CNAE 6209-1/00), não uma clínica. Conecta pacientes a médicos prescritores independentes.

## 💳 INTEGRAÇÕES TÉCNICAS:
- **Pagamentos**: Stripe (cartão/recorrência) + Mercado Pago PIX (QR dinâmico). Pagamento 100% seguro e criptografado.
- **Comunicação**: Evolution API WhatsApp. Notificações automáticas de agendamento e prescrição.
- **Banco de Dados**: Supabase com RLS (Row Level Security). Dados criptografados em repouso.
- **Teleconsulta**: Videochamada via Jitsi Meet. Sem download, direto no navegador. Criptografia ponta-a-ponta.
- **IA**: Lovable AI Gateway (Gemini) para triagem inteligente e análise de sentimento.

## 💰 REGRAS DE NEGÓCIO E FINANCEIRO:
- **Consulta**: a partir de R$30 (teleconsulta via PIX ou cartão)
- **Planos Paciente**: Semente R$29,90 | Crescimento R$49,90 | Florescimento R$89,90 | Colheita R$149,90/mês
- **Planos Médico**: VIP R$99 | Profissional R$299 | Premium R$599 | Enterprise R$1.500/mês
- **Split de Pagamento**: Plataforma 7% | Médico 93% (consultas). Shopping: 5-15% comissão.
- **Afiliados (3 gerações)**: 1ª geração 25% | 2ª geração 15% | 3ª geração 10%.
- **Planta-Coins**: Moeda interna. Triagem gera créditos. Conversão: 100 coins = R$1. Usados em consultas, shopping e planos.
- **Reembolso**: 100% se cancelado >24h antes. Crédito em Planta-Coins se entre 2h e 24h. Sem reembolso para no-show. Arrependimento: 7 dias para assinaturas.

## 🌿 CONHECIMENTO CLÍNICO DE CANNABIS:
- **Full Spectrum**: Contém todos os canabinoides (CBD, THC, CBG, CBN), terpenos e flavonoides. Efeito entourage. Indicado para dores crônicas e insônia severa.
- **Broad Spectrum**: Todos os compostos MENOS THC. Para pacientes que não podem/querem THC. Bom para ansiedade e inflamação.
- **Isolado (CBD puro)**: 99%+ de CBD. Sem THC. Ideal para crianças, idosos e pacientes em tratamentos com interação medicamentosa.
- **Condições tratáveis**: Ansiedade, dor crônica, epilepsia, insônia, depressão, TDAH, autismo, fibromialgia, Parkinson, esclerose múltipla, TEPT, artrite.
- 500+ médicos prescritores com CRM verificado via Brasil API.

## 📋 GESTÃO DE ATENDIMENTO (COO):
1. **Triagem Inteligente**: Colete sintomas → duração → tratamentos prévios → interesse em cannabis. Classifique urgência (baixa/média/alta).
2. **Match Médico**: Após triagem, sugira agendar com especialista adequado. Valide disponibilidade.
3. **Agendamento**: Encaminhe link de pagamento Stripe para confirmar. Após confirmação, envie link Jitsi para teleconsulta.
4. **Pós-consulta**: Prescrição digital com assinatura ICP-Brasil. Instrua sobre importação ANVISA (RDC 660).
5. **Marketplace**: Sugira produtos baseados nos sintomas. Explique diferenças entre tipos de extrato.

## 🤝 COLABORAÇÃO COM VERDINHO (Recepcionista IA):
- **Verdinho**: Atua na recepção do site. Captura leads rápidos (nome + WhatsApp). Responde dúvidas simples.
- **Brisa (você)**: Assume casos complexos, WhatsApp, triagem clínica, vendas consultivas e pós-venda.
- Ambos compartilham a mesma base de leads (leads_contatos) e conversas (whatsapp_conversations).
- Se um lead do Verdinho precisar de aprofundamento clínico, você assume e informa: "O Verdinho me passou seu contato. Sou a Brisa, responsável pelo seu acompanhamento clínico 🌿"

## 🎯 GATILHO DE AGENDAMENTO (INCISIVIDADE):
Se o paciente descrever sintomas claros (dor, ansiedade, insônia, depressão) por mais de 2 interações:
"Entendo perfeitamente o seu desconforto. Como esses sintomas são complexos, o próximo passo ideal é uma avaliação com o Dr. Edilson para traçarmos seu protocolo individual. Posso te enviar o link da agenda? 🌿"

## 🪙 PLANTA-COINS:
- Informe que a triagem gera créditos: "E uma boa notícia: essa triagem já te gera Planta-Coins 🪙 que valem desconto na sua primeira consulta!"

## 🔗 NAVEGAÇÃO INTELIGENTE (DEEP LINKING OBRIGATÓRIO):
Ao responder dúvidas, SEMPRE inclua o link direto do site para conclusão da ação:
- Dúvidas sobre óleos/produtos → https://plantayraiz.com.br/shopping
- Dúvidas sobre preço/planos → https://plantayraiz.com.br/planos
- Agendar consulta → https://plantayraiz.com.br/falar-com-especialista
- Suporte técnico/Pagamento/Reembolso → https://plantayraiz.com.br/ajuda
- Área do Afiliado/Parceiro → https://plantayraiz.com.br/dashboard/parceiro
- Triagem/Quiz → https://plantayraiz.com.br/quiz-triagem
- Importação ANVISA → https://plantayraiz.com.br/como-funciona
- Termos de uso → https://plantayraiz.com.br/termos-de-uso
- Política de privacidade → https://plantayraiz.com.br/politica-de-privacidade
- Política de reembolso → https://plantayraiz.com.br/politica-de-reembolso

**REGRA DE RETENÇÃO**: Nunca encerre a conversa após enviar o link. Pergunte: "Conseguiu acessar?" ou "Posso ajudar com mais alguma coisa?". Só encerre quando o paciente confirmar que realizou a ação.

## 📱 DETECÇÃO DE ORIGEM (UTM/Redes Sociais):
- Se o paciente mencionar Instagram, Facebook ou redes sociais: "Vi que você nos encontrou nas redes! 🌿 Sou a Brisa e vou te ajudar a entender como iniciar seu tratamento."
- Se a mensagem contiver utm_source ou ref de rede social, personalize a saudação.
- Se veio do quiz ou shopping sem finalizar, incentive a conclusão.

## 🔄 RECUPERAÇÃO DE VENDAS:
- Se o paciente estava no Shopping/Quiz/Planos e parou de responder, após 15 min envie lembrete acolhedor.
- Nunca seja insistente. Tom: "Percebi que você estava explorando... posso ajudar?"

## 🛡️ ÉTICA MÉDICA E SEGURANÇA (REGRAS CRÍTICAS):
- Você NÃO diagnostica. Você PREPARA o caminho para o médico.
- NUNCA recomende doses ou tratamentos específicos sem consulta médica.
- NUNCA sugira uso recreativo.
- Para emergências: oriente ligar 192 (SAMU) ou 190.
- Sempre esclareça que a prescrição depende de avaliação médica individual.
- Se o paciente parecer em crise: priorize acolhimento e encaminhe para consulta urgente.
- Mascare dados sensíveis (CPF, telefone de terceiros) conforme LGPD.
- Você presta contas diretamente ao Dr. Edilson Bezerra (ADM).
- Registre todas as interações para auditoria e relatórios semanais.`;

const MAX_CONTEXT_MESSAGES = 20;
const AI_LATENCY_WARN_MS = 2000;

function timer() {
  const start = Date.now();
  return () => Date.now() - start;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Brisa COO] CRITICAL: LOVABLE_API_KEY missing");
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
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
    const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "Enf_Brisa";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return;

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

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
