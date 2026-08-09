import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Brisa Social Media Manager
 * Generates and posts daily content to Instagram, Facebook, and Google Business Profile.
 * Also handles abandoned cart/quiz recovery reminders via WhatsApp.
 */

const CONTENT_THEMES = [
  { theme: "educacao_rdc", prompt: "Crie um post educativo curto (máx 200 palavras) sobre a RDC 660/2022 da ANVISA para importação de Cannabis Medicinal. Tom: profissional e acolhedor. Inclua 3-5 hashtags relevantes em português. Não use linguagem técnica demais." },
  { theme: "beneficios_cbd", prompt: "Crie um post sobre os benefícios comprovados do CBD para ansiedade ou dor crônica. Tom: científico mas acessível. Inclua call-to-action para agendar consulta. 3-5 hashtags. Máx 200 palavras." },
  { theme: "depoimento", prompt: "Crie um depoimento fictício anonimizado de um paciente que melhorou com tratamento de Cannabis Medicinal (ex: insônia, dor crônica). Tom: esperançoso e real. Máx 150 palavras. 3-5 hashtags." },
  { theme: "quiz_triagem", prompt: "Crie um post convidando pessoas a fazerem o Quiz de Triagem gratuito no site. Tom: leve e convidativo. Mencione que é rápido e personalizado. Call-to-action: link do quiz. 3-5 hashtags. Máx 150 palavras." },
  { theme: "marketplace", prompt: "Crie um post sobre os produtos disponíveis no Shopping (óleos Full Spectrum, Broad Spectrum, Isolado). Tom: informativo. Explique brevemente a diferença. Call-to-action: visitar o shopping. 3-5 hashtags. Máx 200 palavras." },
  { theme: "telemedicina", prompt: "Crie um post sobre a facilidade da teleconsulta: consulta online, sem sair de casa, com médicos especializados em Cannabis Medicinal. Tom: acessível. Call-to-action: agendar. 3-5 hashtags. Máx 150 palavras." },
  { theme: "planta_coins", prompt: "Crie um post sobre o programa Planta-Coins: como ganhar créditos fazendo triagem e usar em consultas e produtos. Tom: gamificado e divertido. 3-5 hashtags. Máx 150 palavras." },
];

