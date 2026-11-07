// Reenvia o aviso de pagamento confirmado para pedidos de Orientação Técnica aprovados
// cujo aviso falhou. Acesso: admin (JWT) ou chamada interna de serviço.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { notifyPaymentConfirmedOnce } from "../_shared/payment-notify.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({ external_reference: z.string().min(5).max(200) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const admin = createClient(url, service);

  const internal = token === service || requireServiceAuth(req, corsHeaders) === null;
  if (!internal) {
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: role } = await admin.from("user_roles").select("role")
      .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "forbidden" }, 403);
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const ref = parsed.data.external_reference;

  const { data: order } = await admin.from("orientacao_tecnica_orders")
    .select("external_reference, status, amount, mp_payment_id, user_id").eq("external_reference", ref).maybeSingle();
  if (!order) return json({ error: "order_not_found" }, 404);
  if (order.status !== "approved") return json({ error: "order_not_paid", status: order.status }, 409);

  const { data: prof } = await admin.from("profiles").select("full_name").eq("id", order.user_id).maybeSingle();
  const ok = await notifyPaymentConfirmedOnce(admin, {
    externalReference: ref,
    patientName: (prof as any)?.full_name || "Paciente",
    amountBrl: Number(order.amount),
    service: "Orientação Técnica",
    paymentId: order.mp_payment_id,
  }, "manual_resend");

  const { data: log } = await admin.from("payment_notify_log")
    .select("status, attempts, http_status, error, sent_at").eq("external_reference", ref).maybeSingle();
  const { data: attempts } = await admin.from("payment_notify_attempts")
    .select("attempt_no, trigger, status, http_status, error, created_at")
    .eq("external_reference", ref).order("attempt_no");
  return json({ ok, log, attempts }, ok ? 200 : 502);
});
