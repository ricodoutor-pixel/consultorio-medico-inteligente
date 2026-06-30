// One-shot helper to ping admin WhatsApp via Evolution API.
// Public (no auth) — safe because it only sends a fixed message to ADMIN_WHATSAPP.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let url = Deno.env.get("EVOLUTION_API_URL") || "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const key = Deno.env.get("EVOLUTION_API_KEY") || "";
  const instance = Deno.env.get("EVOLUTION_INSTANCE") || "brisa-bot-v2";
  const number = (Deno.env.get("ADMIN_WHATSAPP") || "5511987131241").replace(/\D/g, "");
  const text = "🌿 Enf Brisa ON ✅ — Sistema 100% operacional. Produção liberada.";

  const endpoint = `${url.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(instance)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number, text }),
      signal: ctrl.signal,
    });
    const body = await r.text().catch(() => "");
    return new Response(
      JSON.stringify({ ok: r.ok, status: r.status, endpoint, instance, number, body: body.slice(0, 800) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), endpoint }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } finally {
    clearTimeout(t);
  }
});
