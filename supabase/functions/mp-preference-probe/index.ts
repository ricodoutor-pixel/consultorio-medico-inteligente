// TEMPORARY diagnostic: creates a real Mercado Pago preference (R$1) to verify credentials.
// Returns only HTTP status and whether an init_point was produced. Deleted after use.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ title: "Probe", quantity: 1, unit_price: 1, currency_id: "BRL" }],
      external_reference: "probe",
    }),
  });
  let body: Record<string, unknown> = {};
  try {
    body = await r.json();
  } catch (_) {
    body = {};
  }
  return new Response(
    JSON.stringify({
      status: r.status,
      has_init_point: Boolean(body.init_point),
      collector_id: body.collector_id ?? null,
      message: r.ok ? null : body.message ?? null,
      token_prefix: token.slice(0, 8),
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
  );
});
