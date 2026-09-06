import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();

    // 1. Total leads captured this week
    const { count: totalLeads } = await supabase
      .from("leads_contatos")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgoISO);

    // 2. WhatsApp conversations this week
    const { data: conversations } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .gte("updated_at", weekAgoISO);

    const totalConversations = conversations?.length || 0;

    // 3. Intent breakdown & sentiment analysis
    const intentCounts: Record<string, number> = {};
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    let schedulingIntents = 0;

    conversations?.forEach((conv: any) => {
      const intent = conv.last_intent || "geral";
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      if (intent === "agendar") schedulingIntents++;

      // Analyze sentiment from tags in messages
      const msgs = conv.messages || [];
      msgs.forEach((m: any) => {
        if (m.role === "user") {
          const lower = (m.content || "").toLowerCase();
          const neg = ["dor", "sofrendo", "ruim", "péssimo", "horrível", "triste", "mal", "desespero"];
          const pos = ["obrigado", "obrigada", "ótimo", "maravilh", "bom", "melhor", "feliz"];
          if (neg.some(w => lower.includes(w))) sentimentCounts.negative++;
          else if (pos.some(w => lower.includes(w))) sentimentCounts.positive++;
          else sentimentCounts.neutral++;
        }
      });
    });

    // 4. Appointments this week
    const { count: appointmentsCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgoISO);

    // 5. Conversion rate
    const conversionRate = totalConversations > 0
      ? ((schedulingIntents / totalConversations) * 100).toFixed(1)
      : "0";

    // 6. Payments processed (escrow)
    const { data: payments } = await supabase
      .from("escrow_transactions")
      .select("amount, status")
      .gte("created_at", weekAgoISO)
      .eq("status", "confirmed");

    const totalPayments = payments?.length || 0;
    const totalRevenue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

    // Build report
    const report = {
      period: {
        start: weekAgoISO,
        end: now.toISOString(),
      },
      leads: {
        total: totalLeads || 0,
        source: "whatsapp_brisa_coo",
      },
      conversations: {
        total: totalConversations,
        intents: intentCounts,
        scheduling_intents: schedulingIntents,
      },
      conversion: {
        rate: `${conversionRate}%`,
        conversations: totalConversations,
        appointments: appointmentsCount || 0,
      },
      payments: {
        total_transactions: totalPayments,
        total_revenue: totalRevenue,
        currency: "BRL",
      },
      sentiment: {
        positive: sentimentCounts.positive,
        negative: sentimentCounts.negative,
        neutral: sentimentCounts.neutral,
        overall: sentimentCounts.positive > sentimentCounts.negative ? "Positivo 😊" : sentimentCounts.negative > sentimentCounts.positive ? "Negativo 😟" : "Neutro 😐",
      },
      generated_at: now.toISOString(),
      generated_by: "Brisa COO IA",
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Brisa Reports] Error:", e);
    return new Response(JSON.stringify({ error: "Failed to generate report" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
