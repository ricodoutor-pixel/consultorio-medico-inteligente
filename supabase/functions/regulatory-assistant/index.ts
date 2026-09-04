// ⚖️ regulatory-assistant — Guia Regulatório e Direitos do Paciente (Planta y Raiz)
// Body: { question: string, history?: {role:"user"|"assistant",content:string}[] }
// Resposta: { answer: string }
// Aberto a usuários anônimos e autenticados (modal da página inicial).
import { getCorsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `Você é o "Guia Regulatório Planta y Raiz", assistente especializado em legislação
brasileira de Cannabis Medicinal e direitos do paciente.

DOMÍNIO DE CONHECIMENTO
- RDC 660/2022 (importação excepcional de produto derivado de Cannabis para uso próprio): requisitos,
  cadastro no gov.br, prescrição válida, quantidade para até 2 anos de tratamento, renovação.
- RDC 327/2019 (produtos de Cannabis autorizados no Brasil): registro sanitário, farmácias autorizadas,
  produtos com THC até 0,2% (venda com receita de controle especial em 2 vias) e acima de 0,2%
  (exige Notificação de Receita B, restrito a pacientes sem alternativa terapêutica ou em cuidados paliativos).
- Portaria 344/1998 e regras de receituário, retenção e validade.
- Viagens: porte da receita e da autorização da ANVISA, transporte em bagagem de mão com embalagem original,
  viagens internacionais (checar legislação do país de destino, declaração médica em inglês/espanhol).
- Laudos e documentos clínicos: laudo médico com CID, relatório de falha terapêutica, prescrição assinada
  digitalmente (ICP-Brasil/gov.br), procuração para importação, comprovante de residência.
- Direitos do paciente: LGPD e dados sensíveis, atendimento por telemedicina (CFM 2.314/2022),
  reembolso e cobertura, isenção de impostos em casos específicos, direito à informação clara.

REGRAS OBRIGATÓRIAS
1. NUNCA prescreva, indique dose, produto, concentração ou marca. Nunca diagnostique.
2. Nunca prometa deferimento da ANVISA, prazo garantido ou resultado clínico.
3. Explique o processo, os documentos e os prazos oficiais típicos, sempre citando a norma aplicável.
4. Se a dúvida for clínica (qual óleo, quanto tomar, interação medicamentosa), oriente a Orientação Técnica
   com médico da plataforma.
5. A Planta y Raiz é plataforma de intermediação tecnológica — não é clínica, farmácia nem importadora.
6. Responda em português do Brasil, tom acolhedor e objetivo, no máximo 5 parágrafos curtos ou lista.
7. Encerre com um próximo passo prático.`;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Serviço de IA não configurado." }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      return new Response(JSON.stringify({ error: "Informe sua dúvida regulatória." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (question.length > 2000) {
      return new Response(JSON.stringify({ error: "Pergunta muito longa (máx. 2000 caracteres)." }), {
        status: 413,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history
        .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
        .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
      { role: "user", content: question },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.3,
        max_tokens: 900,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[regulatory-assistant] gateway", res.status, detail);
      const message = res.status === 429
        ? "Muitas consultas agora. Tente novamente em instantes."
        : res.status === 402
        ? "Créditos de IA esgotados. Fale com a equipe Planta y Raiz."
        : "Não foi possível consultar o guia regulatório agora.";
      return new Response(JSON.stringify({ error: message }), {
        status: res.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() ||
      "Não consegui elaborar a resposta agora. Reformule sua dúvida sobre RDC 660, RDC 327, viagens ou laudos.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[regulatory-assistant]", err);
    return new Response(JSON.stringify({ error: "Erro interno no guia regulatório." }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
