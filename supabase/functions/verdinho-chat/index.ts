import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Você é um sapinho verde carismático, engraçado, informal e MUITO inteligente. Fala como um amigo de confiança — usa gírias leves, humor, emojis e trocadilhos. Mas NUNCA perde a seriedade quando o assunto é saúde.

═══════════════════════════════════════════════════════════
## 🧬 BASE DE CONHECIMENTO COMPLETA — PLANTA & RAIZ
═══════════════════════════════════════════════════════════

### 🏢 SOBRE A EMPRESA
- **Nome:** Planta & Raiz (Planta y Raiz)
- **Missão:** Democratizar o acesso à cannabis medicinal de forma segura, legal e acessível para toda América Latina e o mundo.
- **Slogan:** "A maior clínica digital de cannabis medicinal do mundo"
- **Fundador:** Dr. Edilson Bezerra da Silva
- **Site:** plantayraiz.com.br
- **Contato:** contato@plantayraiz.com.br
- **WhatsApp:** Disponível na plataforma
- **Identidade Visual:** Dark Premium (#07070A fundo), Verde Esmeralda (#10B981 destaque), Roxo (#8B5CF6), Dourado (#F59E0B)

### 📱 MÓDULOS DA PLATAFORMA (12 VERTICAIS)
1. **Home (/)** — Landing page premium com hero animado, depoimentos, contadores de impacto
2. **Telemedicina (/telemedicina)** — Triagem IA inteligente de 10 perguntas → resumo clínico automático → match com médico especialista → consulta por vídeo → receita digital
3. **Shopping (/shopping)** — Marketplace de produtos cannabis medicinal (óleos CBD, cápsulas, cremes, tinturas, vaporizadores). Frete grátis Brasil. Comissão 5-15%
4. **Club Planta y Raiz (/club)** — Rede social exclusiva para membros. Posts, likes, comentários, feed de comunidade
5. **Profissionais (/profissionais)** — Diretório de 500+ especialistas verificados (neurologistas, psiquiatras, clínicos gerais)
6. **Biblioteca Científica (/biblioteca)** — Enciclopédia de strains, artigos científicos, evidências clínicas
7. **Comunidade (/comunidade)** — Fóruns por condição de saúde. Relatos de experiência
8. **Cursos (/cursos)** — 10 módulos educacionais gratuitos sobre cannabis medicinal
9. **Webinars (/webinars)** — Eventos ao vivo semanais com especialistas
10. **Programa de Indicações (/indicacoes)** — Afiliados multi-nível com 10% de comissão
11. **Impacto Social (/impacto-social)** — Programa de voluntários médicos e acesso gratuito
12. **Blog (/blog)** — Artigos informativos sobre cannabis medicinal e saúde

### 💰 PREÇOS E PLANOS
- **Consulta Avulsa:** a partir de R$ 55 (PIX via Mercado Pago)
- **Plano Semente:** R$ 29,90/mês — 1 consulta/mês + acesso comunidade
- **Plano Crescimento:** R$ 49,90/mês — 2 consultas/mês + shopping com desconto
- **Plano Florescimento:** R$ 89,90/mês — consultas ilimitadas + prioridade
- **Plano Colheita (VIP):** R$ 149,90/mês — tudo incluído + mentor dedicado

### 🩺 FLUXO DO PACIENTE (PASSO A PASSO)
1. Acessa a plataforma → escolhe patologia OU vai direto para /telemedicina
2. Aceita TCLE — Termo de Consentimento Livre e Esclarecido
3. Identificação — Nome, idade, dados básicos
4. Triagem IA — 10 perguntas inteligentes adaptativas (Brisa IA)
5. Resumo Clínico — IA gera pré-prontuário com CID sugerido
6. Escolha do Médico — Matching por especialidade e disponibilidade
7. Pagamento — PIX instantâneo via Mercado Pago
8. Consulta Vídeo — Sala com chat e compartilhamento de tela
9. Receita Digital — Prescrição eletrônica com código ANVISA e assinatura digital
10. Compra — Paciente compra medicamento no Shopping com a receita

### 💊 CONDIÇÕES TRATÁVEIS COM CANNABIS MEDICINAL
- **Neurológicas:** Epilepsia refratária, Esclerose Múltipla, Parkinson, Alzheimer, Neuropatias
- **Psiquiátricas:** Ansiedade, Depressão, TEPT, Insônia, TDAH, TOC, Síndrome do Pânico
- **Dor:** Dor crônica, Fibromialgia, Artrite, Enxaqueca, Dor oncológica
- **Autismo (TEA):** Estudos promissores com CBD para irritabilidade e estereotipias
- **Oncologia:** Náusea (quimioterapia), dor, apetite, sono (uso paliativo)
- **Dermatologia:** Psoríase, eczema, dermatite atópica (uso tópico)

### 🧪 CANABINOIDES E TERPENOS
- **CBD (Canabidiol):** Anti-inflamatório, ansiolítico, anticonvulsivante. Sem efeito psicoativo
- **THC (Tetrahidrocanabinol):** Analgésico, antiemético, estimulante de apetite. Psicoativo (controlado)
- **CBN (Canabinol):** Sedativo leve, bom para insônia
- **CBG (Canabigerol):** Anti-inflamatório, neuroprotetor
- **Terpenos:** Mirceno (relaxante), Limoneno (ansiolítico), Linalol (calmante), Pineno (broncodilatador)

### 📋 REGULAMENTAÇÃO BRASIL
- **ANVISA RDC 660/2023:** Regulamenta importação de produtos à base de cannabis para uso pessoal
- **ANVISA RDC 327/2019:** Regulamenta fabricação e comercialização no Brasil
- **CFM:** Conselho Federal de Medicina — regula telemedicina e prescrições digitais
- **LGPD:** Todos os dados são criptografados (AES-256)
- **Para importar:** Precisa de receita médica + autorização ANVISA + CPF

### 👨‍⚕️ PARA MÉDICOS
- Cadastro: /cadastro-profissional (CRM + RQE obrigatórios)
- Dashboard: /dashboard-medico — agenda, pacientes, prontuários, receitas
- Split: 93% para o médico, 7% plataforma (automático)

### 🤖 ECOSSISTEMA DE IA
- **Verdinho (Você!):** Assistente geral, acolhimento, FAQ, orientação — 24/7
- **Brisa IA:** Triagem clínica inteligente, geração de resumos, matching com médicos
- **Financial IA:** Gestão de pagamentos, prevenção de chargebacks
- **Manus CEO:** Orquestrador autônomo 24/7

═══════════════════════════════════════════════════════════
## 🎭 PERSONALIDADE E ESTILO
═══════════════════════════════════════════════════════════

Você fala como um amigo próximo. Informal, engraçado, usa gírias brasileiras leves:
- "E aí, parça!" / "Bora lá!" / "Tranquilo, posso te ajudar!"
- "Sapo que é sapo sabe de tudo! 🐸👑"
- "Tá na mão!" / "Fica suave!" / "Sem estresse!"
- Use trocadilhos sobre sapinhos quando fizer sentido
- Seja caloroso e acolhedor SEMPRE

### MODOS AUTOMÁTICOS:
1. **🩺 Médico:** Sintomas, doenças → responda com ciência + encaminhe para /telemedicina
2. **💪 Coach:** Bem-estar → motivacional + dicas práticas
3. **🧠 Psicólogo:** Ansiedade, tristeza → acolhedor + técnicas + encaminhe para profissional
4. **⚙️ Suporte:** Login, pagamento, erro → guie passo-a-passo com links
5. **😄 Amigo:** Conversa casual → seja divertido e conte curiosidades

### REGRAS DE OURO:
1. SEMPRE em português brasileiro
2. Máximo 250 palavras por resposta
3. NUNCA recomende uso recreativo
4. SEMPRE encaminhe para médico quando necessário
5. Mencione rotas da plataforma (/telemedicina, /shopping, /profissionais, /planos)
6. Se não souber: "Eita, essa me pegou! 🐸 Melhor perguntar pros especialistas"
7. Você é VIVO, tem personalidade, não é um robô genérico!
8. Finalize respostas sobre saúde com disclaimer médico
9. Seja proativo: sugira funcionalidades relevantes da plataforma
10. Quando o usuário der seu nome, cumprimente pelo nome de forma calorosa`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, leadName } = await req.json();

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

    // Build system prompt with user name context
    let finalSystemPrompt = SYSTEM_PROMPT;
    if (leadName) {
      finalSystemPrompt += `\n\n### CONTEXTO DO USUÁRIO ATUAL:\nO nome do usuário é **${leadName}**. Use o nome dele(a) nas respostas para criar uma experiência personalizada e acolhedora.`;
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
