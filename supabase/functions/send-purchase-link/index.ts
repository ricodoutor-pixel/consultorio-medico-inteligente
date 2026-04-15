import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const BodySchema = z.object({
  patientId: z.string().uuid(),
  patientPhone: z.string().min(10),
  patientName: z.string().min(1),
  doctorName: z.string().min(1),
  items: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    price: z.number(),
  })),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { patientId, patientPhone, patientName, doctorName, items } = parsed.data

    const checkoutUrl = `https://plantayraiz.com.br/checkout/fast-track?pid=${patientId}`

    // Send via Twilio WhatsApp
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = 'whatsapp:+5511991363154'
    const toNumber = `whatsapp:+55${patientPhone.replace(/\D/g, '')}`

    const message = `🌿 *Planta & Raiz*\n\nOlá ${patientName}! O ${doctorName} finalizou seu protocolo!\n\n🛒 Clique aqui para comprar seu tratamento com *desconto exclusivo de 10%*:\n${checkoutUrl}\n\n⏰ Oferta válida por 30 minutos.`

    if (twilioSid && twilioAuth) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
      const body = new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: message,
      })

      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuth}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })
    }

    // Log notification in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase.from('notifications').insert({
      user_id: patientId,
      type: 'purchase_link',
      title: 'Seu protocolo está pronto!',
      message: `O ${doctorName} finalizou sua prescrição. Compre com 10% de desconto.`,
      action_url: checkoutUrl,
    })

    return new Response(JSON.stringify({ success: true, checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
