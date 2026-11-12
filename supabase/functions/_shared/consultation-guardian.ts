/**
 * Regras do guardião das consultas (funções puras, testadas no vitest).
 * Só corrige sozinho o que é seguro; o resto vira alerta para o administrador.
 */
export const GUARDIAN_LIMITS = {
  /** Consulta "em andamento" há mais que isso (máx. oficial: 45 min) e sem conversa recente é encerrada. */
  stuckInProgressMinutes: 180,
  /** Sem mensagem no chat há pelo menos isso para poder encerrar sozinho. */
  stuckChatQuietMinutes: 60,
  /** Paga e ainda sem atendimento depois do prazo da sala de espera (12 h) + folga. */
  waitingTooLongMinutes: 13 * 60,
  /** Avaliação registrada e repasse não liberado depois disso. */
  payoutGraceMinutes: 15,
  /** Janela olhada para trás (evita reabrir histórico antigo). */
  lookbackDays: 30,
} as const;

export const GUARDIAN_AUTO_CLOSE_MARKER = "[ENCERRADA_PELO_GUARDIAO]";

export type GuardianEventKind =
  | "video_server_down"
  | "stuck_in_progress_closed"
  | "paid_waiting_too_long"
  | "rating_without_payout";

export function minutesAgoIso(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

/** Chave única: o mesmo problema gera um único alerta (o servidor de vídeo, no máximo um por hora). */
export function guardianDedupeKey(kind: GuardianEventKind, ref: string, now: Date): string {
  return kind === "video_server_down" ? `${kind}:${now.toISOString().slice(0, 13)}` : `${kind}:${ref}`;
}

/** Encerra sozinho só quando a consulta passou muito do limite E ninguém escreveu recentemente. */
export function shouldAutoClose(
  startedAtIso: string,
  lastChatIso: string | null,
  now: Date,
  limits: { stuckInProgressMinutes: number; stuckChatQuietMinutes: number } = GUARDIAN_LIMITS,
): boolean {
  const started = Date.parse(startedAtIso);
  if (!Number.isFinite(started)) return false;
  if (now.getTime() - started < limits.stuckInProgressMinutes * 60_000) return false;
  if (!lastChatIso) return true;
  const last = Date.parse(lastChatIso);
  return !Number.isFinite(last) || now.getTime() - last >= limits.stuckChatQuietMinutes * 60_000;
}

export function appendMarker(notes: string | null, marker: string): string {
  const base = notes ?? "";
  return base.includes(marker) ? base : [base, marker].filter(Boolean).join("\n");
}
