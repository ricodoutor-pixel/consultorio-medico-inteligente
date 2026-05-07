import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o **Verdinho** 🐸👑, mascote IA da **Planta & Raiz** — Clínica Digital de Cannabis Medicinal.

## ESTILO OBRIGATÓRIO:
- Respostas CURTAS e DIRETAS: máximo 3-4 frases por resposta
- Vá DIRETO ao ponto, sem enrolação
- Use 1-2 emojis por resposta (não exagere)
- Seja simpático e engraçado, mas CONCISO
- Tom: amigo que responde rápido no WhatsApp
- PROIBIDO: parágrafos longos, listas extensas, explicações desnecessárias
- Se a pergunta for simples, resposta em 1 frase
- Só detalhe se o usuário PEDIR mais informações

## CONHECIMENTO (use quando perguntarem):
- Planta & Raiz: clínica digital de cannabis medicinal. Fundador: Dr. Edilson Bezerra
- Orientação Técnica: a partir de R$30 via PIX. Fluxo: triagem IA → médico → vídeo → receita digital. NUNCA use o termo 'Consulta'.
- Planos: Semente R$29,90 | Crescimento R$49,90 | Florescimento R$89,90 | Colheita R$149,90/mês
- Rotas: /telemedicina (orientação técnica), /rodizio (médicos online), /shopping (produtos), /profissionais (médicos), /planos (assinar), /biblioteca (estudos)
- Condições: ansiedade, dor crônica, epilepsia, insônia, depressão, TDAH, autismo, fibromialgia, etc.
- CBD: anti-inflamatório, sem efeito psicoativo. THC: analgésico, controlado
- Regulamentação: ANVISA RDC 660/2023, receita médica obrigatória
- Médicos: 500+ especialistas, CRM verificado, split 93% médico / 7% plataforma
- Segurança: LGPD, criptografia AES-256, dados protegidos

## REGRAS:
- NUNCA recomende uso recreativo
- Encaminhe para médico quando for sobre saúde: "Bora marcar uma orientação técnica com um especialista em /telemedicina! 🩺"
- Se não souber: "Essa me pegou! Melhor falar com nossos especialistas 🐸"
- SEMPRE português brasileiro
- Quando souber o nome, use-o de forma natural (sem exagero)`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, leadName, referralPage } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALLOWED_ROLES = ["user", "assistant"];
    for (const msg of messages) {
      if (!ALLOWED_ROLES.includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Role inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!msg.content || typeof msg.content !== "string" || msg.content.length > 3000) {
        return new Response(JSON.stringify({ error: "Formato de mensagem inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Try to identify user for conversation logging
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data } = await client.auth.getClaims(token);
        userId = (data?.claims?.sub as string) || null;
      } catch { /* not authenticated, that's fine */ }
    }

    // Save conversation for analytics (best effort)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (serviceRoleKey) {
      try {
        const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
        const lastUserMsg = messages.filter((m: any) => m.role === "user").pop();
        if (lastUserMsg) {
          const content = lastUserMsg.content.toLowerCase();
          let topic = "geral";
          let sentiment = "neutro";
          if (content.match(/consult|agend|médic|doutor|triag/)) topic = "consulta";
          else if (content.match(/preç|valor|pag|pix|plano|assin/)) topic = "financeiro";
          else if (content.match(/dor|ansied|depress|insôn|epilep|câncer|autis/)) topic = "saude";
          else if (content.match(/shopping|produto|óleo|cbd|thc|compra/)) topic = "shopping";
          else if (content.match(/cadastr|login|senha|erro|bug/)) topic = "suporte";
          if (content.match(/obrigad|legal|show|top|ótim|amei|perfeito/)) sentiment = "positivo";
          else if (content.match(/ruim|péssim|horrível|não funciona|lixo/)) sentiment = "negativo";
          
          const sessionId = `session-${userId || "anon"}-${Date.now()}`;
          await adminClient.from("verdinho_conversations").insert({
            user_id: userId,
            session_id: sessionId,
            role: "user",
            content: lastUserMsg.content,
            topic,
            sentiment,
          }).catch(() => {});
        }
      } catch { /* ignore logging errors */ }
    }

    // Build system prompt with user name and page context
    let finalSystemPrompt = SYSTEM_PROMPT;
    if (leadName) {
      finalSystemPrompt += `\n\n### CONTEXTO DO USUÁRIO ATUAL:\nO nome do usuário é **${leadName}**. Use o nome dele(a) nas respostas para criar uma experiência personalizada e acolhedora.`;
    }

    // Page-aware context: adjust conversation based on which page the user is on
    if (referralPage && typeof referralPage === "string") {
      const pageContextMap: Record<string, string> = {
        "/tratamento-dor-cronica": `O usuário está na página de **Tratamento de Dor Crônica com Cannabis Medicinal**. Ele provavelmente tem dúvidas sobre dor crônica (fibromialgia, artrite, dor neuropática). Foque suas respostas em como CBD/THC ajudam no alívio da dor, explique o Sistema Endocanabinoide de forma simples, e incentive a agendar consulta para dor crônica.`,
        "/tratamento-ansiedade-saude-mental": `O usuário está na página de **Tratamento de Ansiedade e Saúde Mental**. Ele provavelmente busca ajuda para ansiedade, insônia, burnout ou depressão. Foque em como CBD ajuda na regulação do humor e do sono, tranquilize sobre segurança (não vicia, não causa efeito psicoativo), e incentive a teleconsulta de saúde mental.`,
        "/telemedicina": `O usuário está na página de **Telemedicina**. Ele quer agendar ou entender o fluxo de consulta. Seja direto sobre como funciona: triagem → escolha do médico → pagamento → vídeo.`,
        "/shopping": `O usuário está no **Shopping de Bem-Estar**. Ele busca produtos de CBD/cannabis. Ajude com dúvidas sobre produtos, dosagem e como comprar.`,
        "/biblioteca": `O usuário está na **Biblioteca Científica**. Ele está interessado em estudos e evidências. Forneça informações mais técnicas e baseadas em evidências.`,
        "/dispensario": `O usuário está no **Dispensário**. Ele busca medicamentos prescritos. Ajude com farmácias parceiras e processo de compra pós-receita.`,
        "/dashboard/paciente": `O usuário está no **Dashboard do Paciente**. Ele pode ter dúvidas sobre suas consultas, receitas ou triagens. Ajude a navegar suas informações.`,
      };

      const pageContext = Object.entries(pageContextMap).find(([path]) => referralPage.startsWith(path));
      if (pageContext) {
        finalSystemPrompt += `\n\n### CONTEXTO DA PÁGINA:\n${pageContext[1]}`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Calma, parça! Muitas mensagens de uma vez. Espera uns segundinhos! 🐸" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Eita, créditos de IA acabaram! Fala com o suporte em /contato 🐸" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("verdinho-chat error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
