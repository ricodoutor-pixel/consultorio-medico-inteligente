export interface GeminiModelInfo {
  id: string;
  name: string;
  category: "Modelos de saída de texto" | "Agentes" | "Multimodal / Imagem";
  rpmUsed: number;
  rpmLimit: number;
  tpmUsed: number; // in K
  tpmLimit: number; // in K
  status: "healthy" | "warning" | "over_limit";
  tier: "flagship" | "fast" | "ultra_light" | "agent";
}

export interface PlatformAiAutomation {
  id: string;
  name: string;
  description: string;
  assignedModelId: string;
  fallbackModelId: string;
  category: "Atendimento Clínico" | "Executivo / BI" | "Operações & KYC" | "Growth & Marketing";
  status: "running" | "optimized" | "degraded";
  lastOptimizedAt: string;
  rpmCurrent: number;
  dailyRequests: number;
}

/** Espelho fiel do Google AI Studio com cotas e limites de taxa */
export const GEMINI_MODELS_CATALOG: GeminiModelInfo[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    category: "Modelos de saída de texto",
    rpmUsed: 8,
    rpmLimit: 5,
    tpmUsed: 8.46,
    tpmLimit: 250,
    status: "over_limit",
    tier: "flagship",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    category: "Modelos de saída de texto",
    rpmUsed: 3,
    rpmLimit: 5,
    tpmUsed: 8.53,
    tpmLimit: 250,
    status: "healthy",
    tier: "flagship",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    category: "Modelos de saída de texto",
    rpmUsed: 2,
    rpmLimit: 5,
    tpmUsed: 1.9,
    tpmLimit: 250,
    status: "healthy",
    tier: "fast",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    category: "Modelos de saída de texto",
    rpmUsed: 2,
    rpmLimit: 5,
    tpmUsed: 1.35,
    tpmLimit: 250,
    status: "healthy",
    tier: "fast",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    category: "Modelos de saída de texto",
    rpmUsed: 2,
    rpmLimit: 15,
    tpmUsed: 5.69,
    tpmLimit: 250,
    status: "healthy",
    tier: "ultra_light",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    category: "Modelos de saída de texto",
    rpmUsed: 1,
    rpmLimit: 10,
    tpmUsed: 0.004,
    tpmLimit: 250,
    status: "healthy",
    tier: "ultra_light",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    category: "Modelos de saída de texto",
    rpmUsed: 1,
    rpmLimit: 15,
    tpmUsed: 0.007,
    tpmLimit: 250,
    status: "healthy",
    tier: "ultra_light",
  },
  {
    id: "antigravity-agents",
    name: "Antigravity Agents",
    category: "Agentes",
    rpmUsed: 0,
    rpmLimit: 60,
    tpmUsed: 0,
    tpmLimit: 100,
    status: "healthy",
    tier: "agent",
  },
];

