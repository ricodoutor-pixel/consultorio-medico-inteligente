/** "Avise-me quando ficar livre" (funções puras, testadas no vitest). */
export const FREE_ALERT_EXPIRY_MS = 3 * 3_600_000;

export function freeAlertExpired(createdAtIso: string, now: Date): boolean {
  const at = Date.parse(createdAtIso);
  return !Number.isFinite(at) || now.getTime() - at >= FREE_ALERT_EXPIRY_MS;
}

export function freeAlertKey(alertId: string): string {
  return `medico-livre:${alertId}`;
}

export function freeAlertText(link: string, doctorName?: string | null): string {
  const doctor = doctorName || "O médico que você escolheu";
  return `🌿 Planta y Raiz: ${doctor} acabou de ficar disponível (luz verde) para teleconsulta. Chame agora, antes que outro paciente entre: ${link}`;
}
