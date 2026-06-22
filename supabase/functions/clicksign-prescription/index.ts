import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLICKSIGN_API_URL = "https://app.clicksign.com/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ClickSign API token — required, NEVER fall back to a hardcoded value.
    const CLICKSIGN_API_TOKEN = Deno.env.get("CLICKSIGN_API_TOKEN");
    if (!CLICKSIGN_API_TOKEN) {
      console.error("[clicksign-prescription] CLICKSIGN_API_TOKEN not configured");
      return new Response(
        JSON.stringify({ success: false, error: "ClickSign integration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "upload_and_sign": {
        const { documentPath, contentBase64, doctorEmail, doctorName, patientName } = body;

        if (!documentPath || !contentBase64 || !doctorEmail || !doctorName) {
          return new Response(
            JSON.stringify({ success: false, error: "Campos obrigatórios: documentPath, contentBase64, doctorEmail, doctorName" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Authorization: caller MUST be an admin or a registered doctor.
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!serviceKey) {
          return new Response(JSON.stringify({ success: false, error: "Server misconfigured" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const adminClient = createClient(supabaseUrl, serviceKey);
        const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
        const { data: doctorRow } = await adminClient
          .from("doctors").select("id").eq("user_id", user.id).maybeSingle();
        if (!isAdmin && !doctorRow) {
          return new Response(JSON.stringify({ success: false, error: "Apenas médicos cadastrados podem enviar receitas para assinatura" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If a prescriptionId is supplied, caller MUST be the prescribing doctor (or admin).
        if (body.prescriptionId) {
          const { data: rx } = await adminClient
            .from("prescriptions").select("id, doctor_id").eq("id", body.prescriptionId).maybeSingle();
          if (!rx) {
            return new Response(JSON.stringify({ success: false, error: "Receita não encontrada" }), {
              status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (!isAdmin && (!doctorRow || rx.doctor_id !== doctorRow.id)) {
            return new Response(JSON.stringify({ success: false, error: "Apenas o médico prescritor pode assinar esta receita" }), {
              status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // 1. Upload document
        const uploadRes = await fetch(
          `${CLICKSIGN_API_URL}/documents`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${CLICKSIGN_API_TOKEN}` },
            body: JSON.stringify({
              document: {
                path: `/${documentPath}`,
                content_base64: contentBase64,
                deadline_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                auto_close: true,
                locale: "pt-BR",
                sequence_enabled: false,
              },
            }),
          }
        );

        if (!uploadRes.ok) {
          const err = await uploadRes.text();
          console.error("[CLICKSIGN] Upload error:", err);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao enviar documento: ${err}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const uploadData = await uploadRes.json();
        const documentKey = uploadData.document.key;

        // 2. Create signer
        const signerRes = await fetch(
          `${CLICKSIGN_API_URL}/signers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${CLICKSIGN_API_TOKEN}` },
            body: JSON.stringify({
              signer: {
                email: doctorEmail,
                auth_side: "email",
                name: doctorName,
                has_documentation: false,
                selfie_enabled: false,
                handwritten_enabled: false,
              },
            }),
          }
        );

        if (!signerRes.ok) {
          const err = await signerRes.text();
          console.error("[CLICKSIGN] Signer error:", err);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao criar signatário: ${err}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const signerData = await signerRes.json();
        const signerKey = signerData.signer.key;

        // 3. Link signer to document
        const linkRes = await fetch(
          `${CLICKSIGN_API_URL}/lists`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${CLICKSIGN_API_TOKEN}` },
            body: JSON.stringify({
              list: {
                document_key: documentKey,
                signer_key: signerKey,
                sign_as: "sign",
                message: `Dr(a). ${doctorName}, por favor assine a receita médica do paciente ${patientName || "N/A"} na Planta y Raiz.`,
              },
            }),
          }
        );

        if (!linkRes.ok) {
          const err = await linkRes.text();
          console.error("[CLICKSIGN] Link error:", err);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao vincular signatário: ${err}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const linkData = await linkRes.json();

        // 4. Update prescription status in DB if prescriptionId provided
        if (body.prescriptionId) {
          await adminClient
            .from("prescriptions")
            .update({
              digital_signature: `clicksign:${documentKey}`,
              status: "pending_signature",
            })
            .eq("id", body.prescriptionId);
        }

        return new Response(
          JSON.stringify({
            success: true,
            document_key: documentKey,
            signer_key: signerKey,
            signature_url: linkData.list?.url || null,
            message: `Receita enviada para assinatura digital. O médico ${doctorName} receberá um e-mail da ClickSign.`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check_status": {
        const { documentKey } = body;
        if (!documentKey) {
          return new Response(
            JSON.stringify({ success: false, error: "documentKey obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const statusRes = await fetch(
          `${CLICKSIGN_API_URL}/documents/${documentKey}`,
          { headers: { Accept: "application/json", Authorization: `Bearer ${CLICKSIGN_API_TOKEN}` } }
        );

        if (!statusRes.ok) {
          return new Response(
            JSON.stringify({ success: false, error: "Erro ao consultar status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const statusData = await statusRes.json();
        return new Response(
          JSON.stringify({ success: true, document: statusData.document }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[CLICKSIGN] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
