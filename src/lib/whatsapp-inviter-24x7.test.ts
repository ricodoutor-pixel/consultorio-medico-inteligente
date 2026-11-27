import { describe, expect, it, beforeAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Ordem do Dr. Edilson (27/11/2026): convites 24x7 a cada 15 min, nunca repetir número, assinatura Enfª Brisa.
let m: typeof import("../../scripts/agent_brevo_doctor_whatsapp_inviter.mjs");
beforeAll(async () => {
  process.env.BRISA_NO_AUTOSTART = "1";
  delete process.env.OUTREACH_HOURS;
  m = await import("../../scripts/agent_brevo_doctor_whatsapp_inviter.mjs");
});

describe("Convites WhatsApp 24x7", () => {
  it("sem OUTREACH_HOURS envia em qualquer dia e hora; cadência continua 15 min", () => {
    expect(m.isWithinBusinessHours(new Date("2026-11-27T06:00:00Z"))).toBe(true); // sex 03:00 BRT
    expect(m.isWithinBusinessHours(new Date("2026-11-29T15:00:00Z"))).toBe(true); // dom 12:00 BRT
    expect(m.CADENCE_MS).toBe(15 * 60 * 1000);
  });
  it("quem já recebeu convite das campanhas antigas (priority-15min e cadence-10min) nunca recebe de novo", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pyr-inviter-"));
    fs.writeFileSync(path.join(dir, "priority_campaign_state.json"), JSON.stringify({ sentWhatsapps: [{ phone: "5521987654321" }] }));
    fs.writeFileSync(path.join(dir, "medico_socio_campaign_state.json"), JSON.stringify({
      sentWhatsapps: ["5511912345678"],
      history: { "Dr X": { phone: "5531999998888", whatsappAt: "2026-11-20T12:00:00Z", status: "ENVIADO" } },
    }));
    const set = m.loadPreviousCampaignPhones(dir);
    for (const p of ["5521987654321", "5511912345678", "5531999998888"]) {
      expect([...set].some((k) => k.endsWith(p.slice(-8))), p).toBe(true);
    }
    expect(m.loadPreviousCampaignPhones(path.join(dir, "nao-existe")).size).toBe(0);
  });
  it("o convite se identifica como assistente virtual, oferece SAIR e é assinado pela Enfª Brisa, marketing médico", () => {
    const msg = m.buildInvitationMessage("Maria Souza", { crmConfirmed: false });
    expect(msg).toContain("Enfª Brisa, assistente virtual");
    expect(msg).toContain("responda SAIR");
    expect(msg.trim().endsWith("— Enfª Brisa, marketing médico")).toBe(true);
    expect(msg).not.toMatch(/Dr\(a\)\./); // sem CRM confirmado, nunca "Dr(a)."
  });
});
