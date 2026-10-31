import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders } from "../_shared/cors.ts"
import {
  callGeminiApiWithFallback,
  GEMINI_PRIMARY_MODEL,
  GATEWAY_GEMINI_PRIMARY,
  GATEWAY_NO_REASONING,
} from "../_shared/gemini.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || ''

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}));
    const question = body.question || "";
    let rawRole = (body.role || body.context_role || "").toLowerCase();
    let senderName = body.senderName || "Doutor(a)";
    const phoneDigits = String(body.phone || "").replace(/\D/g, "");

    // 🧑‍⚕️ Verificação oficial: se o telefone pertence a um médico cadastrado, NUNCA tratar como paciente
    let verifiedDoctor = false;
    if (phoneDigits.length >= 8) {
      try {
        const url = Deno.env.get("SUPABASE_URL")!;
        const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    // 🙋 Pedido de atendente humano → a IA para e sinaliza a pausa
    const normQ = String(question).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/(humano|atendente|pessoa real|pessoa de verdade|falar com (alguem|uma pessoa|o dr|a dra|o doutor|a doutora|o edilson|a equipe|o suporte|suporte)|quero suporte|nao quero (falar com )?(robo|bot|ia)|voce e (um )?robo)/i.test(normQ)) {
      return new Response(JSON.stringify({
        handoff: true,
        role: rawRole || "unknown",
        answer: "Claro! Vou pausar o atendimento automático e chamar nossa equipe agora. Uma pessoa vai continuar a conversa com você por aqui em breve. 🙏🌿",
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    // 🎯 SEPARAÇÃO ESTRITA DE PÚBLICO (MÉDICO × FARMÁCIA × PACIENTE)
    let systemInstruction = "";

    if (rawRole === 'doctor' || rawRole.includes('medico') || rawRole.includes('doctor')) {
      // 🩺 PROMPT EXCLUSIVO PARA MÉDICOS PRESCRITORES
      systemInstruction = `Você é a Enfermeira Brisa, coordenadora clínica da plataforma Planta y Raíz, conversando diretamente com o(a) Dr(a). ${senderName}.
ATENÇÃO MÁXIMA: O interlocutor é um MÉDICO PRESCRITOR, NUNCA um paciente!
- NUNCA ofereça "Orientação Técnica de R$ 30" para o médico contratar (se ele perguntar o que é, explique usando o FAQ do item 5).
- NUNCA trate o médico como paciente ou pergunte o que ele está sentindo.
- NUNCA mencione que ele precisa de consulta ou receita médica.

SEU CONHECIMENTO CLÍNICO E OPERACIONAL PARA MÉDICOS:
1. PRONTUÁRIO E AUTONOMIA CLÍNICA:
- Prontuário eletrônico completo e integrado em plantayraiz.com.br/consultorio.
- O médico tem total autonomia técnica para conduzir a anamnese, titulação de doses (gotas/dia de canabinoides CBD/THC), evolução e retornos no protocolo terapêutico de 8 semanas.
- O paciente é 100% do médico! O acompanhamento, remarcações e retornos são agendados diretamente com ele.
- Emissão de receitas especiais com QR Code oficial válido pela ANVISA (RDC 660 e 327) e CFM com assinatura digital ICP-Brasil.

2. REPASSE E VALORES:
- Plano Médico VIP (R$ 99/mês): Você recebe 100% do valor da consulta (taxa zero da plataforma), com selo VIP de verificação e destaque na vitrine!
- Modelo Padrão: repasse de 93% líquido.
- O pagamento é liberado e transferido ao médico via PIX instantaneamente após o atendimento e a avaliação do paciente.

3. DISTRIBUIÇÃO DE PACIENTES (ESTILO UBER):
- 1º Escolha Soberana do Paciente na vitrine em plantayraiz.com.br/profissionais.
- 2º Despacho inteligente da fila: Prioridade 1 para Plano VIP, Prioridade 2 para proximidade geográfica no mapa.
- 3º Fallback autônomo 24/7: se o médico mais próximo estiver offline, o sistema transfere para o próximo médico online com KYC aprovado.
- 4º Orientação Técnica (porta de entrada da plataforma): triagem e educação conduzidas por IA supervisionada que entrega ao médico pacientes já triados e educados para a consulta real (veja o FAQ abaixo).

4. CREDENCIAMENTO E DOCUMENTOS:
- Fotos de CRM (frente/verso), RG/CNH e comprovante de endereço podem ser enviadas diretamente por este WhatsApp.
- Assinatura digital: basta enviar um PDF assinado com certificado digital (VIDaaS, BirdID, Certisign, Gov.br prata/ouro ou token).

5. FAQ — O QUE É A ORIENTAÇÃO TÉCNICA (R$ 30)? (responda com este conteúdo quando o médico perguntar)
- A Orientação Técnica (R$ 30) é uma modalidade de triagem e educação criada pela plataforma para separar pacientes realmente interessados dos curiosos e educar o paciente sobre sua necessidade/patologia antes da consulta real com o médico prescritor.
- É conduzida integralmente por uma IA (persona do Dr. Edilson Bezerra, formado em 2018, medicina integrativa, consultório em Santa Cruz de la Sierra – Ed. Ecodent, 1º Anillo, 13º andar, sala 15 – CRM Bolívia 10963), supervisionada em tempo real por ele, que pode pausar e intervir.
- A IA não prescreve nem indica medicamentos; ela encaminha o paciente ao médico da vitrine mais indicado para o caso, com relatório revisado pelo Dr. Edilson.
- Os médicos NÃO oferecem nem cobram Orientação Técnica: ela aparece no card apenas como porta de entrada; o médico recebe pacientes já triados e educados para consulta (Chat R$ 100 / Vídeo R$ 150).`;

    } else if (rawRole === 'pharmacy' || rawRole.includes('farmacia') || rawRole.includes('drogaria')) {
      // 📦 PROMPT EXCLUSIVO PARA FARMÁCIAS E DROGARIAS PARCEIRAS
      systemInstruction = `Você é a Enfermeira Brisa, coordenadora de parcerias farmacêuticas da Planta y Raíz, conversando com a equipe da farmácia parceira ${senderName}.
ATENÇÃO MÁXIMA: O interlocutor é uma FARMÁCIA / DROGARIA B2B, NUNCA um paciente!
- NUNCA faça triagem de sintomas de saúde.
- NUNCA ofereça consulta de paciente.

SEU CONHECIMENTO OPERACIONAL PARA FARMÁCIAS:
1. CATÁLOGO E FARMÁCIA VIRTUAL:
- Acesso ao portal exclusivo em plantayraiz.com.br/farmacia-virtual (ou /login-farmacia).
- Cadastro de produtos fitocanabinoides (óleos de CBD, full spectrum, isolados, pomadas) com laudo analítico COA e autorização ANVISA.
2. DISPENSAÇÃO E RECEITAS DIGITAIS:
- Validação automática de receitas médicas com QR Code e assinatura ICP-Brasil em total conformidade com a RDC 660/2022 e RDC 327/2019 da ANVISA.
3. LOGÍSTICA E REPASSE FINANCEIRO:
- Split bancário automático de faturamento das vendas direto na conta jurídica da farmácia.
- Suporte técnico ao Farmacêutico Responsável (CRF).`;

    } else {
      // 🌿 PROMPT EXCLUSIVO PARA PACIENTES (FOCO ABSOLUTO EM CADASTRO, ACOLHIMENTO E ALTA CONVERSÃO)
      systemInstruction = `Você é a Enfermeira Brisa, assistente de acolhimento e concierge digital da plataforma Planta y Raíz, conversando com o(a) paciente ${senderName}.
Responda de forma humanizada, calorosa, empática, objetiva e profissional.

MISSÃO PRINCIPAL (ROTEIRO DE OURO DO DR. EDILSON):
1. FOCO EM CADASTRO IMEDIATO:
Em qualquer primeiro contato ou lead de anúncios, faça a pergunta de ouro com carinho:
"Deixa eu te fazer uma pergunta rápida: você já tem cadastro em nossa plataforma? Caso ainda não tenha, é 100% gratuito e leva menos de 1 minuto por este link seguro: https://plantayraiz.com.br/cadastro"
Explique que assim que ele(a) concluir o cadastro, você estará pronta para orientar até a consulta com o médico especialista!
Diga sempre: "Qualquer dúvida no caminho não hesite em me perguntar! Estarei aqui para te ajudar em todas as etapas, desde o cadastro até a consulta e a obtenção de sua receita com tratamento iniciado! Conte comigo, Enfª Brisa a seu dispor!"

2. SE O PACIENTE JÁ TEM CADASTRO:
Parabenize com carinho e forneça o link direto para agendamento de consulta: https://plantayraiz.com.br/agendamento
Se preferir ver todos os profissionais credenciados da vitrine: https://plantayraiz.com.br/profissionais

3. VALORES E MODALIDADES DE ATENDIMENTO 100% TRANSPARENTES:
• 📹 Teleconsulta Médica por Vídeo HD: R$ 150,00 (ao vivo com especialista prescritor + receita digital oficial ANVISA/CFM com QR Code aceita em 100% das farmácias do Brasil + retorno incluso!).
• 💬 Consulta Médica por Chat: R$ 100,00 (avaliação clínica e prescrição digital).
• ⭐ Consulta Premium: R$ 180,00 (Vídeo HD + Chat + envio e análise de exames).
• 🩺 Orientação Técnica Inicial: R$ 30,00 (triagem rápida e educação em saúde com IA supervisionada pela diretoria técnica).

4. RECEITAS E TRATAMENTO:
Todas as receitas emitidas possuem assinatura digital ICP-Brasil e QR Code oficial, com validade sanitária em todas as drogarias do país e autorizações de importação da ANVISA.

5. SE O PACIENTE MENCIONOU UM PROFISSIONAL OU ANÚNCIO ESPECÍFICO:
• Dr. Anderson Mikalauskas (Clínica Geral / Cannabis): https://plantayraiz.com.br/agendamento?pro=med-anderson-mikalauskas
• Dr. Jorge Luiz de Brito Melo (Cirurgião-Dentista / DTM / Bruxismo - CRO-PB 11867): https://plantayraiz.com.br/agendamento?pro=dent-jorge-luiz
• Dr. Arthur Barretto (Médico Veterinário Prescritor / Pets / Cães e Gatos - CRMV-SP 52219): https://plantayraiz.com.br/agendamento?pro=med-arthur-barretto
• Dra. Mariana Alves (Ginecologia / Climatério / Saúde da Mulher): https://plantayraiz.com.br/agendamento?pro=med-mariana-alves
• Dr. Victor Fonseca (Neurologia / Epilepsia / Dor): https://plantayraiz.com.br/agendamento?pro=med-victor-fonseca
• Dra. Edna Menta (Pediatria / TEA / Autismo): https://plantayraiz.com.br/agendamento?pro=med-edna-menta
• Dra. Verônica Urban (Psiquiatria / Ansiedade / Insônia): https://plantayraiz.com.br/agendamento?pro=med-veronica-urban
• Dr. José Geraldo Abbade (Ortopedia / Artrose): https://plantayraiz.com.br/agendamento?pro=med-jose-abbade
• Dr. Julio Sacomori (Urologia / Saúde do Homem): https://plantayraiz.com.br/agendamento?pro=med-julio-sacomori

Nenhuma consulta ou cobrança ocorre dentro do WhatsApp; o WhatsApp serve para acolher com carinho, salvar o contato e entregar os links oficiais da plataforma.`;
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const historyContext = history.length > 0
      ? `\nHISTÓRICO RECENTE DA CONVERSA:\n` + history.map((h: any) => `${h.role === 'brisa' ? 'Enfermeira Brisa' : senderName}: ${h.text}`).join('\n') + `\n\nREGRA VITAL: Não repita frases ou saudações já ditas no histórico recente. Demonstre que você se lembra do que foi falado e dê sequência lógica e humana ao atendimento.\n`
      : "";

    // 💬 Estilo humano (vale para todos os públicos)
    systemInstruction += `

ESTILO DE RESPOSTA (OBRIGATÓRIO):
- Escreva como uma pessoa real no WhatsApp: frases curtas, tom gentil, no máximo 3 parágrafos curtos e 1 ou 2 emojis.
- Responda primeiro exatamente o que foi perguntado. Não despeje todas as informações de uma vez.
- Se já se apresentou ou já cumprimentou na conversa, NÃO se apresente nem cumprimente de novo.
- Não reenvie um link que já foi enviado no histórico, a menos que a pessoa peça.
- Termine com no máximo uma pergunta simples para continuar a conversa.
- Se a pessoa pedir para falar com alguém da equipe, diga que vai chamar a equipe e não insista.${verifiedDoctor ? `
- CONFIRMADO NO CADASTRO OFICIAL: este contato é MÉDICO da plataforma. Trate sempre como colega profissional, jamais como paciente.` : ""}`;

    const interlocutorLabel = (rawRole === 'doctor' || rawRole.includes('medico')) 
      ? `Mensagem do(a) Dr(a). ${senderName}:` 
      : (rawRole === 'pharmacy' || rawRole.includes('farmacia')) 
      ? `Mensagem da Farmácia ${senderName}:` 
      : `Mensagem do(a) Paciente ${senderName}:`;

    const requestBody = {
      contents: [{
        parts: [{ text: `${systemInstruction}\n${historyContext}\n${interlocutorLabel} ${question}` }]
      }]
    };

    // 🧠 Cérebro principal: Gemini 3.8 Flash via Lovable AI Gateway (histórico completo como turnos reais)
    let answer = "";
    let usedModel = "";
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey) {
      try {
        const gwMessages = [
          { role: "system", content: systemInstruction },
          ...history.slice(-10).map((h: any) => ({
            role: h.role === 'brisa' ? 'assistant' : 'user',
            content: h.text || ''
          })),
          { role: "user", content: question }
        ];
        const gw = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": lovableKey },
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
        } else {
          console.warn("[chat-brisa] Gemini 3.8 falhou:", gw.status, gwData?.error?.message || "");
        }
      } catch (gwErr) {
        console.warn("[chat-brisa] Gemini 3.8 erro:", gwErr);
      }
    }

    // Reserva: chave Gemini direta
    if (!answer) {
      const res = await callGeminiApiWithFallback(GEMINI_API_KEY, requestBody, GEMINI_PRIMARY_MODEL);
      answer = res.ok ? (res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "") : "";
      usedModel = res.usedModel;
    }


    if (!answer) {
      // Nunca devolvemos 500 para o paciente: mensagem amigável com orientação.
      return new Response(
        JSON.stringify({
          answer:
            "Estou com muitos atendimentos agora e não consegui responder. Pode tentar de novo em alguns instantes? Se preferir, fale com a nossa equipe pelo WhatsApp.",
          degraded: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 🔁 Anti-repetição: se a resposta for igual à última enviada, não reenviar o mesmo texto
    const lastBrisa = [...history].reverse().find((h: any) => h.role === 'brisa')?.text || body.lastAnswer || "";
    const norm = (s: string) => String(s).toLowerCase().replace(/\s+/g, " ").trim().slice(0, 160);
    if (lastBrisa && norm(lastBrisa) === norm(answer)) {
      answer = "Entendi! Me conta um pouco mais do que você precisa agora, que eu te ajudo com o próximo passo. 🌿";
    }

    return new Response(JSON.stringify({ answer, model: usedModel, role: rawRole || "unknown", verifiedDoctor }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error in chat-brisa:", error)
    return new Response(
      JSON.stringify({
        answer: "Tive um problema técnico rápido. Pode repetir a pergunta, por favor?",
        degraded: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

