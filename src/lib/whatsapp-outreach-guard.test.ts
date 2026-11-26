import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import {
  isBusinessHoursBRT,
  getBrasiliaTimeParts,
  hasConfirmedCrm,
  isCompanyOrNonDoctorContact,
  formatDoctorAddressing,
  evaluateOutboundDoctorInvite,
} from '../../supabase/functions/_shared/whatsapp-outreach-guard.mjs';
import {
  isAutoReplyOrCommercialBot,
  isBusinessOrNonDoctorSender,
  isPaymentClaimText,
  quickResponse,
  sanitizeOutboundAnswer,
  PATIENT_PAY_LINK,
} from '../../supabase/functions/_shared/brisa-response-policy.mjs';
import { T } from '../../supabase/functions/_shared/brisa-templates.mjs';

describe('Falha 1 — Trava de horário comercial (Seg–Sáb, 09h–19h BRT) e proibição de convites frios', () => {
  it('bloqueia madrugada (00h–01h30 BRT), antes das 9h, após as 19h e qualquer horário de domingo', () => {
    // 2026-11-25 é quarta-feira; BRT = UTC-3
    expect(isBusinessHoursBRT(new Date('2026-11-25T03:00:00Z'))).toBe(false); // Qua 00:00 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-25T04:30:00Z'))).toBe(false); // Qua 01:30 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-25T11:59:00Z'))).toBe(false); // Qua 08:59 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-25T22:00:00Z'))).toBe(false); // Qua 19:00 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-26T01:30:00Z'))).toBe(false); // Qui 22:30 BRT
    // 2026-11-29 é domingo
    expect(isBusinessHoursBRT(new Date('2026-11-29T13:00:00Z'))).toBe(false); // Dom 10:00 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-29T18:00:00Z'))).toBe(false); // Dom 15:00 BRT
  });

  it('permite estritamente Seg–Sáb entre 09:00 e 18:59 BRT', () => {
    // 2026-11-23 é segunda; 2026-11-28 é sábado
    expect(isBusinessHoursBRT(new Date('2026-11-23T12:00:00Z'))).toBe(true); // Seg 09:00 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-25T17:30:00Z'))).toBe(true); // Qua 14:30 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-28T12:00:00Z'))).toBe(true); // Sáb 09:00 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-28T21:59:00Z'))).toBe(true); // Sáb 18:59 BRT
    expect(isBusinessHoursBRT(new Date('2026-11-28T22:00:00Z'))).toBe(false); // Sáb 19:00 BRT
    const parts = getBrasiliaTimeParts(new Date('2026-11-25T04:30:00Z'));
    expect(parts.hour).toBe(1);
    expect(parts.minute).toBe(30);
  });

  it('exige disparo manual do admin + horário comercial BRT + CRM confirmado em evaluateOutboundDoctorInvite', () => {
    const insideBrt = new Date('2026-11-25T15:00:00Z'); // Qua 12:00 BRT
    const overnightBrt = new Date('2026-11-25T04:15:00Z'); // Qua 01:15 BRT
    const validDoctor = { name: 'Ana Carolina Souza', crm: '49354', crmState: 'PR', specialty: 'Clínica Médica' };

    expect(evaluateOutboundDoctorInvite({ contact: validDoctor, now: insideBrt, manualAdminSend: false }).allowed).toBe(false);
    expect(evaluateOutboundDoctorInvite({ contact: validDoctor, now: overnightBrt, manualAdminSend: true }).allowed).toBe(false);
    expect(evaluateOutboundDoctorInvite({ contact: validDoctor, now: insideBrt, manualAdminSend: true }).allowed).toBe(true);
  });

  it('garante que todos os scripts frios/10min estão desativados com process.exit(0) e sem texto proibido', () => {
    const coldScripts = [
      'scripts/agent_cadence_10min_inviter.mjs',
      'scripts/whatsapp-bot.cjs',
      'scripts/agent_brevo_doctor_whatsapp_inviter.mjs',
      'scripts/crm/03_whatsapp-crm-engine.mjs',
      'scripts/crm/04_autonomous-growth-engine.mjs',
      'scripts/disparo.js',
      'scripts/disparo-convites.ts',
      'brisa-standalone/dispatch_baileys.js',
      'scripts/run-invite-campaign.mjs',
      'scripts/run-invite-campaign.ts',
    ];
    for (const file of coldScripts) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content, `${file} deve encerrar imediatamente`).toContain('process.exit(0)');
      expect(content, `${file} não pode conter texto proibido`).not.toMatch(
        /você foi selecionad[oa]|você foi escolhid[oa]|médico\(?a?\)? prescritor\(?a?\)? sócio|participação nos lucros|distribuição de lucros|taxa zero|100% de repasse/i,
      );
    }
  });
});

