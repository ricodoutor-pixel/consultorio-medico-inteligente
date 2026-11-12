/**
 * Lembretes de consulta (funções puras, testadas no vitest).
 * - 24 h antes: avisa a data/hora (só se faltar mais de 2 h, para não repetir o lembrete de 1 h).
 * - 1 h antes: link direto da sala.
 * - 30 dias após a consulta concluída: convite para o retorno com o mesmo médico.
 * As mensagens não citam diagnóstico, sintomas nem especialidade (LGPD).
 */
export type ReminderKind = "lembrete24h" | "lembrete1h" | "retorno30d";

const MIN = 60_000;

export function scheduledReminderDue(scheduledAtIso: string, now: Date): ReminderKind | null {
  const at = Date.parse(scheduledAtIso);
  if (!Number.isFinite(at)) return null;
  const delta = at - now.getTime();
  if (delta <= 0) return null;
  if (delta <= 65 * MIN) return "lembrete1h";
  if (delta > 2 * 60 * MIN && delta <= 24 * 60 * MIN) return "lembrete24h";
  return null;
}

/** Janela de 1 dia a partir do 30º dia: o cron passa várias vezes, a chave única evita repetição. */
export function returnReminderDue(completedAtIso: string, now: Date): boolean {
  const at = Date.parse(completedAtIso);
  if (!Number.isFinite(at)) return false;
  const age = now.getTime() - at;
  return age >= 30 * 24 * 60 * MIN && age < 31 * 24 * 60 * MIN;
}

export function formatBrasilia(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function reminderKey(appointmentId: string, kind: ReminderKind): string {
  return `consulta:${appointmentId}:paciente:${kind}`;
}

export function reminderText(kind: ReminderKind, input: { whenIso?: string; link: string; doctorName?: string | null }): string {
  const doctor = input.doctorName ? ` com ${input.doctorName}` : "";
  if (kind === "lembrete24h") {
    return `🌿 Planta y Raiz: lembrete da sua teleconsulta${doctor} em ${formatBrasilia(input.whenIso ?? "")} (horário de Brasília). Na hora, entre pela sala: ${input.link}`;
  }
  if (kind === "lembrete1h") {
    return `🌿 Planta y Raiz: sua teleconsulta${doctor} começa em cerca de 1 hora. Teste câmera e internet e entre pela sala: ${input.link}`;
  }
  return `🌿 Planta y Raiz: já faz 30 dias da sua consulta${doctor}. Se o médico indicou retorno ou você precisa renovar a receita, agende por aqui: ${input.link}`;
}
