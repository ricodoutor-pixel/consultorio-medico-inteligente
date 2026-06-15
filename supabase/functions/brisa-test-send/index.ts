import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireServiceAuth } from "../_shared/service-auth.ts";

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await resp.text().catch(() => '');
    return { status: resp.status, text, error: '' };
  } catch (e) {
    return {
      status: 0,
      text: '',
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;

  let url = Deno.env.get('EVOLUTION_API_URL') || '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const key = Deno.env.get('EVOLUTION_API_KEY') || '';
  const instance = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz_nova';
  const admin = Deno.env.get('ADMIN_WHATSAPP') || '5511987131241';

  let body: any = {};
  try { body = await req.json(); } catch {}
  const number = String(body.number || admin).replace(/\D/g, '');
  const text = body.text || `✅ Brisa 2.0 ONLINE — teste ${new Date().toLocaleString('pt-BR')}`;

  const endpoint = `${url.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`;
  const stateEndpoint = `${url.replace(/\/$/, '')}/instance/connectionState/${encodeURIComponent(instance)}`;
  const instancesEndpoint = `${url.replace(/\/$/, '')}/instance/fetchInstances`;
  const managerUrl = `${url.replace(/\/$/, '')}/manager/`;

  const headers = { 'Content-Type': 'application/json', apikey: key };
  const [stateResp, instancesResp, sendResp] = await Promise.all([
    fetchWithTimeout(stateEndpoint, { method: 'GET', headers }, 10000),
    fetchWithTimeout(instancesEndpoint, { method: 'GET', headers }, 10000),
    fetchWithTimeout(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ number, text }),
    }, 12000),
  ]);

  return new Response(JSON.stringify({
    ok: sendResp.status >= 200 && sendResp.status < 300,
    status: sendResp.status,
    endpoint,
    managerUrl,
    instance,
    number,
    response: sendResp.text.slice(0, 1200),
    error: sendResp.error || undefined,
    diagnostics: {
      connectionState: {
        endpoint: stateEndpoint,
        status: stateResp.status,
        error: stateResp.error || undefined,
        response: stateResp.text.slice(0, 1200),
      },
      fetchInstances: {
        endpoint: instancesEndpoint,
        status: instancesResp.status,
        error: instancesResp.error || undefined,
        response: instancesResp.text.slice(0, 2500),
      },
    },
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
