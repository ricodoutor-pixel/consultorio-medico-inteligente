// 🌿 Planta y Raiz — Liberação de consulta APÓS pagamento aprovado.
// Regra oficial (2026-09): em TODOS os fluxos o pagamento vem primeiro.
// Ordem: pagamento (Mercado Pago) → triagem (Enfª Brisa) → consulta.
//
// Ações:
//  - "unlock": valida na API do Mercado Pago se o external_reference está
//    aprovado, cria (idempotente) o appointment já PAGO e devolve os dados.
//  - "triage": grava o resumo da triagem nas notas do atendimento.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SKU_TYPE: Record<string, { type: string; amount: number; minutes: number }> = {
  consulta_chat: { type: "chat", amount: 100, minutes: 40 },
  consulta_video: { type: "video", amount: 150, minutes: 40 },
  retorno_consulta: { type: "chat", amount: 90, minutes: 20 },
  consulta_premium: { type: "video", amount: 180, minutes: 60 },
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: authData, error: authErr } = await anon.auth.getUser();
    if (authErr || !authData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = authData.user.id;

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "unlock");

    // ── Grava a triagem no atendimento ────────────────────────────────────
    if (action === "triage") {
      const appointmentId = String(body?.appointment_id ?? "");
      const triage = body?.triage ?? {};
      if (!appointmentId) return json({ error: "appointment_id obrigatório" }, 400);

      const summary = Object.entries(triage as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join("\n");

      const { error } = await svc
        .from("appointments")
        .update({ notes: `TRIAGEM ENFª BRISA\n${summary}`.slice(0, 4000) })
        .eq("id", appointmentId)
        .eq("patient_id", uid);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // ── Libera consulta com pagamento aprovado ────────────────────────────
    const ref = String(body?.external_reference ?? "");
    const sku = String(body?.sku ?? "");
    const doctorId = typeof body?.doctorId === "string" ? body.doctorId : null;
    const plan = SKU_TYPE[sku];
    if (!plan) return json({ error: "SKU inválido" }, 400);
    if (!ref || !ref.startsWith(`${sku}:`) || !ref.includes(`:${uid}:`)) {
      return json({ active: false, reason: "reference_invalid" });
    }

    // Idempotência: já existe atendimento criado para este pagamento?
    const { data: existing } = await svc
      .from("appointments")
      .select("id, type, doctor_id, amount, notes")
      .eq("payment_id", ref)
      .eq("patient_id", uid)
      .maybeSingle();
    if (existing) {
      return json({
        active: true,
        appointment_id: existing.id,
        type: existing.type,
        doctor_id: existing.doctor_id,
        amount: existing.amount,
        triage_done: Boolean(existing.notes),
      });
    }

    const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!token) return json({ error: "Mercado Pago não configurado" }, 500);

    const search = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(ref)}&sort=date_created&criteria=desc`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!search.ok) {
      console.error("[consulta-unlock] MP", search.status, await search.text());
      return json({ active: false, reason: "payment_lookup_failed" });
    }
    const results = (await search.json())?.results ?? [];
    const approved = (results as Array<Record<string, unknown>>).find(
      (p) => String(p.status) === "approved",
    );
    if (!approved) {
      return json({
        active: false,
        reason: results.length > 0 ? "payment_pending" : "payment_not_found",
      });
    }

    // O profissional escolhido pelo paciente tem prioridade absoluta.
    // O roteamento automático só entra quando o paciente não escolheu ninguém.
    let assignedDoctor = doctorId;
    if (!assignedDoctor) {
      try {
        const { data: routed } = await svc.rpc("route_consultation_doctor", { _specialty: null });
        const first = Array.isArray(routed) ? routed[0] : null;
        if (first?.doctor_id) assignedDoctor = first.doctor_id;
      } catch (e) {
        console.warn("[consulta-unlock] routing falhou", e);
      }
    }
    if (!assignedDoctor) return json({ active: false, reason: "no_doctor_available" });

    const amount = Number(approved.transaction_amount ?? plan.amount);
    const { data: appt, error: insErr } = await svc
      .from("appointments")
      .insert({
        patient_id: uid,
        doctor_id: assignedDoctor,
        scheduled_at: new Date().toISOString(),
        type: plan.type,
        amount,
        duration_minutes: plan.minutes,
        status: "scheduled",
        payment_status: "paid",
        payment_id: ref,
      })
      .select("id, type, doctor_id, amount")
      .single();

    if (insErr || !appt) {
      console.error("[consulta-unlock] insert", insErr);
      return json({ error: insErr?.message ?? "Falha ao abrir atendimento" }, 500);
    }

    // Convite da Enfª Brisa: o profissional tem 60s para aceitar; se recusar ou
    // não responder, a consulta passa ao próximo de plantão (não bloqueia a liberação)
    try {
      await svc.functions.invoke("consultation-offer", {
        body: { action: "dispatch", appointment_id: appt.id },
      });
    } catch { /* aviso é best-effort */ }


    return json({
      active: true,
      appointment_id: appt.id,
      type: appt.type,
      doctor_id: appt.doctor_id,
      amount: appt.amount,
      triage_done: false,
    });
  } catch (e) {
    console.error("[consulta-unlock] erro", e);
    return json({ error: "Erro interno" }, 500);
  }
});
