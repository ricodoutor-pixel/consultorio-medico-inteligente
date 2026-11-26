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

describe('Agentes reativados — WhatsApp 15 min e Brevo 300/dia com guardrails estritos', () => {
  it('scripts/PAUSE_AUTOMATION.flag NUNCA fica commitado no repositório (bloqueava Brisa, WhatsApp e Brevo)', () => {
    expect(fs.existsSync('scripts/PAUSE_AUTOMATION.flag')).toBe(false);
  });

  it('evita falsos positivos em sobrenome "Beleza" e psiquiatra com "Psiquiatria/Psicoterapia", mantendo bloqueios PJ/psicologia', () => {
    expect(isCompanyOrNonDoctorContact({ name: 'Dr(a). Flaeste Cruz Beleza', specialty: 'Médico de Familia e Comunidade' }).blocked).toBe(false);
    expect(isCompanyOrNonDoctorContact({ name: 'Dr(a). Carlos Eduardo Santana de Oliveira', specialty: 'Psiquiatria/Psicoterapia' }).blocked).toBe(false);
    expect(isCompanyOrNonDoctorContact({ name: 'Salão de Beleza Glamour' }).blocked).toBe(true);
    expect(isCompanyOrNonDoctorContact({ name: 'Ana Paula', specialty: 'Psicoterapia Clínica' }).blocked).toBe(true);
  });

  it('WhatsApp inviter mantém cadência mínima de 15 min, bloqueia PJ e não prefixa Dr(a). sem CRM', async () => {
    const wpp = await import('../../scripts/agent_brevo_doctor_whatsapp_inviter.mjs');
    expect(wpp.CADENCE_MS).toBe(15 * 60 * 1000);
    expect(wpp.isExcludedAudience('Americana Contábil', 'contato@americanacontabil.com.br', '').excluded).toBe(true);
    expect(wpp.isExcludedAudience('Ari da Silva Avelar', 'ari@gmail.com', 'Pneumologista').excluded).toBe(false);

    const neutralMsg = wpp.buildInvitationMessage('Dr(a). Ari da Silva Avelar', { email: 'ari@gmail.com', specialty: 'Pneumologista' });
    expect(neutralMsg).toContain('Olá, Ari da Silva!');
    expect(neutralMsg).not.toMatch(/\bDr\(a\)\./);
    expect(neutralMsg).toContain('SAIR');
    expect(neutralMsg).toContain('cadastro-profissional');

    const crmMsg = wpp.buildInvitationMessage('Ana Paula', { crm: '49354', crmState: 'PR' });
    expect(crmMsg).toContain('Olá, Dr(a). Ana Paula!');
  });

  it('Brevo multi-pipeline opera com cota de 300/dia (2 min), bloqueia PJ, sem Dr(a). sem CRM e sem frases proibidas', async () => {
    const brevo = await import('../../scripts/agent_brevo_multi_pipeline.mjs');
    expect(brevo.DAILY_BREVO_LIMIT).toBe(300);
    expect(brevo.CADENCE_MS).toBe(120000);

    const pjBlocked = brevo.buildDoctorEmailForStep({ name: 'Plan Saúde Cartão Benefícios Ltda', email: 'contato@plansaude.com.br' }, 1);
    expect(pjBlocked.allowed).toBe(false);

    for (const step of [1, 2, 3]) {
      const noCrm = brevo.buildDoctorEmailForStep({ name: 'Dr(a). Ari da Silva Avelar', email: 'ari@gmail.com', specialty: 'Pneumologista' }, step);
      expect(noCrm.allowed, `step ${step}`).toBe(true);
      expect(noCrm.subject, `step ${step}`).not.toMatch(/\bDr\(a\)\./);
      expect(noCrm.htmlContent, `step ${step}`).not.toMatch(/Dr\(a\)\.|medicina canabin|40\.000|s[oó]ci[oa]|taxa zero/i);
      expect(noCrm.htmlContent, `step ${step}`).toContain('SAIR');
      expect(noCrm.textContent, `step ${step}`).toContain('SAIR');
    }

    const withCrm = brevo.buildDoctorEmailForStep({ name: 'Ana Paula', email: 'ana@gmail.com', crm: '49354', uf: 'PR' }, 1);
    expect(withCrm.allowed).toBe(true);
    expect(withCrm.subject).toContain('Dr(a). Ana Paula');
  });

  it('E2E real: inicia sob PM2 (ProcessContainerFork.js), envia WhatsApp via Evolution mock e ignora lastOffset obsoleto', async () => {
    const http = await import('node:http');
    const os = await import('node:os');
    const path = await import('node:path');
    const { spawn } = await import('node:child_process');

    const sentPayloads: Array<{ url: string; body: Record<string, unknown> }> = [];
    const server = http.createServer((req, res) => {
      if (req.url?.includes('/instance/connectionState/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ instance: { state: 'open' } }));
        return;
      }
      if (req.url?.includes('/message/sendText/')) {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          sentPayloads.push({ url: req.url || '', body: JSON.parse(body || '{}') });
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ key: { id: 'mock-msg-1' } }));
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const { port } = server.address() as { port: number };
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-wpp-e2e-'));
    const stateFile = path.join(tmpDir, 'state.json');
    const logFile = path.join(tmpDir, 'wpp.log');
    const lockFile = path.join(tmpDir, 'wpp.pid.lock');
    // Simula state antigo da VPS com lastOffset maior que a base local
    fs.writeFileSync(stateFile, JSON.stringify({ lastOffset: 9999, totalInvited: 0, invitedPhones: {}, invitedEmails: {} }));

    try {
      // 1. Executa um ciclo completo via runOneInviteCycle em horário comercial BRT
      process.env.EVOLUTION_URL_VPS = `http://127.0.0.1:${port}`;
      process.env.EVOLUTION_API_KEY_VPS = 'mock-evo-key';
      process.env.EVOLUTION_INSTANCE = 'plantayraiz';
      process.env.BRISA_DRY_RUN = 'false';
      process.env.WPP_INVITER_STATE_FILE = stateFile;
      process.env.WPP_INVITER_LOG_FILE = logFile;
      process.env.WPP_INVITER_PID_LOCK = lockFile;

      const wpp = await import('../../scripts/agent_brevo_doctor_whatsapp_inviter.mjs');
      const localLeads = wpp.loadLocalCuratedLeads();
      expect(localLeads.length).toBeGreaterThan(700);
      const state = { lastOffset: 9999, brevoOffset: 0, totalInvited: 0, invitedPhones: {}, invitedEmails: {} };
      const cycle = await wpp.runOneInviteCycle({
        localLeads,
        knownPhones: new Set(),
        knownNames: new Set(),
        state,
        now: new Date('2026-11-26T15:00:00Z'), // Quinta 12:00 BRT
      });
      expect(cycle.action).toBe('sent');
      expect(cycle.ms).toBe(15 * 60 * 1000);
      expect(state.totalInvited).toBe(1);
      expect(sentPayloads).toHaveLength(1);
      expect(String(sentPayloads[0].body.text || '')).not.toMatch(/\bDr\(a\)\./);
      expect(String(sentPayloads[0].body.text || '')).toContain('SAIR');

      // 2. Prova que sob PM2 ProcessContainerFork.js (argv[1] != script) o daemon REALMENTE inicia e grava log
      const fakePm2Wrapper = path.join(tmpDir, 'ProcessContainerFork.js');
      const scriptUrl = new URL('../../scripts/agent_brevo_doctor_whatsapp_inviter.mjs', import.meta.url).href;
      fs.writeFileSync(fakePm2Wrapper, `import(${JSON.stringify(scriptUrl)});\n`);

      const child = spawn(process.execPath, [fakePm2Wrapper], {
        env: {
          ...process.env,
          VITEST: '',
          NODE_ENV: 'production',
          BRISA_NO_AUTOSTART: '',
          BRISA_DRY_RUN: 'true',
          EVOLUTION_URL_VPS: `http://127.0.0.1:${port}`,
          EVOLUTION_API_KEY_VPS: 'mock-evo-key',
          WPP_INVITER_STATE_FILE: stateFile,
          WPP_INVITER_LOG_FILE: logFile,
          WPP_INVITER_PID_LOCK: lockFile,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      child.stdout.on('data', (d) => { stdout += d.toString(); });
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2500);
        child.stdout.on('data', () => {
          if (stdout.includes('AGENTE DE CONVITES WHATSAPP PARA MÉDICOS INICIADO')) {
            clearTimeout(timer);
            resolve();
          }
        });
      });
      child.kill('SIGTERM');
      await new Promise<void>((resolve) => child.on('exit', () => resolve()));
      expect(stdout).toContain('AGENTE DE CONVITES WHATSAPP PARA MÉDICOS INICIADO');
    } finally {
      delete process.env.EVOLUTION_URL_VPS;
      delete process.env.EVOLUTION_API_KEY_VPS;
      delete process.env.EVOLUTION_INSTANCE;
      delete process.env.BRISA_DRY_RUN;
      delete process.env.WPP_INVITER_STATE_FILE;
      delete process.env.WPP_INVITER_LOG_FILE;
      delete process.env.WPP_INVITER_PID_LOCK;
      server.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('E2E real: Brevo 300/dia inicia sob PM2, envia e-mail via API mock e ativa pausa protetora em erro 554', async () => {
    const http = await import('node:http');
    const os = await import('node:os');
    const path = await import('node:path');
    const { spawn } = await import('node:child_process');

    let return554 = false;
    const sentEmails: Array<Record<string, unknown>> = [];
    const server = http.createServer((req, res) => {
      if (req.url?.includes('/smtp/email') && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          if (return554) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ code: 'permission_denied', message: '554 Outbound sending disabled' }));
            return;
          }
          sentEmails.push(JSON.parse(body || '{}'));
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ messageId: '<mock-brevo-1@smtp-relay.mailin.fr>' }));
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ contacts: [] }));
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const { port } = server.address() as { port: number };
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-brevo-e2e-'));
    const stateFile = path.join(tmpDir, 'brevo_state.json');
    const logFile = path.join(tmpDir, 'brevo.log');
    const lockFile = path.join(tmpDir, 'brevo.pid.lock');

    try {
      const fakePm2Wrapper = path.join(tmpDir, 'ProcessContainerFork.js');
      const scriptUrl = new URL('../../scripts/agent_brevo_multi_pipeline.mjs', import.meta.url).href;
      fs.writeFileSync(fakePm2Wrapper, `import(${JSON.stringify(scriptUrl)});\n`);

      // 1. Disparo real via PM2 wrapper contra Brevo mock retornando 201
      const child = spawn(process.execPath, [fakePm2Wrapper], {
        env: {
          ...process.env,
          VITEST: '',
          NODE_ENV: 'production',
          BRISA_NO_AUTOSTART: '',
          BREVO_API_KEY: 'mock-brevo-key',
          BREVO_API_BASE_URL: `http://127.0.0.1:${port}`,
          BREVO_SKIP_MX_CHECK: '1',
          BREVO_PIPELINE_STATE_FILE: stateFile,
          BREVO_PIPELINE_LOG_FILE: logFile,
          BREVO_PIPELINE_PID_LOCK: lockFile,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      child.stdout.on('data', (d) => { stdout += d.toString(); });
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 3500);
        child.stdout.on('data', () => {
          if (stdout.includes('AGENTE BREVO MULTI-PIPELINE INICIADO') && (sentEmails.length > 0 || stdout.includes('FORA DO HORÁRIO COMERCIAL'))) {
            clearTimeout(timer);
            resolve();
          }
        });
      });
      child.kill('SIGTERM');
      await new Promise<void>((resolve) => child.on('exit', () => resolve()));
      expect(stdout).toContain('AGENTE BREVO MULTI-PIPELINE INICIADO');
      expect(stdout).toContain('COTA: 300/DIA');

      // 2. Testa runMultiPipelineBatch em horário comercial BRT (12:00 BRT) com 201 OK e depois 554 bloqueado
      process.env.BREVO_API_KEY = 'mock-brevo-key';
      process.env.BREVO_API_BASE_URL = `http://127.0.0.1:${port}`;
      process.env.BREVO_PIPELINE_STATE_FILE = stateFile;
      process.env.BREVO_PIPELINE_LOG_FILE = logFile;
      process.env.BREVO_PIPELINE_PID_LOCK = lockFile;
      const brevo = await import('../../scripts/agent_brevo_multi_pipeline.mjs');

      const okRes = await brevo.runMultiPipelineBatch(1, {
        now: new Date('2026-11-26T15:00:00Z'), // Quinta 12:00 BRT
        skipMxCheck: true,
      });
      expect(okRes.processed).toBe(1);
      expect(okRes.providerBlocked).toBe(false);
      expect(sentEmails.length).toBeGreaterThanOrEqual(1);
      const lastEmail = sentEmails[sentEmails.length - 1];
      expect(String(lastEmail.subject || '')).not.toMatch(/\bDr\(a\)\./);
      expect(String(lastEmail.htmlContent || '')).toContain('SAIR');

      return554 = true;
      const blockedRes = await brevo.runMultiPipelineBatch(1, {
        now: new Date('2026-11-26T15:05:00Z'),
        skipMxCheck: true,
      });
      expect(blockedRes.processed).toBe(0);
      expect(blockedRes.providerBlocked).toBe(true);
    } finally {
      delete process.env.BREVO_API_KEY;
      delete process.env.BREVO_API_BASE_URL;
      delete process.env.BREVO_PIPELINE_STATE_FILE;
      delete process.env.BREVO_PIPELINE_LOG_FILE;
      delete process.env.BREVO_PIPELINE_PID_LOCK;
      server.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
