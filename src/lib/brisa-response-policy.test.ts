import { describe, expect, it } from 'vitest';
import { patientName, quickResponse, repeatedWithinDay, DAY_MS } from '../../supabase/functions/_shared/brisa-response-policy.mjs';

describe('Brisa response safety rules', () => {
  it('rejects numeric usernames and email as patient names', () => {
    expect(patientName('Dr. Franciscopego263')).toBe('');
    expect(patientName('saulo@example.com')).toBe('');
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
  it('does not reply to unsolicited service offers', () => {
    expect(quickResponse({ question: 'ofereco secretaria virtual' })?.suppressed).toBe(true);
  });
});