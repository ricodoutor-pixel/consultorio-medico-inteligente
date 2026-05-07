import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { professionalId } = await req.json();
    if (!professionalId) {
      return new Response(JSON.stringify({ error: "professionalId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all badges and existing achievements
    const [{ data: badges }, { data: existing }, { data: npsData }, { data: streak }, { data: doctorData }] = await Promise.all([
      supabase.from("gamification_badges").select("*"),
      supabase.from("gamification_achievements").select("badge_id").eq("professional_id", professionalId),
      supabase.from("nps_professional").select("*").eq("professional_id", professionalId).maybeSingle(),
      supabase.from("gamification_streak").select("*").eq("professional_id", professionalId).maybeSingle(),
      supabase.from("doctors").select("total_consultations").eq("user_id", professionalId).maybeSingle(),
    ]);

    const existingBadgeIds = new Set((existing || []).map((e) => e.badge_id));
    const newBadges: string[] = [];

    for (const badge of badges || []) {
      if (existingBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria as { type: string; min?: number; max_rank?: number } | null;
      if (!criteria) continue;

      let earned = false;

      switch (criteria.type) {
        case "consultations":
          earned = (doctorData?.total_consultations || 0) >= (criteria.min || 0);
          break;
        case "nps_score":
          earned = (npsData?.nps_score || 0) >= (criteria.min || 0);
          break;
        case "streak":
          earned = (streak?.current_streak || 0) >= (criteria.min || 0);
          break;
        case "nps_sustained":
          earned = (npsData?.nps_score || 0) >= (criteria.min || 0);
          break;
      }

      if (earned) {
        await supabase.from("gamification_achievements").insert({
          professional_id: professionalId,
          badge_id: badge.id,
        });
        newBadges.push(badge.name);

        // Record in history
        await supabase.from("gamification_history").insert({
          professional_id: professionalId,
          event_type: "badge_earned",
          points: badge.bonus_points,
          event_data: { badge_name: badge.name, badge_rarity: badge.rarity },
        });

        // Send notification via Evolution API
        try {
          await supabase.functions.invoke("notify-achievement", {
            body: {
              professionalId,
              type: "badge_earned",
              data: { badge_name: badge.name, badge_rarity: badge.rarity, bonus_points: badge.bonus_points },
            },
          });
        } catch (notifErr) {
          console.error("Notification dispatch failed:", notifErr);
        }
      }
    }

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    if (streak) {
      const lastUpdate = streak.last_updated_at?.split("T")[0];
      if (lastUpdate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const newStreak = lastUpdate === yesterday ? streak.current_streak + 1 : 1;
        await supabase.from("gamification_streak").update({
          current_streak: newStreak,
          max_streak: Math.max(newStreak, streak.max_streak),
          last_updated_at: new Date().toISOString(),
        }).eq("professional_id", professionalId);
      }
    } else {
      await supabase.from("gamification_streak").insert({
        professional_id: professionalId,
        current_streak: 1,
        max_streak: 1,
      });
    }

    return new Response(
      JSON.stringify({ newBadges, totalNew: newBadges.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Badge check error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
