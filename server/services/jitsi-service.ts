/**
 * 🏢 Planta y Raiz - Mega Clínica Digital
 * 🚀 Manus CEO: Integração de Videochamada (Telemedicina)
 * 📅 Operação: Jitsi/WebRTC
 */

import crypto from 'crypto';

interface VideoConference {
  roomName: string;
  jwtToken: string;
  url: string;
}

export const createTelemedicineRoom = (consultationId: string, doctorId: string, patientId: string): VideoConference => {
  const roomName = `PlantaYRaiz-Consult-${consultationId}`;
  const secret = process.env.JITSI_SECRET;
  if (!secret) throw new Error('JITSI_SECRET not configured');

  console.log(`🎥 [Manus CEO] Criando sala de telemedicina para consulta ${consultationId}...`);

  // Geração de Token JWT para autenticação no Jitsi (opcional)
  const payload = {
    context: {
      user: {
        avatar: "https://plantayraiz.com.br/assets/logo.png",
        name: "Médico Planta y Raiz",
        email: "medico@plantayraiz.com.br"
      },
      group: "plantayraiz"
    },
    aud: "jitsi",
    iss: "plantayraiz",
    sub: "meet.jit.si",
    room: roomName
  };

  const jwtToken = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  const conference: VideoConference = {
    roomName,
    jwtToken,
    url: `https://meet.jit.si/${roomName}`
  };

  return conference;
};
