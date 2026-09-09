// 🌿 Planta y Raiz — Watchdog das sessões de Orientação Técnica (30 min por pagamento)
// Desliga automaticamente as sessões vencidas e avisa o paciente no WhatsApp,
// mesmo que ele pare de escrever. Só aceita chamadas com service-role/segredo.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sessionExpiredMessage } from '../_shared/agents.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WAHA_URL = (Deno.env.get('WAHA_API_URL') || '').replace(/\/+$/, '');
const WAHA_KEY = Deno.env.get('WAHA_API_KEY') || '';
const WAHA_SESSION = Deno.env.get('WAHA_SESSION') || 'default';
const EVO_URL = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/+$/, '');
const EVO_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVO_INST = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz';
const WEBHOOK_SECRET = Deno.env.get('WAHA_WEBHOOK_SECRET') || '';

/** Segredo do cron guardado no cofre do banco (nunca em código). */
async function vaultCronSecret(sb: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data } = await sb
      .schema('vault')
      .from('decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'OT_WATCHDOG_CRON_SECRET')
      .maybeSingle();
    return (data as { decrypted_secret?: string } | null)?.decrypted_secret || '';
  } catch {
    return '';
  }
}

function presentedSecret(req: Request): string {
  return (
    req.headers.get('x-cron-secret') ||
    req.headers.get('x-webhook-secret') ||
    (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  );
}



async function sendWhatsApp(phone: string, text: string): Promise<boolean> {
  if (WAHA_URL && WAHA_KEY) {
    try {
      const base = WAHA_URL.startsWith('http') ? WAHA_URL : `https://${WAHA_URL}`;
      const r = await fetch(`${base}/api/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_KEY },
        body: JSON.stringify({ session: WAHA_SESSION, chatId: `${phone}@c.us`, text }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) return true;
    } catch (e) { console.error('[ot-watchdog][WAHA]', (e as Error)?.message); }
  }
  if (EVO_URL && EVO_KEY) {
    try {
      const base = EVO_URL.startsWith('http') ? EVO_URL : `https://${EVO_URL}`;
      const r = await fetch(`${base}/message/sendText/${encodeURIComponent(EVO_INST)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
        body: JSON.stringify({ number: phone, text }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) return true;
    } catch (e) { console.error('[ot-watchdog][EVO]', (e as Error)?.message); }
  }
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!authorized(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  if (!SB_URL || !SB_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_config' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const sb = createClient(SB_URL, SB_KEY);
  const { data, error } = await sb.rpc('expire_ot_agent_sessions');
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const rows = (Array.isArray(data) ? data : []) as Array<{ session_id: string; patient_phone: string }>;
  let notified = 0;
  for (const row of rows) {
    const ok = await sendWhatsApp(row.patient_phone, sessionExpiredMessage());
    if (ok) notified++;
    await sb.from('ot_agent_sessions')
      .update({ closing_notice_sent_at: new Date().toISOString() })
      .eq('id', row.session_id);
  }

  return new Response(JSON.stringify({ ok: true, expired: rows.length, notified }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
