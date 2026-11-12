import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { searchCid10, formatCid, type Cid10Item } from "./cid10";
import {
  brasiliaDayStartIso,
  dailyLimit,
  isPaidPlan,
  DOCTOR_AI_DAILY_LIMITS,
} from "../../supabase/functions/_shared/doctor-kit";

describe("Kit do Assinante", () => {
  it("só planos diferentes de free são pagos", () => {
    expect(isPaidPlan("free")).toBe(false);
    expect(isPaidPlan(null)).toBe(false);
    expect(isPaidPlan("")).toBe(false);
    expect(isPaidPlan("vip")).toBe(true);
    expect(isPaidPlan("VIP_PRESCRITOR")).toBe(true);
    expect(isPaidPlan("premium")).toBe(true);
  });

  it("aplica 10 perguntas jurídicas por dia ao assinante e nenhuma ao plano free", () => {
    expect(dailyLimit("juridico", { paid: true, admin: false })).toBe(10);
    expect(dailyLimit("juridico", { paid: false, admin: false })).toBe(0);
    expect(dailyLimit("copiloto", { paid: true, admin: false })).toBe(DOCTOR_AI_DAILY_LIMITS.copiloto.paid);
    expect(dailyLimit("copiloto", { paid: false, admin: false })).toBe(DOCTOR_AI_DAILY_LIMITS.copiloto.free);
  });

  it("renova à meia-noite de Brasília", () => {
    expect(brasiliaDayStartIso(new Date("2026-11-12T02:59:00Z"))).toBe("2026-11-11T03:00:00.000Z");
    expect(brasiliaDayStartIso(new Date("2026-11-12T03:00:00Z"))).toBe("2026-11-12T03:00:00.000Z");
    expect(brasiliaDayStartIso(new Date("2026-11-12T23:30:00Z"))).toBe("2026-11-12T03:00:00.000Z");
  });
});

describe("CID-10 oficial", () => {
  const items = (JSON.parse(readFileSync("public/data/cid10.json", "utf8")) as { itens: Cid10Item[] }).itens;

  it("tem a tabela completa do DATASUS", () => {
    expect(items.length).toBeGreaterThan(14000);
  });

  it("encontra por código, com ou sem ponto", () => {
    expect(searchCid10(items, "G43.9")[0][0]).toBe("G43.9");
    expect(searchCid10(items, "f411")[0][0]).toBe("F41.1");
    expect(searchCid10(items, "G43").every((i) => i[0].startsWith("G43"))).toBe(true);
  });

  it("encontra por palavras sem acento", () => {
    const hits = searchCid10(items, "ansiedade generalizada");
    expect(hits.some((i) => i[0] === "F41.1")).toBe(true);
    expect(searchCid10(items, "enxaqueca").length).toBeGreaterThan(3);
    expect(searchCid10(items, "a")).toEqual([]);
  });

  it("formata para o prontuário", () => {
    expect(formatCid(["F41.1", "Ansiedade generalizada"])).toBe("F41.1 - Ansiedade generalizada");
  });
});
