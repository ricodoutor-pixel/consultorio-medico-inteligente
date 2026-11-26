import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  T,
  OT_DESCRIPTION,
  FORBIDDEN_PHRASES,
  PATIENT_PAY_LINK,
  TECH_SUPERVISOR,
} from "../../supabase/functions/_shared/brisa-templates.mjs";
import { quickResponse } from "../../supabase/functions/_shared/brisa-response-policy.mjs";
import { EDILSON_ON_SUPERVISION, FOUNDER_LINE } from "./edilson-on";

describe("Casos reais do WhatsApp (auditoria 25/11/2026)", () => {
  it("figurinha do Adilson: sem resposta", () => {
    expect(quickResponse({ question: "", senderName: "Adilson", isSticker: true })?.suppressed).toBe(true);
    expect(quickResponse({ question: "👍🏽", senderName: "Adilson" })?.suppressed).toBe(true);
  });
  it("médico André pedindo documentos: lista curta e link de cadastro", () => {
    const r = quickResponse({ question: "Quais documentos preciso enviar?", senderName: "Dr. André", role: "doctor" });
    expect(r?.model).toBe("doctor-documents");
    expect(r?.answer).toMatch(/CRM ativo/);
    expect(r?.answer).toContain("cadastro-profissional");
  });
  it("autoatendimento de empresas e consultórios: nunca responde", () => {
    for (const q of [
      "Olá! Seja bem-vindo(a) à PC&P Contabilidade. Digite o número do setor desejado.",
      "RBR Assessoria Contábil agradece seu contato. Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.",
      "Clínica Burgos: digite o número da opção desejada. 1 - Agendamento 2 - Financeiro",
      "Consultório Médico — este número é exclusivo para urgências.",
    ]) {
      expect(quickResponse({ question: q })?.suppressed, q).toBe(true);
    }
  });
  it("fisioterapeuta perguntando se paga: verdade sobre custo, sem promessa", () => {
    const r = quickResponse({ question: "não pago nada pra isso?", role: "unknown" });
    expect(r?.model).toBe("professional-cost");
    expect(r?.answer).toContain("gratuito");
    expect(r?.answer).toContain("7%");
    expect(r?.answer).not.toMatch(/renda|ganhe|lucro/i);
  });
  it("paciente mandando áudio: uma resposta pedindo texto", () => {
    expect(quickResponse({ isAudio: true })?.answer).toBe(T.audio);
  });
  it('"SAIR" registra opt-out', () => {
    const r = quickResponse({ question: "SAIR" });
    expect(r?.optOut).toBe(true);
    expect(r?.answer).toBe(T.optOut);
  });
});

describe("Identidade e textos oficiais", () => {
  it("a IA não usa nome de médico; supervisão técnica é a da Dra. Suelen, igual ao rodapé", () => {
    expect(TECH_SUPERVISOR).toBe("Dra. Suelen Naves Rodrigues (CRM 49354/PR)");
    expect(EDILSON_ON_SUPERVISION).toContain("Enfª Brisa é uma assistente virtual");
    expect(EDILSON_ON_SUPERVISION).toContain(TECH_SUPERVISOR);
    expect(EDILSON_ON_SUPERVISION).not.toMatch(/Edilson|10963/);
    expect(OT_DESCRIPTION).not.toMatch(/Edilson/);
    expect(FOUNDER_LINE).toContain("mais de 10 anos de experiência em medicina integrativa");
    const footer = fs.readFileSync("src/components/Footer.tsx", "utf8");
    expect(footer).toContain("Dra. Suelen Naves Rodrigues (CRM 49354/PR)");
  });
  it("convite a médico: curto, assinado, com SAIR e sem promessa", () => {
    const msg = T.doctorInvite("Ana");
    expect(msg).toContain("responda SAIR");
    expect(msg).toContain("Enfª Brisa, marketing médico");
    expect(msg).not.toMatch(/selecionad|sócio|lucro|renda|R\$ ?\d{2}\.\d{3}/i);
  });
  it("todo template oficial passa pela lista de frases proibidas", () => {
    const all = Object.values(T).map((v) => (typeof v === "function" ? v("Teste") : v)).concat(OT_DESCRIPTION);
    for (const text of all) for (const re of FORBIDDEN_PHRASES) expect(text, String(re)).not.toMatch(re);
    expect(all.every((t) => !/\/orientacao-tecnica[^?]/.test(t) || t.includes(PATIENT_PAY_LINK))).toBe(true);
  });
});

