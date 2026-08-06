// 🌿 Planta y Raiz — brisa-waha-connect v28 (timeout aumentado)
// Endpoints WAHA confirmados na doc oficial 2026:
//   GET  /api/sessions          → lista sessões
//   GET  /api/sessions/:name    → detalhe (inclui config.webhooks)
//   PUT  /api/sessions/:name    → atualiza sessão (inclui webhook)
//   POST /api/sessions/start    → inicia sessão
//   POST /api/sessions/stop     → para sessão
//   GET  /api/:session/auth/qr  → QR code
//   GET  /api/sessions/:name/me → info do número conectado
//   POST /api/sendText          → envia mensagem
// CORRIGIDO v28: timeout de 15s → 45s. Servidor WAHA (Railway free tier)
// e mais lento do que crashado — 15s causava falsos "Signal timed out"
// mesmo quando a acao terminava com sucesso logo em seguida.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireServiceAuth } from '../_shared/service-auth.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// ── Variáveis de ambiente ────────────────────────────────────────────────
const RAW_WAHA_URL = Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app';
const WAHA_KEY     = Deno.env.get('WAHA_API_KEY') || 'planta123';
const WAHA_SESSION = Deno.env.get('WAHA_SESSION')  || 'default';
const SB_URL       = Deno.env.get('SUPABASE_URL')  || 'https://tkxxoghzhvhjzdoomgss.supabase.co';
const SB_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ADMIN_PHONE  = Deno.env.get('ADMIN_PHONE_BR') || '';

// URL base sempre com https://, sem trailing slash
const WAHA_BASE = (() => {
  let u = RAW_WAHA_URL.trim().replace(/\/+$/, '');
  if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
  return u;
})();

const WEBHOOK_TARGET = `${SB_URL}/functions/v1/brisa-bot`;

// ── Helpers HTTP ─────────────────────────────────────────────────────────
const hdrs = () => ({ 'Content-Type': 'application/json', 'X-Api-Key': WAHA_KEY });

async function wahaReq(method: string, path: string, body?: unknown) {
  const url = `${WAHA_BASE}${path}`;
  console.log(`[waha-connect] ${method} ${url}`);
  try {
    const r = await fetch(url, {
      method,
      headers: hdrs(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(45_000),
    });
    const text = await r.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }
    console.log(`[waha-connect] → ${r.status} | ${text.slice(0, 200)}`);
    return { ok: r.ok, status: r.status, data };
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? String(e);
    console.error(`[waha-connect] ERRO ${method} ${path}: ${msg}`);
    return { ok: false, status: 0, data: { error: msg } };
  }
}

const wahaGet  = (path: string)                => wahaReq('GET',   path);
const wahaPost = (path: string, body: unknown) => wahaReq('POST',  path, body);
const wahaPut  = (path: string, body: unknown) => wahaReq('PUT',   path, body);

// ── Supabase: salvar status ───────────────────────────────────────────────
async function saveStatus(connected: boolean, status: string, phone: string | null) {
  if (!SB_URL || !SB_KEY) return;
  try {
    const sb = createClient(SB_URL, SB_KEY);
    await sb.from('waha_sessions').upsert(
      { session_name: WAHA_SESSION, status: connected ? 'connected' : status,
        phone_number: phone, last_seen: new Date().toISOString() },
      { onConflict: 'session_name' }
    );
  } catch (e) {
    console.warn('[waha-connect] saveStatus falhou (não crítico):', (e as Error)?.message);
  }
}

