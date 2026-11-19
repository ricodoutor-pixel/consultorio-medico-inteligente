import { describe, expect, it } from "vitest";
import { isPublicProfessionalVisible } from "./public-professional-visibility";

describe("explicit public withdrawals", () => {
  it("excludes Leuma by card, full name and CRM/MG even with a backend ID", () => {
    expect(isPublicProfessionalVisible({ id: "med-leuma-netta" })).toBe(false);
    expect(isPublicProfessionalVisible({ id: "db-real", name: "Dra. Leuma Leão Netta" })).toBe(false);
    expect(isPublicProfessionalVisible({ id: "real", crm: "85182", crm_state: "MG" })).toBe(false);
    expect(isPublicProfessionalVisible({ crm: "85182/SP" })).toBe(true);
  });
  it("excludes Ana Paula by card, full name and CRM/PR without excluding other Ana Paulas", () => {
    expect(isPublicProfessionalVisible({ id: "med-ana-paula" })).toBe(false);
    expect(isPublicProfessionalVisible({ full_name: "Dra. Ana Paula Ferreira Lima" })).toBe(false);
    expect(isPublicProfessionalVisible({ crm: "36942 - PR" })).toBe(false);
    expect(isPublicProfessionalVisible({ name: "Dra. Ana Paula Silva", crm: "36942/SP" })).toBe(true);
  });
});
import { describe as d2, it as i2, expect as e2 } from "vitest";
import { isPublicProfessionalVisible as vis } from "./public-professional-visibility";
d2("showcase pauses (28/10/2026)", () => {
  i2("keeps Dra. Suelen visible", () => e2(vis({ id: "mock-suelen", name: "Dra. Suelen Naves Rodrigues" })).toBe(true));
  i2("pauses Dra. Olivia and Dr. Edilson", () => {
    e2(vis({ id: "mock-olivia", name: "Dra. Olivia Zimeri" })).toBe(false);
    e2(vis({ name: "Dr. Edilson Bezerra da Silva" })).toBe(false);
  });
  i2("pauses Dr. Gustavo Nobre Damiani Pereira (CRM 35632/PR) without affecting Dr. Gustavo Simoes", () => {
    e2(vis({ id: "med-gustavo-nobre" })).toBe(false);
    e2(vis({ id: "db-real", name: "Dr. Gustavo Nobre Damiani Pereira" })).toBe(false);
    e2(vis({ crm: "35632/PR (Regular)" })).toBe(false);
    e2(vis({ crm: "35632", crm_state: "PR" })).toBe(false);
    e2(vis({ id: "med-gustavo-simoes", name: "Dr. Gustavo Simoes Llivi Ibanez", crm: "7684/RO" })).toBe(true);
    e2(vis({ crm: "35632/SP" })).toBe(true);
  });
});
