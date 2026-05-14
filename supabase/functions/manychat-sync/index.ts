import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate ManyChat webhook secret via header (never URL — leaks into logs).
    // Falls back to the legacy `?secret=` only if the dedicated webhook secret is not configured yet.
    const headerSecret = req.headers.get('x-manychat-secret') || req.headers.get('X-ManyChat-Secret')
    const url = new URL(req.url)
    const querySecret = url.searchParams.get('secret')
    const webhookSecret = Deno.env.get('MANYCHAT_WEBHOOK_SECRET')
    const expectedSecret = webhookSecret || Deno.env.get('MANYCHAT_API_KEY')
    const provided = headerSecret || (webhookSecret ? null : querySecret)

    if (!expectedSecret || provided !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()

    // Validate input
    const manychatUserId = body.user_id || body.subscriber_id || null
    const manychatName = body.name || body.full_name || body.first_name || null
    const platform = body.platform || 'unknown'
    const source = body.source || 'manychat'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase.from('app_downloads').insert({
      manychat_user_id: manychatUserId,
      manychat_name: manychatName,
      platform,
      source,
      metadata: body
    })

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ error: 'Failed to record download' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
