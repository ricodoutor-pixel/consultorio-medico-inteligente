/**
 * Rótulo do status ANVISA de uma receita mostrado ao paciente.
 * A plataforma não consulta a ANVISA: protocolos antigos marcados como "APROVADO_INSTANTANEO"
 * vinham de uma simulação e nunca são exibidos como aprovação.
 */
export function anvisaStatusLabel(status?: string | null): string {
  if (!status || status === "APROVADO_INSTANTANEO") return "Autorização ANVISA não verificada";
  if (status === "INFORMADO_PELO_PACIENTE") return "Informado pelo paciente · não verificado";
  return status.replace(/_/g, " ");
}

/** Protocolo ANVISA real informado na receita; nunca um número padrão. */
export function anvisaProtocolOf(rx: { anvisa_code?: string | null; anvisa_protocol?: string | null }): string | null {
  const p = (rx.anvisa_code || rx.anvisa_protocol || "").trim();
  return p || null;
}
