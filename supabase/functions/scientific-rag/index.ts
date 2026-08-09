// Scientific RAG — refatorado para Lovable AI Gateway (Gemini).
// Não usa mais OpenAI embeddings. Faz busca full-text via RPC search_scientific_articles
// e opcionalmente sintetiza um resumo clínico com Lovable AI (Gemini Flash).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: signed-in user OR service-role bearer
  const authHeader = req.headers.get("Authorization") || "";
  const isService = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
  if (!isService) {
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (error || !data?.claims) throw new Error("invalid");
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const condition = String(body.condition ?? body.query ?? "").slice(0, 200).trim();
    const summarize = Boolean(body.summarize ?? false);
    const limit = Math.min(Number(body.limit ?? 3), 8);

    if (!condition || condition.length < 3) {
      return new Response(JSON.stringify({ error: "condition (min 3 chars) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Busca full-text gratuita via RPC (sem embeddings, sem OpenAI)
    const { data: articles, error } = await supabase.rpc("search_scientific_articles", {
      query_text: condition, limit_count: limit,
    });
    if (error) throw error;

    const cleaned = (articles ?? []).map((a: any) => ({
      title: a.title, authors: a.authors, year: a.year,
      url: a.url, doi: a.doi, abstract: (a.abstract || "").slice(0, 500),
    }));

import { GEMINI_PRIMARY_MODEL } from "../_shared/gemini.ts";

// 2) (Opcional) sintetizar resumo clínico via Lovable AI Gateway
    let summary: string | null = null;
    if (summarize && GEMINI_API_KEY && cleaned.length > 0) {
      try {
        const ctx = cleaned.map((a, i) =>
          `[${i + 1}] ${a.title} (${a.year || "s/d"}) — ${a.abstract}`).join("\n\n");
        const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: GEMINI_PRIMARY_MODEL,
            messages: [
              { role: "system", content: "Você é um assistente clínico. Resuma evidências em 3 frases curtas, em PT-BR, citando [n]." },
              { role: "user", content: `Condição: ${condition}\n\nEvidências:\n${ctx}` },
            ],
          }),
        });
        if (r.ok) {
          const j = await r.json();
          summary = j.choices?.[0]?.message?.content || null;
        }
      } catch (_) { /* opcional */ }
    }

    return new Response(JSON.stringify({ success: true, condition, articles: cleaned, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[scientific-rag] error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
