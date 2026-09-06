// 📥 Recebe PDF assinado externamente (ITI gov.br) pelo médico Plano Free.
// - Valida JWT (médico dono da prescrição)
// - Calcula hash SHA-256 do arquivo assinado
// - Faz upload no bucket `prescriptions` (gov-br-free/{user_id}/...)
// - Atualiza prescriptions.status='signed', signature_provider='iti_govbr_free'
// - Dispara Enfª Brisa (Evolution API) para o paciente

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

    const { prescriptionId, filename, contentBase64, patient, doctor, appointmentId } =
      await req.json();
    if (!prescriptionId || !contentBase64 || !filename) {
      return new Response(JSON.stringify({ success: false, error: "Campos obrigatórios ausentes" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirma que o usuário é médico dono dessa prescrição
    const { data: doc } = await admin
      .from("doctors").select("id").eq("user_id", user.id).maybeSingle();
    if (!doc) {
      return new Response(JSON.stringify({ success: false, error: "Apenas médicos" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: rx } = await admin
      .from("prescriptions").select("id, doctor_id").eq("id", prescriptionId).maybeSingle();
    if (!rx || rx.doctor_id !== doc.id) {
      return new Response(JSON.stringify({ success: false, error: "Prescrição não pertence ao médico" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash do arquivo assinado (auditoria de integridade)
    const pdfBytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
    const digest = await crypto.subtle.digest("SHA-256", pdfBytes);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0")).join("");

    const objectPath = `iti-free/${user.id}/${Date.now()}_${filename}`;
    const { error: upErr } = await admin.storage
      .from("prescriptions")
      .upload(objectPath, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    const { data: signed } = await admin.storage
      .from("prescriptions")
      .createSignedUrl(objectPath, 7 * 24 * 60 * 60);
    const signedPdfUrl = signed?.signedUrl;

    await admin.from("prescriptions").update({
      digital_signature: `iti:${hash.substring(0, 16)}`,
      signature_hash: hash,
      signature_provider: "iti_govbr_free",
      signed_pdf_url: signedPdfUrl,
      status: "signed",
      signature_date: new Date().toISOString(),
    }).eq("id", prescriptionId);

    // Dispara Enfª Brisa (Evolution API) — chamada server-to-server
    try {
      await admin.functions.invoke("brisa-prescription-dispatch", {
        body: {
          patient_phone: patient?.whatsapp,
          patient_name: patient?.name,
          doctor_name: doctor?.name,
          prescription_url: signedPdfUrl,
          appointment_id: appointmentId,
          prescription_id: prescriptionId,
        },
      });
    } catch (e) {
      console.error("[prescription-upload-signed] brisa dispatch error:", e);
    }

    await admin.from("ai_events").insert({
      ai_name: "manus_ceo",
      event_type: "free_signature",
      status: "completed",
      input_data: { prescriptionId, doctorCRM: doctor?.crm, patientName: patient?.name },
      output_data: { hash: hash.substring(0, 16), bucket_path: objectPath },
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      provider: "iti_govbr_free",
      signature_hash: hash,
      signed_pdf_url: signedPdfUrl,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[prescription-upload-signed] error:", e);
    return new Response(JSON.stringify({ success: false, error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
