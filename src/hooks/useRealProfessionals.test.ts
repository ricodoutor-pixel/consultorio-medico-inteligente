import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  doctors: [] as unknown[],
  stored: [] as unknown[],
  effect: undefined as (() => unknown) | undefined,
  stateIndex: 0,
  from: vi.fn(),
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => unknown) => { harness.effect = effect; },
  useMemo: (calculate: () => unknown) => calculate(),
  useState: () => {
    const index = harness.stateIndex++;
    if (index === 0) return [harness.stored, (value: unknown[]) => { harness.stored = value; }];
    // 2º estado: notas públicas reais (doctor_public_ratings), vazias no teste.
    if (index === 1) return [new Map(), vi.fn()];
    return [false, vi.fn()];
  },
}));
vi.mock("@/lib/visible-interval", () => ({ setVisibleInterval: () => vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: harness.from,
    channel: () => {
      const channel = { on: () => channel, subscribe: () => channel };
      return channel;
    },
    removeChannel: vi.fn(),
  },
}));

import { useRealProfessionals } from "./useRealProfessionals";

describe("Patient-visible medical presence", () => {
  beforeEach(() => {
    harness.stateIndex = 0;
    harness.stored = [];
    harness.effect = undefined;
    harness.doctors = [{
      id: "public-doctor", user_id: "doctor-account", crm: "58169",
      full_name: "Dr. Milton Dimas Tadeu Urban", is_online: true,
      is_available: true, last_seen_online: new Date().toISOString(),
    }];
    harness.from.mockReset();
    harness.from.mockImplementation((table: string) => {
      if (table === "doctors_public") {
        return { select: () => Promise.resolve({ data: harness.doctors, error: null }) };
      }
      if (table === "appointments") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      }
      throw new Error(`Private table read: ${table}`);
    });
  });

  async function loadList() {
    useRealProfessionals();
    harness.effect?.();
    await vi.waitFor(() => expect(harness.stored).toHaveLength(1));
    harness.stateIndex = 0;
    return useRealProfessionals().professionals.find(p => p.dbId === "public-doctor");
  }

  it("shows an ON doctor with a fresh public heartbeat online without private reads", async () => {
    const doctor = await loadList();
    expect(doctor?.online).toBe(true);
    expect(doctor?.presenceState).toBe("online");
    expect(harness.from.mock.calls.map(([table]) => table)).toEqual(["doctors_public", "appointments"]);
  });

  it("does not turn a stale ON flag into real availability", async () => {
    harness.doctors = [{ ...(harness.doctors[0] as object), last_seen_online: new Date(Date.now() - 125_000).toISOString() }];
    expect((await loadList())?.online).toBe(false);
  });

  it("keeps an OFF doctor offline even with a recent public heartbeat", async () => {
    harness.doctors = [{ ...(harness.doctors[0] as object), is_online: false }];
    expect((await loadList())?.online).toBe(false);
  });
});