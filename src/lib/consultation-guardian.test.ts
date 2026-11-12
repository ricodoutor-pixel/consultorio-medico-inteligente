import { describe, expect, it } from "vitest";
import {
  appendMarker,
  GUARDIAN_AUTO_CLOSE_MARKER,
  guardianDedupeKey,
  minutesAgoIso,
  shouldAutoClose,
} from "../../supabase/functions/_shared/consultation-guardian";

describe("guardião das consultas", () => {
  const now = new Date("2026-11-12T15:00:00Z");

  it("só encerra sozinho consulta aberta há mais de 3 h e sem conversa na última hora", () => {
    expect(shouldAutoClose(minutesAgoIso(now, 60), null, now)).toBe(false);
    expect(shouldAutoClose(minutesAgoIso(now, 200), null, now)).toBe(true);
    expect(shouldAutoClose(minutesAgoIso(now, 200), minutesAgoIso(now, 10), now)).toBe(false);
    expect(shouldAutoClose(minutesAgoIso(now, 200), minutesAgoIso(now, 90), now)).toBe(true);
    expect(shouldAutoClose("data inválida", null, now)).toBe(false);
  });

  it("gera um alerta por problema e no máximo um por hora para o vídeo", () => {
    expect(guardianDedupeKey("paid_waiting_too_long", "abc", now)).toBe("paid_waiting_too_long:abc");
    const a = guardianDedupeKey("video_server_down", "meet", now);
    const b = guardianDedupeKey("video_server_down", "meet", new Date("2026-11-12T15:59:00Z"));
    const c = guardianDedupeKey("video_server_down", "meet", new Date("2026-11-12T16:01:00Z"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("não duplica a marca de encerramento automático", () => {
    const once = appendMarker("Triagem: x", GUARDIAN_AUTO_CLOSE_MARKER);
    expect(once).toBe(`Triagem: x\n${GUARDIAN_AUTO_CLOSE_MARKER}`);
    expect(appendMarker(once, GUARDIAN_AUTO_CLOSE_MARKER)).toBe(once);
    expect(appendMarker(null, GUARDIAN_AUTO_CLOSE_MARKER)).toBe(GUARDIAN_AUTO_CLOSE_MARKER);
  });
});
