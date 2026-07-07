// Pings Mercado Pago + Lovable AI Gateway, records status in payment_provider_health.
// Trigger: pg_cron every 5 minutes.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireServiceAuth } from '../_shared/service-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

interface ProbeResult {
  provider: string
  status: 'operational' | 'degraded' | 'down'
  latency_ms: number
  last_error: string | null
}

async function probeMercadoPago(token: string): Promise<ProbeResult> {
  const t0 = performance.now()
  try {
    const res = await fetch('https://api.mercadopago.com/v1/payments/search?limit=1', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    })
    const latency = Math.round(performance.now() - t0)
    // 5xx = real outage; 4xx = API alive (auth/payload issue, not infra failure)
    if (res.status >= 500) {
      return { provider: 'mercado_pago', status: 'down', latency_ms: latency, last_error: `HTTP ${res.status}` }
    }
    if (latency > 3000) {
      return { provider: 'mercado_pago', status: 'degraded', latency_ms: latency, last_error: 'high_latency' }
    }
    return { provider: 'mercado_pago', status: 'operational', latency_ms: latency, last_error: res.ok ? null : `HTTP ${res.status} (auth)` }
  } catch (e) {
    return { provider: 'mercado_pago', status: 'down', latency_ms: Math.round(performance.now() - t0), last_error: String(e) }
  }
}

async function probeLovableAI(key: string): Promise<ProbeResult> {
  const t0 = performance.now()
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-2.5-flash-lite', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
      signal: AbortSignal.timeout(10000),
    })
    const latency = Math.round(performance.now() - t0)
    if (!res.ok) return { provider: 'lovable_ai', status: res.status >= 500 ? 'down' : 'degraded', latency_ms: latency, last_error: `HTTP ${res.status}` }
    return { provider: 'lovable_ai', status: latency > 5000 ? 'degraded' : 'operational', latency_ms: latency, last_error: null }
  } catch (e) {
    return { provider: 'lovable_ai', status: 'down', latency_ms: Math.round(performance.now() - t0), last_error: String(e) }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authFail = requireServiceAuth(req, corsHeaders)
  if (authFail) return authFail



  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || ''
  const aiKey = Deno.env.get('GEMINI_API_KEY') || ''

  const probes = await Promise.all([probeMercadoPago(mpToken), probeLovableAI(aiKey)])

  const { error } = await supabase.from('payment_provider_health').insert(
    probes.map((p) => ({ provider: p.provider, status: p.status, latency_ms: p.latency_ms, last_error: p.last_error })),
  )

  // Auto-alert when MP transitions to down
  const mp = probes.find((p) => p.provider === 'mercado_pago')!
  if (mp.status === 'down') {
    const discord = Deno.env.get('DISCORD_SRE_WEBHOOK_URL')
    if (discord) {
      await fetch(discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 **MERCADO PAGO DOWN** — latência ${mp.latency_ms}ms — ${mp.last_error ?? 'unknown'} — Modo de Crise (PIX direto) ativado.`,
        }),
      }).catch(() => {})
    }
  }

  return new Response(JSON.stringify({ ok: !error, probes, error: error?.message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
