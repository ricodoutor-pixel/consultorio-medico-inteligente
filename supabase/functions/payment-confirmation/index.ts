import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { confirmedProviderPayment, ownsProviderPayment } from "../_shared/payment-confirmation.ts";

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (req.method !== "POST") return reply({ error: "Método inválido" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!url || !anon || !token) return reply({ error: "Confirmação indisponível" }, 503);
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return reply({ error: "Entre na sua conta" }, 401);
  try {
    const client = createClient(url, anon);
    const { data, error } = await client.auth.getUser(auth.slice(7));
    if (error || !data.user) return reply({ error: "Entre na sua conta" }, 401);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return reply({ error: "Pagamento inválido" }, 400);
    const paymentId = body.payment_id == null ? "" : String(body.payment_id);
    const ref = body.external_reference == null ? "" : String(body.external_reference);
    if ((paymentId && !/^\d{1,30}$/.test(paymentId)) || (ref && (ref.length > 255 || !/^[\w:.-]+$/.test(ref))) || (!paymentId && !ref)) {
      return reply({ error: "Pagamento inválido" }, 400);
    }
    const endpoint = paymentId
      ? `https://api.mercadopago.com/v1/payments/${paymentId}`
      : `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(ref)}&sort=date_created&criteria=desc&limit=5`;
    const result = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
    if (!result.ok) return reply({ error: "Não foi possível conferir o pagamento" }, result.status === 404 ? 404 : 503);
    const payload = await result.json();
    const payments: Record<string, unknown>[] = paymentId ? [payload] : (Array.isArray(payload.results) ? payload.results : []);
    const owned = payments.filter(payment => ownsProviderPayment(payment, data.user.id) && (!ref || payment.external_reference === ref));
    if (!owned.length) return reply({ status: "unconfirmed" });
    const payment = owned.find(item => confirmedProviderPayment(item, data.user.id, ref)) || owned[0];
    return reply({ status: confirmedProviderPayment(payment, data.user.id, ref) ? "approved" : "pending",
      payment_method: payment.payment_method_id === "pix" ? "pix" : "other",
      external_reference: payment.external_reference,
    });
  } catch {
    return reply({ error: "Não foi possível conferir o pagamento" }, 503);
  }
});