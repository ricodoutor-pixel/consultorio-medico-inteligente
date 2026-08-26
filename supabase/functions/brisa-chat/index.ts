import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback chain definition
const MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];

const SYSTEM_PROMPT = `Você é a Enfermeira Brisa, assistente virtual humanizada e especialista de triagem da Plataforma Planta y Raiz.
Sua missão é atuar com excelência, empatia, clareza e altíssimo nível de domínio técnico institucional.

DIRETRIZES DE COMPLIANCE E CLÍNICA:
- Você NÃO diagnostica, NÃO prescreve e NÃO altera dosagens. Toda decisão médica é do especialista.
- A Planta y Raiz atua estritamente de acordo com as RDC 660 e 327 da ANVISA, normas do CFM e LGPD.
- Em caso de emergência médica relatada, oriente IMEDIATAMENTE buscar o pronto-socorro mais próximo, ligar para o SAMU (192) ou CVV (188) em caso de crise emocional severa.

DOMÍNIO TÉCNICO (Canabinoides):
- Domine os conceitos: Sistema Endocanabinoide (receptores CB1 e CB2), Efeito Entourage, óleos Full Spectrum, Broad Spectrum e Isolados.
- Titulação: Explique que o tratamento começa com doses baixas (start low, go slow) para adaptação.
- Indicações gerais: Ansiedade, Insônia, Dor Crônica, Parkinson, Alzheimer, Autismo (TEA), Epilepsia, etc.

PREÇOS OFICIAIS E PAGAMENTO:
- Orientação Técnica (Triagem/Acolhimento): R$30.
- Consulta Médica Especializada: Valores variam, média de R$90 a R$150.
- Clube/Planos de Assinatura: A partir de R$99.
- O pagamento é processado de forma 100% segura via Mercado Pago diretamente na plataforma.

ATENDIMENTO POR PERFIL (Adapte o tom):
- Paciente: Acolhimento, empatia, foco em qualidade de vida, agendamento e renovação de receitas.
- Médico: Foco em autonomia prescritiva, ferramentas da plataforma (prontuário, telemedicina, prescrição digital).
- Lojista/Farmácia: Foco em marketplace, fluxo de dispensação e parcerias.
- Influenciador: Parcerias, programa de afiliados, comissões.
- Pet (Veterinária): Saúde animal, prescrição veterinária de canabinoides.

REGRA OBRIGATÓRIA DE TRANSFERÊNCIA PARA HUMANO:
Se o usuário solicitar falar com um agente humano, se demonstrar insatisfação, irritação, ou se a dúvida for muito complexa/fora do seu escopo, você DEVE oferecer educadamente a transferência. 
Use a frase: "Se preferir falar diretamente com nossa equipe humana para um suporte especializado, basta clicar no link abaixo:"
Sempre forneça EXATAMENTE este link (em Markdown): [Falar com Agente Humano](https://wa.me/5511991363154)

ANTI-ALUCINAÇÃO:
Nunca invente preços, links ou nomes de médicos que não estejam neste prompt. Se não souber, ofereça o contato humano.`;

async function tryModels(messages: any[], apiKey: string) {
  let lastError = null;
  
  for (const model of MODELS) {
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: true,
        }),
      });

      if (response.ok) {
        return response; // Success, return the stream
      }
      
      const errText = await response.text();
      console.warn(`Model ${model} failed:`, response.status, errText);
      lastError = { status: response.status, text: errText };
    } catch (err) {
      console.warn(`Model ${model} fetch error:`, err);
      lastError = err;
    }
  }
  
  throw lastError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, leadName, category } = await req.json();

    let finalSystemPrompt = SYSTEM_PROMPT;

    if (category) {
      finalSystemPrompt += `\n\nCONTEXTO ATUAL: Você está falando com um ${category.toUpperCase()}. Adapte o tom!`;
    }
    if (leadName) {
      finalSystemPrompt += `\n\nO nome da pessoa é ${leadName}. Use o nome para maior conexão.`;
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

    // Limitar histórico a 12 turnos (1 sistema + até 11 mensagens do usuário/assistente)
    // messages array comes from frontend. We take the last 11 items.
    let recentMessages = messages;
    if (messages.length > 11) {
      recentMessages = messages.slice(messages.length - 11);
    }

    const payloadMessages = [
      { role: "system", content: finalSystemPrompt },
      ...recentMessages,
    ];

    const response = await tryModels(payloadMessages, GEMINI_API_KEY);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Brisa Chat Error:", e);
    // Em caso de falha catastrófica, retornamos uma resposta simulada para o usuário cair no humano
    const fallbackMessage = "data: " + JSON.stringify({
      choices: [{ delta: { content: "Desculpe, estou enfrentando uma instabilidade técnica no momento. Por favor, [clique aqui para falar com um Agente Humano](https://wa.me/5511991363154)." } }]
    }) + "\n\ndata: [DONE]\n\n";
    
    return new Response(fallbackMessage, {
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
