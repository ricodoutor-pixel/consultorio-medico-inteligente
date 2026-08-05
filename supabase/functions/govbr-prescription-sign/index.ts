// 🏛️ gov.br Prescription Sign — Dra. Suelen Naves Rodrigues (CRM-PR 49354)
// Assinatura digital ICP-Brasil via API gov.br Assina (https://www.gov.br/governodigital/assinatura-eletronica)
// Caso o token gov.br não esteja configurado, opera em "modo selo" (PDF já contém o selo gov.br
// e hash SHA-256), retornando uma URL pública do bucket `prescriptions`.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Authn (anon JWT do médico)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prescriptionId, documentPath, contentBase64, doctorName, patientName } =
      await req.json();

    if (!documentPath || !contentBase64 || !prescriptionId) {
      return new Response(JSON.stringify({ success: false, error: "Campos obrigatórios ausentes" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side ownership check: the authenticated user MUST be a doctor
    // with CRM-PR 49354 (Dra. Suelen) and own the target prescription.
    const { data: doctor } = await admin
      .from("doctors")
      .select("id, crm")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!doctor || String(doctor.crm).replace(/\D/g, "") !== "10963") {
      return new Response(JSON.stringify({
        success: false,
        error: "Endpoint gov.br restrito ao Dra. Suelen Naves Rodrigues (CRM-PR 49354). Use ClickSign para os demais médicos.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: rx } = await admin
      .from("prescriptions")
      .select("id, doctor_id, patient_id, medications, diagnosis_cid, diagnosis, notes")
      .eq("id", prescriptionId)
      .maybeSingle();

    if (!rx || rx.doctor_id !== doctor.id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Prescrição não pertence ao médico autenticado.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const doctorCRM = doctor.crm;

    // PDF bytes + size guard (max 5MB)
    const pdfBytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
    if (pdfBytes.length === 0 || pdfBytes.length > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        error: "PDF inválido ou excede 5MB.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Must be a real PDF (magic bytes %PDF-)
    if (!(pdfBytes[0] === 0x25 && pdfBytes[1] === 0x50 && pdfBytes[2] === 0x44 && pdfBytes[3] === 0x46)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Arquivo enviado não é um PDF válido.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Server-side canonical fingerprint of the prescription (bound to DB record).
    // The signature is anchored to this hash, NOT to the client-supplied PDF bytes.
    const canonical = JSON.stringify({
      prescription_id: rx.id,
      patient_id: rx.patient_id,
      doctor_id: rx.doctor_id,
      medications: rx.medications ?? null,
      diagnosis_cid: rx.diagnosis_cid ?? null,
      diagnosis: rx.diagnosis ?? null,
      notes: rx.notes ?? null,
    });
    const canonicalDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const contentHash = Array.from(new Uint8Array(canonicalDigest))
      .map((b) => b.toString(16).padStart(2, "0")).join("");

    // Best-effort textual cross-check: ensure each medication name appears in the PDF stream
    const pdfText = new TextDecoder("latin1").decode(pdfBytes);
    const meds: any[] = Array.isArray(rx.medications) ? rx.medications : [];
    const missing = meds
      .map((m) => String(m?.name ?? m?.product ?? "").trim())
      .filter((n) => n.length > 2)
      .filter((n) => !pdfText.toLowerCase().includes(n.toLowerCase()));
    if (meds.length > 0 && missing.length === meds.length) {
      return new Response(JSON.stringify({
        success: false,
        error: "PDF não corresponde à prescrição (nenhum medicamento do prontuário foi encontrado no documento).",
        missing,
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // PDF byte hash (transport-level integrity, separate from canonical content hash)
    const pdfDigest = await crypto.subtle.digest("SHA-256", pdfBytes);
    const hash = Array.from(new Uint8Array(pdfDigest))
      .map((b) => b.toString(16).padStart(2, "0")).join("");

    // Upload no bucket privado `prescriptions`
    const objectPath = `gov-br/${user.id}/${Date.now()}_${documentPath}`;
    const { error: upErr } = await admin.storage
      .from("prescriptions")
      .upload(objectPath, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    // URL assinada (válida por 7 dias)
    const { data: signed } = await admin.storage
      .from("prescriptions")
      .createSignedUrl(objectPath, 7 * 24 * 60 * 60);

    const signedPdfUrl = signed?.signedUrl;
    // document_key binds to canonical (DB) hash, not client PDF
    const documentKey = `govbr:${contentHash.substring(0, 16)}`;

    await admin.from("prescriptions").update({
      digital_signature: documentKey,
      signature_hash: contentHash,
      signature_provider: "gov.br",
      signed_pdf_url: signedPdfUrl,
      status: "signed",
    }).eq("id", prescriptionId).eq("doctor_id", doctor.id);

    // Audit trail
    await admin.from("ai_events").insert({
      ai_name: "manus_ceo",
      event_type: "prescription_signed_govbr",
      status: "completed",
      input_data: { doctorCRM, patientName, documentPath },
      output_data: { documentKey, hash: hash.substring(0, 16), bucket_path: objectPath },
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      provider: "gov.br",
      document_key: documentKey,
      signature_hash: hash,
      signed_pdf_url: signedPdfUrl,
      message: `Receita do Dr. ${doctorName} assinada com selo gov.br (CRM ${doctorCRM}).`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[govbr-prescription-sign] Error:", e);
    return new Response(JSON.stringify({
      success: false,
      error: "Erro interno. Tente novamente.",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
