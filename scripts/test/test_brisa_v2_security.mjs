/**
 * scripts/test/test_brisa_v2_security.mjs
 * 
 * Bateria de Testes Unitários com Dublês (Mocks) da Fase 2 e Fase 3
 * Enfermeira Brisa v2 — Planta y Raíz Ltda
 * 
 * NENHUM TESTE ENVIA MENSAGEM REAL: Todos utilizam dublê (mock) e respeitam BRISA_DRY_RUN
 */

import assert from 'assert';
import {
  normalizeJid,
  normalizePhoneDigits,
  checkAiPause,
  registerHumanTakeover,
  unpauseAi,
  isOptOutRequested,
  registerOptOut,
  isBlacklisted,
  isAutoReplyBot,
  checkConsecutiveBrisaLimit,
  checkSemanticRepetition,
  isDoctorKycMedia,
  classifyDoctorDocumentType,
  sanitizeDoctorName,
  preSendGuard
} from '../lib/brisa_security.mjs';

import {
  BRISA_CONFIG,
  buildLgpdOriginReply,
  buildKycChecklistReply,
  buildOfficialInvitationMessage
} from '../brisa_onboarding_config.mjs';

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASSOU] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FALHOU] ${desc}`);
    console.error(`     Erro: ${err.message}`);
    throw err;
  }
}

console.log('========================================================================');
console.log('🧪 INICIANDO TESTES UNITÁRIOS DA CAMADA DE SEGURANÇA BRISA v2');
console.log('========================================================================\n');

// ----------------------------------------------------------------------------
// S1: Identificador Único (normalizeJid)
// ----------------------------------------------------------------------------
console.log('🔹 Grupo 1: Normalização de Identificadores (S1)');

it('T1.1: Deve normalizar número brasileiro padrão e gerar JID canônico', () => {
  const res = normalizeJid('5511991363154@s.whatsapp.net');
  assert.strictEqual(res.normalizedJid, '5511991363154@s.whatsapp.net');
  assert.strictEqual(res.phone, '5511991363154');
  assert.strictEqual(res.isLid, false);
  assert(res.aliases.includes('5511991363154'));
});

it('T1.2: Deve identificar @lid opaco sem perder o identificador', () => {
  const res = normalizeJid('129076786409510@lid');
  assert.strictEqual(res.normalizedJid, '129076786409510@lid');
  assert.strictEqual(res.isLid, true);
  assert(res.aliases.includes('129076786409510@lid'));
});

it('T1.3: Deve normalizar números sem código DDI 55 inserindo 55', () => {
  const phone = normalizePhoneDigits('11991363154');
  assert.strictEqual(phone, '5511991363154');
});

// ----------------------------------------------------------------------------
// S2: Pausa da IA e Assumiu Humano (24h)
// ----------------------------------------------------------------------------
console.log('\n🔹 Grupo 2: Pausa da IA e Detecção de Assumiu Humano (S2)');

it('T2.1: Toda mensagem enviada pela equipe pelo WhatsApp Web deve silenciar a IA por 24h', () => {
  const testJid = '5511988887777@s.whatsapp.net';
  
  // Limpa antes
  unpauseAi(testJid);
  assert.strictEqual(checkAiPause(testJid).paused, false);

  // Equipe humana responde no WhatsApp Web (fromMe: true, isBrisaBot: false)
  const tookOver = registerHumanTakeover(testJid, true, false);
  assert.strictEqual(tookOver, true);

  // Agora a IA deve estar pausada
  const state = checkAiPause(testJid);
  assert.strictEqual(state.paused, true);
  assert.strictEqual(state.reason, 'atendimento_humano_whatsapp_web');

  // Pre-Send Guard deve bloquear envio para este contato
  const guard = preSendGuard(testJid, 'Mensagem qualquer da IA', { bypassDryRun: true });
  assert.strictEqual(guard.canSend, false);
  assert.strictEqual(guard.reason, 'AI_PAUSED');

  // Limpa estado do teste
  unpauseAi(testJid);
});

it('T2.2: Mensagem disparada pela própria Brisa NÃO deve ativar o modo humano', () => {
  const testJid = '5511977776666@s.whatsapp.net';
  unpauseAi(testJid);

  // Mensagem da Brisa (fromMe: true, isBrisaBot: true)
  const tookOver = registerHumanTakeover(testJid, true, true);
  assert.strictEqual(tookOver, false);
  assert.strictEqual(checkAiPause(testJid).paused, false);
});

// ----------------------------------------------------------------------------
// S3: Opt-Out com Zero Tolerância
// ----------------------------------------------------------------------------
console.log('\n🔹 Grupo 3: Opt-Out com Zero Tolerância (S3)');

it('T3.1: Deve detectar todas as variações de pedido de cancelamento/parar', () => {
  assert(isOptOutRequested('0'));
  assert(isOptOutRequested('pare'));
  assert(isOptOutRequested('PARAR'));
  assert(isOptOutRequested('Não quero mais mensagens'));
  assert(isOptOutRequested('Remova meu número por favor'));
  assert(isOptOutRequested('descadastrar'));
  assert(isOptOutRequested('este número já pediu o encerramento'));
  assert(!isOptOutRequested('Gostaria de saber como funciona'));
});

it('T3.2: Registrar opt-out deve retornar confirmação única e bloquear futuros envios', () => {
  const testJid = '5511966665555@s.whatsapp.net';
  const res = registerOptOut(testJid, 'parar');

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.confirmationReply, 'Entendido, removi seu número. Obrigada pela atenção.');
  assert(isBlacklisted(testJid));

  // Pre-Send Guard bloqueia permanentemente
  const guard = preSendGuard(testJid, 'Novo convite promocional', { bypassDryRun: true });
  assert.strictEqual(guard.canSend, false);
  assert.strictEqual(guard.reason, 'OPTOUT_BLACKLIST');
});

// ----------------------------------------------------------------------------
// S4: Anti-Robô de Consultório e Limite de 2 Mensagens Seguidas
// ----------------------------------------------------------------------------
console.log('\n🔹 Grupo 4: Anti-Robô de Consultório (S4)');

it('T4.1: Deve identificar respostas automáticas de consultório e avisos de sistema', () => {
  assert(isAutoReplyBot('A clínica agradece o seu contato. Nosso horário de atendimento é das 8h às 18h.'));
  assert(isAutoReplyBot('Mensagem automática: estamos em recesso'));
  assert(isAutoReplyBot('Não estamos disponíveis no momento. Deixe sua mensagem.'));
  assert(isAutoReplyBot('', 'status@broadcast'));
  assert(!isAutoReplyBot('Olá, sou o Dr. Fernando e tenho interesse'));
});

it('T4.2: Limite estrito de no máximo 2 mensagens seguidas da Brisa sem resposta de humano', () => {
  // 1 mensagem da Brisa -> permitido
  assert.strictEqual(checkConsecutiveBrisaLimit([{ fromMe: true }]).allowed, true);

  // 2 mensagens da Brisa -> bloqueado (já atingiu o limite de 2)
  assert.strictEqual(checkConsecutiveBrisaLimit([{ fromMe: true }, { fromMe: true }]).allowed, false);

  // Usuário respondeu no meio -> liberado
  assert.strictEqual(checkConsecutiveBrisaLimit([{ fromMe: true }, { fromMe: false }]).allowed, true);
});

// ----------------------------------------------------------------------------
// S5: Anti-Repetição Semântica
// ----------------------------------------------------------------------------
console.log('\n🔹 Grupo 5: Anti-Repetição Semântica (S5)');

it('T5.1: Deve bloquear o envio imediato da mesma resposta para o mesmo contato', () => {
  const testJid = '5511955554444@s.whatsapp.net';
  const text = 'Olá, Dr(a). Como posso te orientar hoje sobre o credenciamento?';

  // 1ª vez: permitido
  assert.strictEqual(checkSemanticRepetition(text, testJid), false);

  // 2ª vez consecutiva: repetição detectada!
  assert.strictEqual(checkSemanticRepetition(text, testJid), true);

  // Texto diferente: permitido
  assert.strictEqual(checkSemanticRepetition('Outra resposta diferente com mais detalhes', testJid), false);
});

// ----------------------------------------------------------------------------
// S6: Documentos de Médicos NUNCA são Pagamentos & Checklist Oficial
// ----------------------------------------------------------------------------
console.log('\n🔹 Grupo 6: Classificação de Documentos Médicos (S6)');

it('T6.1: Mídia enviada por médico ou em conversa de credenciamento deve ser KYC, NUNCA pagamento', () => {
  const mediaMessage = {
    message: {
      documentMessage: { fileName: 'cnh_crm.pdf', mimetype: 'application/pdf' }
    }
  };

  const isKyc = isDoctorKycMedia(mediaMessage, 'medico', true);
  assert.strictEqual(isKyc, true);
});

it('T6.2: Deve classificar os tipos de documentos médicos corretamente', () => {
  assert.strictEqual(classifyDoctorDocumentType('crm_foto.jpg'), 'crm');
  assert.strictEqual(classifyDoctorDocumentType('conta_luz_residencia.pdf'), 'comprovante_residencia');
  assert.strictEqual(classifyDoctorDocumentType('diploma_medicina.pdf'), 'diploma_ou_rqe');
  assert.strictEqual(classifyDoctorDocumentType('chave_pix_comprovante.png'), 'chave_pix');
});

it('T6.3: Checklist Oficial de KYC deve conter os 4 itens obrigatórios e o prazo oficial de 24 a 48h úteis', () => {
  const checklistText = buildKycChecklistReply('Julio Cesar', ['crm']);
  
  assert(checklistText.includes('Foto do documento profissional (CRM ativo): *[Recebido]*'));
  assert(checklistText.includes('Comprovante de endereço/residência recente: *[Pendente]*'));
  assert(checklistText.includes('Cópia do Diploma de Medicina ou Certificado de Especialidade/RQE: *[Pendente]*'));
  assert(checklistText.includes('Chave PIX vinculada ao titular: *[Pendente]*'));
  assert(checklistText.includes(BRISA_CONFIG.PRAZO_APROVACAO.textoOficial));
});

// ----------------------------------------------------------------------------
// S7: Higienização de Nomes
// ----------------------------------------------------------------------------
console.log('\n🔹 Grupo 7: Higienização de Nomes Médicos (S7)');

it('T7.1: Deve eliminar prefixos duplicados "Dr(a). Dr." e "Dra. A"', () => {
  assert.strictEqual(sanitizeDoctorName('Dr(a). Dr. Geilson'), 'Geilson');
  assert.strictEqual(sanitizeDoctorName('Dra. A Verônica'), 'Verônica');
  assert.strictEqual(sanitizeDoctorName('Dr. Dr. Marcos'), 'Marcos');
});

it('T7.2: Deve descartar nomes numéricos vindos de identificadores @lid', () => {
  assert.strictEqual(sanitizeDoctorName('129076786409510'), 'Doutor(a)');
});

it('T7.3: Deve preservar sobrenomes com preposições compostas', () => {
  assert.strictEqual(sanitizeDoctorName('André da Silveira'), 'André da Silveira');
  assert.strictEqual(sanitizeDoctorName('Maria de Souza'), 'Maria de Souza');
});

// ----------------------------------------------------------------------------
// Diretrizes Oficiais Dr. Edilson (Fase 3: LGPD, Monetização e Prazos)
// ----------------------------------------------------------------------------
console.log('\n🔹 Grupo 8: Diretrizes Oficiais do Dr. Edilson');

it('T8.1: Resposta padrão de origem do contato deve conter o texto exato da LGPD', () => {
  const reply = buildLgpdOriginReply('Rodrigo');
  assert(reply.includes(BRISA_CONFIG.ORIGEM_CONTATO_LGPD));
});

it('T8.2: Mensagem oficial de convite deve conter as duas modalidades de monetização', () => {
  const invite = buildOfficialInvitationMessage('Amir');
  // Proposta de entrada gancho
  assert(invite.includes(BRISA_CONFIG.POLITICA_COMERCIAL.ofertaGancho));
  // Regra padrão da plataforma
  assert(invite.includes(BRISA_CONFIG.POLITICA_COMERCIAL.regraPadrao));
  // Link oficial canônico
  assert(invite.includes(BRISA_CONFIG.URLS.cadastroProfissional));
});

it('T8.3: Pre-Send Guard deve respeitar BRISA_DRY_RUN=true e bloquear disparos de rede', () => {
  const guard = preSendGuard('5511991363154', 'Olá doutor');
  assert.strictEqual(guard.canSend, false);
  assert.strictEqual(guard.reason, 'DRY_RUN_ACTIVE');
});

console.log('\n========================================================================');
console.log(`🎉 RESULTADO DOS TESTES: ${passedTests}/${totalTests} passaram com 100% de sucesso!`);
console.log('========================================================================\n');
