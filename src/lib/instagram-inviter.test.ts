import { describe, expect, it } from 'vitest';
import {
  parseCliArgs,
  isDoctorProfile,
  formatGreetingName,
  buildInviteMessage,
  buildCookiesFromEnv,
  detectInstagramRestriction,
  isWithinBusinessHours,
  isAllowedSendWindow,
  loadCsvBlockedProfiles,
  recordInviteSent,
  canSendToday,
  resolveChromiumExecutablePath,
} from '../../scripts/agent_instagram_direct_inviter.mjs';

describe('Instagram Direct Inviter (VPS optimization, Protocolo v2 & compliance)', () => {
  it('defaults to headless mode + Protocolo v2 limits (12/day) and parses CLI flags accurately', () => {
    const defaults = parseCliArgs([], {});
    expect(defaults.headless).toBe(true);
    expect(defaults.dryRun).toBe(false);
    expect(defaults.daemon).toBe(false);
    expect(defaults.followBeforeDm).toBe(false);
    expect(defaults.includeLink).toBe(false);
    expect(defaults.allowSunday).toBe(false);
    expect(defaults.maxDaily).toBe(12);

    const custom = parseCliArgs(
      ['--dry-run', '--max', '15', '--daemon', '--follow', '--with-link', '--allow-sunday', '--hashtags', '#medicinacanabinoide,endocanabinologia'],
      {},
    );
    expect(custom.dryRun).toBe(true);
    expect(custom.maxDaily).toBe(15);
    expect(custom.daemon).toBe(true);
    expect(custom.followBeforeDm).toBe(true);
    expect(custom.includeLink).toBe(true);
    expect(custom.allowSunday).toBe(true);
    expect(custom.hashtags).toEqual(['medicinacanabinoide', 'endocanabinologia']);

    const headed = parseCliArgs(['--headed', '--export-cookies'], {});
    expect(headed.headless).toBe(false);
    expect(headed.exportCookiesOnly).toBe(true);

    expect(parseCliArgs(['--daemon'], {}).dryRun).toBe(true);
    expect(parseCliArgs(['--daemon'], { IG_DRY_RUN: 'false' }).dryRun).toBe(false);
    expect(parseCliArgs(['--daemon', '--live'], {}).dryRun).toBe(false);
  });

  it('strictly filters medical doctors and rejects psychologists, nutritionists, optometrists, and clinics', () => {
    expect(isDoctorProfile('Médico Psiquiatra | CRM-SP 123456 | Medicina Canabinoide', 'Dr. João Silva')).toBe(true);
    expect(isDoctorProfile('Neurologista RQE 45210 • Dor crônica', 'Dra. Ana Costa')).toBe(true);
    expect(isDoctorProfile('Psicóloga Clínica | CRP 06/12345 | Saúde integrativa', 'Rebeca Lara')).toBe(false);
    expect(isDoctorProfile('Nutricionista integrativa CRN-3 9988', 'Marina Nutri')).toBe(false);
    expect(isDoctorProfile('SJS Serviços Optométricos • Cuidado visual', 'SJS Optometria')).toBe(false);
    expect(isDoctorProfile('Farmácia de Manipulação e dispensação CBD', 'Farmácia Vida')).toBe(false);
    expect(isDoctorProfile('Paciente de cannabis medicinal compartilhando rotina', 'Carlos')).toBe(false);
  });

  it('builds compliant Protocolo v2 copy (without link by default, and clickable URL when --with-link is active)', () => {
    const msgDefault = buildInviteMessage({ fullName: 'Dr. Carlos Mendes', username: 'drcarlos', bio: 'CRM-SP 99881', templateIndex: 0 });
    const msgFemale = buildInviteMessage({ fullName: 'Dra. Beatriz Lima', username: 'drabeatriz', bio: 'Médica Psiquiatra CRM-RJ 55442', templateIndex: 0 });
    const msgWithLink = buildInviteMessage({
      fullName: 'Dr. Carlos Mendes',
      username: 'drcarlos',
      bio: 'CRM-SP 99881',
      includeLink: true,
    });

    for (const msg of [msgDefault, msgFemale, msgWithLink]) {
      expect(msg).toContain('93%');
      expect(msg).toContain('Planta y Raiz');
      expect(msg).toContain('Enfª Brisa');
      expect(msg).not.toMatch(/s[oó]cio|participa[cç][aã]o\s+(nos|dos)\s+lucros|taxa\s+zero|100%\s+de\s+repasse|pacientes\s+100%\s+seus/i);
    }

    expect(msgDefault).not.toContain('https://');
    expect(msgFemale).toContain('Dra. Beatriz');
    expect(msgFemale).toContain('psiquiatria e cannabis medicinal');
    expect(msgWithLink).toContain('Clique aqui');
    expect(msgWithLink).toContain('https://www.plantayraiz.com.br/cadastro-profissional');
    expect(msgWithLink).toContain('7%');

    expect(formatGreetingName('Clínica Saúde Total', 'clinicasaude', 'Médico CRM-SP 12345')).toBe('colega');
    expect(formatGreetingName('Dra. Beatriz Lima | Psiquiatria', 'drabeatriz', 'CRM-RJ 55442')).toBe('Dra. Beatriz');
  });

  it('builds Instagram session cookies from env for headless VPS authentication', () => {
    const cookies = buildCookiesFromEnv({
      IG_SESSIONID: 'sess_abc123',
      IG_DS_USER_ID: '98765',
      IG_CSRFTOKEN: 'csrf_xyz',
    });
    expect(cookies).toHaveLength(3);
    expect(cookies[0]).toMatchObject({ name: 'sessionid', value: 'sess_abc123', domain: '.instagram.com', httpOnly: true, secure: true });
    expect(buildCookiesFromEnv({})).toEqual([]);
  });

  it('detects Instagram challenge, suspension, login redirect, and action block', () => {
    expect(detectInstagramRestriction({ url: 'https://www.instagram.com/challenge/123/' }).restricted).toBe(true);
    expect(detectInstagramRestriction({ url: 'https://www.instagram.com/accounts/login/?next=/' }).restricted).toBe(true);
    expect(detectInstagramRestriction({ url: 'https://www.instagram.com/direct/t/1/', bodyText: 'Tente novamente mais tarde. Restringimos certas atividades.' }).restricted).toBe(true);
    expect(detectInstagramRestriction({ url: 'https://www.instagram.com/drjoao/', bodyText: 'Médico CRM 12345' }).restricted).toBe(false);
  });

  it('loads convites_medicos.csv and exclusao.csv for unified dedup and respects Mon-Sat + dry-run guards', () => {
    const state = { invitedProfiles: {}, dailyCounters: {}, blockedUntil: null };
    const thursdayNoonBrt = new Date('2026-11-19T15:00:00Z'); // Thu 12:00 BRT
    const sundayNoonBrt = new Date('2026-11-22T15:00:00Z'); // Sun 12:00 BRT

    expect(isWithinBusinessHours(thursdayNoonBrt, 9, 19)).toBe(true);
    expect(isWithinBusinessHours(new Date('2026-11-19T06:00:00Z'), 9, 19)).toBe(false); // 03:00 BRT
    expect(isAllowedSendWindow(thursdayNoonBrt, { startHourBrt: 9, endHourBrt: 19, allowSunday: false })).toBe(true);
    expect(isAllowedSendWindow(sundayNoonBrt, { startHourBrt: 9, endHourBrt: 19, allowSunday: false })).toBe(false);
    expect(isAllowedSendWindow(sundayNoonBrt, { startHourBrt: 9, endHourBrt: 19, allowSunday: true })).toBe(true);

    const csvBlocked = loadCsvBlockedProfiles();
    expect(csvBlocked.has('dra.veronicapaiva')).toBe(true);
    expect(csvBlocked.has('wecann.academy')).toBe(true);

    expect(recordInviteSent(state, 'drteste', { name: 'Dr. Teste' }, { dryRun: true, now: thursdayNoonBrt })).toBe(false);
    expect(Object.keys(state.invitedProfiles)).toHaveLength(0);
    expect(canSendToday(state, 1, thursdayNoonBrt)).toBe(true);

    const blockedState = { ...state, blockedUntil: new Date(thursdayNoonBrt.getTime() + 3600_000).toISOString() };
    expect(canSendToday(blockedState, 12, thursdayNoonBrt)).toBe(false);

    expect(resolveChromiumExecutablePath({ PUPPETEER_EXECUTABLE_PATH: '/custom/chrome' }, (p) => p === '/custom/chrome')).toBe('/custom/chrome');
    expect(resolveChromiumExecutablePath({}, (p) => p === '/usr/bin/chromium')).toBe('/usr/bin/chromium');
  });
});
