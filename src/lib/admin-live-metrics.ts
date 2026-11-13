/**
 * Central de Comando do /admin — regras puras (sem rede) para somar receita real e decidir os alertas.
 * Somente pagamentos confirmados entram em receita: Orientação com paid_at, Brisa com status "approved",
 * consulta com payment_status "paid" e assinatura de médico com status "active".
 */

export const CONSULTATION_PLATFORM_FEE = 0.07;

export type Severity = "ok" | "warning" | "critical";

export interface PaidRow { amount: number; at: string; platformFee?: number | null }

export interface LiveSnapshot {
  nowMs: number;
  otPaid: PaidRow[]; // Orientação Técnica paga (30 dias)
  brisaPaid: PaidRow[]; // pagamentos Brisa aprovados (30 dias)
  consultPaid: PaidRow[]; // consultas pagas (30 dias)
  activeSubscriptions: { amount: number; planTier: string }[];
  otPending24h: number; // pedidos de Orientação criados nas últimas 24h ainda sem pagamento
  otCreated24h: number;
  doctorsOnline: number;
  doctorsInConsultation: number;
  consultationsLive: number;
  waitingRoom: number;
  oldestWaitingIso: string | null;
  guardianOpen: { severity: string }[];
  notifyFailed: number;
  amountMismatch7d: number;
  errors24h: { severity: string }[];
  lastWebhookIso: string | null;
  lastWhatsAppInIso: string | null;
  lastWhatsAppOutIso: string | null;
  doctorsPendingApproval: number;
}

export interface Money { today: number; d7: number; d30: number; platform30: number }

const DAY = 86_400_000;

/** Início do dia em Brasília (UTC-3, sem horário de verão desde 2019). */
export function startOfBrasiliaDay(nowMs: number): number {
  const offset = 3 * 3_600_000;
  return Math.floor((nowMs - offset) / DAY) * DAY + offset;
}

export function sumMoney(s: Pick<LiveSnapshot, "nowMs" | "otPaid" | "brisaPaid" | "consultPaid">): Money {
  const today = startOfBrasiliaDay(s.nowMs);
  const d7 = s.nowMs - 7 * DAY;
  const d30 = s.nowMs - 30 * DAY;
  const out: Money = { today: 0, d7: 0, d30: 0, platform30: 0 };
  const add = (rows: PaidRow[], fee: (r: PaidRow) => number) => {
    for (const r of rows) {
      const t = new Date(r.at).getTime();
      const v = Number(r.amount) || 0;
      if (!Number.isFinite(t) || t < d30) continue;
      out.d30 += v;
      out.platform30 += fee(r);
      if (t >= d7) out.d7 += v;
      if (t >= today) out.today += v;
    }
  };
  // Orientação: a plataforma fica com platform_fee gravado no pedido (ou o valor todo, quando ausente).
  add(s.otPaid, (r) => (r.platformFee != null ? Number(r.platformFee) : Number(r.amount) || 0));
  add(s.brisaPaid, (r) => Number(r.amount) || 0);
  add(s.consultPaid, (r) => (Number(r.amount) || 0) * CONSULTATION_PLATFORM_FEE);
  for (const k of Object.keys(out) as (keyof Money)[]) out[k] = Math.round(out[k] * 100) / 100;
  return out;
}

export function monthlyRecurring(subs: LiveSnapshot["activeSubscriptions"]): number {
  return Math.round(subs.reduce((s, x) => s + (Number(x.amount) || 0), 0) * 100) / 100;
}

export interface Alert { key: string; severity: Severity; title: string; detail: string }

const minutesSince = (iso: string | null, nowMs: number) =>
  iso ? Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60_000)) : null;

const hourBrasilia = (nowMs: number) => new Date(nowMs - 3 * 3_600_000).getUTCHours();

/** Alertas operacionais, do mais grave ao mais leve. Só regras sobre dados reais; nada sorteado. */
export function computeAlerts(s: LiveSnapshot): Alert[] {
  const a: Alert[] = [];
  const waitMin = minutesSince(s.oldestWaitingIso, s.nowMs);

  if (s.waitingRoom > 0 && s.doctorsOnline === 0) {
    a.push({ key: "no-doctor", severity: "critical", title: "Paciente esperando sem médico online", detail: `${s.waitingRoom} na sala de espera e nenhum médico com ON ativo.` });
  } else if (waitMin != null && waitMin >= 15) {
    a.push({ key: "long-wait", severity: "warning", title: "Espera longa na sala", detail: `Paciente mais antigo aguarda há ${waitMin} min.` });
  }

  const guardianCritical = s.guardianOpen.filter((g) => /crit|high|alta|grave/i.test(g.severity)).length;
  if (guardianCritical > 0) a.push({ key: "guardian-critical", severity: "critical", title: "Anomalias graves em consultas", detail: `${guardianCritical} evento(s) do vigia de consultas sem resolução.` });
  else if (s.guardianOpen.length > 0) a.push({ key: "guardian", severity: "warning", title: "Anomalias em consultas", detail: `${s.guardianOpen.length} evento(s) do vigia aguardando revisão.` });

  if (s.amountMismatch7d > 0) a.push({ key: "mismatch", severity: "critical", title: "Pagamento com valor abaixo do preço", detail: `${s.amountMismatch7d} bloqueio(s) nos últimos 7 dias; confira em Auditoria.` });
  if (s.notifyFailed > 0) a.push({ key: "notify", severity: "warning", title: "Avisos de pagamento no WhatsApp falharam", detail: `${s.notifyFailed} aviso(s) sem entrega aguardando reenvio (payment-notify-resend).` });

  const criticalErrors = s.errors24h.filter((e) => /crit|fatal|error|high/i.test(e.severity)).length;
  if (criticalErrors >= 10) a.push({ key: "errors", severity: "critical", title: "Muitos erros no sistema", detail: `${criticalErrors} erros graves em 24h.` });
  else if (criticalErrors > 0) a.push({ key: "errors", severity: "warning", title: "Erros no sistema", detail: `${criticalErrors} erro(s) grave(s) em 24h.` });

  const waMin = minutesSince(s.lastWhatsAppInIso, s.nowMs);
  const h = hourBrasilia(s.nowMs);
  if (h >= 8 && h < 22 && (waMin == null || waMin > 180)) {
    a.push({ key: "whatsapp", severity: "warning", title: "WhatsApp da Brisa sem mensagens", detail: waMin == null ? "Nenhuma mensagem recebida registrada." : `Última mensagem recebida há ${Math.round(waMin / 60)} h.` });
  }

  if (s.otPending24h >= 3 && s.otCreated24h > 0 && s.otPending24h / s.otCreated24h >= 0.7) {
    a.push({ key: "checkout", severity: "warning", title: "Muitos Pix de Orientação sem pagamento", detail: `${s.otPending24h} de ${s.otCreated24h} pedidos em 24h seguem pendentes.` });
  }

  if (s.doctorsPendingApproval > 0) a.push({ key: "approvals", severity: "warning", title: "Médicos aguardando aprovação", detail: `${s.doctorsPendingApproval} cadastro(s) para revisar.` });

  const rank: Record<Severity, number> = { critical: 0, warning: 1, ok: 2 };
  return a.sort((x, y) => rank[x.severity] - rank[y.severity]);
}

export function overallSeverity(alerts: Alert[]): Severity {
  if (alerts.some((x) => x.severity === "critical")) return "critical";
  if (alerts.some((x) => x.severity === "warning")) return "warning";
  return "ok";
}

export function formatAgo(iso: string | null, nowMs: number): string {
  const m = minutesSince(iso, nowMs);
  if (m == null) return "nunca";
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}
