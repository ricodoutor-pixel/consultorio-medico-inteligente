// PubMed RAG Search — busca full-text em scientific_articles para a Brisa
// citar evidências reais por condição. Sem chave externa.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Permite anon (RAG é público para Brisa). Apenas valida input.
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const query = String(body.query ?? url.searchParams.get("q") ?? "").slice(0, 200).trim();
    const limit = Math.min(Number(body.limit ?? 5), 10);

    if (!query || query.length < 3) {
      return new Response(JSON.stringify({ error: "query (min 3 chars) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase.rpc("search_scientific_articles", {
      query_text: query, limit_count: limit,
    });
    if (error) throw error;

    const cleaned = (data ?? []).map((a: any) => ({
      title: a.title,
      authors: a.authors,
      year: a.year,
      url: a.url,
      doi: a.doi,
      abstract: (a.abstract || "").slice(0, 500),
    }));

    return new Response(JSON.stringify({ query, results: cleaned, count: cleaned.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[pubmed-search]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
