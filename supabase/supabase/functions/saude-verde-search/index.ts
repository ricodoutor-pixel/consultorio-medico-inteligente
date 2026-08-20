import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const url = new URL(req.url);
    const specialty = url.searchParams.get("specialty");
    const city = url.searchParams.get("city");
    const category = url.searchParams.get("category");
    const country = url.searchParams.get("country") || "BR";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

    let query = supabase
      .from("saude_verde_partners_public")
      .select("*")
      .eq("is_active", true)
      .eq("country", country)
      .order("rating", { ascending: false })
      .limit(limit);

    if (city) query = query.ilike("city", `%${city}%`);
    if (category) query = query.eq("category", category);
    if (specialty) query = query.contains("available_specialties", [specialty]);

    const { data: partners, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, partners: partners || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
