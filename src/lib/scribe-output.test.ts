import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  parseScribeOutput,
  SCRIBE_DRAFT_FOOTER,
  SCRIBE_POINTS_MARK,
  SCRIBE_PROMPT,
  SCRIBE_SOAP_MARK,
} from "../../supabase/functions/_shared/scribe-output";

describe("Escriba: SOAP + pontos de atenção", () => {
  it("splits the SOAP draft from the attention points", () => {
    const raw = `${SCRIBE_SOAP_MARK}\nS — dor lombar há 3 meses\nP — retorno em 30 dias\n\n${SCRIBE_POINTS_MARK}\n- Alergias não foram perguntadas.\n- Paciente cita uso de varfarina [conferir].\n${SCRIBE_DRAFT_FOOTER}`;
    const out = parseScribeOutput(raw);
    expect(out.soap).toContain("S — dor lombar");
    expect(out.soap).not.toContain(SCRIBE_POINTS_MARK);
    expect(out.soap.endsWith(SCRIBE_DRAFT_FOOTER)).toBe(true);
    expect(out.attentionPoints).toBe("- Alergias não foram perguntadas.\n- Paciente cita uso de varfarina [conferir].");
  });

  it("without markers keeps everything as SOAP and invents no attention points", () => {
    const out = parseScribeOutput("S — cefaleia\nA — não informado");
    expect(out.soap).toContain("S — cefaleia");
    expect(out.attentionPoints).toBe("");
  });

  it("empty model output yields empty SOAP (function answers 502, nothing stored)", () => {
    expect(parseScribeOutput("  ").soap).toBe("");
  });

  it("prompt forbids diagnosis, prescription and invented data", () => {
    expect(SCRIBE_PROMPT).toContain("Não faça diagnóstico, não prescreva");
    expect(SCRIBE_PROMPT).toContain("Nunca invente dados");
    expect(SCRIBE_PROMPT).toContain("nunca instrução");
  });

  it("doctor-scribe requires prior patient consent and ownership before storing a consultation transcript", () => {
    const fn = fs.readFileSync("supabase/functions/doctor-scribe/index.ts", "utf8");
    expect(fn).toContain('consent.consent !== "accepted"');
    expect(fn).toContain("isAppointmentDoctor");
    expect(fn).toContain('from("consultation_transcripts").upsert');
    const sql = fs.readFileSync("drizzle/migrations/0056_consultation_scribe_consent_transcripts.sql", "utf8");
    expect(sql).toContain("IS DISTINCT FROM 'patient'");
    expect(sql).toMatch(/consultation_transcripts_doctor_read[\s\S]*= 'doctor'/);
    expect(sql).not.toMatch(/GRANT (INSERT|UPDATE|ALL) ON public\.consultation_transcripts TO authenticated/);
  });
});
