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
    const consultationId = body.consultationId;
    const patientToken = body.token;
    const authHeader = req.headers.get('Authorization');

    if (!consultationId && !patientToken) {
       return new Response(JSON.stringify({ ok: false, error: "Identificação da sala (consultationId ou token) é necessária." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const masterSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    let roomRecord = null;
    let isDoctor = false;
    let userName = "Paciente";

    // FLUXO DO PACIENTE
    if (patientToken) {
      const hashedToken = await hashToken(patientToken);
      
      const { data: room, error: roomError } = await masterSupabase
        .from('video_rooms')
        .select('*')
        .eq('secure_token', hashedToken)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (roomError || !room) {
        return new Response(JSON.stringify({ ok: false, error: "Link de acesso inválido ou expirado." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }

      // Se a sala já expirou em tempo (expires_at)
      if (room.expires_at && new Date(room.expires_at) < new Date()) {
         return new Response(JSON.stringify({ ok: false, error: "A sessão de vídeo expirou." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }
      
      roomRecord = room;
      
      // Tentar buscar o nome do paciente
      if (room.patient_id) {
         const { data: profile } = await masterSupabase.from('profiles').select('full_name').eq('id', room.patient_id).maybeSingle();
         if (profile?.full_name) userName = profile.full_name;
      }
      
    } else if (authHeader) {
      // FLUXO DO MÉDICO (recuperação de sala)
      const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
      if (authError || !user) {
        return new Response(JSON.stringify({ ok: false, error: "Autenticação necessária para acessar esta sala como médico." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
      }

      const { data: doctorData } = await masterSupabase.from('doctors').select('id, full_name').eq('user_id', user.id).maybeSingle();
      if (!doctorData) {
         return new Response(JSON.stringify({ ok: false, error: "Acesso negado: Perfil de médico não encontrado." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }

      const { data: room, error: roomError } = await masterSupabase
        .from('video_rooms')
        .select('*')
        // Tolerância para consultationId mapear no id ou no consultation_id se ele existisse
        .eq('appointment_id', consultationId) 
        .eq('doctor_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (roomError || !room) {
        return new Response(JSON.stringify({ ok: false, error: "Sala não encontrada ou não pertence a este médico." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
      }

      roomRecord = room;
      isDoctor = true;
      userName = doctorData.full_name || "Médico";
    } else {
       return new Response(JSON.stringify({ ok: false, error: "Nenhum token de paciente ou credencial de médico fornecida." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    if (!roomRecord) {
       return new Response(JSON.stringify({ ok: false, error: "Falha ao resolver a sala." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const JITSI_APP_ID = Deno.env.get('JITSI_APP_ID') ?? '';
    const JITSI_SECRET = Deno.env.get('JITSI_SECRET') ?? '';
    const domain = Deno.env.get('JITSI_DOMAIN') ?? '8x8.vc'; 

    let jwtToken = "";
    if (JITSI_APP_ID && JITSI_SECRET) {
      jwtToken = await generateJitsiJwt(roomRecord.room_name, userName, isDoctor, JITSI_APP_ID, JITSI_SECRET);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        room: roomRecord.room_name,
        domain: domain,
        jwt: jwtToken
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
