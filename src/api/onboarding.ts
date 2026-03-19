/**
 * API Routes para Onboarding com Assinatura Obrigatória
 * 
 * Endpoints:
 * - POST /api/onboarding/validate-personal-data
 * - POST /api/onboarding/send-email-verification
 * - POST /api/onboarding/verify-email
 * - POST /api/onboarding/send-whatsapp-verification
 * - POST /api/onboarding/verify-whatsapp
 * - POST /api/onboarding/activate-account
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { twilio } from '@/services/twilio-integration';
import { clicksignService } from '@/services/clicksign-contracts';

const router = Router();

// Armazenar códigos de verificação temporariamente (em produção, usar Redis)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; attempts: number }>();

/**
 * Validar dados pessoais
 */
router.post('/validate-personal-data', async (req: Request, res: Response) => {
  try {
    const { userType, name, email, phone, cpf, cnpj, crm, specialty, company, location } = req.body;

    // Validações básicas
    if (!userType || !['medico', 'lojista'].includes(userType)) {
      return res.status(400).json({ error: 'Tipo de usuário inválido' });
    }

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validar telefone (formato brasileiro)
    const phoneRegex = /^55\d{10,11}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Telefone inválido' });
    }

    // Validações específicas por tipo
    if (userType === 'medico') {
      if (!cpf || !crm || !specialty) {
        return res.status(400).json({ error: 'Dados de médico incompletos' });
      }

      // Validar CPF (formato básico)
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(cpf)) {
        return res.status(400).json({ error: 'CPF inválido' });
      }
    } else if (userType === 'lojista') {
      if (!company || !cnpj || !location) {
        return res.status(400).json({ error: 'Dados de lojista incompletos' });
      }

      // Validar CNPJ (formato básico)
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      if (!cnpjRegex.test(cnpj)) {
        return res.status(400).json({ error: 'CNPJ inválido' });
      }
    }

    // Verificar se email já existe
    // TODO: Implementar verificação no banco de dados

    res.json({ success: true, message: 'Dados validados com sucesso' });
  } catch (error) {
    console.error('Erro ao validar dados pessoais:', error);
    res.status(500).json({ error: 'Erro ao validar dados' });
  }
});

/**
 * Enviar código de verificação por email
 */
router.post('/send-email-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Armazenar código
    verificationCodes.set(`email:${email}`, {
      code,
      expiresAt,
      attempts: 0,
    });

    // Enviar email (usar serviço de email)
    console.log(`📧 Código de verificação de email: ${code}`);
    // TODO: Implementar envio de email via SendGrid/Mailgun

    res.json({ success: true, message: 'Código enviado por email' });
  } catch (error) {
    console.error('Erro ao enviar código de email:', error);
    res.status(500).json({ error: 'Erro ao enviar código' });
  }
});

/**
 * Verificar código de email
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }

    const stored = verificationCodes.get(`email:${email}`);

    if (!stored) {
      return res.status(400).json({ error: 'Código não encontrado ou expirado' });
    }

    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(`email:${email}`);
      return res.status(400).json({ error: 'Código expirado' });
    }

    if (stored.attempts >= 3) {
      verificationCodes.delete(`email:${email}`);
      return res.status(400).json({ error: 'Muitas tentativas. Solicite um novo código' });
    }

    if (stored.code !== code) {
      stored.attempts++;
      return res.status(400).json({ error: 'Código incorreto' });
    }

    // Código correto
    verificationCodes.delete(`email:${email}`);
    res.json({ success: true, message: 'Email verificado com sucesso' });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
});

/**
 * Enviar código de verificação por WhatsApp
 */
router.post('/send-whatsapp-verification', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Telefone é obrigatório' });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Armazenar código
    verificationCodes.set(`whatsapp:${phone}`, {
      code,
      expiresAt,
      attempts: 0,
    });

    // Enviar via Twilio
    await twilio.sendVerificationCode(phone, code);

    res.json({ success: true, message: 'Código enviado por WhatsApp' });
  } catch (error) {
    console.error('Erro ao enviar código de WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao enviar código' });
  }
});

/**
 * Verificar código de WhatsApp
 */
router.post('/verify-whatsapp', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Telefone e código são obrigatórios' });
    }

    const stored = verificationCodes.get(`whatsapp:${phone}`);

    if (!stored) {
      return res.status(400).json({ error: 'Código não encontrado ou expirado' });
    }

    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(`whatsapp:${phone}`);
      return res.status(400).json({ error: 'Código expirado' });
    }

    if (stored.attempts >= 3) {
      verificationCodes.delete(`whatsapp:${phone}`);
      return res.status(400).json({ error: 'Muitas tentativas. Solicite um novo código' });
    }

    if (stored.code !== code) {
      stored.attempts++;
      return res.status(400).json({ error: 'Código incorreto' });
    }

    // Código correto
    verificationCodes.delete(`whatsapp:${phone}`);
    res.json({ success: true, message: 'WhatsApp verificado com sucesso' });
  } catch (error) {
    console.error('Erro ao verificar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao verificar WhatsApp' });
  }
});

/**
 * Ativar conta após assinatura de contrato
 */
router.post('/activate-account', async (req: Request, res: Response) => {
  try {
    const { userType, email, contractId } = req.body;

    if (!userType || !email || !contractId) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Validar assinatura de contrato
    const contractStatus = await clicksignService.checkSignatureStatus(contractId);

    if (contractStatus.status !== 'completed') {
      return res.status(400).json({ error: 'Contrato não foi assinado' });
    }

    // Criar usuário no banco de dados
    const userId = uuidv4();
    
    // TODO: Implementar criação de usuário no banco de dados
    // const user = await createUser({
    //   id: userId,
    //   email,
    //   userType,
    //   contractId,
    //   status: 'active',
    // });

    // Enviar email de boas-vindas
    console.log(`✅ Conta ativada: ${email} (${userType})`);
    // TODO: Implementar envio de email de boas-vindas

    res.json({
      success: true,
      message: 'Conta ativada com sucesso',
      userId,
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    console.error('Erro ao ativar conta:', error);
    res.status(500).json({ error: 'Erro ao ativar conta' });
  }
});

export default router;
