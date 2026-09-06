import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const guard = requireServiceAuth(req, corsHeaders);
  if (guard) return guard;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { metaId } = await req.json();

    if (!metaId) {
      return new Response(JSON.stringify({ error: "metaId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: meta } = await supabase
      .from("gamification_metas")
      .select("*")
      .eq("id", metaId)
      .single();

    if (!meta) {
      return new Response(JSON.stringify({ error: "Meta not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (meta.status !== "active") {
      return new Response(JSON.stringify({ success: false, message: "Meta is not active" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: npsData } = await supabase
      .from("nps_professional")
      .select("nps_score")
      .eq("professional_id", meta.professional_id)
      .single();

    const currentNPS = npsData?.nps_score || 0;

    if (currentNPS >= meta.nps_target) {
      // Calculate bonus with multiplier (max 1.5x)
      const exceedPct = ((currentNPS - meta.nps_target) / meta.nps_target) * 100;
      const multiplier = Math.min(1 + exceedPct / 100, 1.5);
      const bonusAmount = Math.floor(meta.bonus_amount * multiplier);

      await supabase.from("gamification_bonuses").insert({
        professional_id: meta.professional_id,
        meta_id: metaId,
        bonus_type: "nps_achievement",
        amount: bonusAmount,
        reason: `NPS ${currentNPS} atingiu meta de ${meta.nps_target}`,
        status: "pending",
      });

      await supabase.from("gamification_metas").update({ status: "completed" }).eq("id", metaId);

      await supabase.from("gamification_history").insert({
        professional_id: meta.professional_id,
        event_type: "meta_completed",
        event_data: { metaId, npsScore: currentNPS, bonusAmount },
        points: Math.floor(bonusAmount / 100),
      });

      return new Response(
        JSON.stringify({ success: true, bonusAmount, message: "Meta completed!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, currentNPS, targetNPS: meta.nps_target, progress: Math.round((currentNPS / meta.nps_target) * 100) }),
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
