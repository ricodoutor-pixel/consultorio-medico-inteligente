import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireProfessionalAccess } from "../_shared/professional-auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const professionalId = url.searchParams.get("professionalId");

    if (!professionalId) {
      return new Response(JSON.stringify({ error: "professionalId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authErr = await requireProfessionalAccess(req, professionalId, corsHeaders);
    if (authErr) return authErr;

    // Parallel fetches
    const [metaRes, npsRes, bonusRes, achieveRes, streakRes, leaderRes] = await Promise.all([
      supabase.from("gamification_metas").select("*").eq("professional_id", professionalId).eq("status", "active").limit(1).maybeSingle(),
      supabase.from("nps_professional").select("*").eq("professional_id", professionalId).maybeSingle(),
      supabase.from("gamification_bonuses").select("*").eq("professional_id", professionalId).eq("status", "pending"),
      supabase.from("gamification_achievements").select("*, gamification_badges(*)").eq("professional_id", professionalId),
      supabase.from("gamification_streak").select("*").eq("professional_id", professionalId).maybeSingle(),
      supabase.from("gamification_leaderboard").select("*").eq("professional_id", professionalId).maybeSingle(),
    ]);

    const currentMeta = metaRes.data;
    const npsData = npsRes.data;
    const pendingBonuses = bonusRes.data || [];
    const achievements = achieveRes.data || [];
    const streak = streakRes.data;
    const leaderboard = leaderRes.data;

    let progress = 0;
    if (currentMeta && npsData) {
      progress = Math.min(Math.round((npsData.nps_score / currentMeta.nps_target) * 100), 100);
    }

    // Get top 10 leaderboard
    const { data: top10 } = await supabase
      .from("gamification_leaderboard")
      .select("*, profiles:professional_id(full_name, avatar_url)")
      .order("rank", { ascending: true })
      .limit(10);

    return new Response(
      JSON.stringify({
        currentMeta,
        npsProgress: {
          currentNPS: npsData?.nps_score || 0,
          avgScore: npsData?.avg_score || 0,
          targetNPS: currentMeta?.nps_target || 80,
          progress,
          completed: npsData && currentMeta ? npsData.nps_score >= currentMeta.nps_target : false,
        },
        pendingBonuses: {
          count: pendingBonuses.length,
          totalAmount: pendingBonuses.reduce((s, b) => s + b.amount, 0),
          items: pendingBonuses,
        },
        achievements: {
          count: achievements.length,
          items: achievements,
        },
        streak: {
          currentStreak: streak?.current_streak || 0,
          maxStreak: streak?.max_streak || 0,
        },
        leaderboard: {
          rank: leaderboard?.rank || 0,
          top10: top10 || [],
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
