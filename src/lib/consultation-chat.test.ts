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
