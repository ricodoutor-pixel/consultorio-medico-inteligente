/**
 * Teste Automatizado de Integridade do Sistema e Auditoria Forense
 * Projeto: Planta y Raiz
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("===============================================================");
console.log("🛡️  SUITE DE VERIFICAÇÃO DE INTEGRIDADE & AUDITORIA PLANTA Y RAIZ");
console.log("===============================================================\n");

let passed = 0;
let failed = 0;

function runCheck(title, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${title}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${title}`);
    console.error(`   Erro: ${err.message}`);
    failed++;
  }
}

// 1. Verificação de ausência de fake IP em DoctorContractModal.tsx
runCheck("Zero Fake IP: DoctorContractModal não deve conter 187.12.84.190", () => {
  const file = path.join(__dirname, "../src/components/doctor/DoctorContractModal.tsx");
  const content = fs.readFileSync(file, "utf8");
  assert.ok(!content.includes("187.12.84.190"), "Encontrado IP fictício 187.12.84.190 em DoctorContractModal.tsx");
});

// 2. Verificação de ausência de fake CPFs no DoctorKycPipeline.tsx
runCheck("Zero Fake CPF: DoctorKycPipeline não deve conter CPFs mockados", () => {
  const file = path.join(__dirname, "../src/components/admin/DoctorKycPipeline.tsx");
  const content = fs.readFileSync(file, "utf8");
  assert.ok(!content.includes("054.764.445-90"), "Encontrado CPF fictício 054.764.445-90");
  assert.ok(!content.includes("186.358.421-00"), "Encontrado CPF fictício 186.358.421-00");
  assert.ok(!content.includes("198.742.631-00"), "Encontrado CPF fictício 198.742.631-00");
  assert.ok(!content.includes("DEFAULT_DOCTORS"), "Array DEFAULT_DOCTORS ainda presente");
});

// 3. Verificação de ausência de fallback para mockProfessionals em useDoctors.ts
runCheck("useDoctors.ts não deve injetar catálogo mock de 70 médicos em catch", () => {
  const file = path.join(__dirname, "../src/hooks/useDoctors.ts");
  const content = fs.readFileSync(file, "utf8");
  assert.ok(!content.includes("mockProfessionals"), "useDoctors ainda referencia mockProfessionals");
  assert.ok(!content.includes("mapMockToDoctorRow"), "useDoctors ainda referencia mapMockToDoctorRow");
});

// 4. Verificação de ausência de toasts de sucesso em blocos catch
runCheck("Integridade de Feedback: Catch blocks em arquivos críticos não chamam toast.success", () => {
  const targets = [
    path.join(__dirname, "../src/components/admin/DoctorKycPipeline.tsx"),
    path.join(__dirname, "../src/components/admin/LeadHunterTracker.tsx"),
    path.join(__dirname, "../src/components/admin/TikTokAnalyticsPanel.tsx"),
    path.join(__dirname, "../src/pages/Consultorio.tsx"),
  ];

  for (const t of targets) {
    if (fs.existsSync(t)) {
      const content = fs.readFileSync(t, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("catch")) {
          const block = lines.slice(i, i + 10).join("\n");
          assert.ok(!block.includes("toast.success"), `Encontrado toast.success em bloco catch no arquivo ${path.basename(t)} na linha ${i+1}`);
          break;
        }
      }
    }
  }
});

// 5. Verificação da existência das Migrations estruturais da Fase 0 e Fase 1
runCheck("Migrations SQL obrigatórias criadas no repositório", () => {
  const requiredMigrations = [
    "supabase/migrations/20260905000001_doctor_contract_and_kyc_hardening.sql",
    "supabase/migrations/20260905000002_isolate_e2e_test_doctor.sql",
    "supabase/migrations/20260905000003_ai_agent_orchestration.sql",
    "supabase/migrations/20260905000004_structured_medical_records.sql",
  ];

  for (const m of requiredMigrations) {
    const fullPath = path.join(__dirname, "..", m);
    assert.ok(fs.existsSync(fullPath), `Migration ausente: ${m}`);
  }
});

// 6. Verificação dos Documentos Técnicos da Fase 0 e Fase 1
runCheck("Documentação técnica de conformidade e arquitetura gerada", () => {
  const docs = [
    "docs/production_version_audit.md",
    "docs/ai_agent_architecture.md",
    "docs/structured_medical_records.md",
    "docs/identity_verification_rfp.md",
    "docs/native_app_capacitor.md",
    "docs/disaster_recovery_plan.md",
  ];

  for (const d of docs) {
    const fullPath = path.join(__dirname, "..", d);
    assert.ok(fs.existsSync(fullPath), `Documento ausente: ${d}`);
  }
});

// 7. Verificação de Serviços de Saúde (FHIR e Interações)
runCheck("Serviços clínicos de FHIR e Interações Medicamentosas disponíveis", () => {
  const fhirFile = path.join(__dirname, "../src/services/fhirExport.ts");
  const interFile = path.join(__dirname, "../src/services/drugInteractions.ts");
  assert.ok(fs.existsSync(fhirFile), "fhirExport.ts ausente");
  assert.ok(fs.existsSync(interFile), "drugInteractions.ts ausente");
});

console.log("\n===============================================================");
console.log(`📊 RESULTADO FINAL: ${passed} verificações com sucesso, ${failed} falhas.`);
console.log("===============================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✨ Todos os critérios de conformidade e integridade foram ATENDIDOS!\n");
}
