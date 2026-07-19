// 🌿 Planta y Raiz — brisa-health-check
// Monitoramento completo do sistema em produção
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const WAHA_URL  = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_KEY  = Deno.env.get('WAHA_API_KEY') || 'planta123';
const SB_URL    = Deno.env.get('SUPABASE_URL') || '';
const SB_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const EV_URL    = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
const EV_KEY    = Deno.env.get('EVOLUTION_API_KEY') || '';
const EV_INST   = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const ts = new Date().toISOString();
  const results: Record<string, unknown> = { timestamp: ts, project: 'PLANTA Y RAIZ' };

  // 1. WAHA
  try {
    const base = WAHA_URL.startsWith('http') ? WAHA_URL : `https://${WAHA_URL}`;
    const r = await fetch(`${base}/api/sessions`, {
      headers: { 'X-Api-Key': WAHA_KEY }, signal: AbortSignal.timeout(6000),
    });
    const data = r.ok ? await r.json() : null;
    const sess = Array.isArray(data) ? data.find((s: {name:string}) => s.name === 'default') : data;
    results.waha = { ok: r.ok, status: r.status, session_status: sess?.status || 'unknown', connected: sess?.status === 'WORKING' };
  } catch(e) { results.waha = { ok: false, error: String(e) }; }

  // 2. Evolution
  if (EV_URL && EV_KEY) {
    try {
      const base = EV_URL.startsWith('http') ? EV_URL : `https://${EV_URL}`;
      const r = await fetch(`${base}/instance/connectionState/${encodeURIComponent(EV_INST)}`, {
        headers: { apikey: EV_KEY }, signal: AbortSignal.timeout(6000),
      });
      const data = r.ok ? await r.json() : null;
      results.evolution = { ok: r.ok, status: r.status, state: data?.instance?.state || data?.state || 'unknown', instance: EV_INST };
    } catch(e) { results.evolution = { ok: false, error: String(e) }; }
  } else {
    results.evolution = { ok: false, error: 'EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados' };
  }

  // 3. Supabase DB
  try {
    const r = await fetch(`${SB_URL}/rest/v1/whatsapp_messages?select=count&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, signal: AbortSignal.timeout(5000),
    });
    results.database = { ok: r.ok, status: r.status };
  } catch(e) { results.database = { ok: false, error: String(e) }; }

  // 4. Secrets
  results.secrets = {
    GEMINI_API_KEY: Boolean(Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')),
    LOVABLE_API_KEY: Boolean(Deno.env.get('LOVABLE_API_KEY')),
    EVOLUTION_API_URL: Boolean(EV_URL),
    EVOLUTION_API_KEY: Boolean(EV_KEY),
    EVOLUTION_INSTANCE: EV_INST,
    WAHA_API_URL: WAHA_URL,
    ADMIN_PHONE_BR: Boolean(Deno.env.get('ADMIN_PHONE_BR')),
  };

  // Score geral
  const wahaOk  = (results.waha as {ok:boolean}).ok;
  const dbOk    = (results.database as {ok:boolean}).ok;
  const hasAI   = (results.secrets as {GEMINI_API_KEY:boolean}).GEMINI_API_KEY || (results.secrets as {LOVABLE_API_KEY:boolean}).LOVABLE_API_KEY;
  const score   = [wahaOk, dbOk, hasAI].filter(Boolean).length;
  results.health = score === 3 ? 'GREEN' : score >= 2 ? 'YELLOW' : 'RED';
  results.score  = `${score}/3`;

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