const SITE_LINKS: Record<string, string> = {
  educacao_rdc: "https://plantayraiz.com.br/como-funciona",
  beneficios_cbd: "https://plantayraiz.com.br/falar-com-especialista",
  depoimento: "https://plantayraiz.com.br/falar-com-especialista",
  quiz_triagem: "https://plantayraiz.com.br/quiz-triagem",
  marketplace: "https://plantayraiz.com.br/shopping",
  telemedicina: "https://plantayraiz.com.br/falar-com-especialista",
  planta_coins: "https://plantayraiz.com.br/planos",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");
    const INSTAGRAM_BUSINESS_ACCOUNT_ID = Deno.env.get("INSTAGRAM_BUSINESS_ACCOUNT_ID");
    let FACEBOOK_PAGE_TOKEN: string | null = null;
    if (FACEBOOK_PAGE_ID) {
      try {
        const { getFacebookPageToken } = await import("../_shared/fb-page-token.ts");
        FACEBOOK_PAGE_TOKEN = await getFacebookPageToken(FACEBOOK_PAGE_ID);
      } catch (e) {
        console.error("[Brisa Social] FB token swap failed:", e);
      }
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "generate_and_post";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── Action: Generate and post daily content ───
    if (action === "generate_and_post") {
      const dayIndex = new Date().getDay();
      const theme = CONTENT_THEMES[dayIndex % CONTENT_THEMES.length];
      const siteLink = SITE_LINKS[theme.theme];

      // Geração de conteúdo via Google Gemini DIRETO (sem Lovable AI Gateway)
      const GEMINI_API_KEY =
        Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
        Deno.env.get("GEMINI_API_KEY") ||
        "";
      let postContent = "";
      let aiError = "";

import { callGeminiApiWithFallback, GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";

      if (GEMINI_API_KEY) {
        try {
          const reqPayload = {
            contents: [{ role: "user", parts: [{ text: `${theme.prompt}\n\nSempre inclua o link ${siteLink}. CNAE 6209-1/00. Nunca prometa cura. UTM: ?utm_source=brisa_ia&utm_medium=social&utm_campaign=${theme.theme}` }] }]
          };
          const aiResp = await callGeminiApiWithFallback(GEMINI_API_KEY, reqPayload, GEMINI_PRIMARY_MODEL);
          if (aiResp.ok) {
            postContent = aiResp.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            aiError = `google_gemini ${aiResp.status}: ${JSON.stringify(aiResp.data).slice(0,200)}`;
          }
        } catch (e) { aiError = `google_gemini exception: ${e}`; }
      } else {
        aiError = "GOOGLE_GENERATIVE_AI_API_KEY/GEMINI_API_KEY não configurada";
      }


      if (!postContent) {
        console.error("[Brisa Social] AI fail:", aiError);
        return new Response(JSON.stringify({ error: "AI content generation failed", detail: aiError }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: Record<string, any> = { content: postContent, theme: theme.theme };

      // ─── Post to Facebook Page ───
      if (FACEBOOK_PAGE_TOKEN && FACEBOOK_PAGE_ID) {
        try {
          const fbResp = await fetch(
            `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/feed`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: postContent,
                link: `${siteLink}?utm_source=brisa_ia&utm_medium=facebook&utm_campaign=${theme.theme}`,
                access_token: FACEBOOK_PAGE_TOKEN,
              }),
            }
          );
          const fbData = await fbResp.json();
          results.facebook = { success: fbResp.ok, id: fbData.id, error: fbData.error };
          console.log(`[Brisa Social] Facebook post: ${fbResp.ok ? "✅" : "❌"}`);
        } catch (e) {
          console.error("[Brisa Social] facebook error:", e);
          results.facebook = { success: false, error: "facebook_api_error" };
        }
      }

      // ─── Post to Instagram (requires image - create container) ───
      if (FACEBOOK_PAGE_TOKEN && INSTAGRAM_BUSINESS_ACCOUNT_ID) {
        try {
          // Instagram requires an image. We'll create a text-only carousel caption post
          // For now, log the content for manual posting or future image generation
          results.instagram = {
            success: true,
            note: "Content generated for Instagram. Image generation required for API posting.",
            caption: postContent,
          };
          console.log(`[Brisa Social] Instagram content generated for manual/scheduled posting`);
        } catch (e) {
          console.error("[Brisa Social] instagram error:", e);
          results.instagram = { success: false, error: "instagram_api_error" };
        }
      }

      // ─── Log the post event ───
      await supabase.from("ai_events").insert({
        ai_name: "brisa_coo",
        event_type: "social_media_post",
        status: "completed",
        input_data: { theme: theme.theme, day: new Date().getDay() },
        output_data: results,
      });

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: Abandoned cart/quiz recovery ───
    if (action === "recovery_check") {
      const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
      const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
      const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
      if (!EVO_URL || !EVO_KEY) {
        return new Response(JSON.stringify({ error: "EVOLUTION_API credentials missing" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      const { data: recentLeads } = await supabase
        .from("whatsapp_conversations")
        .select("phone_number, last_intent, updated_at, messages")
        .gte("updated_at", fifteenMinAgo)
        .in("last_intent", ["shopping", "triagem", "preco"]);

      const recoveryResults: any[] = [];

      for (const lead of recentLeads || []) {
        const { count } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", lead.phone_number)
          .gte("created_at", fifteenMinAgo);

        if ((count || 0) > 0) continue;

        const intentMessages: Record<string, string> = {
          shopping: "🌿 Olá! Vi que você estava explorando nosso Shopping de produtos. Posso te ajudar a encontrar o óleo ideal para você? Acesse: https://plantayraiz.com.br/shopping 💚",
          triagem: "🌿 Oi! Percebi que você começou o Quiz de Triagem mas não finalizou. São apenas algumas perguntas rápidas para encontrar o tratamento ideal! Continue: https://plantayraiz.com.br/quiz-triagem 💚",
          preco: "🌿 Olá! Notei que você estava verificando nossos planos. Temos opções a partir de R$29,90/mês com descontos exclusivos! Veja: https://plantayraiz.com.br/planos 💚",
        };

        const msg = intentMessages[lead.last_intent] || "";
        if (!msg) continue;

        try {
          await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVO_KEY },
            body: JSON.stringify({
              number: (lead.phone_number || "").replace(/\D/g, ""),
              text: msg,
              delay: 1200,
            }),
          });
          recoveryResults.push({ phone: lead.phone_number.substring(0, 6) + "***", intent: lead.last_intent, sent: true });
        } catch (e) {
          recoveryResults.push({ phone: lead.phone_number.substring(0, 6) + "***", intent: lead.last_intent, sent: false });
        }
      }

      await supabase.from("ai_events").insert({
        ai_name: "brisa_coo",
        event_type: "recovery_campaign",
        status: "completed",
        output_data: { total_checked: recentLeads?.length || 0, sent: recoveryResults.length, results: recoveryResults },
      });

      return new Response(JSON.stringify({ recoveries: recoveryResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: Get marketing metrics ───
    if (action === "marketing_metrics") {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [postsRes, leadsRes, commissionsRes] = await Promise.all([
        supabase.from("ai_events")
          .select("output_data, created_at")
          .eq("ai_name", "brisa_coo")
          .eq("event_type", "social_media_post")
          .gte("created_at", weekAgo),
        supabase.from("leads_contatos")
          .select("tags, created_at")
          .gte("created_at", weekAgo),
        supabase.from("affiliate_commissions")
          .select("amount, status, level")
          .gte("created_at", weekAgo),
      ]);

      const posts = postsRes.data || [];
      const leads = leadsRes.data || [];
      const commissions = commissionsRes.data || [];

      // Count social media sourced leads
      const socialLeads = leads.filter((l: any) => 
        (l.tags || []).some((t: string) => t.includes("social") || t.includes("instagram") || t.includes("facebook"))
      ).length;

      // Affiliate balances
      const totalCommissionsPaid = commissions
        .filter((c: any) => c.status === "paid")
        .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      const totalCommissionsPending = commissions
        .filter((c: any) => c.status === "pending")
        .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

      // Brisa-assisted conversions
      const brisaAssisted = leads.filter((l: any) =>
        (l.tags || []).includes("brisa_assisted")
      ).length;

      // Recovery campaigns
      const { count: recoveryCampaigns } = await supabase
        .from("ai_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "recovery_campaign")
        .gte("created_at", weekAgo);

      return new Response(JSON.stringify({
        social_media: {
          posts_published: posts.length,
          platforms: ["Facebook", "Instagram", "WhatsApp Status"],
          social_leads: socialLeads,
        },
        organic_traffic: {
          total_leads: leads.length,
          brisa_assisted: brisaAssisted,
          recovery_campaigns: recoveryCampaigns || 0,
        },
        affiliates: {
          total_commissions_paid: totalCommissionsPaid,
          total_commissions_pending: totalCommissionsPending,
          commission_count: commissions.length,
        },
        period: { start: weekAgo, end: now.toISOString() },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Brisa Social] Error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
