import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KYCRequest {
  doctor_id: string;
  crm: string;
  crm_state: string;
  document_type: "cpf" | "passport" | "rne";
  document_number: string;
  full_name: string;
}

interface CRMResult {
  valid: boolean;
  name?: string;
  status?: string;
  specialty?: string;
  error?: string;
}

// CPF validation (digit verifier algorithm)
function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

// Passport validation (basic format)
function validatePassport(passport: string): boolean {
  return /^[A-Z]{1,2}\d{6,9}$/i.test(passport.replace(/\s/g, ""));
}

// RNE validation (Brazilian foreign registration)
function validateRNE(rne: string): boolean {
  return /^[A-Z]\d{6}[A-Z0-9]$/i.test(rne.replace(/[\s-]/g, ""));
}

// Real CRM lookup via Brasil API (CFM proxy)
async function checkCRM(crm: string, uf: string): Promise<CRMResult> {
  const crmNumber = crm.replace(/\D/g, "");
  const ufUpper = uf.toUpperCase();

  if (crmNumber.length < 4 || crmNumber.length > 7) {
    return { valid: false, error: "Formato de CRM inválido" };
  }

  const validUFs = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
    "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
    "SP","SE","TO"
  ];
  if (!validUFs.includes(ufUpper)) {
    return { valid: false, error: "UF inválida" };
  }

  try {
    const resp = await fetch(
      `https://brasilapi.com.br/api/cfm/v1/${crmNumber}/${ufUpper}`,
      { signal: AbortSignal.timeout(7000) }
    );

    if (!resp.ok) {
      // Couldn't reach CFM — do NOT auto-approve. Mark as pending manual review.
      console.warn(`[KYC] Brasil API CFM returned ${resp.status} for ${crmNumber}/${ufUpper}`);
      return { valid: false, status: "pending_manual_review", error: "Não foi possível confirmar o CRM no CFM agora — encaminhado para revisão manual" };
    }

    const j: any = await resp.json().catch(() => null);
    const status = String(j?.situacao || j?.status || "").toLowerCase();
    const name = j?.nome || j?.name || "";
    const specialty = j?.especialidade || j?.specialty || "";
    const isActive = status.includes("ativo");

    return {
      valid: isActive,
      status: isActive ? "Ativo" : (j?.situacao || "Inativo"),
      name,
      specialty,
      error: isActive ? undefined : "CRM não está ativo no CFM",
    };
  } catch (error) {
    console.error("[KYC] CRM check error:", error instanceof Error ? error.message : "unknown");
    return { valid: false, status: "pending_manual_review", error: "Falha na conexão com o conselho médico — revisão manual necessária" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: KYCRequest = await req.json();
    const { doctor_id, crm, crm_state, document_type, document_number, full_name } = body;

    if (!doctor_id || !crm || !crm_state || !document_type || !document_number || !full_name) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify doctor belongs to user
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id, user_id")
      .eq("id", doctor_id)
      .single();

    if (!doctor || doctor.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Médico não encontrado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { crm_valid: boolean; document_valid: boolean; errors: string[] } = {
      crm_valid: false,
      document_valid: false,
      errors: [],
    };

    // 1. Validate document
    switch (document_type) {
      case "cpf":
        results.document_valid = validateCPF(document_number);
        if (!results.document_valid) results.errors.push("CPF inválido (dígito verificador incorreto)");
        break;
      case "passport":
        results.document_valid = validatePassport(document_number);
        if (!results.document_valid) results.errors.push("Formato de passaporte inválido");
        break;
      case "rne":
        results.document_valid = validateRNE(document_number);
        if (!results.document_valid) results.errors.push("Formato de RNE inválido");
        break;
    }

    // 2. Validate CRM
    const crmResult = await checkCRM(crm, crm_state);
    results.crm_valid = crmResult.valid;
    if (!crmResult.valid) {
      results.errors.push(crmResult.error || "CRM inválido ou inativo");
    }

    // 3. Check name consistency (if API returned a name)
    if (crmResult.name && crmResult.name.length > 0) {
      const normalizedInput = full_name.toLowerCase().trim();
      const normalizedAPI = crmResult.name.toLowerCase().trim();
      if (!normalizedAPI.includes(normalizedInput.split(" ")[0])) {
        results.errors.push("Nome não confere com o registro do CRM");
      }
    }

    // 4. Determine KYC status — only "verified" when CRM was actually confirmed by CFM/Brasil API.
    const kycStatus = results.crm_valid && results.document_valid
      ? "verified"
      : (crmResult.status === "pending_manual_review" ? "pending_manual_review" : "rejected");

    // 5. Update doctor record
    await supabase
      .from("doctors")
      .update({
        is_crm_valid: results.crm_valid,
        last_crm_check: new Date().toISOString(),
        document_type,
        document_number,
        kyc_status: kycStatus,
      })
      .eq("id", doctor_id);

    // 6. Audit log
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: kycStatus === "verified" ? "kyc_verified" : "kyc_rejected",
      table_name: "doctors",
      record_id: doctor_id,
      old_data: null,
      new_data: {
        crm,
        crm_state,
        document_type,
        is_crm_valid: results.crm_valid,
        is_document_valid: results.document_valid,
        errors: results.errors,
        crm_api_status: crmResult.status,
      },
    });

    // 7. Trigger ManyChat webhook if verified
    if (kycStatus === "verified") {
      const manychatKey = Deno.env.get("MANYCHAT_API_KEY");
      if (manychatKey) {
        try {
          await fetch("https://api.manychat.com/fb/sending/sendFlow", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${manychatKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscriber_id: user.id,
              flow_ns: "content20250413_welcome_doctor_verified",
            }),
          });
          console.log("[KYC] ManyChat WELCOME_DOCTOR_VERIFIED triggered");
        } catch (e) {
          console.error("[KYC] ManyChat webhook failed:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        kyc_status: kycStatus,
        crm_valid: results.crm_valid,
        document_valid: results.document_valid,
        errors: results.errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[KYC] Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