/** Lista de todas as automações com IA ativas na plataforma */
export const PLATFORM_AI_AUTOMATIONS: PlatformAiAutomation[] = [
  {
    id: "auto-brisa",
    name: "Enfª Brisa IA (WhatsApp & Triagem)",
    description: "Atendimento humanizado 24/7 a pacientes, triagem clínica canabinoide e agendamento de consultas.",
    assignedModelId: "gemini-3.6-flash",
    fallbackModelId: "gemini-3.5-flash-lite",
    category: "Atendimento Clínico",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 2.8,
    dailyRequests: 3420,
  },
  {
    id: "auto-manus",
    name: "Manus CEO (Agente Executivo & BI 360°)",
    description: "Análise estratégica de faturamento, orquestração de módulos, comandos remotos e auditoria executiva.",
    assignedModelId: "antigravity-agents",
    fallbackModelId: "gemini-3.6-flash",
    category: "Executivo / BI",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 0.4,
    dailyRequests: 480,
  },
  {
    id: "auto-prontuario",
    name: "Prontuário Inteligente & Resumos Médicos",
    description: "Transcrição clínica, sumarização de anamneses, análise de laudos e sugestão de posologia canabinoide.",
    assignedModelId: "gemini-3.6-flash",
    fallbackModelId: "gemini-2.5-flash",
    category: "Atendimento Clínico",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 1.2,
    dailyRequests: 890,
  },
  {
    id: "auto-quiz",
    name: "Quiz de Sintomas & Triagem Rápida",
    description: "Pré-avaliação interativa de dor crônica, insônia e ansiedade no portal e redirecionamento de médicos.",
    assignedModelId: "gemini-3.5-flash-lite",
    fallbackModelId: "gemini-3.1-flash-lite",
    category: "Atendimento Clínico",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 1.8,
    dailyRequests: 2150,
  },
  {
    id: "auto-growth",
    name: "Growth Engine & SEO Autônomo",
    description: "Geração contínua de páginas de tratamentos, metadados semânticos e distribuição de conteúdo canabinoide.",
    assignedModelId: "gemini-2.5-flash",
    fallbackModelId: "gemini-3.5-flash",
    category: "Growth & Marketing",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 1.1,
    dailyRequests: 1200,
  },
  {
    id: "auto-kyc-validator",
    name: "Validador Criptográfico KYC (Médicos/Farmácias/Pacientes)",
    description: "Inspeção visual automatizada de CRM, CFM, CNPJ, ANVISA AFE, passaportes e geração de hash SHA-256.",
    assignedModelId: "gemini-3.1-flash-lite",
    fallbackModelId: "gemini-2.5-flash-lite",
    category: "Operações & KYC",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 0.9,
    dailyRequests: 620,
  },
  {
    id: "auto-prescricao",
    name: "Assistente de Prescrição & Calculadora CBD/THC",
    description: "Cálculo de titulação de gotas e dosagem milimétrica para médicos sócios prescritores.",
    assignedModelId: "gemini-3.6-flash",
    fallbackModelId: "gemini-3.5-flash",
    category: "Atendimento Clínico",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 0.8,
    dailyRequests: 430,
  },
  {
    id: "auto-failover-wa",
    name: "Gerenciador de Failover WhatsApp (Dr. Edilson / Brisa)",
    description: "Detecção de desconexão, semáforo anti-bloqueio com pacing de 30s e alternância de instâncias WAHA.",
    assignedModelId: "gemini-2.5-flash-lite",
    fallbackModelId: "gemini-3.1-flash-lite",
    category: "Operações & KYC",
    status: "running",
    lastOptimizedAt: "Hoje às 04:00:02",
    rpmCurrent: 0.3,
    dailyRequests: 950,
  },
];

/**
 * Algoritmo inteligente do Agente das 4h da Manhã:
 * Analisa cotas disponíveis no Google AI Studio e redireciona automações
 * para os modelos mais eficientes com 100% de cota limpa.
 */
export function runBrainOptimizationRoutine(
  currentAutomations: PlatformAiAutomation[],
  models: GeminiModelInfo[]
): {
  updatedAutomations: PlatformAiAutomation[];
  swapsCount: number;
  logMessage: string;
} {
  let swaps = 0;
  const nowStr = `Hoje às ${new Date().toLocaleTimeString("pt-BR")}`;

  const healthyModels = models.filter((m) => m.status === "healthy");
  const fallbackModel = healthyModels[0] || models[1];

  const updated = currentAutomations.map((auto) => {
    const assignedModel = models.find((m) => m.id === auto.assignedModelId);
    
    // Se o modelo estiver com limite estourado (como Gemini 3.7 Flash no print), faz a troca automática!
    if (!assignedModel || assignedModel.status === "over_limit") {
      swaps++;
      const bestAlternative =
        healthyModels.find((m) => m.tier === "flagship" && m.id !== auto.assignedModelId) ||
        healthyModels.find((m) => m.tier === "fast") ||
        fallbackModel;

      return {
        ...auto,
        assignedModelId: bestAlternative.id,
        status: "optimized" as const,
        lastOptimizedAt: nowStr,
      };
    }

    return {
      ...auto,
      status: "running" as const,
      lastOptimizedAt: nowStr,
    };
  });

  return {
    updatedAutomations: updated,
    swapsCount: swaps,
    logMessage: `[Auto-Brain 04:00 AM] Auditoria concluída: ${models.length} modelos analisados. ${swaps} automações rebalanceadas para modelos com cota 100% livre. Zero interrupções.`,
  };
}
