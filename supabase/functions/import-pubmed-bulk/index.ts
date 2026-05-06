import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PUBMED_API_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { requireServiceAuth } from "../_shared/service-auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const query = body.query || "medical cannabis OR cannabidiol OR CBD OR THC OR cannabinoid";
    const max_results = Math.min(body.max_results || 500, 1000);

    const searchUrl = `${PUBMED_API_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${max_results}&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist || [];

    if (ids.length === 0) {
      return new Response(JSON.stringify({ message: "No articles found", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chunkSize = 100;
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunkIds = ids.slice(i, i + chunkSize).join(",");
      const summaryUrl = `${PUBMED_API_BASE}/esummary.fcgi?db=pubmed&id=${chunkIds}&retmode=json`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();
      const result = summaryData?.result || {};
      const uids: string[] = result.uids || [];

      const toInsert = uids.map((uid) => {
        const art = result[uid] || {};
        const yearStr = (art.pubdate || "").split(" ")[0];
        const yearNum = /^\d{4}$/.test(yearStr) ? parseInt(yearStr, 10) : null;
        return {
          title: art.title || `PubMed ${uid}`,
          authors: (art.authors || []).map((a: any) => a.name).join(", ") || null,
          abstract: art.fulljournalname || art.title || "PubMed indexed article",
          doi: art.elocationid || null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
          year: yearNum,
          keywords: art.source ? [art.source] : null,
          source: "pubmed",
        };
      }).filter((a) => a.title);

      if (toInsert.length > 0) {
        const { error, count } = await supabase
          .from("scientific_articles")
          .upsert(toInsert, { onConflict: "url", count: "exact", ignoreDuplicates: false });
        if (error) errors.push(error.message);
        else importedCount += count || toInsert.length;
      }
    }

    return new Response(
      JSON.stringify({ message: `Imported ${importedCount} articles`, count: importedCount, total_found: ids.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[import-pubmed-bulk]", err);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
