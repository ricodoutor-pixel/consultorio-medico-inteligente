// 🌿 Planta y Raiz — brisa-waha-connect
// Gerencia sessão WAHA: status, QR code, iniciar, parar
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key' };

const WAHA_URL     = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_KEY     = Deno.env.get('WAHA_API_KEY') || 'planta123';
const WAHA_SESSION = Deno.env.get('WAHA_SESSION') || 'default';
const SB_URL       = Deno.env.get('SUPABASE_URL')!;
const SB_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const wahaBase = () => WAHA_URL.startsWith('http') ? WAHA_URL : `https://${WAHA_URL}`;
const wahaHeaders = { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_KEY };

async function wahaGet(path: string) {
  const r = await fetch(`${wahaBase()}${path}`, { headers: wahaHeaders });
  const body = await r.text();
  try { return { ok: r.ok, status: r.status, data: JSON.parse(body) }; }
  catch { return { ok: r.ok, status: r.status, data: body }; }
}

async function wahaPost(path: string, payload: unknown = {}) {
  const r = await fetch(`${wahaBase()}${path}`, {
    method: 'POST', headers: wahaHeaders, body: JSON.stringify(payload),
  });
  const body = await r.text();
  try { return { ok: r.ok, status: r.status, data: JSON.parse(body) }; }
  catch { return { ok: r.ok, status: r.status, data: body }; }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url    = new URL(req.url);
  const action = url.searchParams.get('action') || 'status';
  const sb     = createClient(SB_URL, SB_KEY);

  const reply = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    // STATUS — verifica conexão
    if (action === 'status') {
      const [sessions, screenshot] = await Promise.allSettled([
        wahaGet('/api/sessions'),
        wahaGet(`/api/screenshot?session=${WAHA_SESSION}`),
      ]);

      const sessData = sessions.status === 'fulfilled' ? sessions.value.data : null;
      const sessObj  = Array.isArray(sessData) ? sessData.find((s: {name: string}) => s.name === WAHA_SESSION) : sessData;
      const connected = sessObj?.status === 'WORKING' || sessObj?.engine?.state === 'CONNECTED';

      // Salvar no banco
      await sb.from('waha_sessions').upsert({
        session_name: WAHA_SESSION,
        status: connected ? 'connected' : (sessObj?.status || 'unknown'),
        phone_number: sessObj?.me?.id || sessObj?.me?.user || null,
        last_seen: new Date().toISOString(),
        connected_at: connected ? new Date().toISOString() : undefined,
      }, { onConflict: 'session_name' });

      return reply({ ok: true, action: 'status', connected, session: WAHA_SESSION, waha_url: WAHA_URL, session_data: sessObj });
    }

    // QR CODE — retorna QR para escanear
    if (action === 'qr') {
      // Tentar iniciar sessão se não existir
      await wahaPost('/api/sessions/start', { name: WAHA_SESSION });
      await new Promise(r => setTimeout(r, 2000)); // aguardar 2s

      const qr = await wahaGet(`/api/${WAHA_SESSION}/auth/qr`);
      if (!qr.ok || !qr.data) {
        // Tentar endpoint alternativo
        const qr2 = await wahaGet(`/api/screenshot?session=${WAHA_SESSION}`);
        return reply({ ok: true, action: 'qr', session: WAHA_SESSION, qr: null, screenshot: qr2.data, message: 'Use o screenshot para escanear ou acesse a URL do WAHA diretamente' });
      }
      return reply({ ok: true, action: 'qr', session: WAHA_SESSION, qr: qr.data });
    }

    // START — inicia sessão
    if (action === 'start') {
      const r = await wahaPost('/api/sessions/start', { name: WAHA_SESSION });
      return reply({ ok: r.ok, action: 'start', session: WAHA_SESSION, data: r.data });
    }

    // STOP — para sessão
    if (action === 'stop') {
      const r = await wahaPost('/api/sessions/stop', { name: WAHA_SESSION });
      return reply({ ok: r.ok, action: 'stop', session: WAHA_SESSION, data: r.data });
    }

    // RESTART — reinicia sessão
    if (action === 'restart') {
      await wahaPost('/api/sessions/stop', { name: WAHA_SESSION });
      await new Promise(r => setTimeout(r, 1500));
      const r = await wahaPost('/api/sessions/start', { name: WAHA_SESSION });
      return reply({ ok: r.ok, action: 'restart', session: WAHA_SESSION, data: r.data });
    }

    // WEBHOOK — registra webhook no WAHA
    if (action === 'webhook') {
      const webhookUrl = `${SB_URL.replace('.supabase.co', '.supabase.co')}/functions/v1/whatsapp-brisa-bot`;
      const r = await wahaPost(`/api/sessions/${WAHA_SESSION}/config/update`, {
        webhooks: [{
          url: webhookUrl,
          events: ['message'],
          retries: { policy: 'constant', delaySeconds: 3, attempts: 5 },
        }],
      });
      return reply({ ok: r.ok, action: 'webhook', webhookUrl, session: WAHA_SESSION, data: r.data });
    }

    // SEND TEST — envia mensagem de teste
    if (action === 'test') {
      const phone = url.searchParams.get('phone') || Deno.env.get('ADMIN_PHONE_BR') || '';
      if (!phone) return reply({ ok: false, error: 'phone param obrigatório' }, 400);
      const msg  = url.searchParams.get('msg') || '🟢 Sistema Online: Enfermeira Brisa conectada ao Supabase e operando 24/7. 🌿\n\nhttps://plantayraiz.com.br';
      const chatId = phone.includes('@') ? phone : `${phone.replace(/\D/g,'')}@c.us`;
      const r = await wahaPost('/api/sendText', { session: WAHA_SESSION, chatId, text: msg });
      return reply({ ok: r.ok, action: 'test', phone, chatId, status: r.status, data: r.data });
    }

    return reply({ ok: false, error: `Ação desconhecida: ${action}. Use: status, qr, start, stop, restart, webhook, test` }, 400);

  } catch(err) {
    console.error('[waha-connect]', err);
    return reply({ ok: false, error: String(err) }, 500);
  }
});
