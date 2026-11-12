import { describe, it, expect } from "vitest";
import {
  type ConsultationChatRow,
  isConsultationAppointmentId,
  mergeConsultationMessages,
  normalizeConsultationMessage,
} from "./consultation-chat";

const row = (id: string, created_at: string, sender_type: ConsultationChatRow["sender_type"] = "patient"): ConsultationChatRow => ({
  id, appointment_id: "a", sender_type, sender_id: null, content: id, created_at,
});

describe("consultation live chat", () => {
  it("does not duplicate a message received by realtime and by reload", () => {
    const merged = mergeConsultationMessages([row("1", "2026-11-12T10:00:00Z")], [row("1", "2026-11-12T10:00:00Z")]);
    expect(merged).toHaveLength(1);
  });
  it("keeps doctor and patient messages in send order", () => {
    const merged = mergeConsultationMessages(
      [row("p2", "2026-11-12T10:02:00Z")],
      [row("d1", "2026-11-12T10:01:00Z", "doctor"), row("p3", "2026-11-12T10:03:00Z")],
    );
    expect(merged.map((m) => m.id)).toEqual(["d1", "p2", "p3"]);
  });
  it("rejects blank messages and caps length at the database limit", () => {
    expect(normalizeConsultationMessage("   ")).toBeNull();
    expect(normalizeConsultationMessage("x".repeat(5000))).toHaveLength(4000);
  });
  it("only real appointment ids open the chat", () => {
    expect(isConsultationAppointmentId("appt-sim-01")).toBe(false);
    expect(isConsultationAppointmentId("3f2b8c1e-1a2b-4c3d-9e8f-0a1b2c3d4e5f")).toBe(true);
  });
});

import { consultationFileError, consultationFilePath } from "./consultation-chat";
import { patientNoticeText } from "../../supabase/functions/_shared/consultation-queue";
import { CONSULTATION_DOCUMENTS, consultationDocumentLabel } from "./consultation-prescription";

describe("consultation chat attachments", () => {
  it("accepts photos and PDFs up to 10 MB only (same rules as the private bucket)", () => {
    expect(consultationFileError({ type: "application/pdf", size: 1024 })).toBeNull();
    expect(consultationFileError({ type: "image/jpeg", size: 10 * 1024 * 1024 })).toBeNull();
    expect(consultationFileError({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 })).not.toBeNull();
    expect(consultationFileError({ type: "application/zip", size: 10 })).not.toBeNull();
  });
  it("always stores files inside the consultation folder with a safe name", () => {
    const path = consultationFilePath("3f2b8c1e-1a2b-4c3d-9e8f-0a1b2c3d4e5f", "Exame de sangue (março).pdf", "u1");
    expect(path).toBe("3f2b8c1e-1a2b-4c3d-9e8f-0a1b2c3d4e5f/u1-Exame_de_sangue__marco_.pdf");
    expect(consultationFilePath("a", "../../etc/passwd", "u2").startsWith("a/u2-")).toBe(true);
    expect(consultationFilePath("a", "../../etc/passwd", "u2")).not.toContain("/etc/");
  });
});

describe("patient WhatsApp notices and consultation documents", () => {
  it("never includes health data and states the 12 h / 1 h promise", () => {
    expect(patientNoticeText("waiting_room", "https://x/c", false)).toContain("até 12 horas");
    expect(patientNoticeText("waiting_room", "https://x/c", true)).toContain("até 1 hora");
    expect(patientNoticeText("doctor_joined", "https://x/c", false)).toContain("seu médico entrou");
  });
  it("labels each signed document type for the patient", () => {
    expect(consultationDocumentLabel("atestado")).toBe("Atestado médico");
    expect(consultationDocumentLabel("solicitacao_exames")).toBe("Solicitação de exames");
    expect(consultationDocumentLabel(null)).toBe("Receita");
    expect(Object.keys(CONSULTATION_DOCUMENTS)).toEqual(["simples", "atestado", "solicitacao_exames"]);
  });
});