// Arquivos com texto que o agente envia ou que orienta a IA. Linhas de comentário e listas de
// "nunca diga" (que citam a frase proibida justamente para proibi-la) não contam.
const AGENT_TEXT_FILES = [
  "supabase/functions/_shared/brisa-response-policy.mjs",
  "supabase/functions/_shared/brisa-templates.mjs",
  "supabase/functions/_shared/agents.ts",
  "supabase/functions/_shared/brisa-persona.ts",
  "supabase/functions/_shared/clinic-info.ts",
  "supabase/functions/chat-brisa/index.ts",
  "supabase/functions/brisa-bot/index.ts",
  "supabase/functions/brisa-web-chat/index.ts",
  "supabase/functions/brisa-triage/index.ts",
  "supabase/functions/brisa-voice-chat/index.ts",
  "supabase/functions/ot-edilson-web/index.ts",
  "supabase/functions/dr-edilson-clinical-support/index.ts",
  "supabase/functions/clinical-copilot/index.ts",
  "supabase/functions/brisa-daily-summary/index.ts",
  "supabase/functions/send-doctor-welcome-whatsapp/index.ts",
  "supabase/functions/send-invite-campaign/index.ts",
  "supabase/functions/admin-send-invites/index.ts",
  "supabase/functions/funnel-recovery/index.ts",
  "supabase/functions/growth-engine/index.ts",
  "supabase/functions/lead-invite-orientacao/index.ts",
  "supabase/functions/retention-engine/index.ts",
  "supabase/functions/mercadopago-webhook/index.ts",
  "supabase/functions/payments-webhook/index.ts",
  "supabase/functions/admin-lead-status-update/index.ts",
  "supabase/functions/ebook-capture/index.ts",
  "supabase/functions/verdinho-chat/index.ts",
  "scripts/agent_evolution_brisa_live_responder.mjs",
  "scripts/agent_brevo_doctor_whatsapp_inviter.mjs",
  "scripts/agent_brevo_multi_pipeline.mjs",
  "scripts/agent_cadence_10min_inviter.mjs",
  "scripts/agent_hostinger_email_dispatcher.mjs",
  "scripts/whatsapp-bot.cjs",
  "scripts/crm/03_whatsapp-crm-engine.mjs",
  "scripts/crm/04_autonomous-growth-engine.mjs",
  "src/lib/edilson-on.ts",
  "src/lib/brisaMasterEngine.ts",
  "src/lib/brisa-voice-fallback.ts",
  "src/pages/ManualPlataforma.tsx",
  "src/pages/MedSocio.tsx",
  "src/components/doctor/DoctorShareLinks.tsx",
  "src/pages/Index.tsx",
  "src/pages/Telemedicina.tsx",
  "src/pages/OrientacaoTecnicaAgente.tsx",
  "src/components/HomeFAQ.tsx",
];
const isCommentOrProhibition = (line: string) =>
  /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line) ||
  /(proibid|nunca|n[ãa]o (diga|use|fale|cite|existe)|^\s*- dizer|dizer ")/i.test(line) ||
  /FORBIDDEN_PHRASES|\.includes\(|\.replace\(/.test(line);

describe("Nenhum texto ativo do agente contém frase proibida", () => {
  for (const file of AGENT_TEXT_FILES) {
    it(file, () => {
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => !isCommentOrProhibition(l));
      const text = lines.join("\n");
      for (const re of FORBIDDEN_PHRASES) {
        if (file.endsWith("brisa-templates.mjs")) continue; // a própria lista
        expect(text, `${file}: ${re}`).not.toMatch(re);
      }
    });
  }
  it("relatórios emitidos antes da troca mantêm o cabeçalho original (sem reescrever documento)", () => {
    const rel = fs.readFileSync("src/pages/OrientacaoRelatorio.tsx", "utf8");
    expect(rel).toMatch(/IDENTITY_CHANGE_AT = new Date\("2026-11-25/);
    expect(rel).toContain("Supervisão técnica: {TECH_SUPERVISOR}");
  });
  it("somente brevo-whatsapp-inviter (15 min) e brevo-multi-pipeline (300/dia) ficam ativos; legados continuam fora do PM2 e do vigia", async () => {
    const eco = await import("../../ecosystem.config.cjs");
    const names: string[] = (eco.default ?? eco).apps.map((a: { name: string }) => a.name);
    expect(names).toContain("brevo-whatsapp-inviter");
    expect(names).toContain("brevo-multi-pipeline");
    for (const off of [
      "growth-engine",
      "lead-harvesters-master",
      "instagram-direct-inviter",
      "hostinger-email-dispatcher",
      "cannabis-young-doctors-hunter",
      "cadence-10min-inviter",
      "whatsapp-bot",
      "wpp-crm",
      "patient-traffic-booster",
      "apify-lead-sync",
      "anvisa-rdc660-rpa",
    ]) {
      expect(names).not.toContain(off);
    }
    const watchdog = fs.readFileSync("scripts/sysadmin_watchdog_supervisor.mjs", "utf8");
    const expected = watchdog.slice(watchdog.indexOf("EXPECTED_SERVICES"), watchdog.indexOf("];", watchdog.indexOf("EXPECTED_SERVICES")));
    expect(expected).toContain("brevo-whatsapp-inviter");
    expect(expected).toContain("brevo-multi-pipeline");
    expect(expected).not.toMatch(/cadence|growth-engine|lead-harvesters|patient-traffic|anvisa-rdc660|whatsapp-bot|wpp-crm|hostinger-email|instagram-direct|cannabis-young/);
  });
});