describe('Falha 2 — Bloqueio de PJ/empresas/não-médicos e proibição de "Dr(a)." sem CRM confirmado', () => {
  it('bloqueia todos os exemplos reais de empresas, clínicas e não-médicos citados', () => {
    const blockedCases = [
      'Dr(a). Plan Saúde Cartão Benefícios Ltda',
      'Plan Saúde Cartão Benefícios Ltda',
      'Lia Odontologia',
      'Psicologia Jaú',
      '3 P Psicologia Ltda',
      'Curae Centro Médico',
      'Cons. Odontológico Placco',
      'Americana Contábil',
      'RBR Assessoria Contábil',
      'Clínica Burgos',
      'PC&P Contabilidade',
      'Alpha Imobiliária Ltda',
      'CredSul Financeira S/A',
      'Escritório Silva ME',
      'Comercial Alfa EPP',
      'Instituto Saúde Plena',
      'Pet Care Veterinária CRMV',
    ];
    for (const name of blockedCases) {
      const check = isCompanyOrNonDoctorContact({ name });
      expect(check.blocked, `${name} deveria ser bloqueado`).toBe(true);
      expect(isBusinessOrNonDoctorSender(name), `${name} sender bloqueado`).toBe(true);
      expect(T.doctorInvite(name), `doctorInvite não deve gerar mensagem para ${name}`).toBe('');
    }
  });

  it('jamais prefixa "Dr(a)." sem CRM confirmado e só aceita CRM médico válido', () => {
    expect(hasConfirmedCrm('', '', '')).toBe(false);
    expect(hasConfirmedCrm('123456', 'SP')).toBe(false); // placeholder
    expect(hasConfirmedCrm('CRO-SP 44120')).toBe(false);
    expect(hasConfirmedCrm('CRP 06/98123')).toBe(false);
    expect(hasConfirmedCrm('44120', 'SP', 'CRO')).toBe(false);
    expect(hasConfirmedCrm('CRM-CE/SP 10963')).toBe(false);
    expect(hasConfirmedCrm('49354', 'PR', 'CRM')).toBe(true);
    expect(hasConfirmedCrm('CRM/SP 206873')).toBe(true);

    // Sem CRM confirmado -> nunca adiciona "Dr(a)."
    const noCrm = formatDoctorAddressing({ name: 'Dr. Carlos Mendes' });
    expect(noCrm.allowed).toBe(true);
    expect(noCrm.hasConfirmedCrm).toBe(false);
    expect(noCrm.salutation).toBe('Carlos Mendes');
    expect(noCrm.salutation).not.toMatch(/\bDr/i);
    expect(T.doctorInvite('Carlos Mendes')).not.toMatch(/Dr\(a\)\./);

    // Com CRM confirmado -> prefixa "Dr(a)." e permite especialidade "Clínica Médica" e sobrenome "Sá"
    const validClinicaMedica = formatDoctorAddressing({
      name: 'Adriene Maria da Costa',
      specialty: 'Clínica Médica',
      crm: '49354',
      crmState: 'PR',
    });
    expect(validClinicaMedica.allowed).toBe(true);
    expect(validClinicaMedica.salutation).toBe('Dr(a). Adriene Maria da Costa');

    const validSa = formatDoctorAddressing({
      name: 'Paulo Sá',
      crm: '54892',
      crmState: 'SP',
    });
    expect(validSa.allowed).toBe(true);
    expect(validSa.salutation).toBe('Dr(a). Paulo Sá');
    expect(T.doctorInvite('Ana', { crm: '49354', crmState: 'PR' })).toContain('Olá, Dr(a). Ana!');
  });
});

