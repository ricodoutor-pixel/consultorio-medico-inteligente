import { describe, expect, it } from "vitest";
import { consentLine, formatElapsed, joinTranscript, pickAudioMimeType, SCRIBE_CHUNK_MS, SCRIBE_MAX_MS } from "./scribe";
import { dailyLimit } from "../../supabase/functions/_shared/doctor-kit";

describe("escriba de IA", () => {
  it("escolhe o primeiro formato de áudio suportado", () => {
    expect(pickAudioMimeType((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(pickAudioMimeType((t) => t.startsWith("audio/webm"))).toBe("audio/webm;codecs=opus");
    expect(pickAudioMimeType(() => false)).toBeUndefined();
    expect(pickAudioMimeType(() => { throw new Error("x"); })).toBeUndefined();
  });

  it("junta os trechos na ordem da gravação", () => {
    expect(joinTranscript([{ index: 1, text: "segundo" }, { index: 0, text: " primeiro " }, { index: 2, text: "  " }])).toBe("primeiro\nsegundo");
  });

  it("registra o consentimento do paciente no prontuário", () => {
    const line = consentLine("consulta", new Date("2026-11-12T18:00:00Z"));
    expect(line).toContain("paciente autorizou");
    expect(line).toContain("Áudio não armazenado");
    expect(consentLine("ditado", new Date())).toContain("ditado do médico");
  });

  it("grava em trechos de 4,5 min e para aos 50 min", () => {
    expect(SCRIBE_CHUNK_MS).toBe(270_000);
    expect(SCRIBE_MAX_MS).toBe(3_000_000);
    expect(formatElapsed(125_000)).toBe("02:05");
    expect(dailyLimit("escriba", { paid: true, admin: false })).toBe(150);
  });
});
