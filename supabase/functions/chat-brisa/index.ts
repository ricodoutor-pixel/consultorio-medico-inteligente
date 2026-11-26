import {
  isAutoReplyOrCommercialBot,
  isBusinessOrNonDoctorSender,
  LOOPING_BOT_NUMBERS,
  patientName,
  quickResponse,
  repeatedWithinDay,
  sanitizeOutboundAnswer,
} from "../_shared/brisa-response-policy.mjs"
import { T } from "../_shared/brisa-templates.mjs"
import { hasConfirmedCrm } from "../_shared/whatsapp-outreach-guard.mjs"
import { hasPendingPaymentForPhone } from "../_shared/pending-payment-context.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"
import { requireServiceAuth } from "../_shared/service-auth.ts"
import {
  callGeminiApiWithFallback,
  GEMINI_PRIMARY_MODEL,
  GATEWAY_GEMINI_PRIMARY,
  GATEWAY_NO_REASONING,
} from "../_shared/gemini.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || ''

const sanitizePatientName = patientName;

function getGoldenPatientScript(name?: string, _phone?: string): string {
  const cleanName = sanitizePatientName(name);
  const greeting = cleanName ? `Olá, ${cleanName}!` : `Olá!`;
  return `${greeting} Sou a Enfª Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha). Você pode começar pela Orientação Técnica educativa (R$ 30) em https://www.plantayraiz.com.br/orientacao-tecnica ou escolher um médico na vitrine em https://www.plantayraiz.com.br/profissionais. O que faz mais sentido para você hoje?`;
}

function getGoldenDoctorScript(_senderName?: string): string {
  return `Sou a Enfª Brisa, assistente virtual da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.). Para médicos com registro em conselho: cadastro gratuito em https://www.plantayraiz.com.br/cadastro-profissional, plano Médico VIP R$ 99/mês e repasse de 93% de cada consulta (taxa de 7%). Como posso ajudar?`;
}

