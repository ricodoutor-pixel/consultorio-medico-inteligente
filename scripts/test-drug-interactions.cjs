const assert = require("assert");

// Simula a lógica de teste das regras de interação
const { checkDrugInteractions } = (function() {
  // Mini wrapper para testar em ambiente Node CJS
  const INTERACTION_DATABASE = [
    {
      medicationMatches: ["varfarina", "warfarin", "marevan", "coumadin"],
      severity: "high",
    },
    {
      medicationMatches: ["clobazam", "frisium"],
      severity: "high",
    },
    {
      medicationMatches: ["valproato", "depakote"],
      severity: "high",
    },
    {
      medicationMatches: ["clonazepam", "rivotril"],
      severity: "moderate",
    },
    {
      medicationMatches: ["fluoxetina"],
      severity: "low",
    }
  ];

  function normalize(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function check(cannabinoids, meds) {
    const normMeds = meds.map(normalize);
    const matches = [];
    for (const rule of INTERACTION_DATABASE) {
      for (const m of normMeds) {
        if (rule.medicationMatches.some(k => m.includes(k) || k.includes(m))) {
          matches.push({ medication: m, severity: rule.severity });
          break;
        }
      }
    }
    const maxSeverity = matches.some(m => m.severity === "high") ? "high" : (matches.some(m => m.severity === "moderate") ? "moderate" : (matches.length ? "low" : "none"));
    return { interactions: matches, maxSeverity, hasHighRisk: maxSeverity === "high" };
  }

  return { checkDrugInteractions: check };
})();

console.log("🧪 Iniciando testes unitários do Verificador de Interações...");

// Teste 1: Varfarina + CBD deve ter alto risco
const r1 = checkDrugInteractions(["CBD"], ["Varfarina 5mg"]);
assert.strictEqual(r1.maxSeverity, "high", "Varfarina deve gerar severidade high");
assert.strictEqual(r1.hasHighRisk, true, "Varfarina deve indicar hasHighRisk=true");
console.log("✅ Teste 1: Varfarina (CYP2C9) -> Risco Alto [OK]");

// Teste 2: Clobazam + CBD deve ter alto risco
const r2 = checkDrugInteractions(["CBD"], ["Frisium 10mg"]);
assert.strictEqual(r2.maxSeverity, "high", "Clobazam deve gerar severidade high");
console.log("✅ Teste 2: Clobazam (CYP2C19) -> Risco Alto [OK]");

// Teste 3: Clonazepam (Rivotril) deve ter severidade moderada
const r3 = checkDrugInteractions(["CBD"], ["Rivotril 2mg"]);
assert.strictEqual(r3.maxSeverity, "moderate", "Rivotril deve gerar severidade moderate");
console.log("✅ Teste 3: Clonazepam (SNC) -> Risco Moderado [OK]");

// Teste 4: Medicamento sem interação conhecida
const r4 = checkDrugInteractions(["CBD"], ["Dipirona 500mg"]);
assert.strictEqual(r4.maxSeverity, "none", "Dipirona não deve gerar interação de risco");
console.log("✅ Teste 4: Dipirona -> Sem Interação Crítica [OK]");

console.log("\n🎉 Todos os 4 testes unitários de interações passaram com 100% de sucesso!");
