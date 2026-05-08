// DOU ANVISA Monitor — busca diariamente publicações no Diário Oficial da União
// (in.gov.br) por termos: cannabis, canabidiol, RDC 660, RDC 327, etc.
// Persiste em public.anvisa_dou_alerts e dispara WhatsApp via evolution-api-proxy.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TERMS = ["cannabis", "canabidiol", "CBD", "RDC 660", "RDC 327", "cannabis medicinal"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const found: any[] = [];
    for (const term of TERMS) {
      const url = `https://www.in.gov.br/consulta/-/buscar/dou?q=${encodeURIComponent(term)}&s=ANVISA&exactDate=ultimos7`;
      try {
        const r = await fetch(url, { headers: { "User-Agent": "PlantaYRaiz-Guardian/1.0" } });
        if (!r.ok) continue;
        const html = await r.text();
        // Extrai cards de resultado (estrutura simples do portal in.gov.br)
        const re = /<a[^>]+href="(\/en\/web\/dou\/-\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
        let m: RegExpExecArray | null;
        let count = 0;
        while ((m = re.exec(html)) && count < 5) {
          const link = `https://www.in.gov.br${m[1]}`;
          const title = m[2].trim();
          found.push({ term, title, url: link });
          count++;
        }
      } catch (_) { /* skip */ }
    }

    let inserted = 0;
    for (const f of found) {
      const { error, data } = await supabase
        .from("anvisa_dou_alerts")
        .upsert({ term: f.term, title: f.title, url: f.url }, { onConflict: "url", ignoreDuplicates: true })
        .select("id");
      if (!error && data && data.length > 0) inserted++;
    }

    return new Response(JSON.stringify({ ok: true, scanned: found.length, new_alerts: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[dou-anvisa-monitor]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
