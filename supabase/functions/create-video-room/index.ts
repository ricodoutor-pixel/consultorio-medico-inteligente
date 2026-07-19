// 🌿 Planta y Raiz — create-video-room (Jitsi)
// Gera sala segura de telemedicina CFM 2.314/2022
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JITSI_APP_ID = Deno.env.get('JITSI_APP_ID') || '8x8.vc';
const JITSI_DOMAIN = Deno.env.get('JITSI_DOMAIN') || 'meet.jit.si';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, service: 'create-video-room', provider: 'jitsi', domain: JITSI_DOMAIN }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { consultationId, patientName, doctorName, appointmentId } = await req.json();
    if (!consultationId) throw new Error('consultationId é obrigatório');

    // Sala segura: prefixo + ID + timestamp hash
    const ts = Date.now().toString(36);
    const roomName = `plantayraiz-${consultationId}-${ts}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const roomUrl = `https://${JITSI_DOMAIN}/${roomName}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 horas

    // Salvar no banco
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await sb.from('video_rooms').upsert({
      consultation_id: consultationId,
      room_name: roomName,
      room_url: roomUrl,
      expires_at: expiresAt,
      status: 'scheduled',
    }, { onConflict: 'consultation_id' });

    if (error) console.error('[create-video-room] DB error:', error);

    // Se tiver appointmentId, atualizar appointments também
    if (appointmentId) {
      await sb.from('appointments').update({
        room_url: roomUrl,
        consultation_id: consultationId,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      }).eq('id', appointmentId);
    }

    console.log(`[create-video-room] Sala criada: ${roomName}`);

    return new Response(JSON.stringify({
      ok: true,
      roomName,
      roomUrl,
      domain: JITSI_DOMAIN,
      consultationId,
      expiresAt,
      jitsiConfig: {
        roomName,
        domain: JITSI_DOMAIN,
        userInfo: { displayName: patientName || 'Paciente' },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ['microphone','camera','hangup','chat','tileview'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableNoisyMicDetection: true,
        },
      },
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[create-video-room] Error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
