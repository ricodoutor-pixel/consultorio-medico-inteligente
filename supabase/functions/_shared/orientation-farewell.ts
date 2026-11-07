// Despedida e encerramento automático da Orientação Técnica.
// Regra: quando o agente perguntou "Posso ajudar em mais alguma coisa?" e o
// paciente responde que não precisa de mais nada, a sala é encerrada no
// servidor com uma despedida curta, sem nova pergunta.

/** Pergunta de encerramento feita pelo agente antes da despedida. */
export const CLOSING_QUESTION_PATTERN =
  /posso (te )?ajudar (em )?mais (alguma coisa|algo)|mais alguma (coisa|d[úu]vida)|posso (te )?ajudar em algo mais/i;

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** O paciente confirmou que não precisa de mais nada / se despediu. */
export function isFarewell(text: string): boolean {
  const t = normalize(text);
  if (!t || t.length > 300) return false;
  // A new question always takes precedence over a farewell in the same message.
  if (/\?|\b(mas|porem|qual|quais|como|quando|onde|quanto|duvida)\b|\be (a|o|sobre)\b/.test(t)) return false;
  const patterns: RegExp[] = [
    /\bnao[, ]? (e so isso|preciso de mais nada|quero mais nada|tenho mais duvidas?)\b/,
    /\b(e|era|foi) so isso\b/,
    /\bso isso[, ]? (obrigad[oa]|valeu|tchau)?\s*[.!]*$/,
    /\bnao preciso de mais nada\b/,
    /\bpode encerrar\b/,
    /\bpode finalizar\b/,
    /\bvamos encerrar\b/,
    /\bquero encerrar\b/,
    /\bencerrar (a )?orientacao\b/,
    /\bmais nada[, ]? (obrigad[oa]|valeu)?\s*[.!]*$/,
    /\bso agradecer\b/,
    /\bmuito obrigad[oa][, ]? (tchau|ate mais|por hoje e isso)\b/,
    /\btchau\b/,
    /\bate mais\b/,
    /\bate logo\b/,
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Encerramento automático: só quando a última fala do agente foi a pergunta
 * de encerramento E o paciente confirmou a despedida. Isso evita fechar a
 * sala no meio da conversa quando o paciente apenas agradece.
 */
export function shouldAutoClose(patientText: string, lastAgentText: string | null): boolean {
  return isFarewell(patientText);
}

/** Despedida curta e final: sem pergunta nova, sem conteúdo clínico. */
export const FAREWELL_MESSAGE =
  "Perfeito! Foi um prazer acolher você 🌿 Sua Orientação Técnica está encerrada. " +
  "Seu relatório educativo fica disponível aqui nesta página para baixar em PDF, e você pode avaliar o atendimento logo abaixo. " +
  "Para tratamento e prescrição, o próximo passo é a consulta com um médico prescritor da nossa vitrine. Cuide-se bem!";
