import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NPSSubmitRequest {
  consultationId: string;
  patientId: string;
  professionalId: string;
  score: number;
  feedback?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ── AUTH: require valid Supabase JWT ──
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: NPSSubmitRequest = await req.json();

    // Validation
    if (!data.consultationId || !data.patientId || !data.professionalId || data.score === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.score < 0 || data.score > 10) {
      return new Response(
        JSON.stringify({ error: "Score must be between 0 and 10" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── AUTHZ: caller must own the patient_id ──
    if (data.patientId !== callerId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify consultation belongs to this patient + professional ──
    const { data: consultation } = await supabase
      .from("consultations")
      .select("id, patient_id, professional_id")
      .eq("id", data.consultationId)
      .maybeSingle();
    if (!consultation
      || consultation.patient_id !== data.patientId
      || consultation.professional_id !== data.professionalId) {
      return new Response(JSON.stringify({ error: "Consultation not found for this patient/professional" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Dedupe: one response per consultation ──
    const { data: existing } = await supabase
      .from("nps_responses")
      .select("id")
      .eq("consultation_id", data.consultationId)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: "NPS already submitted for this consultation" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Categorize
    let category: "detractor" | "passive" | "promoter";
    if (data.score <= 6) category = "detractor";
    else if (data.score <= 8) category = "passive";
    else category = "promoter";

    // Sentiment analysis (simple)
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    if (data.feedback) {
      const sanitized = data.feedback.replace(/<[^>]*>/g, "");
      const lower = sanitized.toLowerCase();
      const positive = ["ótimo", "excelente", "boa", "adorei", "perfeito", "maravilhoso", "recomendo"];
      const negative = ["ruim", "péssimo", "horrível", "terrível", "decepção", "insatisfeito"];
      if (positive.some(w => lower.includes(w))) sentiment = "positive";
      else if (negative.some(w => lower.includes(w))) sentiment = "negative";
      data.feedback = sanitized;
    }

    // Insert response
    const { data: response, error: insertError } = await supabase
      .from("nps_responses")
      .insert({
        consultation_id: data.consultationId,
        patient_id: data.patientId,
        professional_id: data.professionalId,
        score: data.score,
        category,
        feedback: data.feedback || null,
        sentiment,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update professional stats
    const { data: responses } = await supabase
      .from("nps_responses")
      .select("score, category")
      .eq("professional_id", data.professionalId);

    if (responses && responses.length > 0) {
      const total = responses.length;
      const avg = responses.reduce((s, r) => s + r.score, 0) / total;
      const promoters = responses.filter(r => r.category === "promoter").length;
      const passives = responses.filter(r => r.category === "passive").length;
      const detractors = responses.filter(r => r.category === "detractor").length;
      const nps = Math.round(((promoters - detractors) / total) * 100);

      await supabase.from("nps_professional").upsert({
        professional_id: data.professionalId,
        total_responses: total,
        avg_score: parseFloat(avg.toFixed(1)),
        nps_score: nps,
        promoters,
        passives,
        detractors,
        last_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "professional_id" });
    }

    // Create alert if low score
    if (data.score < 7) {
      let alertType = "low_score";
      let severity = "medium";
      if (data.score <= 3) { alertType = "critical"; severity = "critical"; }
      else if (data.score <= 5) { severity = "high"; }

      await supabase.from("nps_alerts").insert({
        response_id: response.id,
        professional_id: data.professionalId,
        alert_type: alertType,
        severity,
        message: `Paciente deu nota ${data.score}/10. Feedback: "${data.feedback || "Sem comentários"}"`,
        status: "active",
      });
    }

    return new Response(
      JSON.stringify({ success: true, responseId: response.id, category, sentiment }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