// ── Resposta JSON ─────────────────────────────────────────────────────────
const ok = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d, null, 2), {
    status: s,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

// ── Payload de webhook (doc oficial) ─────────────────────────────────────
const WAHA_WEBHOOK_SECRET = Deno.env.get('WAHA_WEBHOOK_SECRET') || '';

const webhookPayload = (sessionName: string) => ({
  name: sessionName,
  config: {
    webhooks: [
      {
        url: WEBHOOK_TARGET,
        events: ['message', 'session.status'],
        customHeaders: WAHA_WEBHOOK_SECRET
          ? [{ name: 'x-webhook-secret', value: WAHA_WEBHOOK_SECRET }]
          : [],
        retries: {
          policy:       'constant',
          delaySeconds: 3,
          attempts:     5,
        },
      },
    ],
  },
});

// ════════════════════════════════════════════════════════════════════════
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // 🔐 Painel de controle do bot: só service-role / cron secret
  const unauth = requireServiceAuth(req, cors);
  if (unauth) return unauth;


  const url    = new URL(req.url);
  const action = url.searchParams.get('action') || 'status';

  try {

    // ── STATUS ────────────────────────────────────────────────────────────
    if (action === 'status') {
      const [listR, meR, detailR] = await Promise.all([
        wahaGet('/api/sessions'),
        wahaGet(`/api/sessions/${WAHA_SESSION}/me`),
        wahaGet(`/api/sessions/${WAHA_SESSION}`),
      ]);

      const list    = Array.isArray(listR.data) ? listR.data : [listR.data].filter(Boolean);
      const sess    = (list as Record<string,unknown>[]).find(
        s => s?.name === WAHA_SESSION
      ) ?? (list[0] as Record<string,unknown>);

      const wahaStatus = String(sess?.status ?? 'unknown');
      const connected  = wahaStatus === 'WORKING';

      const detail  = detailR.data as Record<string,unknown> | null;
      const config  = detail?.config as Record<string,unknown> | undefined;
      const hooks   = (config?.webhooks ?? []) as Record<string,unknown>[];
      const webhookOk = hooks.some(w => String(w?.url ?? '') === WEBHOOK_TARGET);

      const me      = meR.data as Record<string,unknown> | null;
      const phone   = String(me?.id ?? me?.pushName ?? sess?.id ?? '');

      await saveStatus(connected, wahaStatus, phone || null);

      return ok({
        ok:      true,
        action:  'status',
        session: WAHA_SESSION,
        waha_url: WAHA_BASE,
        connected,
        waha_status: wahaStatus,
        me: meR.data,
        webhook_ok:       webhookOk,
        webhook_expected: WEBHOOK_TARGET,
        webhooks_atuais:  hooks,
        diagnostico: connected
          ? webhookOk
            ? '✅ Tudo OK — WAHA conectado e webhook configurado'
            : '⚠️ WAHA conectado MAS webhook incorreto → rode ?action=webhook'
          : wahaStatus === 'SCAN_QR_CODE'
            ? '📱 Aguardando scan do QR → use o dashboard WAHA'
            : `🔴 Sessão em estado "${wahaStatus}" → tente ?action=start`,
      });
    }

    // ── WEBHOOK ──────────────────────────────────────────────────────────
    if (action === 'webhook') {
      console.log(`[waha-connect] Configurando webhook → ${WEBHOOK_TARGET}`);

      const r = await wahaPut(
        `/api/sessions/${WAHA_SESSION}`,
        webhookPayload(WAHA_SESSION)
      );

      if (r.status === 404) {
        console.warn('[waha-connect] 404 no PUT → sessão pode não existir, tentando criar...');
        const createR = await wahaPost('/api/sessions', webhookPayload(WAHA_SESSION));
        return ok({
          ok:           createR.ok,
          action:       'webhook',
          strategy:     'create_session',
          webhook_url:  WEBHOOK_TARGET,
          session:      WAHA_SESSION,
          http_status:  createR.status,
          waha_response: createR.data,
          nota: createR.ok
            ? '✅ Sessão criada com webhook. Agora escaneie o QR no dashboard WAHA.'
            : '❌ Falha ao criar sessão — verifique WAHA_API_KEY e WAHA_API_URL',
        });
      }

      const verifyR = await wahaGet(`/api/sessions/${WAHA_SESSION}`);
      const vDetail = verifyR.data as Record<string,unknown> | null;
      const vConfig = vDetail?.config as Record<string,unknown> | undefined;
      const vHooks  = (vConfig?.webhooks ?? []) as Record<string,unknown>[];
      const saved   = vHooks.some(w => String(w?.url ?? '') === WEBHOOK_TARGET);

      return ok({
        ok:           r.ok,
        action:       'webhook',
        strategy:     'update_session',
        webhook_url:  WEBHOOK_TARGET,
        session:      WAHA_SESSION,
        http_status:  r.status,
        waha_response: r.data,
        verificacao: {
          webhook_salvo:    saved,
          webhooks_atuais:  vHooks,
        },
        nota: r.ok && saved
          ? '✅ Webhook configurado e verificado com sucesso!'
          : r.ok && !saved
            ? '⚠️ PUT retornou OK mas webhook não aparece na verificação — a sessão pode reiniciar, aguarde 10s e rode ?action=status'
            : `❌ PUT retornou ${r.status} — verifique WAHA_API_KEY`,
      });
    }

    // ── START ─────────────────────────────────────────────────────────────
    if (action === 'start') {
      const r = await wahaPost('/api/sessions/start', { name: WAHA_SESSION });
      return ok({ ok: r.ok, action: 'start', session: WAHA_SESSION,
        status: r.status, data: r.data,
        nota: !r.ok ? 'Se "Signal timed out": aguarde 30s e confira ?action=status — a acao pode ter concluido mesmo assim' : undefined });
    }

    // ── STOP ──────────────────────────────────────────────────────────────
    if (action === 'stop') {
      const r = await wahaPost('/api/sessions/stop', { name: WAHA_SESSION });
      return ok({ ok: r.ok, action: 'stop', session: WAHA_SESSION,
        status: r.status, data: r.data });
    }

    // ── RESTART ───────────────────────────────────────────────────────────
    if (action === 'restart') {
      await wahaPost('/api/sessions/stop',  { name: WAHA_SESSION });
      await new Promise(r => setTimeout(r, 3000));
      const r = await wahaPost('/api/sessions/start', { name: WAHA_SESSION });
      return ok({ ok: r.ok, action: 'restart', session: WAHA_SESSION,
        status: r.status, data: r.data });
    }

    // ── QR ────────────────────────────────────────────────────────────────
    if (action === 'qr') {
      await wahaPost('/api/sessions/start', { name: WAHA_SESSION }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
      const qrR = await wahaGet(`/api/${WAHA_SESSION}/auth/qr`);
      return ok({
        ok:          qrR.ok,
        action:      'qr',
        session:     WAHA_SESSION,
        qr:          qrR.data,
        dashboard:   `${WAHA_BASE}/dashboard`,
        instrucao:   'Escaneie o QR no dashboard WAHA ou use a imagem acima no WhatsApp',
      });
    }

    // ── TEST ──────────────────────────────────────────────────────────────
    if (action === 'test') {
      const phone = url.searchParams.get('phone') || ADMIN_PHONE || '';
      if (!phone) return ok({ ok: false, error: 'Parâmetro ?phone=5511... obrigatório' }, 400);
      const chatId = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@c.us`;
      const msg    = url.searchParams.get('msg')
        || '🌿 *Planta y Raiz* — Sistema Online\n\nEnfermeira Brisa conectada e operando 24h\nhttps://plantayraiz.com.br';
      const r = await wahaPost('/api/sendText', {
        session: WAHA_SESSION,
        chatId,
        text: msg,
      });
      return ok({
        ok:     r.ok,
        action: 'test',
        phone,
        chatId,
        status: r.status,
        data:   r.data,
        nota:   r.ok ? '✅ Mensagem enviada' : '❌ Falha no envio — se "Signal timed out", verifique o WhatsApp em alguns segundos, pode ter enviado mesmo assim',
      });
    }

    // ── FULLSETUP ────────────────────────────────────────────────────────
    if (action === 'fullsetup') {
      const results: Record<string, unknown> = { waha_base: WAHA_BASE, webhook_target: WEBHOOK_TARGET };

      const statusR = await wahaGet('/api/sessions');
      const list    = Array.isArray(statusR.data) ? statusR.data : [];
      const sess    = (list as Record<string,unknown>[]).find(s => s?.name === WAHA_SESSION);
      results.status_atual = sess?.status ?? 'nao_encontrada';
      results.connected    = sess?.status === 'WORKING';

      const whr = await wahaPut(`/api/sessions/${WAHA_SESSION}`, webhookPayload(WAHA_SESSION));
      results.webhook = { ok: whr.ok, status: whr.status, url: WEBHOOK_TARGET, response: whr.data };

      await new Promise(r => setTimeout(r, 2000));
      const verR  = await wahaGet(`/api/sessions/${WAHA_SESSION}`);
      const vConf = (verR.data as Record<string,unknown>)?.config as Record<string,unknown> | undefined;
      const vHooks = (vConf?.webhooks ?? []) as Record<string,unknown>[];
      results.webhook_verificado = vHooks.some(w => String(w?.url) === WEBHOOK_TARGET);
      results.webhooks_salvos    = vHooks;

      if (ADMIN_PHONE && results.connected) {
        const chatId = `${ADMIN_PHONE.replace(/\D/g, '')}@c.us`;
        const tR = await wahaPost('/api/sendText', {
          session: WAHA_SESSION, chatId,
          text: '🌿 *Planta y Raiz* — Sistema configurado com sucesso\nEnfermeira Brisa online 24h\nhttps://plantayraiz.com.br',
        });
        results.teste_mensagem = { ok: tR.ok, phone: ADMIN_PHONE, status: tR.status };
      }

      const tudo_ok = results.connected && results.webhook_verificado;
      return ok({
        ok:     tudo_ok,
        action: 'fullsetup',
        session: WAHA_SESSION,
        results,
        conclusao: tudo_ok
          ? '✅ Sistema 100% operacional — Brisa ativa no WhatsApp'
          : results.connected
            ? '⚠️ WAHA conectado mas webhook pendente — aguarde 30s e rode ?action=status'
            : '🔴 WAHA desconectado — escaneie o QR no dashboard: ' + WAHA_BASE + '/dashboard',
      });
    }

    // ── HEALTH ────────────────────────────────────────────────────────────
    if (action === 'health') {
      return ok({
        ok:       true,
        service:  'brisa-waha-connect',
        version:  28,
        waha_base: WAHA_BASE,
        session:  WAHA_SESSION,
        webhook_target: WEBHOOK_TARGET,
        timeout_ms: 45000,
        actions:  ['status','webhook','start','stop','restart','qr','test','fullsetup','health'],
      });
    }

    return ok({
      ok:     false,
      error:  `Ação desconhecida: "${action}"`,
      acoes:  ['status','webhook','start','stop','restart','qr','test','fullsetup','health'],
    }, 400);

  } catch (e: unknown) {
    const err = e as Error;
    console.error('[waha-connect] Exceção não tratada:', err?.message, err?.stack?.slice(0, 400));
    return ok({ ok: false, error: err?.message ?? String(e) }, 500);
  }
});
