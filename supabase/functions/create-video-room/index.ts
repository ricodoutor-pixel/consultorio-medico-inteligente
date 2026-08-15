import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import * as jwt from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hashToken(token: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateJitsiJwt(roomName: string, userName: string, isModerator: boolean, jitsiAppId: string, jitsiSecret: string) {
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(jitsiSecret);
  const key = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  
  const payload = {
    aud: "jitsi",
    iss: jitsiAppId,
    sub: "*",
    room: roomName,
    exp: Math.floor(Date.now() / 1000) + (2 * 3600),
    context: {
      user: {
        name: userName,
        affiliation: isModerator ? "owner" : "member"
      },
      features: {
        recording: isModerator,
        livestreaming: false,
        screen_sharing: true
      }
    }
  };
  return await jwt.create({ alg: "HS256", typ: "JWT" }, payload, key);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Acesso não autorizado. Header ausente." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const body = await req.json();
    const appointmentId = body.appointmentId || body.consultation_id || body.appointment_id;

    if (!appointmentId) {
      return new Response(JSON.stringify({ ok: false, error: "O campo 'appointmentId' é obrigatório no corpo da requisição." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // Cliente com o token do usuário para validação RLS básica
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Usuário não autenticado ou token inválido." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    // Cliente Master (Service Role) para inserção em tabelas seguras/bypassar RLS
    const masterSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: doctorData, error: doctorError } = await masterSupabase
      .from('doctors')
      .select('id, is_verified, full_name')
      .eq('user_id', user.id) // doctors.user_id ou doctors.id? Dependendo do esquema, é comum ser id.
      // Usaremos id se for 1:1, mas vamos tentar 'id' primeiro (fallback para 'user_id' se erro?)
      // A versão anterior buscava eq('id', user.id). Vamos manter 'id'.
      .eq('id', user.id)
      .maybeSingle();

    if (doctorError || !doctorData || doctorData.is_verified === false) {
       return new Response(JSON.stringify({ ok: false, error: "Acesso negado: O usuário não é um médico ou não está verificado." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const { data: appointment, error: appointmentError } = await masterSupabase
      .from('appointments')
      .select('id, patient_id, consultation_id') // tentando trazer consultation_id se houver
      .eq('id', appointmentId)
      .eq('doctor_id', user.id)
      .maybeSingle()

    if (appointmentError || !appointment) {
      return new Response(JSON.stringify({ ok: false, error: "Acesso negado: Agendamento não encontrado ou não pertence a este médico." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const doctorId = user.id;
    const patientId = appointment.patient_id;
    const consultationId = appointment.consultation_id || appointment.id || crypto.randomUUID();

    // Idempotência
    const { data: existingRoom } = await masterSupabase
      .from('video_rooms')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    let roomName: string;
    let patientToken: string = crypto.randomUUID();
    let hashedToken = await hashToken(patientToken);
    let doctorJwt: string = "";
    let reused = false;
    let expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const JITSI_APP_ID = Deno.env.get('JITSI_APP_ID') ?? '';
    const JITSI_SECRET = Deno.env.get('JITSI_SECRET') ?? '';
    const domain = Deno.env.get('JITSI_DOMAIN') ?? '8x8.vc'; 

    if (existingRoom && existingRoom.length > 0) {
      roomName = existingRoom[0].room_name;
      reused = true;
      // Atualizar o secure_token na sala existente para que o novo link funcione
      await masterSupabase.from('video_rooms').update({
         secure_token: hashedToken,
         expires_at: expiresAt
      }).eq('id', existingRoom[0].id);
      
    } else {
      roomName = `planta-y-raiz-${consultationId}-${crypto.randomUUID().split('-')[0]}`;
      
      const { error: insertError } = await masterSupabase
        .from('video_rooms')
        .insert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          patient_id: patientId,
          room_name: roomName,
          secure_token: hashedToken,
          status: 'active',
          expires_at: expiresAt
        })

      if (insertError) {
        return new Response(JSON.stringify({ ok: false, error: `Falha ao criar sala no banco de dados: ${insertError.message}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
      }
    }

    if (JITSI_APP_ID && JITSI_SECRET) {
      // Jitsi App ID for 8x8 is usually formatted `vpaas-magic-cookie-xxx`
      doctorJwt = await generateJitsiJwt(roomName, doctorData.full_name || 'Médico', true, JITSI_APP_ID, JITSI_SECRET);
    }

    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') ?? 'https://plantayraiz.com';
    const patientAccessLink = `${FRONTEND_URL}/orientacao-video?consultation=${consultationId}&token=${patientToken}`;

    await masterSupabase.from('appointments').update({
       room_url: patientAccessLink
    }).eq('id', appointmentId);

    return new Response(
      JSON.stringify({
        ok: true,
        roomName: roomName,
        roomUrl: patientAccessLink,
        domain: domain,
        consultationId: consultationId,
        expiresAt: expiresAt,
        doctorJwt: doctorJwt,
        patientAccessLink: patientAccessLink,
        reused: reused
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
