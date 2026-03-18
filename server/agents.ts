import { invokeLLM } from "./_core/llm";

/**
 * Agentes IA da Planta & Raiz
 * - Enfermeira Brisa: Triagem clínica, matching geográfico, pós-venda
 * - Manus CEO: Gestão financeira, automação de pagamentos
 * - Guardião ANVISA: Compliance, auditoria de receitas
 * - Verdinho: Suporte técnico, gestão logística
 */

export interface TriageResult {
  symptoms: string[];
  severity: "low" | "medium" | "high";
  recommendedSpecialties: string[];
  urgency: "routine" | "soon" | "urgent";
  followUpDays: number;
}

export interface MatchResult {
  doctorId: number;
  matchScore: number;
  distance: number;
  availability: string;
}

export interface ComplianceResult {
  isValid: boolean;
  doctorName: string;
  crmNumber: string;
  crmValidated: boolean;
  productCompliance: boolean;
  issues: string[];
}

/**
 * Enfermeira Brisa - Triagem Clínica
 * Realiza triagem automática de sintomas e recomenda especialistas
 */
export async function brisaTriage(symptoms: string, medicalHistory?: string): Promise<TriageResult> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Você é Enfermeira Brisa, um agente IA especializado em triagem clínica. 
        Analise os sintomas fornecidos e determine:
        1. Gravidade (low, medium, high)
        2. Especialidades médicas recomendadas
        3. Urgência do atendimento (routine, soon, urgent)
        4. Dias para seguimento (0-30)
        
        Responda em JSON com as chaves: symptoms (array), severity, recommendedSpecialties (array), urgency, followUpDays`,
      },
      {
        role: "user",
        content: `Sintomas: ${symptoms}${medicalHistory ? `\nHistórico: ${medicalHistory}` : ""}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "triage_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            symptoms: { type: "array", items: { type: "string" } },
            severity: { type: "string", enum: ["low", "medium", "high"] },
            recommendedSpecialties: { type: "array", items: { type: "string" } },
            urgency: { type: "string", enum: ["routine", "soon", "urgent"] },
            followUpDays: { type: "integer" },
          },
          required: ["symptoms", "severity", "recommendedSpecialties", "urgency", "followUpDays"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("No response from Brisa");

  return JSON.parse(content) as TriageResult;
}

/**
 * Brisa - Matching Geográfico
 * Encontra médicos disponíveis próximos ao paciente
 */
