import { describe, expect, it } from "vitest";
import { consultationStage, canRateConsultation, faceToScore, roomFromUrl } from "./consultation-stage";

const triage = "Triagem: 3f1c2b9a-1111-4222-8333-944455556666";
const base = { payment_status: "paid", status: "scheduled", notes: triage, room_url: null as string | null };

describe("consulta paga em página única", () => {
  it("pagamento pendente fica no Pix", () => {
    expect(consultationStage({ ...base, payment_status: "pending" }, false)).toBe("payment");
  });
  it("pago sem triagem abre as 5 perguntas", () => {
    expect(consultationStage({ ...base, notes: "Triagem: pendente (após pagamento)" }, false)).toBe("triage");
  });
  it("pago com triagem vai para a sala", () => {
    expect(consultationStage(base, false)).toBe("room");
  });
  it("não avalia se o médico nunca abriu a sala", () => {
    expect(consultationStage({ ...base, status: "completed" }, false)).toBe("room");
    expect(canRateConsultation(base)).toBe(false);
  });
  it("consulta encerrada pelo médico abre a avaliação", () => {
    expect(consultationStage({ ...base, status: "completed", room_url: "https://meet.jit.si/pyr-x" }, false)).toBe("rating");
  });
  it("depois da avaliação mostra o link de indicação", () => {
    expect(consultationStage({ ...base, status: "completed", room_url: "https://meet.jit.si/pyr-x" }, true)).toBe("referral");
  });
  it("carinhas viram nota", () => {
    expect([faceToScore(1), faceToScore(2), faceToScore(3)]).toEqual([3, 7, 10]);
  });
  it("lê a sala do endereço salvo", () => {
    expect(roomFromUrl("https://meet.jit.si/pyr-abc-12")).toEqual({ domain: "meet.jit.si", roomName: "pyr-abc-12" });
  });
});
