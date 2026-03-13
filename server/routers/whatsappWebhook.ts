import { Router, Request, Response } from 'express';
import { sendConsultationAlert, sendPatientNotification } from '../services/whatsappService';
import { supabase } from '../integrations/supabase/server';

const router = Router();

/**
 * POST /api/webhooks/whatsapp
 * Recebe mensagens de resposta do WhatsApp (Atender/Recusar)
 */
router.post('/api/webhooks/whatsapp', async (req: Request, res: Response) => {
  try {
    const { Body, From, MessageSid } = req.body;

    console.log(`📱 Mensagem WhatsApp recebida de ${From}: ${Body}`);

    // Responder ao Twilio imediatamente
    res.status(200).send('OK');

    // Processar a resposta
    if (Body.toLowerCase().includes('atender') || Body.toLowerCase().includes('sim')) {
      // Médico aceitou a consulta
      console.log(`✅ Médico ${From} aceitou a consulta`);
      
      // Atualizar status da consulta no banco
      // await supabase
      //   .from('consultations')
      //   .update({ status: 'accepted', doctor_phone: From })
      //   .eq('message_sid', MessageSid);

    } else if (Body.toLowerCase().includes('recusar') || Body.toLowerCase().includes('não')) {
      // Médico recusou a consulta
      console.log(`❌ Médico ${From} recusou a consulta`);
      
      // Reverter para próximo médico
      // await supabase
      //   .from('consultations')
      //   .update({ status: 'pending', assigned_doctor: null })
      //   .eq('message_sid', MessageSid);
    }
  } catch (error) {
    console.error('❌ Erro ao processar webhook WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * POST /api/consultations/alert
 * Dispara alerta de consulta agendada
 */
router.post('/api/consultations/alert', async (req: Request, res: Response) => {
  try {
    const { doctorPhone, patientName, patientQueixa, consultationId, appointmentTime, urgency } = req.body;

    if (!doctorPhone || !patientName || !consultationId) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const messageSid = await sendConsultationAlert({
      doctorPhone,
      patientName,
      patientQueixa,
      consultationId,
      appointmentTime,
      urgency: urgency || 'normal',
    });

    res.status(200).json({ success: true, messageSid });
  } catch (error) {
    console.error('❌ Erro ao enviar alerta:', error);
    res.status(500).json({ error: 'Erro ao enviar alerta' });
  }
});

/**
 * POST /api/patients/notify
 * Envia notificação ao paciente
 */
router.post('/api/patients/notify', async (req: Request, res: Response) => {
  try {
    const { patientPhone, message, type } = req.body;

    if (!patientPhone || !message || !type) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const messageSid = await sendPatientNotification(patientPhone, message, type);

    res.status(200).json({ success: true, messageSid });
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    res.status(500).json({ error: 'Erro ao enviar notificação' });
  }
});

/**
 * GET /api/whatsapp/qrcode
 * Retorna QR Code para autenticação
 */
router.get('/api/whatsapp/qrcode', (req: Request, res: Response) => {
  try {
    // Gerar QR Code (em produção, seria integrado com Twilio)
    const qrCode = generateWhatsAppQRCode();
    res.status(200).json(qrCode);
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

function generateWhatsAppQRCode() {
  return {
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://plantayraiz.com.br/whatsapp-auth',
    expiresIn: 300,
  };
}

export default router;
