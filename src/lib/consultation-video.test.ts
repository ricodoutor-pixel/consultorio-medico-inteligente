import { describe, expect, it, vi } from "vitest";
import { ConsultationVideoError, requestConsultationVideoAccess, type VideoTokenInvoke } from "./consultation-video";

const APPT = "11111111-2222-3333-4444-555555555555";
const noSleep = { sleep: async () => {} };

describe("requestConsultationVideoAccess", () => {
  it("returns the server room with its token", async () => {
    const invoke: VideoTokenInvoke = vi.fn(async () => ({
      data: { ok: true, domain: "meet.plantayraiz.com.br", roomName: `plantayraiz-consultorio-${APPT}`, jwt: "tok" },
      error: null,
    }));
    await expect(requestConsultationVideoAccess(invoke, APPT, noSleep)).resolves.toEqual({
      domain: "meet.plantayraiz.com.br",
      roomName: `plantayraiz-consultorio-${APPT}`,
      jwt: "tok",
    });
    expect(invoke).toHaveBeenCalledWith("consultation-video-token", { body: { appointmentId: APPT } });
  });

  it("retries transient failures and then succeeds", async () => {
    let calls = 0;
    const invoke: VideoTokenInvoke = async () => {
      calls++;
      if (calls === 1) throw new Error("network");
      if (calls === 2) return { data: null, error: new Error("500") };
      return { data: { ok: true, domain: "meet.plantayraiz.com.br", roomName: "r", jwt: null }, error: null };
    };
    await expect(requestConsultationVideoAccess(invoke, APPT, noSleep)).resolves.toEqual({
      domain: "meet.plantayraiz.com.br",
      roomName: "r",
      jwt: undefined,
    });
    expect(calls).toBe(3);
  });

  it("never falls back to another video server; surfaces the server message", async () => {
    const error = Object.assign(new Error("409"), {
      context: { json: async () => ({ error: "A sala abre quando a consulta paga estiver em andamento" }) },
    });
    const invoke = vi.fn(async () => ({ data: null, error })) as unknown as VideoTokenInvoke;
    const result = requestConsultationVideoAccess(invoke, APPT, { delaysMs: [1, 1], ...noSleep });
    await expect(result).rejects.toBeInstanceOf(ConsultationVideoError);
    await expect(requestConsultationVideoAccess(invoke, APPT, { delaysMs: [1, 1], ...noSleep })).rejects.toThrow(
      "A sala abre quando a consulta paga estiver em andamento",
    );
    expect(invoke).toHaveBeenCalledTimes(6);
  });

  it("patient and doctor screens no longer hardcode the public meet.jit.si fallback", async () => {
    const fs = await import("node:fs");
    for (const file of ["src/pages/ConsultaMedica.tsx", "src/pages/WorkspaceMedico.tsx"]) {
      const src = fs.readFileSync(file, "utf8");
      expect(src).toContain("requestConsultationVideoAccess");
      expect(src).not.toMatch(/setRoomInfo\(\{\s*roomName: `plantayraiz-consultorio-\$\{appointmentId\}`, domain: "meet\.jit\.si"/);
      expect(src).not.toMatch(/setVideoAccess\(\{ domain: "meet\.jit\.si"/);
    }
  });
});
