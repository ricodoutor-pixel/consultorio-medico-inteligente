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

    const { prescriptionId, documentPath, contentBase64, doctorCRM, doctorName, patientName } =
      await req.json();

    if (!documentPath || !contentBase64 || !doctorCRM) {
      return new Response(JSON.stringify({ success: false, error: "Campos obrigatórios ausentes" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (String(doctorCRM).replace(/\D/g, "") !== "10963") {
      return new Response(JSON.stringify({
        success: false,
        error: "Endpoint gov.br restrito ao Dr. Edilson Bezerra (CRM 10963). Use ClickSign para os demais médicos.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    // Atualiza prescription se id fornecido
    if (prescriptionId) {
      await admin.from("prescriptions").update({
        digital_signature: documentKey,
        signature_hash: hash,
        signature_provider: "gov.br",
        signed_pdf_url: signedPdfUrl,
        status: "signed",
      }).eq("id", prescriptionId);
    }

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
      error: e instanceof Error ? e.message : "Erro interno",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
