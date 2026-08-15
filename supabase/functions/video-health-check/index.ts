import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const testDoctorEmail = Deno.env.get('TEST_DOCTOR_EMAIL');
  const testDoctorPassword = Deno.env.get('TEST_DOCTOR_PASSWORD');

  async function notifyAdmin(errorMsg: string) {
    try {
      await supabase.functions.invoke('brisa-bot', {
        body: {
          type: 'alert',
          message: `🚨 ALERTA CRÍTICO: Falha no Health Check de Vídeo (E2E)\n\nMotivo: ${errorMsg}`
        }
      });
    } catch (e) {
      console.error("Falha ao notificar admin:", e);
    }
  }

  try {
    if (!testDoctorEmail || !testDoctorPassword) {
      throw new Error("Credenciais de médico de teste (TEST_DOCTOR_EMAIL, TEST_DOCTOR_PASSWORD) não configuradas no ambiente.");
    }

    // 0. Autenticar como médico de teste para obter o JWT real
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: testDoctorEmail,
      password: testDoctorPassword
    });

    if (authError || !authData.session) {
      throw new Error(`Falha ao logar com médico de teste: ${authError?.message}`);
    }

    const doctorJwt = authData.session.access_token;
    const testDoctorId = authData.user.id;

    // 1. Criar consulta de teste no banco (bypassing restrictions for test data)
    const testAppointmentId = 'e2e-test-' + Date.now();
    
    // Obter um paciente qualquer ou usar o próprio médico como paciente de teste
    const { data: testPatient } = await supabase.from('profiles').select('id').limit(1).single();

    const { error: apptError } = await supabase.from('appointments').insert({
      id: testAppointmentId,
      doctor_id: testDoctorId,
      patient_id: testPatient?.id || testDoctorId,
      type: 'video_test',
      status: 'scheduled',
      scheduled_for: new Date().toISOString()
    });

    if (apptError) {
      throw new Error(`Falha ao injetar agendamento de teste: ${apptError.message}`);
    }

    try {
      // 2. Chamar create-video-room via API HTTP REST real
      const createRes = await fetch(`${supabaseUrl}/functions/v1/create-video-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${doctorJwt}`
        },
        body: JSON.stringify({ appointmentId: testAppointmentId })
      });

      const createData = await createRes.json();

      // 3. Confirmar que a resposta tem roomName e doctorJwt válidos
      if (!createRes.ok || !createData.ok || !createData.roomName || !createData.doctorJwt || !createData.patientAccessLink) {
        throw new Error(`Falha no create-video-room: ${JSON.stringify(createData)}`);
      }

      // Extrair o token do paciente da URL (patientAccessLink)
      // Exemplo: https://site.com/orientacao-video?consultation=123&token=abc
      const urlParams = new URLSearchParams(createData.patientAccessLink.split('?')[1]);
      const patientToken = urlParams.get('token');

      if (!patientToken) {
        throw new Error(`O patientAccessLink não conteve um 'token' válido.`);
      }

      // 4. Chama join-video-room simulando o paciente
      const joinRes = await fetch(`${supabaseUrl}/functions/v1/join-video-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
           consultationId: createData.consultationId || testAppointmentId,
           token: patientToken
        })
      });

      const joinData = await joinRes.json();

      // 5. Confirmar que retorna um JWT de participante válido
      if (!joinRes.ok || !joinData.ok || !joinData.jwt) {
        throw new Error(`Falha no join-video-room (paciente): ${JSON.stringify(joinData)}`);
      }

      return new Response(JSON.stringify({ 
        status: "healthy",
        message: "Fluxo E2E de Vídeo verificado com sucesso.",
        details: {
          roomName: joinData.room
        },
        timestamp: new Date().toISOString()
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } finally {
      // 6. Limpeza (Tear down)
      await supabase.from('video_rooms').delete().eq('appointment_id', testAppointmentId);
      await supabase.from('appointments').delete().eq('id', testAppointmentId);
    }

  } catch (error: any) {
    console.error("[CRITICAL] Video E2E Health Check Failed:", error.message);
    await notifyAdmin(error.message);
    
    return new Response(
      JSON.stringify({ status: "degraded", error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
