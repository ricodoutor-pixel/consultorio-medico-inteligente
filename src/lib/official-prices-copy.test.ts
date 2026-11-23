import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { analyzeUserIntent, BRISA_SYSTEM_PROMPT } from "./brisaMasterEngine";
import { PLAN_FEATURES, SERVICES } from "./pricing";

describe("Preços e promessas seguem o catálogo oficial", () => {
  it("Brisa master engine quotes only catalog prices and no fixed doctor list", () => {
    expect(analyzeUserIntent("quero consulta por vídeo").value).toBe(SERVICES.consulta_video.price);
    expect(analyzeUserIntent("prefiro chat").value).toBe(SERVICES.consulta_chat.price);
    expect(analyzeUserIntent("orientação técnica").value).toBe(SERVICES.orientacao_tecnica.price);
    expect(analyzeUserIntent("é uma emergência").detectedModality).toBe("NONE");
    expect(BRISA_SYSTEM_PROMPT).not.toMatch(/R\$ ?(250|350)/);
    expect(BRISA_SYSTEM_PROMPT).not.toContain("Olivia");
    expect(BRISA_SYSTEM_PROMPT).toContain("R$ 150");
  });

  it("doctor plan features never promise zero fee or 100% payout", () => {
    const all = Object.values(PLAN_FEATURES).flat().join(" ");
    expect(all).not.toMatch(/0%|100%|taxa zero/i);
    expect(PLAN_FEATURES.plano_medico.join(" ")).toContain("7%");
  });

  it("web chat never sells a paid emergency consultation", () => {
    expect(fs.readFileSync("supabase/functions/brisa-web-chat/index.ts", "utf8")).not.toMatch(/Emergência R\$ ?350/);
  });

  it("the simulated /telemed-whatsapp flow is retired and no screen links to it", () => {
    const app = fs.readFileSync("src/App.tsx", "utf8");
    expect(app).toMatch(/path="\/telemed-whatsapp" element=\{<Navigate to="\/profissionais" replace \/>\}/);
    expect(app).not.toContain('import("./pages/TelemedWhatsApp")');
    for (const f of ["src/pages/Consultorio.tsx", "src/pages/DashboardMedico.tsx", "src/pages/DashboardPaciente.tsx"]) {
      expect(fs.readFileSync(f, "utf8")).not.toContain("/telemed-whatsapp");
    }
  });
});
