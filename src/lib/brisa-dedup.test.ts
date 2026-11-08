import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { claimBrisaInbound } from '../../supabase/functions/_shared/brisa-inbound-claim';
import { acquireBrisaWorkerLock } from '../../scripts/lib/brisa-worker-lock.mjs';

describe('one WhatsApp response per inbound', () => {
  it('only one of two simultaneous identical callbacks wins', async () => {
    const ids = new Set<string>();
    const sb = { from: () => ({ insert: (row: { wa_message_id: string }) => ({ select: () => ({ maybeSingle: async () => {
      if (ids.has(row.wa_message_id)) return { data: null, error: { code: '23505' } };
      ids.add(row.wa_message_id);
      return { data: row, error: null };
    } }) }) }) };
    expect(await Promise.all([claimBrisaInbound(sb, 'same-message', 'test-chat'), claimBrisaInbound(sb, 'same-message', 'test-chat')]))
      .toEqual(['claimed', 'duplicate']);
    expect(await claimBrisaInbound(sb, 'new-message', 'test-chat')).toBe('claimed');
  });
  it('does not send when the claim store is unavailable or the identifier is absent', async () => {
    const sb = { from: () => { throw new Error('offline'); } };
    expect(await claimBrisaInbound(sb, 'id', 'chat')).toBe('unavailable');
    expect(await claimBrisaInbound(sb, '', 'chat')).toBe('unavailable');
  });
  it('blocks a second live worker and releases the lock for restart', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brisa-lock-'));
    try {
      const file = path.join(dir, 'worker.lock');
      const release = acquireBrisaWorkerLock(file, 101, () => true);
      expect(typeof release).toBe('function');
      expect(acquireBrisaWorkerLock(file, 102, () => true)).toBeNull();
      release?.();
      const next = acquireBrisaWorkerLock(file, 102, () => true);
      expect(typeof next).toBe('function');
      next?.();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});