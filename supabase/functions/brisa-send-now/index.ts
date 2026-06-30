import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  const instance = "brisa-bot-v2";
  const number = "5511987131241";
  const text = "🌿 Enf Brisa ON ✅\n\nPlanta y Raiz 100% operacional.\nTeste de produção bem-sucedido — " + new Date().toLocaleString("pt-BR");

  const endpoints = [
    `${url}/message/sendText/${encodeURIComponent(instance)}`,
  ];

  const results: any[] = [];
  for (const ep of endpoints) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key },
        body: JSON.stringify({ number, text }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const body = await r.text();
      results.push({ ep, status: r.status, body: body.slice(0, 500) });
      if (r.ok) break;
    } catch (e) {
      results.push({ ep, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return new Response(JSON.stringify({ instance, number, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
