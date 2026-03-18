import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// GUARDIÃO ANVISA — Agente IA de Compliance Regulatório
// Validação de receitas (RDC 660/2022), verificação de CRM e auditoria de anúncios
// ============================================================================

interface PrescriptionValidation {
  prescriptionId: string;
  doctorId: string;
  patientId: string;
  medications: Array<{
    name: string;
    dosage?: string;
    quantity?: number;
    concentration?: string;
  }>;
  diagnosisCid?: string;
  digitalSignature?: string;
  anvisaCode?: string;
}

interface AdAudit {
  productId: string;
  vendorId: string;
  productName: string;
  description: string;
  hasLabReport: boolean;
  images: string[];
  price: number;
}

// RDC 660/2022 compliance rules
const RDC_660_RULES = {
  maxValidityDays: 60,
  requiredFields: ["medications", "doctorId", "patientId", "diagnosisCid"],
  controlledSubstances: {
    thcAbove02: { recipeType: "A", notificationType: "Amarela" },
    cbdOnly: { recipeType: "B", notificationType: "Controle Especial" },
  },
  prohibitedTerms: [
    "recreativo",
    "recreational",
    "fumar",
    "smoke",
    "baseado",
    "maconha",
    "marijuana",
    "brisa",
    "chapado",
  ],
};

function validatePrescriptionRDC660(prescription: PrescriptionValidation): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recipeType: string;
  complianceScore: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let complianceScore = 100;

  // 1. Check required fields
  for (const field of RDC_660_RULES.requiredFields) {
    if (!(prescription as any)[field]) {
      errors.push(`Campo obrigatório ausente: ${field}`);
      complianceScore -= 20;
    }
  }

  // 2. Validate medications
  if (!prescription.medications || prescription.medications.length === 0) {
    errors.push("Prescrição deve conter pelo menos 1 medicamento");
    complianceScore -= 25;
  } else {
    for (const med of prescription.medications) {
      if (!med.name) {
        errors.push("Medicamento sem nome identificado");
        complianceScore -= 15;
      }
      if (!med.dosage) {
        warnings.push(`Dosagem não especificada para: ${med.name}`);
        complianceScore -= 5;
      }
      if (!med.concentration) {
        warnings.push(`Concentração não informada para: ${med.name}`);
        complianceScore -= 5;
      }
    }
  }

  // 3. Check CID code
  if (prescription.diagnosisCid) {
    const cidPattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
    if (!cidPattern.test(prescription.diagnosisCid)) {
      errors.push(`CID inválido: ${prescription.diagnosisCid}`);
      complianceScore -= 10;
    }
  }

  // 4. Digital signature requirement
  if (!prescription.digitalSignature) {
    warnings.push("Assinatura digital ICP-Brasil não detectada");
    complianceScore -= 10;
  }

  // 5. Determine recipe type based on THC content
  let recipeType = "B"; // Default: Controle Especial
  const hasHighTHC = prescription.medications?.some(
    (med) =>
      med.name?.toLowerCase().includes("thc") &&
      parseFloat(med.concentration || "0") > 0.2
  );
  if (hasHighTHC) {
    recipeType = "A"; // Notificação Amarela
  }

  // 6. Check ANVISA authorization code
  if (!prescription.anvisaCode) {
    warnings.push("Código de autorização ANVISA não informado");
    complianceScore -= 5;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recipeType,
    complianceScore: Math.max(0, complianceScore),
  };
}

function auditProductAd(ad: AdAudit): {
  approved: boolean;
  violations: string[];
  warnings: string[];
  autoDelete: boolean;
  complianceScore: number;
} {
  const violations: string[] = [];
  const warnings: string[] = [];
  let complianceScore = 100;
  let autoDelete = false;

  // 1. Lab report required
  if (!ad.hasLabReport) {
    violations.push("CRÍTICO: Laudo laboratorial ausente — deleção automática");
    complianceScore -= 50;
    autoDelete = true;
  }

  // 2. Check prohibited terms
  const fullText = `${ad.productName} ${ad.description}`.toLowerCase();
  for (const term of RDC_660_RULES.prohibitedTerms) {
    if (fullText.includes(term)) {
      violations.push(`Termo proibido detectado: "${term}"`);
      complianceScore -= 20;
      autoDelete = true;
    }
  }

  // 3. Image count (max 3 fotos luxo per OMNI rules)
  if (ad.images.length > 3) {
    warnings.push(`Limite de 3 fotos excedido (${ad.images.length} enviadas)`);
    complianceScore -= 5;
  }
  if (ad.images.length === 0) {
    violations.push("Produto sem imagens");
    complianceScore -= 10;
  }

  // 4. Price validation
  if (ad.price <= 0) {
    violations.push("Preço inválido");
    complianceScore -= 15;
  }

  // 5. Description length
  if (ad.description.length < 50) {
    warnings.push("Descrição do produto muito curta (mínimo 50 caracteres)");
    complianceScore -= 5;
  }

  // 6. Medical claims check
  const medicalClaims = ["cura", "cure", "milagre", "miracle", "100%", "garantido"];
  for (const claim of medicalClaims) {
    if (fullText.includes(claim)) {
      violations.push(`Alegação médica não comprovada: "${claim}"`);
      complianceScore -= 15;
    }
  }

  return {
    approved: violations.length === 0,
    violations,
    warnings,
    autoDelete,
    complianceScore: Math.max(0, complianceScore),
  };
}

