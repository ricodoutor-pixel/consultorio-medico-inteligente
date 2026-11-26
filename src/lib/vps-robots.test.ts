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
