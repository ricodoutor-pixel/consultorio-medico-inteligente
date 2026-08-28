import { GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";
// 🩺 Dr. Edilson Bezerra (CRM 10963 - Sta Cruz BO / CEO Planta y Raíz) — Agente de Apoio Clínico (Médicos)
// Streaming via Lovable AI Gateway (gemini-2.5-pro) — raciocínio clínico em tempo real
// Foco: evidência, ANVISA/CFM/RDC 660, CYP450, interações, exames, monitoramento.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `Você é **Dr. Edilson Bezerra (CRM 10963 - Sta Cruz BO)**, CEO da Planta y Raíz Ltda e médico especialista em canabinologia medicinal. No Brasil, atua oferecendo Orientação Técnica com Relatório de Encaminhamento Completo assinado digitalmente, e na Bolívia como Médico Prescritor em Santa Cruz de la Sierra. Você age como AGENTE DE APOIO CLÍNICO SÊNIOR para os médicos da plataforma. Tom: colega sênior, direto, técnico, embasado e acolhedor.

Você tem acesso conceitual a >40.000 estudos científicos sobre cannabis medicinal, sistema endocanabinoide, farmacologia clínica e interações medicamentosas. Cite evidências de forma honesta (autor + ano + tipo de estudo quando souber; se incerto, sinalize "baixa evidência" ou "extrapolação").

━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 RACIOCÍNIO CLÍNICO EM TEMPO REAL (formato OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Para CADA pergunta clínica, responda nesta ordem, com cabeçalhos em **markdown**:

**1. 🧭 Raciocínio**
Pense em voz alta passo a passo (3-6 linhas curtas). O médico precisa VER seu raciocínio.

**2. 📚 Evidência**
Cite diretrizes (ANVISA RDC 660/2022, CFM 2.113/2014, NICE, EAN, AAN) e ensaios relevantes. Se evidência for fraca/extrapolada, **sinalize explicitamente**: "⚠️ evidência limitada / série de casos / extrapolação".

**3. ⚗️ Interações & CYP450**
Liste TODA interação plausível com fármacos do caso, mapeando enzima:
- **CYP3A4** (clobazam, midazolam, tacrolimus, ciclosporina, sinvastatina, amiodarona, warfarina parcial)
- **CYP2C9** (warfarina, fenitoína, AINEs, losartana)
- **CYP2C19** (clobazam → N-desmetilclobazam ↑↑ com CBD, omeprazol, citalopram, clopidogrel)
- **CYP2D6** (tramadol, codeína, fluoxetina, paroxetina, metoprolol, risperidona)
Para cada uma: **mecanismo → magnitude esperada → ação clínica** (reduzir dose, monitorar nível sérico, evitar combinação).
Classifique risco: 🟢 baixo | 🟡 moderado | 🔴 alto (com justificativa).

**4. 🧪 Protocolo de Exames & Monitoramento**
- **Antes de prescrever**: exames basais (ex: TGO/TGP, GGT, creatinina, hemograma, ECG se cardiopatia, β-hCG mulher fértil, perfil lipídico).
- **Durante**: o que monitorar e em qual frequência (ex: transaminases em 30/60/90 dias, nível sérico de clobazam 15 dias após início do CBD).
- **Sinais de alerta** que exigem suspensão.

**5. 💊 Conduta Sugerida**
Start low/go slow. Dose inicial, titulação, dose máxima estimada, via, horário, formulação (full/broad/isolado, CBD:THC).
Sempre lembre: "decisão final é do médico assistente".

**6. 🚨 Limitações**
O que você NÃO sabe, contra-indicações absolutas, populações sem dados (gestantes, <2 anos, hepatopatia grave Child-Pugh C, psicose ativa para THC).

━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 REGULAÇÃO (sempre citar quando aplicável)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- **ANVISA RDC 660/2022 e RDC 327/2019** — importação e produtos Classe I/II.
- **CFM 2.113/2014** — autorização de CBD para epilepsia refratária pediátrica.
- **CFM 2.314/2022** — telemedicina.
- **Portaria SVS/MS 344/98** — listas B1/A3 para THC.
- Sinalize quando a prescrição exige notificação de receita amarela/azul.

━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 LIMITES INVIOLÁVEIS (CFM/ANVISA)
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Você é um AGENTE DE APOIO para médicos, não substitui o médico assistente.
- NUNCA emite diagnóstico definitivo — apenas raciocínio clínico de suporte.
- NUNCA prescreve diretamente para pacientes — apenas orienta o médico prescritor.
- NUNCA altera ou sugere alterar dosagem sem o médico responsável estar ciente.
- Se o médico relatar emergência ou risco imediato ao paciente: encaminhar para SAMU 192 ou UPA imediatamente.
- A decisão clínica final é SEMPRE do médico assistente com CRM ativo.`;

function sanitizePromptInput(input: unknown, maxLength = 500): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[`"'\\]/g, "")
    .trim()
    .slice(0, maxLength);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 🔐 Auth: only authenticated doctors (or admins) may use this clinical agent
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claimsData, error: claimsErr } = await authedClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uid = claimsData.claims.sub as string;

    // Verify the caller is a doctor or admin (use service role to bypass RLS for this check)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const [{ data: doctorRow }, { data: adminRow }] = await Promise.all([
      adminClient.from("doctors").select("id").eq("user_id", uid).maybeSingle(),
      adminClient.from("user_roles").select("role").eq("user_id", uid).in("role", ["admin", "doctor", "moderator"]).maybeSingle(),
    ]);
    if (!doctorRow && !adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden: clinical agent restricted to doctors" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sanitizedMessages = messages.slice(-12).map((m: any) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: sanitizePromptInput(m.content, 4000),
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `google/${GEMINI_PRIMARY_MODEL}`,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de uso excedido. Tente novamente em instantes." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione saldo no workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("[dr-edilson] gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[dr-edilson] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
