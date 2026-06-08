const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'npm:@supabase/supabase-js@2'
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
    // ── AUTH: service-role (cron/internal) OR verified-doctor JWT ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    const isService = !!authHeader && authHeader === `Bearer ${serviceKey}`

    let callerDoctorUserId: string | null = null
    if (!isService) {
      if (!authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        })
        const { data: claims, error: cErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''))
        if (cErr || !claims?.claims?.sub) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const adminClient = createClient(supabaseUrl, serviceKey)
        const { data: doctor } = await adminClient
          .from('doctors')
          .select('user_id, is_verified')
          .eq('user_id', claims.claims.sub as string)
          .maybeSingle()
        if (!doctor || !doctor.is_verified) {
          return new Response(JSON.stringify({ error: 'Forbidden: caller is not a verified doctor' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        callerDoctorUserId = doctor.user_id as string
      } catch {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { patientId, patientPhone, patientName, doctorName, items } = parsed.data

    // If a doctor is calling (not service-role), verify they have an appointment with this patient
    if (callerDoctorUserId) {
      const adminClient = createClient(supabaseUrl, serviceKey)
      const { data: appt } = await adminClient
        .from('consultations')
        .select('id')
        .eq('patient_id', patientId)
        .eq('professional_id', callerDoctorUserId)
        .limit(1)
        .maybeSingle()
      if (!appt) {
        return new Response(JSON.stringify({ error: 'Forbidden: no consultation with this patient' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const checkoutUrl = `https://plantayraiz.com.br/checkout/fast-track?pid=${patientId}`

    // Send via Evolution API (Enfª Brisa)
    const EVO_URL = Deno.env.get('EVOLUTION_API_URL')
    const EVO_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const EVO_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || "plantayraiz"

    const message = `🌿 *Planta & Raiz*\n\nOlá ${patientName}! O ${doctorName} finalizou seu protocolo!\n\n🛒 Clique aqui para comprar seu tratamento com *desconto exclusivo de 10%*:\n${checkoutUrl}\n\n⏰ Oferta válida por 30 minutos.`

    if (EVO_URL && EVO_KEY) {
      await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
        body: JSON.stringify({
          number: `55${patientPhone.replace(/\D/g, '')}`,
          text: message,
          delay: 1200,
        }),
      })
    }

    // Log notification in database (reuse the service-role client created above)
    const supabase = createClient(supabaseUrl, serviceKey)

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
