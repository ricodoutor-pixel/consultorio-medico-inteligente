import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const cached = { ok: true, source: 'cache' };
  const cache = {
    add: vi.fn(async (url: string) => { if (url === '/og-image.png') throw new Error('missing'); }),
    put: vi.fn(async () => {}),
  };
  const caches = {
    open: vi.fn(async () => cache),
    match: vi.fn(async () => cached),
    keys: vi.fn(async () => ['plantayraiz-v2.7', 'other-app-cache']),
    delete: vi.fn(async () => true),
  };
  const fetch = vi.fn(async () => ({ ok: true, source: 'network', clone: () => ({}) }));
  const self = {
    location: { origin: 'https://www.plantayraiz.com.br' },
    addEventListener: (name: string, handler: (event: any) => void) => { handlers[name] = handler; },
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  };
  runInNewContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), {
    self, caches, fetch, URL, Response, console,
  });
  return { handlers, cached, caches, fetch, self };
}

describe('site reopening cache', () => {
  it('reuses an exact hash-versioned bundle without downloading it again', async () => {
    const w = worker();
    let response: Promise<unknown> | undefined;
    w.handlers.fetch({ request: { url: 'https://www.plantayraiz.com.br/assets/index-Ab123456.js', method: 'GET' }, respondWith: (p: Promise<unknown>) => { response = p; } });
    expect(await response).toBe(w.cached);
    expect(w.fetch).not.toHaveBeenCalled();
  });
  it('fetches fresh HTML on every reopening', async () => {
    const w = worker();
    let response: Promise<any> | undefined;
    w.handlers.fetch({ request: { url: 'https://www.plantayraiz.com.br/', method: 'GET', mode: 'navigate' }, respondWith: (p: Promise<any>) => { response = p; } });
    expect((await response)?.source).toBe('network');
    expect(w.fetch).toHaveBeenCalledOnce();
  });
  it('does not intercept external or private API requests into static cache', () => {
    const w = worker();
    const respondWith = vi.fn();
    w.handlers.fetch({ request: { url: 'https://external.example/supabase/data', method: 'GET' }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
  });
  it('installs even when an optional icon is missing', async () => {
    const w = worker();
    let done: Promise<unknown> | undefined;
    w.handlers.install({ waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    expect(w.self.skipWaiting).toHaveBeenCalledOnce();
  });
  it('leaves other applications caches untouched', async () => {
    const w = worker();
    let done: Promise<unknown> | undefined;
    w.handlers.activate({ waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    expect(w.caches.delete).toHaveBeenCalledExactlyOnceWith('plantayraiz-v2.7');
  });
});