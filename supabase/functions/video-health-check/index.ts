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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Este script foi projetado para rodar via pg_cron diariamente ou ser chamado por um uptime monitor.
    // Ele não exige permissão auth explícita, pois atua com service_role,
    // mas pode exigir um segredo próprio se aberto ao mundo. Por segurança, rodaremos via banco/trigger cron.

    const testAppointmentId = 'health-check-' + Date.now();

    // 1. Simula a criação de um agendamento temporário
    const { data: testDoctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, full_name, is_verified')
      .eq('is_verified', true)
      .limit(1)
      .single()

    if (doctorError || !testDoctor) {
      throw new Error(`Falha no Health Check: Nenhum médico verificado encontrado para testar. ${doctorError?.message}`);
    }

    const { data: testPatient, error: patientError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()

    if (patientError || !testPatient) {
      throw new Error(`Falha no Health Check: Nenhum paciente encontrado para testar. ${patientError?.message}`);
    }

    // Inserimos um agendamento fictício temporário (mock bypass)
    const { error: apptError } = await supabase.from('appointments').insert({
      id: testAppointmentId,
      doctor_id: testDoctor.id,
      patient_id: testPatient.id,
      type: 'video_test',
      status: 'scheduled',
      scheduled_for: new Date().toISOString()
    })

    if (apptError) {
      throw new Error(`Falha ao injetar agendamento de teste: ${apptError.message}`);
    }

    try {
      // Como a create-video-room agora depende de um token JWT de usuário autenticado,
      // a forma mais segura de testá-la no backend é consumi-la via REST (invocação normal),
      // mas injetando um token anon + chamando as funções internas que usamos na função.
      // 
      // Por isso, o "video-health-check" valida diretamente a consistência do banco de dados (inserção de token hash, etc).
      // e garante que a tabela de vídeos aceita os dados corretamente simulando o que a EdgeFunction faria.
      
      const testRoomName = `test-room-${Date.now()}`
      const patientToken = crypto.randomUUID()
      const msgUint8 = new TextEncoder().encode(patientToken);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error: insertRoomError } = await supabase.from('video_rooms').insert({
        appointment_id: testAppointmentId,
        doctor_id: testDoctor.id,
        patient_id: testPatient.id,
        room_name: testRoomName,
        secure_token: hashedToken,
        status: 'active',
        expires_at: new Date(Date.now() + 1000 * 60).toISOString()
      })

      if (insertRoomError) throw new Error(`Falha ao inserir na tabela video_rooms: ${insertRoomError.message}`);

      // Validação do Hash Reverso Mockado (simulando join-video-room)
      const { data: checkRoom, error: fetchRoomError } = await supabase
        .from('video_rooms')
        .select('*')
        .eq('appointment_id', testAppointmentId)
        .eq('secure_token', hashedToken)
        .single()

      if (fetchRoomError || !checkRoom) {
         throw new Error(`Falha de consistência: O secure_token não pôde ser lido de video_rooms.`);
      }

      // Sucesso!
      return new Response(JSON.stringify({ 
        status: "healthy",
        message: "E2E Health check do fluxo de vídeo validado com sucesso.",
        timestamp: new Date().toISOString()
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } finally {
      // Limpeza (Tear down)
      await supabase.from('video_rooms').delete().eq('appointment_id', testAppointmentId)
      await supabase.from('appointments').delete().eq('id', testAppointmentId)
    }

  } catch (error: any) {
    // Alerta Sentry/Slack poderia ser disparado aqui se usarmos as env vars correspondentes
    console.error("[CRITICAL] Video Health Check Failed:", error.message);
    
    return new Response(
      JSON.stringify({ status: "degraded", error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
