// Submits sitemap to Google Search Console via connector gateway
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SITE = "https://plantayraiz.com.br/";
const SITEMAP = "https://plantayraiz.com.br/sitemap.xml";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GSC_API_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!LOVABLE_API_KEY || !GSC_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "missing_credentials" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const siteEnc = encodeURIComponent(SITE);
  const feedEnc = encodeURIComponent(SITEMAP);
  const url = `${GATEWAY}/webmasters/v3/sites/${siteEnc}/sitemaps/${feedEnc}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_API_KEY,
    },
  });

  const body = await res.text();
  return new Response(JSON.stringify({
    ok: res.ok, status: res.status, sitemap: SITEMAP, response: body.slice(0, 500),
  }), { status: res.ok ? 200 : res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
