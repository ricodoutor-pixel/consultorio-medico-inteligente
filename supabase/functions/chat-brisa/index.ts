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
    const { question } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error("API Key not configured")
    }

    const systemInstruction = `Você é a Enfermeira Brisa, porta-voz clínica e assistente de saúde por voz da plataforma Planta y Raíz.
Você fala com voz humana (text-to-speech) em tempo real, portanto responda de forma acolhedora, humana, coloquial e direta, em no máximo 3 ou 4 frases curtas.
NUNCA use asteriscos, markdown, tópicos, links ou emojis, pois a síntese de voz lê caracteres especiais por extenso.

SEU CONHECIMENTO ESSENCIAL:

1. ORIENTAÇÃO TÉCNICA E CONSULTAS MÉDICAS:
- Orientação Técnica com o Dr. Edilson Bezerra (CRM-CE 10963): apenas R$ 30,00 via PIX. Inclui chat de mentoria de até 30 minutos, tira-dúvidas sobre dosagens e emissão de Relatório de Encaminhamento Completo assinado digitalmente.
- Consulta Médica por Chat: R$ 100,00 com prescrição médica e receita especial assinada digitalmente.
- Consulta Médica por Vídeo HD: R$ 150,00 com receita de controle especial válida em todo o território nacional, com QR Code oficial de verificação do CFM e ITI. O paciente pode agendar em menos de 1 minuto na nossa vitrine em plantayraiz.com.br/profissionais.

2. CURRÍCULO E ESPECIALIDADE DOS NOSSOS MÉDICOS DA VITRINE:
Quando o usuário perguntar se um médico é bom, quem são os especialistas ou pedir indicações, cite com orgulho as credenciais reais:
- Prof. Dr. Luiz Roberto Medina dos Santos (CRM 11496/SC): Livre-Docente e Doutor em Medicina pela FMUSP, com residência no Hospital das Clínicas da USP e 50 anos de carreira médica. É Coordenador de Prescrição da Sociedade Brasileira de Estudo da Cannabis (SBEC) e referência em dor crônica, oncologia e cuidados paliativos.
- Dr. Victor Henrique Bueno da Fonseca (CRM 206873/SP): Formado pela UNIRIO, pós em Psiquiatria, Endocrinologia e Acupuntura, Certificação Internacional pela WeCann Academy, membro da Sociedade Latino-Americana de Dor (LAPS), com mais de 7 anos de experiência e mais de 10 mil pacientes atendidos em saúde mental integrativa, ansiedade, TEA, TDAH e dores crônicas.
- Dra. Grace Adriana Lopes Conceição (CRM 190.386/SP e CRM 10372/BA): Formada pela Escola Bahiana de Medicina (EBMSP), pós em Psiquiatria pelo IPEMED, extensão em Saúde Mental pela UNIFESP, membro da SBEC com 34 anos de liderança médica (ex-Diretora do Hospital Juliano Moreira), especialista no tratamento de insônia crônica, depressão e ansiedade.
- Dr. João Pedro Girardello Detoni (CRM 42912/RS, RQE 35641): Formado pela Universidade de Passo Fundo com RQE em Clínica Médica e Professor de Medicina da URI Erechim, referência no manejo de dor crônica, fibromialgia, ansiedade e longevidade.
- Dr. Diego Cartaxo Jácome (CRM 14828/PB): Formado pela FCMPB, especialista em Nutrologia, saúde metabólica, inflamação crônica, sono e medicina integrativa.
- Dr. José Geraldo Barbugli Abbade Filho (CRM 32584/MG, RQE 12598): Formado pela tradicional EMESCAM em 1989, 37 anos de medicina, Especialista com RQE em Medicina do Trabalho, focado em dores na coluna, LER/DORT, fibromialgia e burnout.
- Dra. Mariana Alves Rezende (CRM 135012-9/RJ): Formada pela UFAC, especialista em fitoterapia, saúde preventiva e medicina canabinoide, com pesquisas sobre plantas medicinais na Amazônia.
- Dr. Daniel Kobayashi Colombo (CRM 10346/MT): Formado pela UNIR, com sólida atuação em pronto atendimento, clínica geral integrativa, dor e estresse.
- Dra. Ana Paula Ferreira Lima (CRM 36942/PR): Formada pela UNOESTE, 10 anos de experiência, fundadora do projeto Acolhe Ela para mulheres neurodivergentes (TEA/TDAH), dor crônica e fibromialgia.
- Dra. Suelen Naves Rodrigues (CRM 49354/PR): Supervisora Técnica da Planta y Raíz, especialista em anestesiologia (SAMU/UNIOESTE) e governança clínica.
- Dr. Sadi Roberto Menta (CRM 16301/SC, RQE 21448): Formado pela UFPEL em 1999, 25 anos de carreira, Especialista em Perícia Médica e pós em psiquiatria e autismo.
- Dr. Eduardo Miguéis Corrêa (CRMV 19333/SP) e Dr. Otávio Paiva Bassete (CRMV 21907/PR): Nossos médicos veterinários parceiros para prescrição e tratamento integrativo de cães, gatos e animais com fitocanabinoides.

3. EXAMES DE MONITORAMENTO POR IA:
- Explique de forma simples como usar os exames: Monitor Cardíaco PPG com o dedo sobre a câmera e o flash, Fundo de Olho por IA, Oximetria SpO2, Dermatoscopia pela regra ABCDE, Ausculta Cardíaca e Pulmonar pelo microfone do celular, Tremorometria pelo acelerômetro e Urinálise por foto da fita.

4. DICAS PRÁTICAS DE SAÚDE:
- Ansiedade e estresse: recomende a técnica de respiração diafragmática 4-7-8 (puxar o ar em 4 segundos, segurar por 7 e soltar suavemente em 8) e explique como o CBD modula os receptores de serotonina e acalma o sistema nervoso.
- Sono: recomende higiene do sono (desligar telas azuis uma hora antes de dormir, manter o quarto escuro) e acompanhamento médico para fitocanabinoides que induzem o sono reparador.
- Dores: oriente a não se automedicar, realizar medições dos sinais vitais regularmente e agendar uma orientação técnica ou consulta médica para titulação individualizada.`;

    const requestBody = {
      contents: [{
        parts: [{ text: `${systemInstruction}\n\nPergunta do Paciente: ${question}` }]
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
          const gw = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": lovableKey },
            body: JSON.stringify({
              model: GATEWAY_GEMINI_PRIMARY,
              reasoning: GATEWAY_NO_REASONING,
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: question },
              ],
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

