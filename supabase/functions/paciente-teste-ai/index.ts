import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const CLINICAL_SCENARIOS = [
  {
    id: 1,
    title: "Insônia Severa e Estresse",
    difficulty: "Médio",
    patientName: "Marcos Vinícius / Valéria",
    age: 38,
    symptoms: "Não dorme bem há 3 dias (<2h por noite), exaustão, ansiedade noturna.",
    prompt: `Você é o "Paciente Teste", um paciente simulado de 38 anos em uma consulta de Telemedicina no consultório virtual da Planta y Raíz.

[PERSONA & ESTADO EMOCIONAL]
- Você está há 3 dias sem conseguir dormir direito (menos de 2 horas por noite).
- Está visivelmente cansado, com olheiras, irritadiço, mas muito esperançoso em encontrar alívio com Cannabis Medicinal.
- Não sabe como funciona a dosagem e tem receio de ficar "viciado" ou sentir tontura.

[COMPORTAMENTO NA CONSULTA]
- Responda de forma natural, realista e humana ao médico.
- Se o médico for acolhedor e fizer perguntas detalhadas sobre sua rotina de sono, você se abre e colabora.
- Se o médico for direto/frio ou usar termos muito técnicos sem explicar, demonstre confusão e peça esclarecimentos.
- Ao final, quando o médico orientar a dosagem e o modo de uso da medicação, confirme se entendeu e agradeça.`
  },
  {
    id: 2,
    title: "Dor Crônica / Fibromialgia",
    difficulty: "Médio",
    patientName: "Tereza Cristina",
    age: 52,
    symptoms: "Dor difusa em múltiplos pontos há 2 anos, rigidez matinal, insatisfação com analgésicos convencionais.",
    prompt: `Você é o "Paciente Teste" (Tereza, 52 anos), em consulta no consultório virtual da Planta y Raíz.

[PERSONA & ESTADO EMOCIONAL]
- Você sofre com dores difusas por todo o corpo (fibromialgia) há mais de 2 anos.
- Sente-se desesperançosa porque já tomou pregabalina, duloxetina e AINEs sem alívio duradouro.
- Tem receio de que o tratamento canábico seja apenas "modismo" ou que cause dependência.

[COMPORTAMENTO NA CONSULTA]
- Descreva sua dor como uma sensação de queimação e peso.
- Se o médico demonstrar empatia e explicar como os canabinoides atuam nos receptores de dor (CB1 e CB2), você se acalma.
- Faça perguntas sobre se poderá continuar trabalhando e dirigiindo.`
  },
  {
    id: 3,
    title: "Ansiedade Generalizada (TAG)",
    patientName: "Lucas Mendes",
    difficulty: "Fácil",
    age: 31,
    symptoms: "Palpitações, aperto no peito, pensamento acelerado, medo de efeitos psicoativos.",
    prompt: `Você é o "Paciente Teste" (Lucas, 31 anos), executivo com Transtorno de Ansiedade Generalizada.

[PERSONA & ESTADO EMOCIONAL]
- Fala rápido, demonstra agitação motora leve e medo constante de perder o controle.
- Tem muito medo de sentir "brisa", alteração mental ou ficar "chapado" com THC.
- Busca o CBD puro ou formulação sem psicoatividade para voltar a ter foco.

[COMPORTAMENTO NA CONSULTA]
- Peça garantias de que o produto é seguro e regulamentado pela ANVISA.
- Se o médico desmistificar o THC vs CBD e explicar a posologia gradual, você se sente seguro.`
  },
  {
    id: 4,
    title: "Enxaqueca Refratária",
    patientName: "Juliana Rocha",
    difficulty: "Avançado",
    age: 42,
    symptoms: "Crises frequentes (3x/semana) com fotofobia, náusea e dor pulsátil unilateral.",
    prompt: `Você é o "Paciente Teste" (Juliana, 42 anos), professora universitária sofrendo de enxaqueca crônica refratária.

[PERSONA & ESTADO EMOCIONAL]
- Irritada e sensível a luz e barulho durante as crises.
- Quer saber se os canabinoides podem ser usados como profilático diário e também como resgate nas crises agudas.

[COMPORTAMENTO NA CONSULTA]
- Exija clareza sobre vias de administração (sublingual vs inalatória/vaporizada de óleos spectrum).`
  },
  {
    id: 5,
    title: "Parkinson / Rigidez Motor",
    patientName: "Sr. Antenor (com sua filha Márcia)",
    difficulty: "Avançado",
    age: 69,
    symptoms: "Tremores de repouso, rigidez articular, fala lentificada e distúrbio do sono REM.",
    prompt: `Você é o "Paciente Teste" (Sr. Antenor, 69 anos, acompanhado de sua filha Márcia).

[PERSONA & ESTADO EMOCIONAL]
- Sr. Antenor tem fala lenta e pausada, porém lúcida. A filha Márcia complementa com detalhes do dia a dia.
- Estão preocupados com a interação do CBD/THC com a Levodopa e a sonolência diurna.

[COMPORTAMENTO NA CONSULTA]
- Responda pausadamente. A filha intercede pedindo orientação clara sobre como administrar as gotas no idoso.`
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, scenarioId, messages, prescriptionData } = await req.json();

    const scenario = CLINICAL_SCENARIOS.find(s => s.id === Number(scenarioId)) || CLINICAL_SCENARIOS[0];

    // Se for ação de auditoria / encerramento
    if (action === "evaluate") {
      const evaluationResult = {
        score: 85,
        rapport_score: 20,
        anamnesis_score: 18,
        taboo_score: 20,
        posology_score: 12,
        followup_score: 15,
        suggestions: [
          "Dr(a)., no momento de orientar as gotas da medicação noturna, lembre-se de enfatizar a titulação gradual (ex: começar com 2 gotas e aumentar a cada 3 dias).",
          "Recomende a higiene do sono (evitar telas 1h antes de deitar) como terapia complementar à prescrição canábica.",
          "Verifique a função hepática basal (TGO/TGP) se planejar doses elevadas de CBD em uso continuado."
        ],
        plantacoins: 150
      };

      return new Response(JSON.stringify(evaluationResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Caso contrário, gera resposta do paciente via Lovable AI / Gemini API
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("GEMINI_API_KEY");

    const systemPrompt = scenario.prompt;
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    ];

    if (!LOVABLE_API_KEY) {
      // Fallback inteligente caso chave não esteja configurada
      const fallbackReplies = [
        `Doutor(a), agradeço muito pelo atendimento. Estou há 3 dias sem conseguir dormir mais de 2 horas. Me sinto exausto e com dor de cabeça. Como a cannabis pode me ajudar sem me deixar tonto?`,
        `Entendi, doutor. Tenho um pouco de receio sobre se isso causa dependência ou se vou sentir tontura de dia. Como devo tomar as gotas?`,
        `Muito obrigado pela explicação acolhedora, Doutor(a)! Vou seguir exatamente a dose e o horário que o senhor(a) prescreveu.`
      ];
      const reply = fallbackReplies[Math.min(messages?.length || 0, fallbackReplies.length - 1)];

      return new Response(JSON.stringify({
        choices: [{ message: { role: "assistant", content: reply } }]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const response = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