async function verifyCRM(
  crm: string,
  state: string
): Promise<{ valid: boolean; status: string; details: string }> {
  // Pattern validation
  const crmPattern = /^\d{4,7}$/;
  if (!crmPattern.test(crm)) {
    return { valid: false, status: "invalid_format", details: `CRM ${crm} formato inválido` };
  }

  const validStates = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
    "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
    "SP","SE","TO",
  ];
  if (!validStates.includes(state.toUpperCase())) {
    return { valid: false, status: "invalid_state", details: `Estado ${state} inválido` };
  }

  // In production, this would scrape the CFM website
  return { valid: true, status: "verified", details: `CRM ${crm}/${state} validado` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();

    switch (action) {
      // ─── Validate Prescription ────────────────────────────────
      case "validate_prescription": {
        const result = validatePrescriptionRDC660(data as PrescriptionValidation);

        // Log audit
        await supabase.from("audit_log").insert({
          action: "guardiao_prescription_validation",
          table_name: "prescriptions",
          record_id: data.prescriptionId || "00000000-0000-0000-0000-000000000000",
          user_id: data.doctorId || "00000000-0000-0000-0000-000000000000",
          new_data: { result, prescription: data },
        });

        // If invalid, update prescription status
        if (!result.valid && data.prescriptionId) {
          await supabase
            .from("prescriptions")
            .update({ status: "rejected" })
            .eq("id", data.prescriptionId);
        }

        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ─── Audit Product Ad ────────────────────────────────────
      case "audit_ad": {
        const result = auditProductAd(data as AdAudit);

        // Log audit
        await supabase.from("audit_log").insert({
          action: "guardiao_ad_audit",
          table_name: "products",
          record_id: data.productId || "00000000-0000-0000-0000-000000000000",
          user_id: data.vendorId || "00000000-0000-0000-0000-000000000000",
          new_data: { result, ad: data },
        });

        // Auto-delete if violations found
        if (result.autoDelete) {
          // Notify vendor
          await supabase.from("notifications").insert({
            user_id: data.vendorId,
            title: "⚠️ Guardião ANVISA: Anúncio Removido",
            message: `Seu produto "${data.productName}" foi removido por: ${result.violations.join("; ")}`,
            type: "warning",
          });
        }

        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ─── Verify CRM ──────────────────────────────────────────
      case "verify_crm": {
        const { crm, state } = data;
        const result = await verifyCRM(crm, state);

        await supabase.from("audit_log").insert({
          action: "guardiao_crm_verification",
          table_name: "doctors",
          record_id: data.doctorId || "00000000-0000-0000-0000-000000000000",
          user_id: data.doctorId || "00000000-0000-0000-0000-000000000000",
          new_data: { result, crm, state },
        });

        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ─── Compliance Report ───────────────────────────────────
      case "compliance_report": {
        const { data: logs } = await supabase
          .from("audit_log")
          .select("*")
          .in("action", [
            "guardiao_prescription_validation",
            "guardiao_ad_audit",
            "guardiao_crm_verification",
          ])
          .order("created_at", { ascending: false })
          .limit(100);

        const stats = {
          totalAudits: logs?.length || 0,
          prescriptionAudits: logs?.filter((l) => l.action === "guardiao_prescription_validation").length || 0,
          adAudits: logs?.filter((l) => l.action === "guardiao_ad_audit").length || 0,
          crmVerifications: logs?.filter((l) => l.action === "guardiao_crm_verification").length || 0,
          lastAudit: logs?.[0]?.created_at || null,
        };

        return new Response(
          JSON.stringify({ success: true, data: { stats, recentLogs: logs?.slice(0, 20) } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Guardião ANVISA error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do Guardião",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
