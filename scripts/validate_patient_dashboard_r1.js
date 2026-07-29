/**
 * validate_patient_dashboard_r1.js
 * Valida rotas, importações e componentes do Dashboard do Paciente — Rodada 1
 * 
 * Uso: node scripts/validate_patient_dashboard_r1.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

let pass = 0;
let fail = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ${GREEN}✔${RESET} ${label}`);
    pass++;
  } else {
    console.log(`  ${RED}✘${RESET} ${label}`);
    fail++;
  }
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function fileContains(rel, text) {
  if (!fileExists(rel)) return false;
  const content = fs.readFileSync(path.join(ROOT, rel), "utf-8");
  return content.includes(text);
}

console.log(`\n${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
console.log(`${CYAN}  Dashboard Paciente — Validação Rodada 1${RESET}`);
console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

// 1. Component Files Exist
console.log(`${YELLOW}📁 Verificando arquivos de componentes:${RESET}`);
check("QuickActionHub.tsx existe", fileExists("src/components/patient/QuickActionHub.tsx"));
check("ProfileAvatarCard.tsx existe", fileExists("src/components/patient/ProfileAvatarCard.tsx"));
check("DashboardPaciente.tsx existe", fileExists("src/pages/DashboardPaciente.tsx"));
check("SymptomTracker.tsx existe", fileExists("src/components/diary/SymptomTracker.tsx"));

// 2. QuickActionHub content checks
console.log(`\n${YELLOW}🎯 Verificando QuickActionHub (Botões de Ação):${RESET}`);
const qah = "src/components/patient/QuickActionHub.tsx";
check("Botão 'Agendar Consulta'", fileContains(qah, "Agendar Consulta"));
check("Botão 'Solicitar Retorno'", fileContains(qah, "Solicitar Retorno"));
check("Botão 'Orientação Técnica R$ 30'", fileContains(qah, "Orientação Técnica R$ 30"));
check("Botão 'Emergência'", fileContains(qah, "Emergência"));
check("Botão 'Pressão Arterial'", fileContains(qah, "Pressão Arterial"));
check("Botão 'E-book Gratuito'", fileContains(qah, "E-book Gratuito"));
check("Botão 'Indique e Ganhe'", fileContains(qah, "Indique e Ganhe"));
check("Botão 'Receitas e Documentos'", fileContains(qah, "Receitas e Documentos"));
check("Botão 'Diário de Gotas'", fileContains(qah, "Diário de Gotas"));
check("Botão 'Suporte Jurídico'", fileContains(qah, "Suporte Jurídico"));

// 3. Route targets
console.log(`\n${YELLOW}🔗 Verificando rotas dos botões:${RESET}`);
check("Rota /profissionais", fileContains(qah, "/profissionais"));
check("Rota /agendamento", fileContains(qah, "/agendamento"));
check("Rota /monitor-cardiaco", fileContains(qah, "/monitor-cardiaco"));
check("Rota /ebook-medicina-canabinoide", fileContains(qah, "/ebook-medicina-canabinoide"));
check("Rota /indicacoes", fileContains(qah, "/indicacoes"));
check("Rota /lgpd (suporte jurídico)", fileContains(qah, "/lgpd"));
check("Link WhatsApp (Emergência)", fileContains(qah, "wa.me/5511991363154"));
check("Link WhatsApp (OT R$30)", fileContains(qah, "Orienta%C3%A7%C3%A3o"));

// 4. ProfileAvatarCard enhancements
console.log(`\n${YELLOW}📸 Verificando ProfileAvatarCard (Upload de Foto):${RESET}`);
const pac = "src/components/patient/ProfileAvatarCard.tsx";
check("Label 'Alterar Foto' presente", fileContains(pac, "Alterar Foto"));
check("Upload ao Supabase Storage (bucket avatars)", fileContains(pac, 'from("avatars")'));
check("Atualização de profiles.avatar_url", fileContains(pac, "avatar_url"));

// 5. DashboardPaciente integration
console.log(`\n${YELLOW}🏥 Verificando integração no DashboardPaciente:${RESET}`);
const dp = "src/pages/DashboardPaciente.tsx";
check("Import do QuickActionHub", fileContains(dp, "QuickActionHub"));
check("Uso do <QuickActionHub", fileContains(dp, "<QuickActionHub"));
check("ProfileAvatarCard importado", fileContains(dp, "ProfileAvatarCard"));
check("ProfileAvatarCard utilizado", fileContains(dp, "<ProfileAvatarCard"));
check("SymptomTracker importado", fileContains(dp, "SymptomTracker"));
check("SymptomTracker com anchor id", fileContains(dp, 'id="symptom-diary-section"'));
check("Aba Receitas funcional (prescriptions)", fileContains(dp, '"prescriptions"'));
check("onTabSwitch callback ligado", fileContains(dp, "onTabSwitch"));

// 6. Route pages exist
console.log(`\n${YELLOW}📄 Verificando existência das páginas-alvo:${RESET}`);
check("MonitorCardiaco.tsx", fileExists("src/pages/MonitorCardiaco.tsx"));
check("Indicacoes.tsx", fileExists("src/pages/Indicacoes.tsx"));
check("EbookMedicinaCanabinoide.tsx", fileExists("src/pages/EbookMedicinaCanabinoide.tsx"));
check("Agendamento.tsx", fileExists("src/pages/Agendamento.tsx"));
check("Profissionais.tsx", fileExists("src/pages/Profissionais.tsx"));

// Summary
console.log(`\n${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
console.log(`  ${GREEN}${pass} verificações OK${RESET} | ${fail > 0 ? RED : GREEN}${fail} falhas${RESET}`);
if (fail === 0) {
  console.log(`  ${GREEN}🎉 RODADA 1 VALIDADA COM SUCESSO!${RESET}`);
} else {
  console.log(`  ${RED}⚠️  ${fail} verificação(ões) precisam de atenção.${RESET}`);
}
console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

process.exit(fail > 0 ? 1 : 0);
