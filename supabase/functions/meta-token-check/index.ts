// Verifica o FACEBOOK_PAGE_ACCESS_TOKEN: validade, permissões, páginas e contas IG.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireServiceAuth } from "../_shared/service-auth.ts";

const REQUIRED = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_manage_engagement',
  'pages_messaging',
  'pages_read_user_content',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_messages',
  'instagram_manage_insights',
  'business_management',
];

async function gget(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url);
  const j = await r.json();
  return { status: r.status, body: j };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;

  const token =
    Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') ||
    Deno.env.get('FACEBOOK_GRAPH_API_TOKEN') ||
    '';
  const pageId = Deno.env.get('FACEBOOK_PAGE_ID') || '';
  const igId = Deno.env.get('INSTAGRAM_BUSINESS_ACCOUNT_ID') || '';

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'no token' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const out: Record<string, unknown> = {};

  // 1. Identidade do token
  const me = await gget('me', token, { fields: 'id,name' });
  out.me = me;

  // 2. Debug do token (validade + escopos)
  const dbg = await gget('debug_token', token, { input_token: token });
  const scopes: string[] = (dbg.body?.data?.scopes as string[]) || [];
  const missing = REQUIRED.filter((s) => !scopes.includes(s));
  out.debug_token = { status: dbg.status, data: dbg.body?.data };
  out.permissions = { has: scopes, missing };

  // 3. Páginas acessíveis (scrub access_token from response)
  const pages = await gget('me/accounts', token, {
    fields: 'id,name,access_token,instagram_business_account,tasks',
  });
  if (Array.isArray(pages.body?.data)) {
    pages.body.data = pages.body.data.map((p: any) => {
      const { access_token: _omit, ...rest } = p || {};
      return { ...rest, has_access_token: Boolean(_omit) };
    });
  }
  out.pages = pages;

  // 4. Teste de leitura na página configurada
  if (pageId) {
    out.page_info = await gget(pageId, token, {
      fields: 'id,name,fan_count,instagram_business_account',
    });
    out.page_feed = await gget(`${pageId}/feed`, token, { limit: '1' });
  }

  // 5. Teste IG
  if (igId) {
    out.ig_info = await gget(igId, token, {
      fields: 'id,username,followers_count,media_count',
    });
    out.ig_media = await gget(`${igId}/media`, token, { limit: '1' });
  }

  const ok =
    me.status === 200 &&
    dbg.body?.data?.is_valid === true &&
    missing.length === 0;

  return new Response(
    JSON.stringify({ ok, missing_permissions: missing, details: out }, null, 2),
    { status: ok ? 200 : 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
