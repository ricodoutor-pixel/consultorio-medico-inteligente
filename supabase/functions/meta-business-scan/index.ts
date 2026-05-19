// Escaneia um Business Manager: páginas próprias/clientes e contas Instagram vinculadas.
// GET ?business_id=1421648866095076  (opcional; default abaixo)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const DEFAULT_BIZ = '1421648866095076';

async function g(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url);
  return { status: r.status, body: await r.json() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const token = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') || Deno.env.get('FACEBOOK_GRAPH_API_TOKEN') || '';
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'no token' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const u = new URL(req.url);
  const biz = u.searchParams.get('business_id') || DEFAULT_BIZ;

  const out: Record<string, unknown> = { business_id: biz };

  out.business = await g(biz, token, { fields: 'id,name,verification_status,primary_page' });
  out.owned_pages = await g(`${biz}/owned_pages`, token, {
    fields: 'id,name,instagram_business_account{id,username,name,followers_count}',
    limit: '50',
  });
  out.client_pages = await g(`${biz}/client_pages`, token, {
    fields: 'id,name,instagram_business_account{id,username,name,followers_count}',
    limit: '50',
  });
  out.owned_instagram_accounts = await g(`${biz}/owned_instagram_accounts`, token, {
    fields: 'id,username,name,followers_count', limit: '50',
  });
  out.client_instagram_accounts = await g(`${biz}/client_instagram_accounts`, token, {
    fields: 'id,username,name,followers_count', limit: '50',
  });
  out.instagram_accounts = await g(`${biz}/instagram_accounts`, token, {
    fields: 'id,username', limit: '50',
  });
  out.me_accounts = await g('me/accounts', token, {
    fields: 'id,name,instagram_business_account{id,username,name}', limit: '50',
  });

  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
