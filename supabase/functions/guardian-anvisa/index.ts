/**
 * 🛡️ GUARDIÃO ANVISA - Compliance Automático
 * Auditoria de receitas (RDC 660), verificação de CRMs e anúncios
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authError } = await anonClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar se é admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();

    switch (action) {
      case "audit_prescriptions":
        return await auditPrescriptions(supabase);
      case "verify_doctors":
        return await verifyDoctorCRMs(supabase);
      case "full_audit":
        const [prescResult, crmResult] = await Promise.all([
          auditPrescriptionsInternal(supabase),
          verifyDoctorCRMsInternal(supabase),
        ]);
        return new Response(JSON.stringify({
          success: true,
          audit: {
            prescriptions: prescResult,
            doctors: crmResult,
            timestamp: new Date().toISOString(),
            agent: "Guardião ANVISA",
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("❌ [Guardião ANVISA] Erro:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function auditPrescriptionsInternal(supabase: any) {
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("id, doctor_id, patient_id, medications, status, digital_signature, anvisa_code, valid_until, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const issues: any[] = [];
  let compliant = 0;

  for (const rx of prescriptions || []) {
    const problems: string[] = [];

    // RDC 660: Receita deve ter assinatura digital
    if (!rx.digital_signature) {
      problems.push("Sem assinatura digital (RDC 660 Art. 5)");
    }

    // Verificar validade
    if (rx.valid_until && new Date(rx.valid_until) < new Date()) {
      problems.push("Receita expirada");
    }

    // Verificar medicamentos preenchidos
    const meds = rx.medications;
    if (!meds || (Array.isArray(meds) && meds.length === 0)) {
      problems.push("Sem medicamentos listados");
    }

    if (problems.length > 0) {
      issues.push({ prescriptionId: rx.id, doctorId: rx.doctor_id, problems });
    } else {
      compliant++;
    }
  }

  console.log(`🛡️ [Guardião ANVISA] Auditoria: ${compliant} conformes, ${issues.length} com pendências`);
  return { total: (prescriptions || []).length, compliant, issues: issues.length, details: issues.slice(0, 20) };
}

async function verifyDoctorCRMsInternal(supabase: any) {
  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, user_id, crm, crm_state, is_verified, specialty");

  const results: any[] = [];

  for (const doc of doctors || []) {
    // Validação básica de formato CRM
    const crmValid = /^\d{4,7}$/.test(doc.crm?.replace(/\D/g, "") || "");
    const stateValid = /^[A-Z]{2}$/.test(doc.crm_state || "");

    if (!crmValid || !stateValid) {
      results.push({
        doctorId: doc.id,
        crm: doc.crm,
        state: doc.crm_state,
        issue: !crmValid ? "Formato CRM inválido" : "UF inválida",
        action: "Pendente verificação manual",
      });

      // Marcar como não verificado se formato inválido
      if (!crmValid) {
        await supabase.from("doctors").update({ is_verified: false }).eq("id", doc.id);
      }
    }
  }

  console.log(`🛡️ [Guardião ANVISA] CRMs: ${(doctors || []).length} médicos, ${results.length} com pendências`);
  return { total: (doctors || []).length, issues: results.length, details: results };
}

async function auditPrescriptions(supabase: any) {
  const result = await auditPrescriptionsInternal(supabase);
  return new Response(JSON.stringify({ success: true, ...result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyDoctorCRMs(supabase: any) {
  const result = await verifyDoctorCRMsInternal(supabase);
  return new Response(JSON.stringify({ success: true, ...result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
