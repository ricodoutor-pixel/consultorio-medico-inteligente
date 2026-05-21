// One-shot WhatsApp test sender. Service-role auth or BRISA_CEO_SECRET_KEY token.
import { requireServiceAuth } from "../_shared/service-auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const unauth = requireServiceAuth(req, cors);
  if (unauth) return unauth;

  const { phone, message } = await req.json().catch(() => ({}));
  if (!phone || !message) {
    return new Response(JSON.stringify({ error: "phone and message required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE") || "Brisa_CEO";
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Evolution not configured" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const clean = String(phone).replace(/\D/g, "");
  const r = await fetch(`${url}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ number: clean, text: message, delay: 800, linkPreview: true }),
  });
  const body = await r.text();
  return new Response(JSON.stringify({ ok: r.ok, status: r.status, body }), {
    status: r.ok ? 200 : 502,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
