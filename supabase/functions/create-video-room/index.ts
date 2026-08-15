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
    const body = await req.json();
    // Accept either format to preserve compatibility
    const appointmentId = body.appointmentId || body.consultation_id || body.appointment_id;

    if (!appointmentId) {
      throw new Error("O campo 'appointmentId' é obrigatório no corpo da requisição.")
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Header de autorização ausente.")
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error("Usuário não autenticado ou token inválido.")
    }

    // Usaremos a master key para as validações estritas de banco (RLS bypass seguro no backend)
    const masterSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: doctorData, error: doctorError } = await masterSupabase
      .from('doctors')
      .select('id, is_verified, full_name')
      .eq('id', user.id)
      .single()

    if (doctorError || !doctorData || doctorData.is_verified === false) {
      throw new Error("Acesso negado: O usuário não é um médico ou não está verificado.")
    }

    const { data: appointment, error: appointmentError } = await masterSupabase
      .from('appointments')
      .select('id, patient_id')
      .eq('id', appointmentId)
      .eq('doctor_id', user.id)
      .single()

    if (appointmentError || !appointment) {
      throw new Error("Agendamento não encontrado ou não pertence a este médico.")
    }

    const doctorId = user.id;
    const patientId = appointment.patient_id;

    // Idempotência
    const { data: existingRoom } = await masterSupabase
      .from('video_rooms')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    let roomName: string;
    let patientToken: string | null = null;
    let doctorJwt: string = "";

    const JITSI_APP_ID = Deno.env.get('JITSI_APP_ID') ?? '';
    const JITSI_SECRET = Deno.env.get('JITSI_SECRET') ?? '';

    if (existingRoom && existingRoom.length > 0) {
      roomName = existingRoom[0].room_name;
      if (JITSI_APP_ID && JITSI_SECRET) {
        doctorJwt = await generateJitsiJwt(roomName, doctorData.full_name || 'Médico', true, JITSI_APP_ID, JITSI_SECRET);
      }
    } else {
      roomName = `planta-y-raiz-${appointmentId}-${crypto.randomUUID().split('-')[0]}`;
      
      patientToken = crypto.randomUUID();
      const hashedToken = await hashToken(patientToken);
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); 
      
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
        throw new Error(`Falha ao criar sala no banco de dados: ${insertError.message}`);
      }

      if (JITSI_APP_ID && JITSI_SECRET) {
        doctorJwt = await generateJitsiJwt(roomName, doctorData.full_name || 'Médico', true, JITSI_APP_ID, JITSI_SECRET);
      }
    }

    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') ?? 'https://plantayraiz.com';
    const patientAccessLink = patientToken 
      ? `${FRONTEND_URL}/orientacao-video?room=${roomName}&token=${patientToken}` 
      : `Link já gerado e salvo.`;

    await masterSupabase.from('appointments').update({
       room_url: patientAccessLink
    }).eq('id', appointmentId);

    // Compatibilidade estrita com OrientacaoVideo.tsx e join-video-room
    return new Response(
      JSON.stringify({
        roomName: roomName,
        doctorJwt: doctorJwt,
        patientAccessLink: patientAccessLink,
        consultationId: appointmentId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