describe('Falha 3 — Silêncio total para auto-respostas/URAs/bots comerciais e bloqueio de OT para empresas/contatos frios', () => {
  it('silencia URAs e bots comerciais MESMO quando citam "atendente", "comprovante" ou "pagamento"', () => {
    const uras = [
      {
        senderName: 'Americana Contábil',
        question: 'Olá! Bem-vindo à Americana Contábil. Digite 1 para enviar comprovante de pagamento ou 2 para falar com um atendente.',
      },
      {
        senderName: 'Clínica Burgos',
        question: 'Clínica Burgos: escolha uma opção:\n1 - Agendamento\n2 - Financeiro / Pagamento\n3 - Falar com atendente',
      },
      {
        senderName: 'RBR Assessoria Contábil',
        question: '1️⃣ Departamento Fiscal\n2️⃣ Departamento Contábil\n3️⃣ Comprovante de pagamento\n4️⃣ Falar com atendente humano',
      },
      {
        senderName: 'Empresa X',
        question: 'Esta é uma mensagem automática. Em caso de urgência ligue 192. Retornaremos em breve.',
      },
    ];
    for (const c of uras) {
      expect(isAutoReplyOrCommercialBot(c.question, { senderName: c.senderName }), c.question).toBe(true);
      const reply = quickResponse({
        question: c.question,
        senderName: c.senderName,
        hasPendingPaymentContext: true,
      });
      expect(reply?.suppressed, c.senderName).toBe(true);
      expect(reply?.answer, c.senderName).toBe('');
      expect(reply?.handoff, c.senderName).not.toBe(true);
    }
  });

  it('silencia empresas/PJ mesmo em saudações simples e nunca oferece Orientação Técnica para empresas ou contatos frios', () => {
    for (const company of ['Americana Contábil', 'Clínica Burgos', 'RBR Assessoria Contábil', 'Lia Odontologia']) {
      const r = quickResponse({ question: 'Bom dia', senderName: company });
      expect(r?.suppressed, company).toBe(true);
      expect(r?.answer, company).toBe('');
    }

    // Contato frio não-empresa: nunca oferece link de Orientação Técnica (R$ 30)
    const coldGreet = quickResponse({ question: 'Oi', senderName: 'Carlos', isColdContact: true, role: 'unknown' });
    expect(coldGreet?.answer).not.toContain(PATIENT_PAY_LINK);
    expect(coldGreet?.answer).not.toMatch(/Orientação Técnica|R\$ 30/i);
    expect(coldGreet?.answer).toContain('SAIR');

    const coldAudio = quickResponse({ isAudio: true, senderName: 'Carlos', isColdContact: true, role: 'unknown' });
    expect(coldAudio?.answer).not.toContain(PATIENT_PAY_LINK);
  });
});

describe('Falha 4 — Classificação de pagamento exige cobrança/pedido pendente real do próprio contato', () => {
  it('jamais classifica mensagem como aviso de pagamento sem contexto pendente real (ex.: RBR Assessoria Contábil)', () => {
    const rbr = quickResponse({
      question: 'Segue o comprovante de pagamento da guia',
      senderName: 'RBR Assessoria Contábil',
      hasPendingPaymentContext: false,
    });
    expect(rbr?.suppressed).toBe(true);
    expect(rbr?.model).not.toBe('payment-claim');

    // Mesmo para pessoa física SEM cobrança pendente (default false): não aciona payment-claim
    for (const q of ['paguei', 'fiz o pix', 'segue o comprovante', 'pagamento realizado']) {
      const r = quickResponse({ question: q, senderName: 'João' });
      expect(r?.model, q).not.toBe('payment-claim');
    }

    // Comprovante de residência nunca é classificado como aviso de pagamento
    expect(isPaymentClaimText('Segue meu comprovante de residência')).toBe(false);
    expect(isPaymentClaimText('Enviei comprovante de endereço')).toBe(false);
  });

  it('classifica payment-claim apenas quando há pedido/cobrança pendente real e sanitiza strings proibidas', () => {
    const r = quickResponse({
      question: 'paguei o pix agora',
      senderName: 'Maria',
      hasPendingPaymentContext: true,
    });
    expect(r?.model).toBe('payment-claim');
    expect(r?.answer).toContain('Mercado Pago');
    expect(r?.answer).not.toMatch(/recebemos sua mensagem sobre o pagamento|pagamento informado/i);

    const sanitized = sanitizeOutboundAnswer('Recebemos sua mensagem sobre o pagamento. 🔔 PAGAMENTO INFORMADO');
    expect(sanitized).not.toMatch(/recebemos sua mensagem sobre o pagamento|pagamento informado/i);
  });
});
