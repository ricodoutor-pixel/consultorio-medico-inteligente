// 🌿 Category Chat — fluxo interno da Enf. Brisa via Gemini, por categoria de lead.
// Usuário clica no CTA da sua categoria → modal captura nome+celular → conversa direto
// com a Brisa (institucional, sob supervisão técnica da Dra. Suelen Naves Rodrigues (CRM-PR 49354) CRM 49354/PR).
// Contatos e mensagens ficam salvos em `platform_contacts` / `platform_contact_messages`
// para o admin acompanhar em /admin/contatos.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit, clientIp } from "../_shared/ai-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY") ||
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
  "";

type Category = "paciente" | "medico" | "lojista" | "afiliado" | "investidor" | "imprensa" | "geral";

const CATEGORY_PROMPTS: Record<Category, string> = {
  paciente:
    "O usuário é PACIENTE em busca de tratamento com cannabis medicinal. Explique o fluxo: cadastro grátis em plantayraiz.com.br + Orientação Técnica R$30 (US$10 internacional) via WhatsApp, com relatório técnico em PDF válido para importação ANVISA RDC 660/2022. Se descrever sintomas graves (dor 8+, crises, red flags), oriente encaminhamento imediato ao médico prescritor. Não prescreva.",
  medico:
    "O usuário é MÉDICO(A) interessado em prescrever pela plataforma. Explique: cadastro profissional em /cadastro-profissional, verificação de CRM, split 93% médico / 7% plataforma nas consultas, prescrição digital com selo gov.br/ICP-Brasil, agenda integrada e telemedicina Jitsi. Convide para conversar com nosso time comercial.",
  lojista:
    "O usuário é LOJISTA/FARMÁCIA/IMPORTADORA. Explique parceria de marketplace: catálogo verificado ANVISA, comissão 5–15%, dashboard de pedidos, split Mercado Pago em tempo real. Peça nome da empresa, CNPJ e categoria de produtos.",
  afiliado:
    "O usuário quer ser AFILIADO. Explique o programa MLM 3 gerações (25% / 15% / 10%), Planta-Coins, dashboard em /afiliados, saque mínimo R$100. Peça o WhatsApp para envio do link de cadastro.",
  investidor:
    "O usuário é INVESTIDOR. Fale de forma institucional: métricas de tração, funil, LTV/CAC, roadmap. NUNCA compartilhe cap table, valuation ou dados financeiros sensíveis. Encaminhe para agendamento com a diretoria.",
  imprensa:
    "O usuário é da IMPRENSA. Ofereça press kit institucional, dados de mercado (RDC 660/2022, CFM 2.314/2022) e agendamento com porta-voz. Não emita opinião clínica.",
  geral:
    "Perfil do usuário ainda não classificado. Descubra em uma pergunta a categoria (paciente / médico / lojista / afiliado / investidor / imprensa) e conduza a partir daí.",
};

const BASE_PERSONA = `Você é a Enf. Brisa, atendente institucional da plataforma Planta y Raiz — nome fantasia da Bezerra Med Soluções Integradas Ltda. (CNPJ 30.740.319/0001-14, CNAE 6209-1/00). A plataforma é uma INTERMEDIAÇÃO DIGITAL e não uma clínica.

Regras invioláveis:
- Apresente-se SEMPRE como "Enf. Brisa da Planta y Raiz".
- Supervisão técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354) (CRM 49354/PR). Só cite quando perguntarem por responsável técnico.
- PROIBIDO citar Dr. Edilson Bezerra (CRM-CE 10963), CRM-SP 10963 ou dados clínicos íntimos.
- PROIBIDO termos íntimos (amor, querido, meu bem, fofo, lindo, gata).
- PROIBIDO prescrever medicamento, dosagem ou diagnóstico. Encaminhe ao médico prescritor.
- Tom: corporativo institucional, acolhedor, PT-BR, respostas curtas (máx. 3 parágrafos, use listas quando útil).
- Sempre ofereça o próximo passo concreto (cadastro, WhatsApp, link da rota).
- URL oficial: https://plantayraiz.com.br · WhatsApp humano de suporte: +55 11 99136-3154.

Se o usuário pedir dado que você não tem, seja honesta e encaminhe para o time humano no WhatsApp.`;

