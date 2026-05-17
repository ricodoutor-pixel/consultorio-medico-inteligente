import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: responses } = await supabase
      .from("nps_responses")
      .select("score, category, created_at, feedback, sentiment")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!responses || responses.length === 0) {
      return new Response(
        JSON.stringify({ npsScore: 0, avgScore: 0, totalResponses: 0, promoters: 0, passives: 0, detractors: 0, responseRate: 0, recentFeedback: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const total = responses.length;
    const avg = responses.reduce((s, r) => s + r.score, 0) / total;
    const promoters = responses.filter(r => r.category === "promoter").length;
    const passives = responses.filter(r => r.category === "passive").length;
    const detractors = responses.filter(r => r.category === "detractor").length;
    const nps = Math.round(((promoters - detractors) / total) * 100);

    // Trend data (daily for last 30 days)
    const trends: Record<string, { scores: number[]; categories: string[] }> = {};
    for (const r of responses) {
      const day = r.created_at.substring(0, 10);
      if (!trends[day]) trends[day] = { scores: [], categories: [] };
      trends[day].scores.push(r.score);
      trends[day].categories.push(r.category);
    }

    const trendData = Object.entries(trends).map(([date, d]) => {
      const p = d.categories.filter(c => c === "promoter").length;
      const det = d.categories.filter(c => c === "detractor").length;
      return {
        date,
        npsScore: Math.round(((p - det) / d.scores.length) * 100),
        totalResponses: d.scores.length,
        avgScore: parseFloat((d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(1)),
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    const recentFeedback = responses
      .filter(r => r.feedback)
      .slice(0, 10)
      .map(r => ({ score: r.score, feedback: r.feedback, sentiment: r.sentiment, date: r.created_at }));

    return new Response(
      JSON.stringify({ npsScore: nps, avgScore: parseFloat(avg.toFixed(1)), totalResponses: total, promoters, passives, detractors, responseRate: parseFloat(((total / 1000) * 100).toFixed(2)), trends: trendData, recentFeedback }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
