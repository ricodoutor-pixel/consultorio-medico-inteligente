import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
const DOCTOR_WHATSAPP = Deno.env.get('DOCTOR_WHATSAPP_NUMBER'); // O número do médico que vai receber os alertas

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Webhook from Supabase when diagnostic_exams gets an insert
    const record = payload.record;

    if (!record || !record.ai_diagnosis) {
      return new Response("No valid record found", { status: 400 });
    }

    if (record.risk_level === 'alto' || record.risk_level === 'critico') {
      console.log(`High risk detected in ${record.exam_type}! Sending alert...`);

      const examTypeStr = record.exam_type.toUpperCase();
      const findings = record.ai_diagnosis.findings?.join(', ') || 'Nenhum detalhe técnico fornecido';

      const message = `🚨 *Alerta da Brisa - Risco Alto Detectado!* 🚨\n\n*Exame:* ${examTypeStr}\n*Paciente ID:* ${record.user_id}\n\n*Achados Técnicos:*\n${findings}\n\n*Resumo da IA:*\n${record.ai_diagnosis.diagnosis || 'Verifique o prontuário para mais detalhes.'}\n\nPor favor, acesse o *Prontuário Inteligente* imediatamente.`;

      if (EVOLUTION_API_URL && EVOLUTION_API_KEY && DOCTOR_WHATSAPP) {
        const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/PlantaRaiz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
          },
          body: JSON.stringify({
            number: DOCTOR_WHATSAPP,
            options: {
              delay: 1200,
              presence: 'composing'
            },
            textMessage: {
              text: message
            }
          })
        });

        if (!response.ok) {
          console.error("Failed to send WhatsApp message via Evolution API", await response.text());
        } else {
          console.log("Alert sent successfully to doctor.");
        }
      } else {
        console.log("Evolution API credentials or DOCTOR_WHATSAPP_NUMBER not set. Simulation mode:");
        console.log("Would have sent message:", message);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in brisa-alert-doctor:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
})
