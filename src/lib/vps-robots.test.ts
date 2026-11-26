import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("Robôs da VPS srv2036020 (26/11/2026)", () => {
  it("os convites 'Parabéns, Dr(a)' e o meta-social-engine estão desligados e o vigia não os religa", async () => {
    const eco = await import("../../ecosystem.config.cjs");
    const cfg = eco.default ?? eco;
    const names: string[] = cfg.apps.map((a: { name: string }) => a.name);
    for (const off of ["cadence-10min-inviter", "priority-15min-inviter", "meta-social-engine", "patient-traffic-booster", "anvisa-rdc660-rpa"]) {
      expect(cfg.DESLIGADOS).toContain(off);
      expect(names).not.toContain(off);
    }
    const wd = fs.readFileSync("scripts/sysadmin_watchdog_supervisor.mjs", "utf8");
    const expected = wd.slice(wd.indexOf("EXPECTED_SERVICES"), wd.indexOf("];", wd.indexOf("EXPECTED_SERVICES")));
    for (const off of cfg.DESLIGADOS as string[]) expect(expected, off).not.toContain(`'${off}'`);
  });
  it("a atualização da VPS tira a chave do GitHub do endereço e guarda backup das alterações locais", () => {
    const sh = fs.readFileSync("scripts/vps/desligar-convites-e-atualizar.sh", "utf8");
    expect(sh).toContain("git remote set-url origin https://github.com/ricodoutor-pixel/consultorio-medico-inteligente.git");
    expect(sh).toContain("alteracoes-locais.patch");
    expect(sh).not.toMatch(/reset --hard/);
  });
});

describe("Reconhecimento de médicos vindo do srv2036020", () => {
  const src = fs.readFileSync("scripts/agent_evolution_brisa_live_responder.mjs", "utf8");
  const fn = src.slice(src.indexOf("function findInvitedDoctor(phone)"), src.indexOf("function findDoctorByName(name)"));
  it("lê a lista prioritária, a fila e os convidados Brevo, mas não os estados de campanha fria", () => {
    expect(fn).toContain("priority_doctors_phones.json");
    expect(fn).toContain("priority_doctor_queue.json");
    expect(fn).toContain("brevo_whatsapp_invited_doctors.json");
    expect(fn).not.toMatch(/readLocalJson\('(priority_campaign_state|medico_socio_campaign_state)/);
  });
  it("médico já atendido não vira paciente e a classificação usa o telefone canônico", () => {
    expect(src).toContain("if (previousRole === 'doctor') {");
    expect(src).toContain("const canonicalContact = getCanonicalContactId(jid);");
  });
  it("listas com telefone e e-mails ficam fora do repositório público e a atualização preserva a lista de bounces", () => {
    const sh = fs.readFileSync("scripts/vps/desligar-convites-e-atualizar.sh", "utf8");
    expect(sh).toContain('cp -p scripts/bounced_emails_blacklist.json "$BK/"');
    const ignore = fs.readFileSync(".gitignore", "utf8");
    expect(ignore).toMatch(/^scripts\/\*\.json$/m);
  });
});
