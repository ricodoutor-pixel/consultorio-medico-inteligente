import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from './logger';

describe('createLogger', () => {
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    infoSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits structured log entries with service context', () => {
    const logger = createLogger('db');

    logger.info('connection ready', { status: 'ok' });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('[db]'),
      expect.objectContaining({
        level: 'info',
        message: 'connection ready',
        status: 'ok',
      })
    );
  });

  it('emits warning entries with metadata', () => {
    const logger = createLogger('monitoring');

    logger.warn('degraded service', { retryCount: 2 });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[monitoring]'),
      expect.objectContaining({
        level: 'warn',
        message: 'degraded service',
        retryCount: 2,
      })
    );
  });
});
