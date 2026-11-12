import { describe, expect, it } from "vitest";
import {
  formatBrasilia,
  reminderKey,
  reminderText,
  returnReminderDue,
  scheduledReminderDue,
} from "../../supabase/functions/_shared/consultation-reminders";
import { financeTotals, monthLabel } from "./doctor-finance";

const now = new Date("2026-11-12T15:00:00Z");
const inMinutes = (m: number) => new Date(now.getTime() + m * 60_000).toISOString();

describe("lembretes de consulta", () => {
  it("escolhe o lembrete certo pelo tempo que falta", () => {
    expect(scheduledReminderDue(inMinutes(60), now)).toBe("lembrete1h");
    expect(scheduledReminderDue(inMinutes(90), now)).toBeNull();
    expect(scheduledReminderDue(inMinutes(180), now)).toBe("lembrete24h");
    expect(scheduledReminderDue(inMinutes(24 * 60), now)).toBe("lembrete24h");
    expect(scheduledReminderDue(inMinutes(25 * 60), now)).toBeNull();
    expect(scheduledReminderDue(inMinutes(-5), now)).toBeNull();
    expect(scheduledReminderDue("data ruim", now)).toBeNull();
  });

  it("convida para o retorno só no 30º dia", () => {
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3_600_000).toISOString();
    expect(returnReminderDue(daysAgo(29.9), now)).toBe(false);
    expect(returnReminderDue(daysAgo(30), now)).toBe(true);
    expect(returnReminderDue(daysAgo(30.5), now)).toBe(true);
    expect(returnReminderDue(daysAgo(31), now)).toBe(false);
  });

  it("mostra a hora de Brasília e não cita dados clínicos", () => {
    expect(formatBrasilia("2026-11-13T18:30:00Z")).toContain("15:30");
    const text = reminderText("lembrete24h", { whenIso: "2026-11-13T18:30:00Z", link: "https://x/sala", doctorName: "Dra. Ana" });
    expect(text).toContain("Dra. Ana");
    expect(text).toContain("https://x/sala");
    expect(reminderText("retorno30d", { link: "https://x/retorno" })).toContain("30 dias");
    expect(reminderKey("abc", "lembrete1h")).toBe("consulta:abc:paciente:lembrete1h");
  });
});

describe("financeiro do consultório", () => {
  it("formata o mês e soma os totais", () => {
    expect(monthLabel("2026-11-01")).toBe("nov/26");
    const rows = [
      { month: "2026-11-01", released_count: 2, released_amount: 186, withdrawn_net: 95, withdrawn_fee: 5, withdrawals_pending: 0 },
      { month: "2026-10-01", released_count: 1, released_amount: 93.1, withdrawn_net: 0, withdrawn_fee: 0, withdrawals_pending: 50 },
    ];
    expect(financeTotals(rows)).toEqual({ currentMonth: 186, year: 279.1, consultations: 3, withdrawn: 95 });
    expect(financeTotals([]).currentMonth).toBe(0);
  });
});

import {
  brasiliaParts,
  dailyAgendaDue,
  dailyAgendaKey,
  dailyAgendaText,
  waitlistKey,
  waitlistText,
} from "../../supabase/functions/_shared/consultation-reminders";

describe("lista de espera e agenda do dia", () => {
  it("usa a data e a hora de Brasília", () => {
    expect(brasiliaParts(new Date("2026-11-13T02:30:00Z"))).toEqual({
      date: "2026-11-12",
      hour: 23,
      month: "2026-11",
      nextMonth: "2026-12",
    });
    expect(brasiliaParts(new Date("2026-12-31T12:00:00Z")).nextMonth).toBe("2027-01");
  });

  it("envia o resumo do médico só na janela das 7 h", () => {
    expect(dailyAgendaDue(new Date("2026-11-12T10:05:00Z"))).toBe(true);
    expect(dailyAgendaDue(new Date("2026-11-12T11:00:00Z"))).toBe(false);
    expect(dailyAgendaKey("doc", "2026-11-12")).toBe("medico:doc:agenda:2026-11-12");
  });

  it("monta as mensagens sem dados de pacientes", () => {
    const agenda = dailyAgendaText(["09:00", "14:30"], "https://x/consultorio", "Dra. Ana");
    expect(agenda).toContain("2 teleconsulta(s)");
    expect(agenda).toContain("09:00, 14:30");
    expect(waitlistText("https://x/agendamento", "Dr. João")).toContain("lista de espera");
    expect(waitlistKey("w1")).toBe("lista-espera:w1");
  });
});
