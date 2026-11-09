// Avisa o médico por WhatsApp (uma única vez) que o pagamento da consulta foi liberado.
// Chamado pelo banco logo após a avaliação do paciente; só age sobre registros já liberados.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { notifyRecipientOnce } from "../_shared/payment-notify.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const auditId = String(body?.audit_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(auditId)) return json({ error: "audit_id inválido" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: audit } = await svc.from("consultation_credit_audit")
    .select("id, professional_id, amount, payout_status").eq("id", auditId).maybeSingle();
  if (!audit || audit.payout_status !== "released") return json({ ok: false, reason: "not_released" });

  const { data: doc } = await svc.from("doctors").select("user_id").eq("id", audit.professional_id).maybeSingle();
  if (!doc?.user_id) return json({ ok: false, reason: "doctor_not_found" });
  const { data: prof } = await svc.from("profiles").select("full_name, phone").eq("id", doc.user_id).maybeSingle();
  if (!prof?.phone) return json({ ok: false, reason: "no_phone" });

  const value = Number(audit.amount ?? 0).toFixed(2).replace(".", ",");
  const sent = await notifyRecipientOnce(svc, {
    key: `payout:${audit.id}:doctor`,
    phone: String(prof.phone),
    service: "Aviso ao médico — pagamento liberado",
    text: `🌱 *Planta y Raiz — pagamento liberado*\n\n${prof.full_name ?? "Doutor(a)"}, o paciente avaliou a consulta e R$ ${value} já estão no seu saldo.\n\nPara receber no seu Pix cadastrado, toque em *Sacar* no Consultório Médico: https://www.plantayraiz.com.br/consultorio\n\n— Enfª Brisa 💚`,
  });
  return json({ ok: true, sent });
});
