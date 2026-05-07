import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Daily Gamification Check - Triggered by pg_cron
 * Verifies active metas for ALL professionals and awards bonuses
 */
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

    // Get all active metas
    const { data: activeMetas, error: metaErr } = await supabase
      .from("gamification_metas")
      .select("*")
      .eq("status", "active");

    if (metaErr) throw metaErr;
    if (!activeMetas || activeMetas.length === 0) {
      return new Response(JSON.stringify({ message: "No active metas", processed: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let completed = 0;
    let bonusesAwarded = 0;
    const results: Array<{ professionalId: string; status: string; bonus?: number }> = [];

    for (const meta of activeMetas) {
      // Check if meta has expired
      if (meta.end_date && new Date(meta.end_date) < new Date()) {
        await supabase.from("gamification_metas").update({ status: "expired" }).eq("id", meta.id);
        results.push({ professionalId: meta.professional_id, status: "expired" });
        continue;
      }

      // Get NPS score
      const { data: npsData } = await supabase
        .from("nps_professional")
        .select("nps_score")
        .eq("professional_id", meta.professional_id)
        .maybeSingle();

      const currentNPS = npsData?.nps_score || 0;

      if (currentNPS >= meta.nps_target) {
        // Tiered bonus multiplier
        let multiplier = 1.0;
        if (currentNPS >= 95) multiplier = 1.5;       // 💎 Platina
        else if (currentNPS >= 90) multiplier = 1.35;  // 🥇 Ouro
        else if (currentNPS >= 85) multiplier = 1.2;   // 🥈 Prata
        else multiplier = 1.0;                          // 🥉 Bronze

        const bonusAmount = Math.floor(meta.bonus_amount * multiplier);

        // Award bonus
        await supabase.from("gamification_bonuses").insert({
          professional_id: meta.professional_id,
          meta_id: meta.id,
          bonus_type: "nps_achievement",
          amount: bonusAmount,
          reason: `NPS ${currentNPS} atingiu meta ${meta.nps_target} (${multiplier}x)`,
          status: "pending",
        });

        // Mark meta completed
        await supabase.from("gamification_metas").update({ status: "completed" }).eq("id", meta.id);

        // Record history
        await supabase.from("gamification_history").insert({
          professional_id: meta.professional_id,
          event_type: "meta_completed",
          points: Math.floor(bonusAmount / 100),
          event_data: { metaId: meta.id, npsScore: currentNPS, bonusAmount, multiplier },
        });

        completed++;
        bonusesAwarded += bonusAmount;
        results.push({ professionalId: meta.professional_id, status: "completed", bonus: bonusAmount });
      } else {
        results.push({ professionalId: meta.professional_id, status: "in_progress" });
      }
    }

    // Also run badge checks for all active professionals
    const professionalIds = [...new Set(activeMetas.map(m => m.professional_id))];
    for (const pid of professionalIds) {
      try {
        await supabase.functions.invoke("auto-badge-check", {
          body: { professionalId: pid },
        });
      } catch (e) {
        console.error(`Badge check failed for ${pid}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalMetas: activeMetas.length,
        completed,
        bonusesAwarded,
        results,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Daily gamification check error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
