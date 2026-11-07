// Despedida e encerramento automático da Orientação Técnica.
// Regra: quando o agente perguntou "Posso ajudar em mais alguma coisa?" e o
// paciente responde que não precisa de mais nada, a sala é encerrada no
// servidor com uma despedida curta, sem nova pergunta.

/** Pergunta de encerramento feita pelo agente antes da despedida. */
export const CLOSING_QUESTION_PATTERN =
  /posso ajudar (em )?mais (alguma coisa|algo)|mais alguma (coisa|d[úu]vida)|posso te ajudar em algo mais/i;

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** O paciente confirmou que não precisa de mais nada / se despediu. */
export function isFarewell(text: string): boolean {
  const t = normalize(text);
  if (!t || t.length > 300) return false;
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
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Encerramento automático: só quando a última fala do agente foi a pergunta
 * de encerramento E o paciente confirmou a despedida. Isso evita fechar a
 * sala no meio da conversa quando o paciente apenas agradece.
 */
export function shouldAutoClose(patientText: string, lastAgentText: string | null): boolean {
  if (!isFarewell(patientText)) return false;
  if (!lastAgentText) return false;
  return CLOSING_QUESTION_PATTERN.test(lastAgentText);
}

/** Despedida curta e final: sem pergunta nova, sem conteúdo clínico. */
export const FAREWELL_MESSAGE =
  "Perfeito! Foi um prazer acolher você 🌿 Sua Orientação Técnica está encerrada. " +
  "Seu relatório educativo fica disponível aqui nesta página para baixar em PDF, e você pode avaliar o atendimento logo abaixo. " +
  "Para tratamento e prescrição, o próximo passo é a consulta com um médico prescritor da nossa vitrine. Cuide-se bem!";