function detectColdContactFromHistory(history: Array<{ role?: string; text?: string }> = []): boolean {
  return history.some((h) => {
    if (h?.role !== 'brisa' && h?.role !== 'assistant') return false;
    const t = String(h?.text || '').toLowerCase();
    return /marketing médico|cadastro-profissional|convite|consultório virtual com vídeo/i.test(t);
  });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let rawRole = "unknown";
  let senderName = "";
  let phoneDigits = "";
  let suppressOnError = false;
  let isColdContact = false;

  try {
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || "").trim();
    rawRole = String(body.role || body.context_role || "").toLowerCase();
    senderName = String(body.confirmedName || body.senderName || "").trim();
    phoneDigits = String(body.phone || "").replace(/\D/g, "");
    const senderJid = String(body.senderJid || (phoneDigits ? `${phoneDigits}@s.whatsapp.net` : ""));
    const history = Array.isArray(body.history) ? body.history : [];
    isColdContact = Boolean(body.isColdContact) || detectColdContactFromHistory(history);

    // Phone-based identity lookup is internal messaging functionality, not public lookup.
    if (phoneDigits && requireServiceAuth(req, corsHeaders) !== null) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PAUSED_WHATSAPP_CONTACTS = new Set([
      "557591462018",
      "7591462018",
      "5575991462018",
      "75991462018",
      "212988065788005",
      "5511987131241",
    ]);

    const normQ = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normSender = String(senderName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 🛑 Bloqueio imediato de bots/URAs/auto-respostas comerciais (silêncio total)
    if (
      (phoneDigits && LOOPING_BOT_NUMBERS.has(phoneDigits)) ||
      isAutoReplyOrCommercialBot(question, { senderName, senderJid })
    ) {
      suppressOnError = true;
      return new Response(JSON.stringify({ answer: "", suppressed: true, reason: "auto-reply-suppressed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🛑 Se a conversa no WhatsApp está pausada pelo Dr. Edilson ou pelo contato, suprime imediatamente
    if (
      (phoneDigits && PAUSED_WHATSAPP_CONTACTS.has(phoneDigits)) ||
      (phoneDigits && (normSender.includes("geisell") || /^dra\s+g\b/.test(normSender))) ||
      /\b(vou pausar|pausar a automacao|pausar esta conversa|pausar conversa|pausa a automacao|pausar ia)\b/.test(normQ)
    ) {
      suppressOnError = true;
      return new Response(JSON.stringify({ answer: "", suppressed: true, reason: "human_paused_conversation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🛑 Se veio do WhatsApp (phoneDigits presente), checa na Evolution API se o Dr. Edilson assumiu a conversa manualmente nas últimas 24h
    if (phoneDigits.length >= 10) {
      try {
        const evoUrl = Deno.env.get("EVOLUTION_API_URL") || "https://whatsapp.plantayraiz.com.br";
        const evoKey = Deno.env.get("EVOLUTION_API_KEY") || "";
        const evoInst = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
        const jid = phoneDigits.length >= 14 && !phoneDigits.startsWith("55")
          ? `${phoneDigits}@lid`
          : `${phoneDigits}@s.whatsapp.net`;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2200);
        const evoRes = await fetch(`${evoUrl}/chat/findMessages/${evoInst}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evoKey },
          body: JSON.stringify({ where: { key: { remoteJid: jid } }, limit: 15, page: 1 }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (evoRes.ok) {
          const evoData = await evoRes.json().catch(() => ({}));
          const recs = evoData?.messages?.records || [];
          const cutoffSec = Math.floor(Date.now() / 1000) - 24 * 3600;
          for (const m of recs) {
            if ((m.messageTimestamp || 0) < cutoffSec) continue;
            const mText = String(
              m.message?.conversation ||
              m.message?.extendedTextMessage?.text ||
              m.message?.imageMessage?.caption ||
              ""
            ).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (/\b(reativar_ia|retomar_ia|ativar_ia|liberar_ia)\b/.test(mText)) break;
            if (
              /\b(vou pausar|pausar a automacao|pausar esta conversa|pausar conversa|pausa a automacao|preciso falar com humano|falar com humano|atendente humano)\b/.test(mText) ||
              (m.key?.fromMe && (m.source === "android" || m.source === "ios"))
            ) {
              suppressOnError = true;
              return new Response(JSON.stringify({ answer: "", suppressed: true, reason: "human_paused_conversation" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        }
      } catch {
        // Continua normalmente se a checagem Evolution exceder timeout
      }
    }

    // 🧑‍⚕️ Verificação oficial: médico cadastrado + CRM confirmado; checagem de cobrança pendente do próprio contato
    let verifiedDoctor = false;
    let hasPendingPaymentContext = false;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    if (phoneDigits.length >= 8 && supabaseUrl && supabaseKey) {
      try {
        const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
        const last8 = phoneDigits.slice(-8);
        const pr = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,full_name,phone&phone=ilike.*${last8}*&limit=5`, { headers: h });
        const profs = pr.ok ? await pr.json() : [];
        const ids = (profs || []).map((p: { id?: string }) => p.id).filter(Boolean);
        if (ids.length) {
          const dr = await fetch(
            `${supabaseUrl}/rest/v1/doctors?select=user_id,crm,crm_state,council_type&user_id=in.(${ids.join(",")})&limit=1`,
            { headers: h },
          );
          const docs = dr.ok ? await dr.json() : [];
          if (docs?.length) {
            const doc = docs[0];
            rawRole = "doctor";
            verifiedDoctor = hasConfirmedCrm(doc.crm, doc.crm_state, doc.council_type);
            const p = profs.find((x: { id?: string; full_name?: string }) => x.id === doc.user_id);
            if (p?.full_name) senderName = String(p.full_name).replace(/^(dr\.?|dra\.?|dr\(a\)\.?)\s+/i, "");
          }
        }
      } catch (e) {
        console.warn("[chat-brisa] verificação de médico falhou:", e);
      }

      if (supabase && phoneDigits.length >= 10) {
        const pendingCheck = await hasPendingPaymentForPhone(supabase, phoneDigits);
        hasPendingPaymentContext = pendingCheck.hasPendingPayment;
      }
    }

    // 🛑 Empresas/PJ/clínicas/não-médicos que não são médicos cadastrados: silêncio total (exceto opt-out no quickResponse)
    if (rawRole !== "doctor" && isBusinessOrNonDoctorSender(senderName)) {
      suppressOnError = true;
    }

    const sentHistory = Array.isArray(body.sentHistory24h) ? body.sentHistory24h : [];
    const respond = (data: Record<string, unknown>) => {
      const sanitized = typeof data.answer === 'string' ? sanitizeOutboundAnswer(data.answer) : '';
      const duplicate = Boolean(sanitized) && repeatedWithinDay(sanitized, sentHistory);
      return new Response(JSON.stringify(duplicate ? { ...data, answer: '', suppressed: true, reason: 'duplicate_24h' } : { ...data, answer: sanitized }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    const effectiveRole = rawRole || (isColdContact ? 'unknown' : 'patient');
    const quick = quickResponse({
      question,
      senderName,
      senderJid,
      role: effectiveRole,
      isAudio: Boolean(body.isAudio),
      isCall: Boolean(body.isCall),
      isSticker: Boolean(body.isSticker),
      introducedRecently: Boolean(body.introducedRecently),
      hasPendingPaymentContext,
      isColdContact,
    });
    if (quick) return respond({ ...quick, role: effectiveRole, verifiedDoctor });

    // Se for empresa/PJ e passou pelo quickResponse (não era opt-out), manter silêncio total
    if (suppressOnError) {
      return respond({ answer: "", suppressed: true, reason: "business-contact-suppressed", role: effectiveRole, verifiedDoctor });
    }

    // 🎯 PROMPT DO SISTEMA (Auditoria e Treinamento de Vendas — 19/11/2026)
    let systemInstruction = "";

    if (rawRole === 'doctor' || rawRole.includes('medico') || rawRole.includes('doctor')) {
      // 🩺 PROFISSIONAIS DE SAÚDE / MÉDICOS PRESCRITORES
      const cleanName = sanitizePatientName(senderName);
      const addressingRule = verifiedDoctor
        ? `Você está falando com um médico com CRM confirmado (${cleanName ? `Dr(a). ${cleanName}` : 'colega'}).`
        : `NUNCA chame de "Dr(a)." quem não tiver CRM confirmado. Use apenas o nome da pessoa (${cleanName || 'sem título'}).`;

      systemInstruction = `Você é a Enfª Brisa, assistente virtual da Planta y Raiz (Bezerra Med Soluções Integradas Ltda., CNPJ 30.740.319/0001-14). Fale em português simples, frases curtas (máximo 3 a 4 linhas), tom acolhedor e profissional, sem jargão e no máximo 1 emoji. Diga que é assistente virtual e que a equipe humana acompanha.
${addressingRule}

INFORMAÇÕES OFICIAIS PARA PROFISSIONAIS COM REGISTRO EM CONSELHO:
- Cadastro gratuito (somente para quem tem registro ativo em conselho): https://www.plantayraiz.com.br/cadastro-profissional
- Condição oficial (definida pelo Dr. Edilson em 19/11/2026): repasse de 93% de cada consulta via PIX (taxa fixa de 7% da plataforma em todos os planos) e plano Médico VIP R$ 99/mês (prioridade na fila de pacientes, destaque na vitrine e ferramentas de IA: Copiloto Clínico, Assistente Jurídico e Escriba). Planos em https://www.plantayraiz.com.br/precos.
- Aprovação cadastral (KYC) é humana em até 24 a 48 horas úteis; pagar assinatura nunca aprova CRM automaticamente.

NUNCA FAÇA:
- Dizer "sócio", "participação nos lucros", "pacientes 100% seus", "taxa zero" ou "100% de repasse".
- Chamar de "Dr(a)." quem não tiver CRM confirmado.
- Tratar profissional como paciente ou enviar link sozinho sem frase explicativa.
- Classificar mensagem como pagamento sem cobrança pendente confirmada.
- Se o profissional pedir condição comercial diferente, tiver dúvida sobre repasse/contrato ou questão jurídica, encaminhe para a equipe humana ("Vou passar para nossa equipe humana. Retornamos por aqui.").`;
    } else if (isColdContact) {
      // 🛑 CONTATO FRIO: nunca oferecer Orientação Técnica de paciente nem chamar de Dr(a). sem CRM confirmado
      systemInstruction = `Você é a Enfª Brisa, assistente virtual da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.). Responda em português simples, no máximo 2 a 3 linhas.
REGRAS ESTRITAS PARA CONTATO FRIO:
- NUNCA ofereça Orientação Técnica (R$ 30) nem envie link de checkout de paciente.
- NUNCA chame de "Dr(a)." sem CRM confirmado.
- NUNCA diga "sócio", "participação nos lucros", "taxa zero", "100% de repasse" ou "Recebemos sua mensagem sobre o pagamento".
- Se a pessoa pedir para parar ou não tiver interesse, oriente responder SAIR e encerre educadamente.`;
    } else {
      // 🌿 VENDAS CONSULTIVAS PARA PACIENTES E INTERESSADOS (19/11/2026)
      const patientCleanName = sanitizePatientName(senderName);
      const nameContext = patientCleanName ? `O nome da pessoa é ${patientCleanName}.` : "A pessoa ainda não informou um nome válido.";

      systemInstruction = `Você é a Enfª Brisa, assistente virtual da Planta y Raiz (Bezerra Med Soluções Integradas Ltda., CNPJ 30.740.319/0001-14). Fale em português simples, frases curtas (no máximo 3 a 4 linhas por mensagem), tom acolhedor e consultivo, sem jargão e no máximo 1 emoji. Diga que é assistente virtual e que a equipe humana acompanha.
${nameContext}

SERVIÇOS E URLS OFICIAIS QUE VOCÊ PODE VENDER (NUNCA INVENTE PREÇO OU LINK):
1) Orientação Técnica: R$ 30 (internacional US$ 10) — https://www.plantayraiz.com.br/orientacao-tecnica
   - O que é: porta de entrada educativa de 30 minutos conduzida pela Enfª Brisa (assistente virtual, com supervisão técnica da Dra. Suelen Naves Rodrigues, CRM 49354/PR). É apenas o início do cuidado: NÃO é consulta, NÃO diagnostica, NÃO prescreve e NÃO indica medicamento nem dose. Entrega: relatório educativo em PDF revisado e encaminhamento ao médico mais indicado.
2) Consulta com médico prescritor: o preço é o que aparece no perfil do médico na vitrine — https://www.plantayraiz.com.br/profissionais (ou fluxo de teleconsulta em https://www.plantayraiz.com.br/telemedicina e agendamento em https://www.plantayraiz.com.br/agendamento; referência da plataforma: Chat R$ 100, Vídeo R$ 150, Retorno R$ 90, Premium R$ 180 — sempre consulte a vitrine e nunca invente preço).
3) Planos VIP e Módulos de Diagnóstico — https://www.plantayraiz.com.br/precos
   - Paciente VIP: R$ 99/mês (isenção de taxa de 5% no shopping e prioridade na triagem).
   - Médico VIP: R$ 99/mês (prioridade na fila e ferramentas de IA; repasse de 93% de cada consulta).
   - Lojista VIP: R$ 99/mês (até 10 produtos, destaque nas recomendações IA; taxa padrão de 5% do marketplace).
   - 11 módulos de diagnóstico digital: R$ 29,90 cada ou combo completo por R$ 97 (pagamento único).
4) Cadastro gratuito de profissional (somente com registro em conselho): https://www.plantayraiz.com.br/cadastro-profissional
5) Política de Reembolso oficial: https://www.plantayraiz.com.br/reembolso (cancelamento >24h = reembolso integral em até 7 dias úteis; entre 2h e 24h = crédito Planta-Coins; assinaturas = direito de arrependimento em 7 dias corridos).

COMO VENDER (FUNIL CONSULTIVO — 1 PERGUNTA POR VEZ):
1. Entenda em UMA pergunta curta o que a pessoa precisa (ex.: "O que te trouxe até a Planta y Raiz hoje?").
2. Ofereça o serviço certo com preço e o que ela recebe (comece pela Orientação Técnica R$ 30 para quem está pesquisando ou inseguro; ofereça consulta na vitrine para quem já quer falar direto com médico).
3. Envie o link oficial do checkout da plataforma com uma frase explicativa (nunca mande link sozinho).
4. Acesso liberado SOMENTE após o sistema confirmar o pagamento (webhook Mercado Pago aprovado). Nunca aceite pagamento "por fora" e nunca libere acesso só porque o cliente disse "já paguei" ou mandou print.

TRATAMENTO DE OBJEÇÕES:
- "É caro / não sei se vale": destaque a Orientação Técnica (R$ 30) como primeiro passo acessível para tirar dúvidas educativas e ser encaminhado ao médico certo.
- "É legal / seguro?": explique que a teleconsulta e a eventual prescrição seguem as normas vigentes (CFM e ANVISA), sempre após avaliação individual de um médico habilitado.
- "Vocês vendem óleo / CBD / cannabis?": deixe claro que a Planta y Raiz NÃO vende nem entrega medicamentos ou produtos derivados de cannabis; conectamos você à Orientação Técnica (R$ 30) ou a médicos prescritores.
- "Já tenho receita": explique que a renovação ou ajuste depende de avaliação médica na plataforma (https://www.plantayraiz.com.br/profissionais).
- "Vou pensar": respeite sem pressionar, deixe o link e pergunte se ficou alguma dúvida.
- "Você é robô?": confirme com transparência que é a Enfª Brisa, assistente virtual, e que a equipe humana acompanha.

NUNCA FAÇA:
- Prometer cura, resultado, receita ou desconto não cadastrado; falar de dose, posologia ou medicamento; fazer diagnóstico.
- Vender ou indicar produto/medicamento de cannabis.
- Dizer "sócio", "participação nos lucros", "taxa zero", "100% de repasse" ou "pacientes 100% seus".
- Chamar de "Dr(a)." quem não for médico confirmado. Use o nome da pessoa (${patientCleanName || 'sem título'}).
- Responder a outros robôs ("mensagem automática", "assistente virtual de..."): fique em silêncio.
- Repetir frases já enviadas nas últimas 24h ou fazer textões longos.

ENCAMINHE PARA HUMANO (responda "Vou passar para nossa equipe humana. Retornamos por aqui."):
- Reclamação, pedido de reembolso, caso clínico complexo, menor de idade, urgência (oriente SAMU 192 imediatamente antes de tudo), pedido jurídico ou qualquer dúvida sobre repasse a médico.`;
    }

    const historyContext = history.length > 0
      ? `\nHISTÓRICO RECENTE DA CONVERSA:\n` + history.map((h: { role?: string; text?: string }) => `${h.role === 'brisa' ? 'Assistente' : senderName}: ${h.text}`).join('\n') + `\n\nLEMBRETE: Não repita frases já ditas no histórico. Avance para o próximo passo.\n`
      : "";

    const requestBody = {
      contents: [{
        parts: [{ text: `${systemInstruction}\n${historyContext}\nMensagem recebida: ${question}` }]
      }]
    };

    let answer = "";
    let usedModel = "";

    // 1. Lovable AI Gateway
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey) {
      try {
        const gwMessages = [
          { role: "system", content: systemInstruction },
          ...history.slice(-8).map((h: { role?: string; text?: string }) => ({
            role: h.role === 'brisa' ? 'assistant' : 'user',
            content: h.text || ''
          })),
          { role: "user", content: question }
        ];
        const gw = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${lovableKey}`,
            "Lovable-API-Key": lovableKey 
          },
          body: JSON.stringify({
            model: GATEWAY_GEMINI_PRIMARY,
            reasoning: GATEWAY_NO_REASONING,
            messages: gwMessages,
          }),
        });
        const gwData = await gw.json().catch(() => ({}));
        if (gw.ok) {
          answer = gwData?.choices?.[0]?.message?.content || "";
          usedModel = GATEWAY_GEMINI_PRIMARY;
        }
      } catch (gwErr) {
        console.warn("[chat-brisa] Gateway erro:", gwErr);
      }
    }

    // 2. Chave Gemini direta do Google (fallback)
    if (!answer && GEMINI_API_KEY) {
      const res = await callGeminiApiWithFallback(GEMINI_API_KEY, requestBody, GEMINI_PRIMARY_MODEL);
      answer = res.ok ? (res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "") : "";
      usedModel = res.usedModel;
    }

    // 3. Fallback de Ouro: nunca oferece Orientação Técnica para empresas ou contatos frios
    if (!answer) {
      if (isColdContact && rawRole !== 'doctor') {
        answer = T.coldContactGreeting;
      } else if (/rem[eé]dio|dormir|ins[oô]nia|ansiedade|dor|sintoma/i.test(normQ)) {
        answer = "Quem avalia isso e define a melhor conduta é o médico na consulta. O primeiro passo é o cadastro gratuito em plantayraiz.com.br/cadastro. Você já tem cadastro na plataforma?";
      } else {
        answer = rawRole === 'doctor'
          ? getGoldenDoctorScript(senderName)
          : getGoldenPatientScript(senderName, phoneDigits);
      }
      usedModel = "golden-script-fallback";
    }

    return respond({ answer, model: usedModel, role: effectiveRole, verifiedDoctor });

  } catch (error) {
    console.error("Error in chat-brisa:", error);
    if (suppressOnError || isBusinessOrNonDoctorSender(senderName)) {
      return new Response(
        JSON.stringify({ answer: "", suppressed: true, degraded: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const fallbackAnswer = rawRole === 'doctor'
      ? getGoldenDoctorScript(senderName)
      : isColdContact
        ? T.coldContactGreeting
        : getGoldenPatientScript(senderName, phoneDigits);

    return new Response(
      JSON.stringify({
        answer: fallbackAnswer,
        degraded: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
