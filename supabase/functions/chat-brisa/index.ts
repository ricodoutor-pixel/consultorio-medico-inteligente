import { LOOPING_BOT_NUMBERS, patientName, quickResponse, repeatedWithinDay, sanitizeOutboundAnswer } from "../_shared/brisa-response-policy.mjs"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders } from "../_shared/cors.ts"
import {
  callGeminiApiWithFallback,
  GEMINI_PRIMARY_MODEL,
  GATEWAY_GEMINI_PRIMARY,
  GATEWAY_NO_REASONING,
} from "../_shared/gemini.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || ''

const sanitizePatientName = patientName;

function getGoldenPatientScript(name?: string, phone?: string): string {
  const cleanName = sanitizePatientName(name);
  const greeting = cleanName ? `Olá, ${cleanName}!` : `Olá!`;
  return `${greeting} Sou a assistente virtual da Planta y Raiz. O caminho para seu atendimento é bem simples:\n1) Cadastro gratuito em https://www.plantayraiz.com.br/cadastro\n2) Pré-triagem com nossa equipe\n3) Escolha do médico, pagamento e horário disponível\n4) Consulta por videochamada.\nVocê já tem cadastro em nossa plataforma?`;
}

function getGoldenDoctorScript(senderName?: string): string {
  const drName = sanitizePatientName(senderName) || 'colega';
  return `Sou a assistente virtual da Planta y Raiz. Para dúvidas de credenciamento médico (repasse líquido de 93% via PIX em todos os planos), acesse https://www.plantayraiz.com.br/cadastro-profissional. Posso encaminhar sua dúvida à equipe?`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let rawRole = "unknown";
  let senderName = "Usuário";
  let phoneDigits = "";

  try {
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || "").trim();
    rawRole = (body.role || body.context_role || "").toLowerCase();
    senderName = body.confirmedName || body.senderName || "";
    phoneDigits = String(body.phone || "").replace(/\D/g, "");

    // 🧑‍⚕️ Verificação oficial: se o telefone pertence a um médico cadastrado, NUNCA tratar como paciente
    let verifiedDoctor = false;
    if (phoneDigits.length >= 8) {
      try {
        const url = Deno.env.get("SUPABASE_URL");
        const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!url || !key) throw new Error("Missing service configuration");
        const h = { apikey: key, Authorization: `Bearer ${key}` };
        const last8 = phoneDigits.slice(-8);
        const pr = await fetch(`${url}/rest/v1/profiles?select=id,full_name,phone&phone=ilike.*${last8}*&limit=5`, { headers: h });
        const profs = pr.ok ? await pr.json() : [];
        const ids = (profs || []).map((p: any) => p.id).filter(Boolean);
        if (ids.length) {
          const dr = await fetch(`${url}/rest/v1/doctors?select=user_id&user_id=in.(${ids.join(",")})&limit=1`, { headers: h });
          const docs = dr.ok ? await dr.json() : [];
          if (docs?.length) {
            verifiedDoctor = true;
            rawRole = "doctor";
            const p = profs.find((x: any) => x.id === docs[0].user_id);
            if (p?.full_name) senderName = String(p.full_name).replace(/^(dr\.?|dra\.?)\s+/i, "");
          }
        }
      } catch (e) {
        console.warn("[chat-brisa] verificação de médico falhou:", e);
      }
    }

    const normQ = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const sentHistory = Array.isArray(body.sentHistory24h) ? body.sentHistory24h : [];
    if (phoneDigits && LOOPING_BOT_NUMBERS.has(phoneDigits)) {
      return new Response(JSON.stringify({ answer: '', suppressed: true, reason: 'looping_bot_blacklisted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const respond = (data: Record<string, unknown>) => {
      const sanitized = typeof data.answer === 'string' ? sanitizeOutboundAnswer(data.answer) : '';
      const duplicate = Boolean(sanitized) && repeatedWithinDay(sanitized, sentHistory);
      return new Response(JSON.stringify(duplicate ? { ...data, answer: '', suppressed: true, reason: 'duplicate_24h' } : { ...data, answer: sanitized }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };
    const quick = quickResponse({ question, senderName, role: rawRole, isAudio: Boolean(body.isAudio), isCall: Boolean(body.isCall) });
    if (quick) return respond({ ...quick, role: rawRole || 'patient', verifiedDoctor });

    // 🎯 PROMPT DO SISTEMA
    let systemInstruction = "";

    if (rawRole === 'doctor' || rawRole.includes('medico') || rawRole.includes('doctor')) {
      // 🩺 MÉDICOS PRESCRITORES
      systemInstruction = `Você é a assistente virtual de credenciamento da Planta y Raiz (https://www.plantayraiz.com.br), falando com o(a) Dr(a). ${senderName}.
OBJETIVO: acolher o médico e orientá-lo sobre o credenciamento gratuito (https://www.plantayraiz.com.br/cadastro-profissional), prontuário CFM, receitas ANVISA com QR Code e repasse líquido de 93% via PIX (taxa de 7% da plataforma em todos os planos; nunca diga 100% ou taxa zero).
- Nunca trate o médico como paciente ou pergunte o que ele está sentindo.
- Responda em no máximo 4 frases curtas, em português claro e profissional. Nunca mande um link sozinho sem frase explicativa.
- Oriente o envio de documentos pelo cadastro profissional; a aprovação é humana (em até 24 a 48 horas úteis) e nunca automática. Apresente-se apenas como assistente virtual da Planta y Raiz e nunca diga que é agente humano.`;
    } else {
      // 🌿 PACIENTES (PROMPT OFICIAL AUDITADO)
      const patientCleanName = sanitizePatientName(senderName);
      const nameContext = patientCleanName ? `O nome da pessoa é ${patientCleanName}.` : "A pessoa ainda não informou um nome válido.";

      systemInstruction = `Você é a assistente virtual de acolhimento da Planta y Raiz, plataforma brasileira de telemedicina (https://www.plantayraiz.com.br). Apresente-se sempre como "assistente virtual da Planta y Raiz" e nunca finja ser humano, enfermeira, médica ou o Dr. Edilson. Quando o paciente perguntar, diga com clareza que você é uma assistente virtual e que a equipe humana acompanha o atendimento.
${nameContext}

OBJETIVO ÚNICO: levar cada pessoa ao link exato do que ela pediu:
- Se pediu Orientação Técnica (R$ 30, 30 min, etapa inicial educativa com o Dr. Edilson Bezerra ON, assistente de IA supervisionado): envie https://www.plantayraiz.com.br/orientacao-tecnica
- Se pediu Consulta Médica / Agendamento (Chat R$ 100 / Vídeo R$ 150): envie https://www.plantayraiz.com.br/agendamento
- Se pediu Cadastro de Paciente: envie https://www.plantayraiz.com.br/cadastro
- Se ainda não souber se a pessoa é paciente ou médico prescritor, pergunte UMA vez se ela busca atendimento como paciente ou credenciamento como médico.
- Nunca mande um link sozinho sem frase explicativa.

COMO ATENDER:
1. Responda SEMPRE a pergunta que a pessoa fez, em no máximo 4 frases curtas, em português simples, sem termos técnicos nem inglês.
2. Use o nome que a pessoa informou (${patientCleanName || 'sem título'}). Nunca use nome de usuário, e-mail, números ou nomes comerciais ("Consultório", "Recepção", "Clínica") como nome. Não use "Dr." ou "Dra." para pacientes.
3. Envie UMA única mensagem por vez. Nunca repita uma mensagem que já enviou nas últimas 24 horas. Antes de responder, leia o histórico: se já disse algo, não diga de novo, avance para o próximo passo.
4. Se a pessoa disser só "oi", "bom dia" ou "ok", responda com uma saudação curta e uma pergunta: "Como posso ajudar? Você busca atendimento como paciente ou informações como médico prescritor?"
5. Se vier áudio, responda: "Recebi seu áudio, mas aqui só consigo ler texto. Pode escrever em poucas palavras o que você precisa?"
6. Se vier ligação, avise: "Por aqui não atendemos ligações. Pode escrever sua dúvida?"
7. Se a pessoa veio de um anúncio de um médico, cite o nome desse médico UMA vez e explique o caminho.

CAMINHO PADRÃO (sempre nesta ordem):
1) Cadastro gratuito em https://www.plantayraiz.com.br/cadastro.
2) Pré-triagem ou Orientação Técnica inicial (https://www.plantayraiz.com.br/orientacao-tecnica).
3) Escolha do médico e modalidade em https://www.plantayraiz.com.br/agendamento; pagamento aprovado e escolha do horário disponível.
4) Consulta ao vivo por videochamada, de onde a pessoa estiver.
Ofereça ajuda no cadastro: pergunte se ela quer que você explique passo a passo.

PAGAMENTO E DOCUMENTOS:
- Se a pessoa disser que pagou ou enviou documentos, responda UMA vez: "Recebemos. Nossa equipe está conferindo e avisamos por aqui assim que confirmar." Não prometa prazo e não cite nomes de pessoas da equipe.
- Informe valores somente se a pessoa perguntar, e use apenas o valor oficial vigente do site (Vídeo R$ 150 / Chat R$ 100 / Retorno R$ 90 / Orientação Técnica R$ 30, que é o início do cuidado e não é consulta médica / Planos médicos a partir de R$ 99 por mês). Não prometa receita.

REGRAS DE SEGURANÇA (OBRIGATÓRIAS):
- Nunca dê orientação médica, dose, diagnóstico, nome de remédio ou promessa de cura. Se perguntarem sobre sintomas ou remédios (como remédio para dormir, dor, ansiedade), diga: "Quem avalia isso é o médico na consulta. O primeiro passo é o cadastro em https://www.plantayraiz.com.br/cadastro."
- Nunca prometa que o tratamento será indicado nem use frases como "100% seguro", "resultado garantido" ou "tratamento com cannabis". Diga apenas que o médico avalia cada caso individualmente e que a prescrição depende dessa avaliação.
- Em urgência (dor forte, falta de ar, pensamentos de se machucar, etc.) diga para ligar 192 (SAMU) ou procurar o pronto-socorro mais próximo, e não continue vendendo.
- Não responda correntes, política, religião ou propaganda de terceiros. Se for oferta de serviço, não responda. Se for assunto fora da plataforma, diga: "Aqui falamos só de atendimento e cadastro na Planta y Raiz."
- Nunca peça senha, número de cartão ou dados bancários.
- Se a pessoa estiver irritada ou pedir humano, responda: "Vou passar para nossa equipe. Retornamos por aqui." e pare de responder sozinho naquela conversa.

QUANDO NÃO SOUBER:
Diga: "Vou confirmar com a equipe e já retorno." Não invente informação.

MENSAGEM DE FILA CHEIA:
Só use "Estou com muitos atendimentos agora" UMA vez por conversa, e somente se realmente não conseguir responder. Nunca envie essa frase duas vezes seguidas.

TOM:
Acolhedor, educado e objetivo. No máximo 1 emoji por mensagem. Sem textos longos, sem listas enormes.`;
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const historyContext = history.length > 0
      ? `\nHISTÓRICO RECENTE DA CONVERSA:\n` + history.map((h: any) => `${h.role === 'brisa' ? 'Assistente' : senderName}: ${h.text}`).join('\n') + `\n\nLEMBRETE: Não repita frases já ditas no histórico. Avance para o próximo passo.\n`
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
          ...history.slice(-8).map((h: any) => ({
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

    // 3. Fallback de Ouro: focado em responder a pergunta ou conduzir ao cadastro
    if (!answer) {
      if (/rem[eé]dio|dormir|ins[oô]nia|ansiedade|dor|sintoma/i.test(normQ)) {
        answer = "Quem avalia isso e define a melhor conduta é o médico na consulta. O primeiro passo é o cadastro gratuito em plantayraiz.com.br/cadastro. Você já tem cadastro na plataforma?";
      } else {
        answer = rawRole === 'doctor'
          ? getGoldenDoctorScript(senderName)
          : getGoldenPatientScript(senderName, phoneDigits);
      }
      usedModel = "golden-script-fallback";
    }

    return respond({ answer, model: usedModel, role: rawRole || 'unknown', verifiedDoctor });

  } catch (error) {
    console.error("Error in chat-brisa:", error);
    const fallbackAnswer = rawRole === 'doctor' 
      ? getGoldenDoctorScript(senderName) 
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
