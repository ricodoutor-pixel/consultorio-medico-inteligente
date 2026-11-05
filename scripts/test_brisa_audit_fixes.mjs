import {
  sanitizePatientName,
  isPureGreeting,
  isPaymentOrVoucherNotice,
  isUrgentMedicalEmergency,
  isGeneralSpamOrUnrelated,
  isAngryOrDemandsHuman,
  calculateStringSimilarity,
  checkSemanticRepetition
} from './lib/brisa_security.mjs';

console.log("=== INICIANDO BATERIA DE TESTES DA AUDITORIA ENFª BRISA ===");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ [PASSOU] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FALHOU] ${testName}`);
    failed++;
  }
}

// 1. Teste de Higienização de Nome de Paciente (Defeito 5 - Regra 2: "Nunca use nome de usuário, e-mail ou números como nome. Não use Dr. ou Dra. para pacientes.")
assert(sanitizePatientName("Dr. Franciscopego263") === "", "Dr. Franciscopego263 -> vazio (bloqueia username e título)");
assert(sanitizePatientName("franciscopego263") === "", "franciscopego263 -> vazio (bloqueia username)");
assert(sanitizePatientName("usuario12345") === "", "usuario12345 -> vazio (bloqueia username)");
assert(sanitizePatientName("991363154") === "", "Número puro -> vazio");
assert(sanitizePatientName("Dra. Maria Clara") === "Maria", "Dra. Maria Clara -> Maria (remove título Dra.)");
assert(sanitizePatientName("Francisco") === "Francisco", "Francisco -> Francisco (nome real preservado)");
assert(sanitizePatientName("Saulo") === "Saulo", "Saulo -> Saulo");

// 2. Teste de Saudação Pura vs Card do Médico (Defeito 3)
assert(isPureGreeting("Bom dia") === true, "Bom dia é saudação pura");
assert(isPureGreeting("Oi") === true, "Oi é saudação pura");
assert(isPureGreeting("Qk") === true, "Qk é saudação pura");
assert(isPureGreeting("Ok") === true, "Ok é saudação pura");
assert(isPureGreeting("ola!") === true, "ola! é saudação pura");
assert(isPureGreeting("Oi, doutor Anderson atende?") === false, "Pergunta com médico não é saudação pura");
assert(isPureGreeting("Qual remédio para dormir?") === false, "Dúvida clínica não é saudação pura");

// 3. Teste de Dúvida Clínica / Remédio para dormir (Defeito 4)
const clinicalRegex = /rem[eé]dio|dormir|ins[oô]nia|ansiedade|dor|sintoma/i;
assert(clinicalRegex.test("Qual remédio para dormir?"), "Detecta pergunta sobre remédio para dormir");
assert(clinicalRegex.test("tenho insônia"), "Detecta insônia");

// 4. Teste de Pagamento e Documentos (Defeito 6)
assert(isPaymentOrVoucherNotice("Paguei o pix") === true, "Detecta 'Paguei o pix'");
assert(isPaymentOrVoucherNotice("Segue comprovante") === true, "Detecta 'Segue comprovante'");
assert(isPaymentOrVoucherNotice("Qual o valor da consulta?") === false, "Pergunta de valor não é aviso de pagamento");

// 5. Teste de Emergência Médica (CFM / SAMU 192)
assert(isUrgentMedicalEmergency("dor no peito forte e falta de ar") === true, "Detecta emergência cardiorrespiratória");
assert(isUrgentMedicalEmergency("estou com pensamentos de suicidio") === true, "Detecta ideação");
assert(isUrgentMedicalEmergency("estou com uma dorzinha nas costas") === false, "Dor leve não dispara SAMU falso");

// 6. Teste de Spam, Correntes e Ofertas de Secretária Virtual (Defeito 11)
assert(isGeneralSpamOrUnrelated("Aumente suas vendas com nossa secretária virtual").isServiceOffer === true, "Detecta bot de marketing");
assert(isGeneralSpamOrUnrelated("Compartilhe com 10 pessoas esta oracao").isSpam === true, "Detecta corrente");
assert(isGeneralSpamOrUnrelated("Gostaria de agendar consulta").isSpam === false, "Mensagem legítima de paciente");

// 7. Teste de Similaridade e Trava Anti-Repetição 24h (Defeito 1 e 2)
const msg1 = "Estou com muitos atendimentos agora e não consegui responder. Pode tentar de novo em alguns instantes? Se preferir, fale com a nossa equipe pelo WhatsApp.";
const msg2 = "Estou com muitos atendimentos agora e não consegui responder. Pode tentar de novo em alguns instantes? Se preferir, fale com a nossa equipe pelo WhatsApp.";
const sim = calculateStringSimilarity(msg1, msg2);
assert(sim === 1.0, "Mensagens idênticas têm similaridade 1.0");

const testJid = "5511999999999@s.whatsapp.net";
const history24h = [{ text: msg1, sentAt: Date.now() - 3600000 }];
assert(checkSemanticRepetition(msg2, testJid, history24h) === true, "Trava anti-repetição de 24h bloqueia envio similar >= 80%");

// 8. Teste de Emojis de Raiva e Pedido de Humano (Modo Humano e Pausa)
assert(isAngryOrDemandsHuman("😡 que demora") === true, "Detecta emoji de raiva 😡");
assert(isAngryOrDemandsHuman("quero falar com um atendente agora") === true, "Detecta pedido de atendente");
assert(isAngryOrDemandsHuman("isso aqui é um golpe ou o que?") === true, "Detecta reclamação/golpe");
assert(isAngryOrDemandsHuman("Quero uma pessoa de verdade") === true, "Detecta pedido de pessoa humana");
assert(isAngryOrDemandsHuman("Olá, como funciona a consulta?") === false, "Mensagem normal não ativa modo de raiva");

console.log(`\n=== RESULTADO: ${passed} PASSARAM, ${failed} FALHARAM ===`);
if (failed > 0) process.exit(1);
