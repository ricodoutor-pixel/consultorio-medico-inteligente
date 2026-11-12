/**
 * Jornada completa do paciente, sem burocracia, conferida etapa por etapa:
 * entra → paga → triagem → consulta (chat/vídeo) → avalia → recebe documentos → indica.
 * Usa as mesmas funções que as telas e o servidor usam para decidir cada passo.
 */
import { describe, expect, it } from "vitest";
import { consultationStage, faceToScore, consultationRoomName, type ConsultationSnapshot } from "./consultation-stage";
import { evaluateDoctorPresence } from "../../supabase/functions/_shared/consultation-queue";
import { freeAlertExpired, freeAlertKey, freeAlertText } from "../../supabase/functions/_shared/doctor-free-alerts";
import { scheduledReminderDue, returnReminderDue } from "../../supabase/functions/_shared/consultation-reminders";
import { parseTriageNotes } from "./clinical-summary";
import { doctorShareLinks } from "./doctor-share-links";

const TRIAGE_ID = "123e4567-e89b-12d3-a456-426614174000";
const TRIAGE_NOTES = `Triagem: ${TRIAGE_ID}

1. Sinais de alerta (emergência): Nenhum sinal de emergência
2. Queixa principal: Insônia (Tempo: 6 meses)
3. Intensidade (0 a 10): 7/10
4. Medicamentos contínuos / alergias: Nenhum
5. Objetivo principal: Dormir melhor`;

describe("Jornada do paciente: do link ao retorno", () => {
  const now = new Date("2026-11-12T15:00:00Z");
  let appt: ConsultationSnapshot = { payment_status: "pending", status: "pending", notes: null };

  it("1. o paciente chega pelo link do médico já com o médico escolhido", () => {
    const links = doctorShareLinks("https://plantayraiz.com.br/", "doc-1", "DRANA1");
    expect(links.video).toBe("https://plantayraiz.com.br/consulta/consulta_video?doctor=doc-1&ref=DRANA1");
  });

  it("2. sem pagamento confirmado pelo servidor, fica na etapa de pagamento", () => {
    expect(consultationStage(null, false)).toBe("payment");
    expect(consultationStage(appt, false)).toBe("payment");
    // Voltar do checkout ou clicar em "já paguei" não muda o estado gravado.
    expect(consultationStage({ ...appt, status: "confirmed" }, false)).toBe("payment");
  });

  it("3. pago (webhook), segue para a triagem de 5 perguntas", () => {
    appt = { ...appt, payment_status: "paid", status: "confirmed" };
    expect(consultationStage(appt, false)).toBe("triage");
  });

  it("4. triagem gravada e ligada à consulta: entra na sala", () => {
    appt = { ...appt, notes: TRIAGE_NOTES };
    expect(consultationStage(appt, false)).toBe("room");
    const t = parseTriageNotes(appt.notes);
    expect(t.complaint).toBe("Insônia");
    expect(t.intensity).toBe(7);
  });

  it("5. não dá para avaliar antes de o médico entrar", () => {
    expect(consultationStage(appt, false, true)).toBe("room");
  });

  it("6. médico entra (luz amarela para os outros pacientes) e a sala é a mesma dos dois lados", () => {
    appt = { ...appt, status: "in_progress" };
    expect(consultationStage(appt, false)).toBe("room");
    expect(consultationRoomName("abc")).toBe("plantayraiz-consultorio-abc");
    const busy = evaluateDoctorPresence({ user_id: "u", is_online: true, last_seen_online: now.toISOString(), in_consultation: true }, now.getTime());
    expect(busy.state).toBe("em_consulta");
    expect(busy.canReceiveOffers).toBe(false);
  });

  it("7. consulta encerrada: avaliação com 3 carinhas", () => {
    appt = { ...appt, status: "completed" };
    expect(consultationStage(appt, false)).toBe("rating");
    expect([faceToScore(1), faceToScore(2), faceToScore(3)]).toEqual([3, 7, 10]);
  });

  it("8. avaliou: recebe documentos e o link de indicação", () => {
    expect(consultationStage(appt, true)).toBe("referral");
  });

  it("9. outro paciente que pediu aviso recebe quando o médico fica livre (luz verde)", () => {
    const free = evaluateDoctorPresence({ user_id: "u", is_online: true, last_seen_online: now.toISOString(), in_consultation: false }, now.getTime());
    expect(free.state).toBe("online");
    expect(free.canReceiveOffers).toBe(true);
    expect(freeAlertText("https://x/profissionais/doc-1", "Dra. Ana")).toContain("Dra. Ana acabou de ficar disponível");
    expect(freeAlertKey("a1")).toBe("medico-livre:a1");
    expect(freeAlertExpired(new Date(now.getTime() - 2 * 3_600_000).toISOString(), now)).toBe(false);
    expect(freeAlertExpired(new Date(now.getTime() - 3 * 3_600_000).toISOString(), now)).toBe(true);
  });

  it("10. médico com botão OFF ou sem batimento nunca aparece verde", () => {
    const off = evaluateDoctorPresence({ user_id: "u", is_online: false, last_seen_online: now.toISOString() }, now.getTime());
    const stale = evaluateDoctorPresence({ user_id: "u", is_online: true, last_seen_online: new Date(now.getTime() - 10 * 60_000).toISOString() }, now.getTime());
    expect(off.isOnlineForVitrine).toBe(false);
    expect(stale.isOnlineForVitrine).toBe(false);
  });

  it("11. consulta agendada recebe lembretes e, 30 dias depois, o convite de retorno", () => {
    expect(scheduledReminderDue(new Date(now.getTime() + 30 * 60_000).toISOString(), now)).toBe("lembrete1h");
    expect(returnReminderDue(new Date(now.getTime() - 30.2 * 24 * 3_600_000).toISOString(), now)).toBe(true);
  });
});