export async function brisaGeoMatching(
  patientLocation: string,
  specialty: string,
  availableDoctors: Array<{ id: number; name: string; location: string; specialty: string }>
): Promise<MatchResult[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Você é Enfermeira Brisa. Faça matching entre paciente e médicos baseado em:
        1. Proximidade geográfica (quanto mais próximo, melhor)
        2. Especialidade solicitada
        3. Disponibilidade
        
        Retorne array de matches com score de 0-100.`,
      },
      {
        role: "user",
        content: `Paciente em: ${patientLocation}, procura: ${specialty}\nMédicos disponíveis: ${JSON.stringify(availableDoctors)}`,
      },
    ],
  });

  // Simulação de matching (em produção, usar LLM)
  return availableDoctors
    .filter((doc) => doc.specialty.toLowerCase().includes(specialty.toLowerCase()))
    .map((doc) => ({
      doctorId: doc.id,
      matchScore: Math.random() * 100,
      distance: Math.random() * 50,
      availability: "Próxima semana",
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

/**
 * Brisa - Smart Refill
 * Agenda recompra automática de medicamentos
 */
export async function brisaSmartRefill(
  medicationName: string,
  dosage: string,
  frequency: string,
  lastRefillDate: Date
): Promise<{ nextRefillDate: Date; daysUntilRefill: number }> {
  // Calcular próxima data de recompra (5 dias antes do fim do medicamento)
  const estimatedDuration = 30; // dias
  const nextRefillDate = new Date(lastRefillDate);
  nextRefillDate.setDate(nextRefillDate.getDate() + estimatedDuration - 5);

  const today = new Date();
  const daysUntilRefill = Math.ceil((nextRefillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    nextRefillDate,
    daysUntilRefill,
  };
}

/**
 * Manus CEO - Gestão Financeira
 * Automatiza pagamentos, cobrança e divisão de comissões
 */
export async function ceoFinancialReport(
  userId: number,
  period: "daily" | "weekly" | "monthly"
): Promise<{
  totalRevenue: number;
  totalCommissions: number;
  adminFees: number;
  netBalance: number;
  pendingPayments: number;
}> {
  // Simulação de relatório financeiro
  const baseRevenue = Math.random() * 10000;
  const commissions = baseRevenue * 0.15;
  const adminFees = baseRevenue * 0.05;

  return {
    totalRevenue: baseRevenue,
    totalCommissions: commissions,
    adminFees: adminFees,
    netBalance: baseRevenue - adminFees,
    pendingPayments: Math.random() * 5000,
  };
}

/**
 * Manus CEO - Automação de Saques
 * Processa saques com cálculo automático de taxas
 */
export async function ceoProcessWithdrawal(
  userId: number,
  amount: number,
  hasWithdrawalExemption: boolean
): Promise<{
  withdrawalId: string;
  requestedAmount: number;
  fee: number;
  netAmount: number;
  estimatedDate: Date;
  status: "pending" | "processing" | "completed";
}> {
  const fee = hasWithdrawalExemption ? 0 : amount * 0.05;
  const netAmount = amount - fee;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 2); // 2 dias úteis

  return {
    withdrawalId: `WD-${Date.now()}`,
    requestedAmount: amount,
    fee: fee,
    netAmount: netAmount,
    estimatedDate: estimatedDate,
    status: "pending",
  };
}

/**
 * Guardião ANVISA - Validação de Receitas
 * Auditoria OCR e validação de conformidade RDC 660
 */
export async function guardianValidateReceipt(
  receiptImageUrl: string,
  ocrText: string
): Promise<ComplianceResult> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Você é Guardião ANVISA. Valide receitas conforme RDC 660:
        1. Extraia nome do médico
        2. Valide CRM (formato: CRM-UF XXXXXX)
        3. Verifique conformidade de medicamentos
        4. Identifique problemas
        
        Retorne JSON com: isValid, doctorName, crmNumber, crmValidated, productCompliance, issues (array)`,
      },
      {
        role: "user",
        content: `Texto OCR da receita:\n${ocrText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "receipt_validation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isValid: { type: "boolean" },
            doctorName: { type: "string" },
            crmNumber: { type: "string" },
            crmValidated: { type: "boolean" },
            productCompliance: { type: "boolean" },
            issues: { type: "array", items: { type: "string" } },
          },
          required: ["isValid", "doctorName", "crmNumber", "crmValidated", "productCompliance", "issues"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("No response from Guardian");

  return JSON.parse(content) as ComplianceResult;
}

/**
 * Verdinho - Suporte Técnico
 * Responde dúvidas e resolve problemas
 */
export async function verdinhoSupport(userQuestion: string, context?: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Você é Verdinho, o concierge da Planta & Raiz. Responda perguntas de usuários com:
        1. Clareza e empatia
        2. Soluções práticas
        3. Referências ao sistema quando necessário
        
        Seja amigável e profissional.`,
      },
      {
        role: "user",
        content: `${userQuestion}${context ? `\n\nContexto: ${context}` : ""}`,
      },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (typeof content === "string") return content;
  return "Desculpe, não consegui processar sua pergunta.";
}

/**
 * Verdinho - Gestão Logística
 * Rastreia pedidos e coordena entregas
 */
export async function verdinhoTrackOrder(
  orderId: string
): Promise<{
  orderId: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  estimatedDelivery: Date;
  trackingUrl: string;
}> {
  // Simulação de rastreamento
  const statuses: Array<"pending" | "processing" | "shipped" | "delivered"> = [
    "pending",
    "processing",
    "shipped",
    "delivered",
  ];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 7) + 1);

  return {
    orderId,
    status: randomStatus,
    estimatedDelivery,
    trackingUrl: `https://plantaraiz.com/track/${orderId}`,
  };
}
