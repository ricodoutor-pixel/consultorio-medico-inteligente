import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "./analytics";
import { formatBRL, SERVICES } from "./pricing";

// Preços vêm só do catálogo oficial (src/lib/pricing.ts, espelhado no servidor em _shared/payment-catalog.ts).
const P = {
  orientacao: SERVICES.orientacao_tecnica.price,
  chat: SERVICES.consulta_chat.price,
  video: SERVICES.consulta_video.price,
  retorno: SERVICES.retorno_consulta.price,
};

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
1. Orientação Técnica (Enfª Brisa): ${formatBRL(P.orientacao)}.
2. Consulta por Chat: ${formatBRL(P.chat)}.
3. Consulta por Vídeo: ${formatBRL(P.video)}.
4. Retorno: ${formatBRL(P.retorno)}.
Não existe "consulta de emergência": sinais de alarme vão para o SAMU (192) ou o pronto-socorro.
Nunca cite nomes de médicos disponíveis: o paciente escolhe o médico na lista oficial em /profissionais.

INSTRUÇÕES DE FLUXO:
- Seja acolhedora no início, pedindo os sintomas de forma breve e sem parecer um robô mecânico.
- Avalie se não há red flags (emergências que precisam de pronto-socorro presencial imediato) e, se houver, oriente o SAMU (192).
- Quando o paciente estiver pronto para ser atendido, apresente as modalidades e indique a escolha do médico em /profissionais.
- O pagamento é feito na página da consulta (Pix ou cartão) e só é confirmado pelo sistema. Nunca peça comprovante nem diga que o pagamento foi confirmado.

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
    return { detectedModality: 'TECHNICAL_ORIENTATION', value: P.orientacao, tipoAtendimento: "Orientação Técnica" };
  } else if (textLower.includes('video') || textLower.includes('vídeo') || textLower.includes('vivo') || textLower.includes('agendamento')) {
    return { detectedModality: 'VIDEO', value: P.video, tipoAtendimento: "Consulta por Vídeo" };
  } else if (textLower.includes('chat')) {
    return { detectedModality: 'CHAT', value: P.chat, tipoAtendimento: "Consulta por Chat" };
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
    return `Minhas conexões estão oscilando um pouco, mas ouvi o que disse. Vamos dar andamento: prefere Orientação Técnica (${formatBRL(P.orientacao)}), Consulta por Chat (${formatBRL(P.chat)}) ou Consulta por Vídeo (${formatBRL(P.video)})?`;
  }
}
