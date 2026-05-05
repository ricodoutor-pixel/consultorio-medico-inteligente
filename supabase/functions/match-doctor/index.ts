import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authError } = await anonClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { specialty, urgency, symptoms } = await req.json();

    // Uber-style matching algorithm
    // 1. Get all verified, online doctors
    const { data: doctors, error: docError } = await supabase
      .from("doctors")
      .select("id, user_id, specialty, rating, total_consultations, consultation_price, is_online, crm, crm_state, bio")
      .eq("is_verified", true)
      .eq("is_online", true);

    if (docError || !doctors?.length) {
      // Fallback: get any verified doctor
      const { data: fallbackDocs } = await supabase
        .from("doctors")
        .select("id, user_id, specialty, rating, total_consultations, consultation_price, is_online, crm, crm_state, bio")
        .eq("is_verified", true)
        .order("rating", { ascending: false })
        .limit(5);

      if (!fallbackDocs?.length) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Nenhum médico disponível no momento",
          suggestion: "Tente novamente em alguns minutos ou agende para outro horário"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ranked = rankDoctors(fallbackDocs, specialty, urgency);
      return new Response(JSON.stringify({ 
        success: true, 
        doctors: ranked,
        matchType: "scheduled",
        message: "Médicos disponíveis para agendamento"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Score and rank doctors
    const ranked = rankDoctors(doctors, specialty, urgency);

    // 3. Select best match
    const bestMatch = ranked[0];

    // 4. Create pending appointment
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .insert({
        patient_id: authData.user.id,
        doctor_id: bestMatch.id,
        scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min from now
        type: "video",
        status: "matching",
        amount: bestMatch.consultation_price,
        notes: `Auto-match: ${specialty || 'Geral'} | Urgência: ${urgency || 'baixa'} | Sintomas: ${symptoms || 'N/A'}`,
      })
      .select()
      .single();

    return new Response(JSON.stringify({ 
      success: true,
      matchType: "realtime",
      bestMatch: {
        doctorId: bestMatch.id,
        specialty: bestMatch.specialty,
        rating: bestMatch.rating,
        price: bestMatch.consultation_price,
        score: bestMatch._score,
      },
      alternatives: ranked.slice(1, 4).map(d => ({
        doctorId: d.id,
        specialty: d.specialty,
        rating: d.rating,
        price: d.consultation_price,
      })),
      appointmentId: appointment?.id,
      timeout: 300, // 5 minutes to accept
      message: "Médico encontrado! Aguardando confirmação."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-doctor error:", e);
    return new Response(JSON.stringify({ error: "Erro no matching" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function rankDoctors(doctors: any[], specialty?: string, urgency?: string) {
  return doctors.map(doc => {
    let score = 0;
    
    // Specialty match (40% weight)
    if (specialty && doc.specialty?.toLowerCase().includes(specialty.toLowerCase())) {
      score += 40;
    } else {
      score += 10; // General practitioners get base score
    }
    
    // Rating score (30% weight)
    score += (doc.rating || 0) * 6; // max 30 points for 5.0 rating
    
    // Online bonus (20% weight)
    if (doc.is_online) score += 20;
    
    // Experience (10% weight)
    const consultations = doc.total_consultations || 0;
    score += Math.min(consultations / 100, 10); // max 10 points for 1000+ consultations
    
    // Urgency boost for highly rated doctors
    if (urgency === "alta" || urgency === "urgente") {
      if ((doc.rating || 0) >= 4.5) score += 15;
    }
    
    return { ...doc, _score: Math.round(score * 100) / 100 };
  }).sort((a, b) => b._score - a._score);
}
