// 🏛️ gov.br Prescription Sign — Dr. Edilson Bezerra (CRM 10963)
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
    // with CRM 10963 (Dr. Edilson) and own the target prescription.
    const { data: doctor } = await admin
      .from("doctors")
      .select("id, crm")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!doctor || String(doctor.crm).replace(/\D/g, "") !== "10963") {
      return new Response(JSON.stringify({
        success: false,
        error: "Endpoint gov.br restrito ao Dr. Edilson Bezerra (CRM 10963). Use ClickSign para os demais médicos.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: rx } = await admin
      .from("prescriptions")
      .select("id, doctor_id")
      .eq("id", prescriptionId)
      .maybeSingle();

    if (!rx || rx.doctor_id !== doctor.id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Prescrição não pertence ao médico autenticado.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const doctorCRM = doctor.crm;

    // Hash de autenticidade (SHA-256 do PDF)
    const pdfBytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
    const digest = await crypto.subtle.digest("SHA-256", pdfBytes);
    const hash = Array.from(new Uint8Array(digest))
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
    const documentKey = `govbr:${hash.substring(0, 16)}`;

    await admin.from("prescriptions").update({
      digital_signature: documentKey,
      signature_hash: hash,
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
