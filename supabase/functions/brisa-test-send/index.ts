import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('EVOLUTION_API_URL')!;
  const key = Deno.env.get('EVOLUTION_API_KEY')!;
  const instance = Deno.env.get('EVOLUTION_INSTANCE')!;
  const admin = Deno.env.get('ADMIN_WHATSAPP') || '5511987131241';

  let body: any = {};
  try { body = await req.json(); } catch {}
  const number = (body.number || admin).replace(/\D/g, '');
  const text = body.text || `✅ Brisa 2.0 ONLINE — teste enviado em ${new Date().toLocaleString('pt-BR')}.\n\nEvolution: ${url}\nInstância: ${instance}`;

  const endpoint = `${url.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instance)}`;

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': key },
    body: JSON.stringify({ number, text }),
  });

  const respText = await resp.text();
  return new Response(JSON.stringify({
    ok: resp.ok,
    status: resp.status,
    endpoint,
    instance,
    number,
    response: respText.slice(0, 500),
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
