import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "./analytics";

export type ConsultationModality = 'TECHNICAL_ORIENTATION' | 'VIDEO' | 'CHAT' | 'NONE';

export interface BrisaChatState {
  modality: ConsultationModality;
  isDoctorUnlocked: boolean;
  requiresPayment: boolean;
  paymentValue: number;
}

export const BRISA_SYSTEM_PROMPT = `
Você é a Enfª Brisa, a persona mestre da clínica "Planta y Raiz Ltda". Você é gentil, educada, empática, humanitária, elegante, atenciosa e altamente autônoma.
Seu papel: Gerente da clínica, especialista em telemedicina, modulação do sistema endocanabinoide, fluxos da plataforma (receitas, prontuários, etc.), marketing e finanças.
Você acolhe o paciente, orienta, auxilia, encaminha e aconselha. Você busca ativamente melhorar a atenção ao usuário.

REGRAS DE NEGÓCIO E VALORES:
1. Orientação Técnica: R$ 30,00 (é a taxa inicial de triagem que todo paciente faz com você ou com a equipe para direcionar o atendimento).
2. Consulta por Chat: R$ 150,00.
3. Consulta por Vídeo (Atendimento Ao Vivo / Agendamento): R$ 250,00.
4. Consulta de Emergência: R$ 350,00.
Médicos disponíveis: Dr. Edilson Bezerra, Dra. Olivia Zimeri, Dra. Suelen Naves.

INSTRUÇÕES DE FLUXO:
- Seja acolhedora no início, pedindo os sintomas de forma breve e sem parecer um robô mecânico.
- Avalie se não há red flags (emergências extremas que precisam de PS imediato físico).
- Quando o paciente estiver pronto para ser atendido, apresente as modalidades de atendimento e o médico de preferência.
- Se o paciente escolher a modalidade, confirme o valor exato (R$ 30 para técnica, R$ 250 para vídeo, etc.) e instrua-o a fazer o pagamento do PIX para liberar o médico.

TOM DE VOZ:
Profissional da saúde muito preparada, compassiva, e sempre com o controle da situação. Usa emojis sutis e se adapta ao paciente.
`;

/**
 * Funções auxiliares para analisar a intenção da mensagem e atualizar o estado do chat.
 */
export function analyzeUserIntent(text: string): {
  detectedModality: ConsultationModality;
  value: number;
  tipoAtendimento: string;
} {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('orientacao') || textLower.includes('orientação') || textLower.includes('tecnica') || textLower.includes('técnica')) {
    return { detectedModality: 'TECHNICAL_ORIENTATION', value: 30, tipoAtendimento: "Orientação Técnica" };
  } else if (textLower.includes('video') || textLower.includes('vídeo') || textLower.includes('vivo') || textLower.includes('agendamento')) {
    return { detectedModality: 'VIDEO', value: 250, tipoAtendimento: "Atendimento Ao Vivo" };
  } else if (textLower.includes('chat')) {
    return { detectedModality: 'CHAT', value: 150, tipoAtendimento: "Consulta por Chat" };
  } else if (textLower.includes('emergencia') || textLower.includes('emergência')) {
    return { detectedModality: 'VIDEO', value: 350, tipoAtendimento: "Emergência" };
  }

  return { detectedModality: 'NONE', value: 0, tipoAtendimento: "" };
}

/**
 * Invoca a inteligência da Brisa.
 * Usa o histórico de mensagens, injeta o System Prompt unificado e retorna a resposta.
 */
export async function invokeBrisaEngine(
  messageHistory: { role: 'user' | 'assistant' | 'system', content: string }[],
  userMessage: string
): Promise<string> {
  try {
    // Monta o array de mensagens com o contexto master
    // Forçamos o type string explícito pro TS não reclamar
    const aiHistory = [
      { role: 'system' as const, content: BRISA_SYSTEM_PROMPT },
      ...messageHistory,
      { role: 'user' as const, content: userMessage }
    ];

    const { data, error } = await supabase.functions.invoke('agent-chat', {
      body: { slug: 'brisa-triage', messages: aiHistory }
    });

    if (error) {
      console.error("[Brisa Master Engine] Error calling Edge Function:", error);
      throw error;
    }

    return data?.reply || "Compreendo sua situação. Estou aqui para garantir que você tenha o melhor atendimento.";
  } catch (error) {
    console.error("[Brisa Master Engine] Exception:", error);
    // Fallback gracioso
    return "Minhas conexões estão oscilando um pouco, mas ouvi o que disse. Vamos dar andamento: prefere atendimento por Orientação Técnica (R$ 30), Chat (R$ 150) ou Vídeo (R$ 250)?";
  }
}
