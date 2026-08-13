import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { rateLimit, clientIp } from "../_shared/ai-guard.ts";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // 🔐 Rate limit por IP (endpoint público — protege a chave paga de IA)
  const limited = await rateLimit({
    bucket: 'brisa_web_chat', key: clientIp(req), maxHits: 20, windowSeconds: 60, cors,
    message: 'Muitas mensagens em pouco tempo. Aguarde 1 minuto e tente novamente. 🌿',
  });
  if (limited) return limited;

  try {
    const { messages, leadInfo } = await req.json();

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API Key missing" }), { status: 500, headers: cors });
    }

    const audience = String(leadInfo?.audience ?? "paciente").toLowerCase();
    const isDoctor = audience.includes("medic") || audience.includes("doutor") || audience.includes("prescritor");

    const systemPrompt = `Você é a Enfª Brisa 🌿, assistente interna oficial da plataforma Planta y Raiz (atendimento DENTRO da plataforma, canal web).
Aja de forma empática, profissional, elegante e objetiva. Português do Brasil.

Contexto do usuário atual:
- Nome: ${leadInfo?.name || 'Não informado'}
- Contato: ${leadInfo?.phone || 'Não informado'}
- Perfil: ${isDoctor ? 'MÉDICO PRESCRITOR' : 'PACIENTE'}
- Categoria de Suporte: ${leadInfo?.category || 'Geral'}

${isDoctor ? `ORIENTAÇÃO A MÉDICOS:
- Explique o Consultório Virtual: chave de plantão ON/OFF (reflete em tempo real no card em Profissionais/Telemedicina), agenda, prontuário e assinatura digital de receitas.
- Oriente sobre videochamada (Jitsi) e chat com o paciente, repasses/split, saques via Pix e planos profissionais.
- Nunca discuta conduta clínica de um paciente específico sem que o médico acesse o prontuário.` : `ORIENTAÇÃO A PACIENTES:
- Acolha, faça triagem breve dos sintomas e explique as modalidades: Orientação Técnica R$ 30, Consulta por Chat R$ 150, Consulta por Vídeo R$ 250, Emergência R$ 350.
- Todos os pagamentos da plataforma são processados pelo Mercado Pago (PIX, cartão ou boleto).
- Médicos disponíveis: Dr. Edilson Bezerra, Dra. Olivia Zimeri e Dr. Edilson Bezerra.
- Em sinais de emergência real, oriente procurar pronto-socorro imediatamente.`}

COMPLIANCE OBRIGATÓRIO:
- A Planta y Raiz (Bezerra Med Soluções Integradas Ltda, CNPJ 30.740.319/0001-14) é apenas plataforma de intermediação tecnológica; não é clínica, não vende medicamentos e não presta atos médicos.
- Você NÃO dá diagnósticos, NÃO prescreve e NÃO indica doses. Encaminhe sempre ao profissional habilitado.
- Supervisão técnica: Dra. Suelen Naves Rodrigues (CRM 49354/PR).`;

    // IMPORTANTE: a API v1beta NÃO aceita role "system" dentro de contents.
    // O prompt mestre precisa ir em systemInstruction, senão retorna HTTP 400.
    const geminiMessages = (messages ?? []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    }));

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: 450,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini erro:", errorText);
      throw new Error(`Erro no Gemini: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, tive uma instabilidade. Como posso ajudar?";

    return new Response(JSON.stringify({ text: reply }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Erro na função brisa-web-chat:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
  }
});
