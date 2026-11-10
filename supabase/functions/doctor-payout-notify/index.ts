// Avisa o médico por WhatsApp (uma única vez) que o pagamento da consulta foi liberado.
// Chamado pelo banco logo após a avaliação do paciente; só age sobre registros já liberados.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { buildDoctorPayoutAvailableMessage, notifyRecipientOnce } from "../_shared/payment-notify.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const auditId = String(body?.audit_id ?? "");
  const testMode = Boolean(body?.test_mode);
  if (!/^[0-9a-f-]{36}$/i.test(auditId)) return json({ error: "audit_id inválido" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: audit } = await svc.from("consultation_credit_audit")
    .select("id, professional_id, amount, status, payout_status").eq("id", auditId).maybeSingle();
  const isReleased = audit && (audit.payout_status === "released" || audit.status === "released");
  if (!isReleased) return json({ ok: false, reason: "not_released" });

  const { data: doc } = await svc.from("doctors").select("user_id").eq("id", audit.professional_id).maybeSingle();
  const doctorUserId = doc?.user_id || audit.professional_id;
  if (!doctorUserId) return json({ ok: false, reason: "doctor_not_found" });
  const { data: prof } = await svc.from("profiles").select("full_name, phone").eq("id", doctorUserId).maybeSingle();
  if (!prof?.phone) return json({ ok: false, reason: "no_phone" });

  const text = buildDoctorPayoutAvailableMessage();
  const sent = await notifyRecipientOnce(svc, {
    key: `payout:${audit.id}:doctor`,
    phone: String(prof.phone),
    service: "Aviso ao médico — pagamento disponível para saque",
    text,
    simulateOnly: testMode,
  });
  return json({ ok: true, sent, text, simulated: testMode });
});

