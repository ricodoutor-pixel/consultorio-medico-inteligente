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
    const rawRole = (body.role || body.context_role || "").toLowerCase();
    const senderName = body.senderName || "Doutor(a)";

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    // 🎯 SEPARAÇÃO ESTRITA DE PÚBLICO (MÉDICO × FARMÁCIA × PACIENTE)
    let systemInstruction = "";

    if (rawRole === 'doctor' || rawRole.includes('medico') || rawRole.includes('doctor')) {
      // 🩺 PROMPT EXCLUSIVO PARA MÉDICOS PRESCRITORES
      systemInstruction = `Você é a Enfermeira Brisa, coordenadora clínica da plataforma Planta y Raíz, conversando diretamente com o(a) Dr(a). ${senderName}.
ATENÇÃO MÁXIMA: O interlocutor é um MÉDICO PRESCRITOR, NUNCA um paciente!
- NUNCA ofereça "Orientação Técnica de R$ 30" para o médico.
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
- 4º Orientação Técnica com Dr. Edilson Bezerra ON: atua como triagem preparatória com 40.000 estudos científicos, entregando o paciente educado, consciente e com perfil canabinoide pronto para a consulta médica.

4. CREDENCIAMENTO E DOCUMENTOS:
- Fotos de CRM (frente/verso), RG/CNH e comprovante de endereço podem ser enviadas diretamente por este WhatsApp.
- Assinatura digital: basta enviar um PDF assinado com certificado digital (VIDaaS, BirdID, Certisign, Gov.br prata/ouro ou token).`;

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
      // 🌿 PROMPT EXCLUSIVO PARA PACIENTES (ACOLHIMENTO E SAÚDE)
      systemInstruction = `Você é a Enfermeira Brisa, assistente de acolhimento e concierge digital da plataforma Planta y Raíz, conversando com o(a) paciente ${senderName}.
Responda de forma acolhedora, humana, empática e calorosa.

REGRA ARQUITETURAL VITAL:
Todas as atividades de atendimento, orientação e consulta acontecem 100% DENTRO DO SITE (na nuvem da plataforma). Você acolhe, compreende a necessidade e entrega o LINK DIRETO personalizado para a modalidade solicitada:

1. ORIENTAÇÃO TÉCNICA EM NUVEM (R$ 30):
- Conduzida pelo Dr. Edilson Bezerra On (Médico Prescritor CRM Santa Cruz / Bolívia nº 10963 · Assinatura Digital Homologada).
- Sala virtual de 30 minutos em nuvem com base em 40.000 estudos científicos mundiais.
- Emissão do Relatório do Perfil Canabinoide Personalizado e Encaminhamento em PDF assinado digitalmente.
- Link direto: https://plantayraiz.com.br/orientacao-tecnica?origem=whatsapp

2. TELECONSULTA MÉDICA POR VÍDEO HD (R$ 150):
- Consulta ao vivo por vídeo criptografado na plataforma com médico especialista prescritor.
- Emissão de receita oficial digital ANVISA/CFM com QR Code e direito a retorno clínico.
- Link direto: https://plantayraiz.com.br/telemedicina?modalidade=video&origem=whatsapp

3. CONSULTA MÉDICA POR CHAT CLÍNICO (R$ 100):
- Atendimento médico ágil por chat seguro na plataforma com avaliação de anamnese e receita oficial digital.
- Link direto: https://plantayraiz.com.br/telemedicina?modalidade=chat&origem=whatsapp

4. SHOPPING E FARMÁCIA DE FITOCANABINOIDES:
- Catálogo de óleos (Full/Broad Spectrum, isolados) autorizados pela ANVISA (RDC 660 e 327).
- Link direto: https://plantayraiz.com.br/shopping

5. VITRINE DE MÉDICOS PRESCRIBORES:
- Escolha direta do especialista e agendamento soberano: https://plantayraiz.com.br/profissionais

Nenhuma consulta ou cobrança é realizada dentro do WhatsApp; o WhatsApp serve para acolher e entregar o link seguro da plataforma.`;
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const historyContext = history.length > 0
      ? `\nHISTÓRICO RECENTE DA CONVERSA:\n` + history.map((h: any) => `${h.role === 'brisa' ? 'Enfermeira Brisa' : senderName}: ${h.text}`).join('\n') + `\n\nREGRA VITAL: Não repita frases ou saudações já ditas no histórico recente. Demonstre que você se lembra do que foi falado e dê sequência lógica e humana ao atendimento.\n`
      : "";

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

    const res = await callGeminiApiWithFallback(GEMINI_API_KEY, requestBody, GEMINI_PRIMARY_MODEL);

    let answer = res.ok
      ? (res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "")
      : "";
    let usedModel = res.usedModel;

    // Fallback: quando a cota do Gemini direto estoura (429) usamos o Lovable AI Gateway com Gemini 3.8 sem reasoning
    if (!answer) {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableKey) {
        try {
          const gwMessages = [
            { role: "system", content: systemInstruction },
            ...history.slice(-4).map((h: any) => ({
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
            console.warn("[chat-brisa] Lovable AI fallback falhou:", gw.status, gwData?.error?.message || "");
          }
        } catch (gwErr) {
          console.warn("[chat-brisa] Lovable AI fallback erro:", gwErr);
        }
      }
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

    return new Response(JSON.stringify({ answer, model: usedModel }), {
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

