import { describe, expect, it } from "vitest";
import { computeAlerts, monthlyRecurring, overallSeverity, startOfBrasiliaDay, sumMoney, type LiveSnapshot } from "./admin-live-metrics";

// 13/11/2026 15:00 em Brasília = 18:00 UTC
const NOW = Date.UTC(2026, 10, 13, 18, 0, 0);
const base: LiveSnapshot = {
  nowMs: NOW, otPaid: [], brisaPaid: [], consultPaid: [], activeSubscriptions: [],
  otPending24h: 0, otCreated24h: 0, doctorsOnline: 2, doctorsInConsultation: 0, consultationsLive: 0,
  waitingRoom: 0, oldestWaitingIso: null, guardianOpen: [], notifyFailed: 0, amountMismatch7d: 0,
  errors24h: [], lastWebhookIso: null, lastWhatsAppInIso: new Date(NOW - 10 * 60_000).toISOString(),
  lastWhatsAppOutIso: null, doctorsPendingApproval: 0,
};
const ago = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

describe("Central de Comando — receita", () => {
  it("início do dia é meia-noite de Brasília", () => {
    expect(new Date(startOfBrasiliaDay(NOW)).toISOString()).toBe("2026-11-13T03:00:00.000Z");
  });

  it("soma só pagamentos confirmados, por janela, e a parte da plataforma", () => {
    const m = sumMoney({
      ...base,
      otPaid: [{ amount: 30, at: ago(1), platformFee: 30 }, { amount: 30, at: ago(24 * 3) }],
      brisaPaid: [{ amount: 30, at: ago(24 * 20) }],
      consultPaid: [{ amount: 150, at: ago(2) }, { amount: 100, at: ago(24 * 40) }],
    });
    expect(m.today).toBe(180);
    expect(m.d7).toBe(210);
    expect(m.d30).toBe(240);
    expect(m.platform30).toBe(30 + 30 + 30 + 10.5); // Orientação inteira + 7% de R$ 150
  });

  it("assinaturas ativas somam a receita mensal", () => {
    expect(monthlyRecurring([{ amount: 99, planTier: "premium" }, { amount: 1500, planTier: "black" }])).toBe(1599);
  });
});

describe("Central de Comando — alertas", () => {
  it("sem problemas: tudo operando", () => {
    expect(computeAlerts(base)).toEqual([]);
    expect(overallSeverity([])).toBe("ok");
  });

  it("paciente na sala sem médico online é crítico e vem primeiro", () => {
    const a = computeAlerts({ ...base, doctorsOnline: 0, waitingRoom: 1, doctorsPendingApproval: 2 });
    expect(a[0].key).toBe("no-doctor");
    expect(a[0].severity).toBe("critical");
    expect(overallSeverity(a)).toBe("critical");
  });

  it("espera de 15 min ou mais com médico online gera atenção", () => {
    const a = computeAlerts({ ...base, waitingRoom: 1, oldestWaitingIso: new Date(NOW - 20 * 60_000).toISOString() });
    expect(a.map((x) => x.key)).toEqual(["long-wait"]);
  });

  it("bloqueio de valor e vigia grave são críticos; aviso falho é atenção", () => {
    const a = computeAlerts({ ...base, amountMismatch7d: 1, guardianOpen: [{ severity: "critical" }], notifyFailed: 2 });
    expect(a.filter((x) => x.severity === "critical").map((x) => x.key).sort()).toEqual(["guardian-critical", "mismatch"]);
    expect(a.find((x) => x.key === "notify")?.severity).toBe("warning");
  });

  it("WhatsApp parado mais de 3 h em horário comercial gera atenção; de madrugada não", () => {
    expect(computeAlerts({ ...base, lastWhatsAppInIso: ago(4) }).map((x) => x.key)).toEqual(["whatsapp"]);
    const madrugada = Date.UTC(2026, 10, 13, 6, 0, 0); // 03:00 em Brasília
    expect(computeAlerts({ ...base, nowMs: madrugada, lastWhatsAppInIso: new Date(madrugada - 5 * 3_600_000).toISOString() })).toEqual([]);
  });

  it("muitos Pix de Orientação pendentes geram atenção", () => {
    expect(computeAlerts({ ...base, otCreated24h: 4, otPending24h: 3 }).map((x) => x.key)).toEqual(["checkout"]);
    expect(computeAlerts({ ...base, otCreated24h: 10, otPending24h: 3 })).toEqual([]);
  });
});
