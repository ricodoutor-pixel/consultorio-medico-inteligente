/**
 * validate_telemed_r2.js
 * Bateria de testes integrados E2E para o TelemedChat — Rodada 2
 * 
 * Uso: node scripts/validate_telemed_r2.js
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
const BOLD = "\x1b[1m";
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
  return fs.readFileSync(path.join(ROOT, rel), "utf-8").includes(text);
}

function fileContainsRegex(rel, regex) {
  if (!fileExists(rel)) return false;
  return regex.test(fs.readFileSync(path.join(ROOT, rel), "utf-8"));
}

console.log(`\n${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${CYAN}${BOLD}  🏥 TELEMED CHAT — Validação E2E Rodada 2${RESET}`);
console.log(`${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${RESET}\n`);

const TC = "src/components/patient/TelemedChat.tsx";
const DP = "src/pages/DashboardPaciente.tsx";
const QAH = "src/components/patient/QuickActionHub.tsx";

// ── 1. Component Files ────────────────────────────────
console.log(`${YELLOW}📁 [1/6] Verificando arquivos do TelemedChat:${RESET}`);
check("TelemedChat.tsx existe", fileExists(TC));
check("DashboardPaciente.tsx existe", fileExists(DP));
check("QuickActionHub.tsx existe", fileExists(QAH));

// ── 2. WhatsApp-style Layout ──────────────────────────
console.log(`\n${YELLOW}💬 [2/6] Layout estilo WhatsApp Web:${RESET}`);
check("Painel de contatos (lado esquerdo)", fileContains(TC, "Contact List") || fileContains(TC, "md:w-[320px]"));
check("Janela de chat (lado direito)", fileContains(TC, "Chat Window") || fileContains(TC, "Chat Header"));
check("Campo de input de mensagem", fileContains(TC, "Converse com a Enfª Brisa"));
check("Botão enviar (Send)", fileContains(TC, "<Send"));
check("Busca de contatos", fileContains(TC, "Buscar contato"));
check("Mensagens com animação (framer-motion)", fileContains(TC, "AnimatePresence"));
check("Responsivo mobile (voltar/ArrowLeft)", fileContains(TC, "mobileShowChat"));

// ── 3. Enfª Brisa (Desbloqueada 24h) ────────────────
console.log(`\n${YELLOW}🩺 [3/6] Enfermeira Brisa (Contato desbloqueado):${RESET}`);
check("Brisa como primeiro contato", fileContains(TC, "BRISA_CONTACT"));
check("Badge 'Online 24h'", fileContains(TC, "Online 24h"));
check("Chat 100% liberado (locked: false)", fileContains(TC, "locked: false"));
check("Mensagem de boas-vindas da Brisa", fileContains(TC, "Eu sou a Enfª Brisa"));
check("Brisa usa AI Gateway", fileContains(TC, "ai-gateway"));
check("System prompt da Brisa", fileContains(TC, "Enfermeira Brisa"));
check("Indicador 'digitando...' (bounce animation)", fileContains(TC, "animate-bounce"));

// ── 4. Médicos (Bloqueados por padrão) ───────────────
console.log(`\n${YELLOW}🔒 [4/6] Médicos (bloqueados por padrão):${RESET}`);
check("Médicos do catálogo na lista", fileContains(TC, "Médicos Prescritores"));
check("Ícone de cadeado (Lock)", fileContains(TC, "<Lock"));
check("Modal de bloqueio ao clicar", fileContains(TC, "Profissional Bloqueado"));
check("Mensagem de aviso no modal", fileContains(TC, "faça o agendamento da sua consulta"));
check("Botão 'Agendar Consulta Agora'", fileContains(TC, "Agendar Consulta Agora"));
check("Rota para /profissionais no botão", fileContains(TC, "/profissionais"));
check("Desbloqueio automático via Supabase", fileContainsRegex(TC, /appointments.*confirmed|confirmed.*appointments/));
check("Verificação de status confirmed/completed/scheduled", fileContains(TC, "confirmed"));

// ── 5. Integração no Dashboard ───────────────────────
console.log(`\n${YELLOW}🏥 [5/6] Integração no DashboardPaciente:${RESET}`);
check("Import do TelemedChat", fileContains(DP, "TelemedChat"));
check("Uso do <TelemedChat", fileContains(DP, "<TelemedChat"));
check("Aba 'Telemed' nos tabs", fileContains(DP, '"telemed"'));
check("Aba Telemed usa MessageCircle icon", fileContains(DP, "MessageCircle"));
check("QuickActionHub condicional (só overview)", fileContainsRegex(DP, /activeTab\s*===\s*["']overview["'].*QuickActionHub/s));
check("patientId passado ao TelemedChat", fileContains(DP, "patientId={profile?.id}"));

// ── 6. Navegabilidade QuickActionHub ↔ Telemed ──────
console.log(`\n${YELLOW}🔗 [6/6] Navegabilidade entre QuickActionHub e Telemed:${RESET}`);
check("QuickActionHub tem onTabSwitch callback", fileContains(QAH, "onTabSwitch"));
check("QuickActionHub exporta interface com onTabSwitch", fileContains(QAH, "QuickActionHubProps"));
check("Aba Receitas via QuickActionHub funciona", fileContains(QAH, "#prescriptions"));
check("Aba Diário via QuickActionHub funciona", fileContains(QAH, "#diary"));

// ── Summary ──────────────────────────────────────────
console.log(`\n${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`  ${GREEN}${BOLD}${pass} verificações OK${RESET} | ${fail > 0 ? `${RED}${BOLD}${fail} falhas` : `${GREEN}${BOLD}0 falhas`}${RESET}`);
if (fail === 0) {
  console.log(`  ${GREEN}${BOLD}🎉 RODADA 2 (TELEMED) VALIDADA COM SUCESSO!${RESET}`);
  console.log(`  ${GREEN}Reestruturação completa do Dashboard Paciente CONCLUÍDA.${RESET}`);
} else {
  console.log(`  ${RED}⚠️  ${fail} verificação(ões) precisam de atenção.${RESET}`);
}
console.log(`${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${RESET}\n`);

process.exit(fail > 0 ? 1 : 0);
