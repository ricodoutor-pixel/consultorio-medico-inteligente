import { describe, expect, it } from "vitest";
import { lawyerFeeSchema, lawyerRegistrationSchema } from "./lawyer-registration";

describe("cadastro jurídico independente", () => {
  it("aceita honorários próprios sem impor R$150 da consulta médica", () => {
    expect(lawyerFeeSchema.parse(450)).toBe(450);
    expect(lawyerFeeSchema.parse(275.50)).toBe(275.50);
    expect(lawyerFeeSchema.safeParse(0).success).toBe(false);
  });
  it("exige número e UF da OAB, não CRM", () => {
    const profile = { full_name: "Advogado", oab_number: "123456", oab_state: "SP", city: "", bio: "" };
    expect(lawyerRegistrationSchema.safeParse(profile).success).toBe(true);
    expect(lawyerRegistrationSchema.safeParse({ ...profile, oab_number: "CRM123" }).success).toBe(false);
    expect(lawyerRegistrationSchema.safeParse({ ...profile, oab_state: "XX" }).success).toBe(false);
  });
});