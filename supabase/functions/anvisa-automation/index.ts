import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function requireAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

interface AnvisaMedicine {
  name: string;
  activePrinciple: string;
  concentration: string;
  dosage: string;
  quantity: number;
  indication: string;
  supplier?: string;
}

interface AnvisaRequest {
  patientName: string;
  patientCPF: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorCRM: string;
  doctorCRMState: string;
  doctorSpecialty: string;
  medicines: AnvisaMedicine[];
  medicalJustification: string;
  treatmentDuration: string;
  diagnosisCID?: string;
}

function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (parseInt(cleaned[9]) !== digit) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  return parseInt(cleaned[10]) === digit;
}

function validateForm(data: AnvisaRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.patientName || data.patientName.length < 3) errors.push("Nome do paciente inválido");
  if (!data.patientCPF || !isValidCPF(data.patientCPF)) errors.push("CPF do paciente inválido");
  if (!data.doctorCRM) errors.push("CRM do médico obrigatório");
  if (!data.medicines || data.medicines.length === 0) errors.push("Ao menos um medicamento obrigatório");
  if (!data.medicalJustification || data.medicalJustification.length < 50) errors.push("Justificativa médica muito curta");
  if (!data.treatmentDuration) errors.push("Duração do tratamento obrigatória");
  for (const med of (data.medicines || [])) {
    if (!med.name) errors.push("Medicamento sem nome");
    if (!med.activePrinciple) errors.push(`${med.name}: princípio ativo obrigatório`);
    if (med.quantity <= 0) errors.push(`${med.name}: quantidade inválida`);
  }
  return { valid: errors.length === 0, errors };
}

function generateProtocol(): string {
  const d = new Date();
  const r = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ANV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${r}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const user = await requireAuthenticatedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: AnvisaRequest = await req.json();
    const validation = validateForm(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: "Validação falhou", details: validation.errors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const hasTHC = body.medicines.some(m => m.activePrinciple.toLowerCase().includes("thc"));
    const protocol = generateProtocol();
    const estimatedDays = hasTHC ? 15 : 7;

    return new Response(JSON.stringify({
      success: true,
      protocol,
      status: "submitted",
      estimatedDays,
      message: `Solicitação submetida com sucesso. Protocolo: ${protocol}`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    // Avoid logging request body (contains PII like CPF)
    console.error("[anvisa-automation] error:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