function normalizePhone(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length < 10) return "";
  return digits.length <= 13 ? digits : digits.slice(0, 13);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 🔐 Rate limit por IP (endpoint público de captação — protege a chave paga de IA)
  const limited = await rateLimit({
    bucket: "category_chat", key: clientIp(req), maxHits: 20, windowSeconds: 60, cors: corsHeaders,
    message: "Muitas mensagens em pouco tempo. Aguarde 1 minuto e tente novamente. 🌿",
  });
  if (limited) return limited;

  try {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const {
      contactId: rawContactId,
      name,
      phone,
      category: rawCat,
      message,
      utm,
      userAgent,
    } = body as {
      contactId?: string | null;
      name?: string;
      phone?: string;
      category?: string;
      message?: string;
      utm?: { source?: string; medium?: string; campaign?: string };
      userAgent?: string;
    };

    const category = (CATEGORY_PROMPTS as any)[rawCat as string]
      ? (rawCat as Category)
      : ("geral" as Category);

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "message_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Contato — cria ou reaproveita
    let contactId = rawContactId || null;
    if (!contactId) {
      const cleanName = String(name || "").trim().slice(0, 120);
      const cleanPhone = normalizePhone(phone || "");
      if (!cleanName || !cleanPhone) {
        return new Response(JSON.stringify({ error: "name_and_phone_required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: inserted, error: insertErr } = await supa
        .from("platform_contacts")
        .insert({
          name: cleanName,
          phone: cleanPhone,
          category,
          first_message: message.slice(0, 500),
          utm_source: utm?.source ?? null,
          utm_medium: utm?.medium ?? null,
          utm_campaign: utm?.campaign ?? null,
          user_agent: (userAgent || req.headers.get("user-agent") || "").slice(0, 400),
          message_count: 0,
        })
        .select("id")
        .single();
      if (insertErr || !inserted) {
        console.error("insert contact error", insertErr);
        return new Response(JSON.stringify({ error: "db_insert_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      contactId = inserted.id;
    }

    // 2) Histórico recente (últimas 10 msgs)
    const { data: history } = await supa
      .from("platform_contact_messages")
      .select("role, content")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: true })
      .limit(20);

    // 3) Log da mensagem do usuário
    await supa.from("platform_contact_messages").insert({
      contact_id: contactId,
      role: "user",
      content: message.slice(0, 4000),
    });

    // 4) Chamada Gemini via OpenAI-compat
    if (!GEMINI_API_KEY) {
      const fallback =
        "Estou temporariamente indisponível. Fale com nosso time humano no WhatsApp +55 11 99136-3154.";
      await supa.from("platform_contact_messages").insert({
        contact_id: contactId,
        role: "assistant",
        content: fallback,
      });
      return new Response(JSON.stringify({ contactId, reply: fallback, provider: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `${BASE_PERSONA}\n\nCategoria do lead: ${category.toUpperCase()}.\n${CATEGORY_PROMPTS[category]}`;

    const aiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...((history ?? []).map((h: any) => ({ role: h.role, content: h.content }))),
            { role: "user", content: message },
          ],
          temperature: 0.7,
        }),
      }
    );

    let reply = "";
    let provider: "gemini" | "fallback" = "gemini";
    if (!aiRes.ok) {
      console.error("gemini error", aiRes.status, await aiRes.text().catch(() => ""));
      reply =
        "No momento estou com instabilidade. Chame nosso time humano no WhatsApp +55 11 99136-3154 que a gente te atende agora mesmo.";
      provider = "fallback";
    } else {
      const data = await aiRes.json();
      reply = data?.choices?.[0]?.message?.content?.trim() || "(sem resposta)";
    }

    // 5) Persistir resposta + bump metrics
    await supa.from("platform_contact_messages").insert({
      contact_id: contactId,
      role: "assistant",
      content: reply.slice(0, 8000),
    });

    // Bump counters (best-effort)
    await supa
      .from("platform_contacts")
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: ((history?.length ?? 0) + 2),
      })
      .eq("id", contactId);

    return new Response(
      JSON.stringify({ contactId, reply, provider, category }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("category-chat fatal", e);
    return new Response(JSON.stringify({ error: "internal", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
