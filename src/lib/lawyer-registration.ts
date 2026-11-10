import { z } from "zod";

export const BRAZIL_STATES = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export const lawyerRegistrationSchema = z.object({
  full_name: z.string().trim().min(3).max(160),
  oab_number: z.string().regex(/^[0-9]{1,10}$/, "Informe somente os números da OAB"),
  oab_state: z.string().refine(v => BRAZIL_STATES.includes(v), "Selecione a UF da OAB"),
  city: z.string().trim().max(100),
  bio: z.string().trim().max(2000),
});
export const lawyerFeeSchema = z.coerce.number().finite().positive().max(9999999999.99);
export const legalTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });