import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let url = Deno.env.get('EVOLUTION_API_URL') || '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const key = Deno.env.get('EVOLUTION_API_KEY') || '';
  const instance = Deno.env.get('EVOLUTION_INSTANCE') || '';
  const admin = Deno.env.get('ADMIN_WHATSAPP') || '5511987131241';

  let body: any = {};
  try { body = await req.json(); } catch {}
  const number = String(body.number || admin).replace(/\D/g, '');
  const text = body.text || `✅ Brisa 2.0 ONLINE — teste ${new Date().toLocaleString('pt-BR')}`;

  const endpoint = `${url.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);

  let status = 0, respText = '', errMsg = '';
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({ number, text }),
      signal: ctrl.signal,
    });
    status = resp.status;
    respText = await resp.text();
  } catch (e) {
    errMsg = e instanceof Error ? e.message : String(e);
  } finally {
    clearTimeout(t);
  }

  return new Response(JSON.stringify({
    ok: status >= 200 && status < 300,
    status, endpoint, instance, number,
    response: respText.slice(0, 800),
    error: errMsg || undefined,
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
