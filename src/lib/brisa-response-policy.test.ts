import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import {
  PATIENT_PAY_LINK,
  isMediaOnlyText,
  introducedWithinDay,
  patientName,
  quickResponse,
  repeatedWithinDay,
  sanitizeOutboundAnswer,
  LOOPING_BOT_NUMBERS,
  DAY_MS,
} from '../../supabase/functions/_shared/brisa-response-policy.mjs';

describe('Brisa response safety rules', () => {
  it('rejects numeric usernames, email, and generic clinic profile names as patient names', () => {
    expect(patientName('Dr. Franciscopego263')).toBe('');
    expect(patientName('saulo@example.com')).toBe('');
    expect(patientName('Consultório')).toBe('');
    expect(patientName('Recepção Clínica Paciornik')).toBe('');
    expect(patientName('Vital Apex Health')).toBe('');
    expect(patientName('Saulo')).toBe('Saulo');
  });
  it('prioritizes emergency over human requests and enrollment', () => {
    const reply = quickResponse({ question: 'Quero humano estou com falta de ar' });
    expect(reply?.model).toBe('safety-emergency');
    expect(reply?.answer).toContain('192');
    expect(reply?.answer).not.toContain('cadastro');
  });
  it('hands off to a human but answers identity questions honestly', () => {
    expect(quickResponse({ question: 'quero falar com o Dr Edilson' })?.handoff).toBe(true);
    expect(quickResponse({ question: 'preciso falar com humano' })?.handoff).toBe(true);
    expect(quickResponse({ question: 'vou pausar a automacao para esta conversa' })?.handoff).toBe(true);
    expect(quickResponse({ question: 'pausar esta conversa' })?.handoff).toBe(true);
    expect(quickResponse({ question: 'voce e um robo' })?.model).toBe('identity');
  });
  it('never promotes doctor ads for a pure greeting', () => {
    expect(quickResponse({ question: 'Qk', senderName: 'Dr. Franciscopego263' })?.model).toBe('greeting-response');
  });
  it('handles audio and calls explicitly', () => {
    expect(quickResponse({ isAudio: true })?.model).toBe('audio-response');
    expect(quickResponse({ isCall: true })?.model).toBe('call-response');
  });
  it('acknowledges documents without claiming payment approval', () => {
    expect(quickResponse({ question: 'enviei os documentos' })?.model).toBe('receipt-notice');
  });
  it('blocks identical and over 80 percent similar replies only within 24 hours', () => {
    const now = 200000000;
    expect(repeatedWithinDay('Olá como posso ajudar?', [{ text: 'Olá como posso ajudar!', sentAt: now - 1000 }], now)).toBe(true);
    expect(repeatedWithinDay('Olá', [{ text: 'Olá', sentAt: now - DAY_MS }], now)).toBe(false);
    expect(repeatedWithinDay('Outra pergunta', [{ text: 'Olá', sentAt: now - 1000 }], now)).toBe(false);
  });
  it('does not reply to unsolicited service offers or clinic auto-reply bots', () => {
    expect(quickResponse({ question: 'ofereco secretaria virtual' })?.suppressed).toBe(true);
    expect(quickResponse({ question: 'este canal é da Vital Apex Health Center, não consigo verificar cadastro' })?.suppressed).toBe(true);
    expect(quickResponse({ question: 'Não agendamos consulta por aqui' })?.suppressed).toBe(true);
    expect(quickResponse({ question: 'Não entendi, escolha uma das opções acima, por favor.' })?.suppressed).toBe(true);
    expect(LOOPING_BOT_NUMBERS.has('5511979977802')).toBe(true);
    expect(LOOPING_BOT_NUMBERS.has('551153045378')).toBe(true);
    expect(LOOPING_BOT_NUMBERS.has('551633572527')).toBe(true);
    expect(LOOPING_BOT_NUMBERS.has('557591462018')).toBe(true);
  });
  it('payment claims, emoji and stickers never get "recebemos" nor a payment alert', () => {
    for (const q of ['paguei', 'fiz o pix', 'segue o comprovante', 'já paguei']) {
      const r = quickResponse({ question: q });
      expect(r?.model).toBe('payment-claim');
      expect(r?.answer).not.toMatch(/recebemos|confirmad[oa] o pagamento|pagamento informado/i);
      expect(r?.answer).toContain('Mercado Pago');
      expect(r?.answer).toContain(PATIENT_PAY_LINK);
    }
    expect(quickResponse({ question: '👍' })?.suppressed).toBe(true);
    expect(quickResponse({ question: '🙏🙏 !!' })?.suppressed).toBe(true);
    expect(quickResponse({ isSticker: true })?.suppressed).toBe(true);
    expect(isMediaOnlyText('Oi 😊')).toBe(false);
    expect(fs.readFileSync('scripts/agent_evolution_brisa_live_responder.mjs', 'utf8')).not.toContain('Recebemos. O acesso é liberado');
  });
  it('audio gets one fixed answer with the payment link; greeting is not repeated within 24 h', () => {
    const audio = quickResponse({ isAudio: true });
    expect(audio?.answer).toContain('Ainda não consigo ouvir áudios, pode me escrever?');
    expect(audio?.answer).toContain(PATIENT_PAY_LINK);
    const now = 500000000;
    expect(introducedWithinDay([{ text: audio?.answer ?? '', sentAt: now - 1000 }], now)).toBe(false);
    const greet = quickResponse({ question: 'oi', senderName: 'Ana' });
    expect(greet?.answer).toContain('Sou a Enfª Brisa, assistente virtual');
    expect(greet?.answer).toContain(PATIENT_PAY_LINK);
    expect(introducedWithinDay([{ text: greet?.answer ?? '', sentAt: now - 1000 }], now)).toBe(true);
    expect(introducedWithinDay([{ text: greet?.answer ?? '', sentAt: now - DAY_MS - 1 }], now)).toBe(false);
    const again = quickResponse({ question: 'oi', senderName: 'Ana', introducedRecently: true });
    expect(again?.answer).not.toMatch(/Sou a Enf/);
    expect(again?.answer).toContain(PATIENT_PAY_LINK);
  });
  it('unpaid patient contacts get a short answer with the express checkout link and never a doctor persona', () => {
    for (const q of ['tenho insonia', 'voces vendem oleo de cbd?']) {
      const r = quickResponse({ question: q });
      expect(r?.answer).toContain(PATIENT_PAY_LINK);
      expect(r?.answer.length).toBeLessThan(260);
    }
    expect(quickResponse({ question: 'quem e voce' })?.answer).toMatch(/^Sou a Enfª Brisa, assistente virtual/);
    expect(quickResponse({ question: 'SAIR' })?.optOut).toBe(true);
  });
  it('cold "Parabéns, Dr(a)... selecionado(a)" WhatsApp invites only run on a manual admin send', () => {
    const inviter = fs.readFileSync('scripts/agent_cadence_10min_inviter.mjs', 'utf8');
    const start = inviter.slice(inviter.indexOf('async function startCadenceInviter'));
    expect(start.indexOf("process.env.MANUAL_ADMIN_SEND !== '1'")).toBeGreaterThan(-1);
    expect(start.indexOf("process.env.MANUAL_ADMIN_SEND !== '1'")).toBeLessThan(start.indexOf('sendWhatsAppInvite('));
  });
  it('honors opt-out phrases and sanitizes forbidden human claims or bare links', () => {
    expect(quickResponse({ question: 'Não tenho interesse, pare de enviar' })?.optOut).toBe(true);
    expect(sanitizeOutboundAnswer('Oi, sou agente humano. Em que podemos ajudar?')).not.toMatch(/sou agente humano/i);
    expect(sanitizeOutboundAnswer('https://plantayraiz.com.br')).toContain('Acesse nossa plataforma oficial em:');
  });
  it('enforces 19/11 sales audit rules: consultative opener, no cannabis product sale, handoff for refund/minor/legal, and strips forbidden claims', () => {
    const greeting = quickResponse({ question: 'Oi', senderName: 'Maria' });
    expect(greeting?.model).toBe('greeting-response');
    expect(greeting?.answer).toContain('assistente virtual');
    expect(greeting?.answer).not.toContain('Você já tem cadastro');

    const buyProduct = quickResponse({ question: 'Vocês vendem óleo de CBD?' });
    expect(buyProduct?.model).toBe('no-medication-sale');
    expect(buyProduct?.answer).toContain('não vende nem entrega medicamentos');
    expect(buyProduct?.answer).toContain('orientacao-tecnica');

    expect(quickResponse({ question: 'Quero reembolso do pagamento' })?.handoff).toBe(true);
    expect(quickResponse({ question: 'Atendimento para meu filho de 8 anos' })?.handoff).toBe(true);
    expect(quickResponse({ question: 'Vou acionar meu advogado' })?.handoff).toBe(true);
    expect(quickResponse({ question: 'Olá, sou o assistente virtual de Clínica Modelo' })?.suppressed).toBe(true);

    expect(sanitizeOutboundAnswer('Plano com taxa zero e 100% de repasse para médico sócio com participação nos lucros')).not.toMatch(/taxa zero|100% de repasse|médico sócio|participação nos lucros/i);
    expect(sanitizeOutboundAnswer('Plano com taxa zero e 100% de repasse')).toContain('93%');
  });
});