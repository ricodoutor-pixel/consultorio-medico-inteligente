import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDoctorAvailableSlots,
  getDoctorAvailableDays,
  createTemporarySlotHold,
  generateIcsCalendar,
  SPECIAL_DOCTOR_RULES,
} from "./doctor-schedule";
import { supabase } from "@/integrations/supabase/client";

describe("Doctor Schedule - Dr. Anderson Mikalauskas rules and booking", () => {
  const doctorSlug = "med-anderson-mikalauskas";

  beforeEach(() => {
    // Mock supabase RPC to return error immediately so tests test the sovereign fallback logic without network latency
    vi.spyOn(supabase, "rpc").mockImplementation(() => {
      return Promise.resolve({ data: null, error: { message: "Network disabled in unit test" } } as any);
    });
    vi.spyOn(supabase, "from").mockImplementation(() => {
      return {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any;
    });
  });

  it("should have SPECIAL_DOCTOR_RULES configured strictly without morning slots", () => {
    const rules = SPECIAL_DOCTOR_RULES[doctorSlug];
    expect(rules).toBeDefined();
    expect(rules.morningSlots).toEqual([]);
    expect(rules.afternoonSlots).toEqual(["13:00", "13:30"]);
    expect(rules.afternoonDays).toEqual([1, 2, 3, 4, 5]);
  });

  it("should generate afternoon and Monday evening slots for Dr. Anderson on a Monday", async () => {
    // 2026-11-02 is a Monday
    const monday = new Date("2026-11-02T10:00:00Z");
    const slots = await getDoctorAvailableSlots(doctorSlug, monday);

    const times = slots.map(s => s.timeSlot);
    expect(times).toContain("13:00");
    expect(times).toContain("13:30");
    expect(times).toContain("19:00");
    expect(times).toContain("19:30");

    // Must NEVER have morning slots
    const morningSlots = slots.filter(s => s.shift === "manha" || s.timeSlot < "12:00");
    expect(morningSlots).toHaveLength(0);
  });

  it("should generate afternoon and Tuesday evening slots (20:30, 21:00, 21:30) on a Tuesday", async () => {
    // 2026-11-03 is a Tuesday
    const tuesday = new Date("2026-11-03T10:00:00Z");
    const slots = await getDoctorAvailableSlots(doctorSlug, tuesday);

    const times = slots.map(s => s.timeSlot);
    expect(times).toContain("13:00");
    expect(times).toContain("13:30");
    expect(times).toContain("20:30");
    expect(times).toContain("21:00");
    expect(times).toContain("21:30");

    // Zero morning slots
    const morningSlots = slots.filter(s => s.timeSlot < "12:00");
    expect(morningSlots).toHaveLength(0);
  });

  it("should return zero slots on Sunday for Dr. Anderson", async () => {
    // 2026-11-01 is a Sunday
    const sunday = new Date("2026-11-01T10:00:00Z");
    const slots = await getDoctorAvailableSlots(doctorSlug, sunday);
    expect(slots).toHaveLength(0);
  });

  it("should return available days in the month correctly", async () => {
    const days = await getDoctorAvailableDays(doctorSlug, "2026-11");
    expect(Array.isArray(days)).toBe(true);
    expect(days.length).toBeGreaterThan(0);

    // Days with slots should have hasAvailableSlots = true
    const activeDays = days.filter(d => d.hasAvailableSlots);
    expect(activeDays.length).toBeGreaterThan(15);
  });

  it("should hold a slot temporarily with expiration", async () => {
    const res = await createTemporarySlotHold(doctorSlug, "2026-11-02", "13:00", "test-patient-id");
    expect(res.success).toBe(true);
  });

  it("should generate a valid RFC 5545 .ics calendar string", () => {
    const startDate = new Date("2026-11-02T16:00:00Z");
    const ics = generateIcsCalendar({
      title: "Teleconsulta Médica Canabinoide",
      description: "Consulta com Dr. Anderson Mikalauskas via Plataforma Planta y Raíz",
      startDate,
      locationUrl: "https://plantayraiz.com.br/workspace-medico",
      durationMinutes: 30,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Teleconsulta Médica Canabinoide");
    expect(ics).toContain("https://plantayraiz.com.br/workspace-medico");
    expect(ics).toContain("END:VCALENDAR");
  });
});
