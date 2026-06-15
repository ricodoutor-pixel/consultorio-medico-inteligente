/**
 * 🏢 Planta y Raiz - Mega Clínica Digital
 * 🚀 Manus CEO: Webhook de Deploy Automático (CI/CD)
 * 📅 Operação: GitHub -> Hostinger
 */

import { Request, Response } from 'express';
import { exec } from 'child_process';
import crypto from 'crypto';

export const deployWebhook = (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ GITHUB_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  // Validação de segurança do GitHub
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  if (signature !== digest) {
    console.error('❌ [Manus CEO] Assinatura de Webhook inválida!');
    return res.status(401).send('Invalid signature');
  }

  console.log('🚀 [Manus CEO] Iniciando Deploy Automático na Hostinger...');

  // Comando de atualização do servidor
  exec('git pull origin main && npm install && npm run build && pm2 restart all', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ [Manus CEO] Erro no Deploy: ${error.message}`);
      return;
    }
    console.log(`✅ [Manus CEO] Deploy concluído com sucesso:\n${stdout}`);
  });

  res.status(200).send('Deploy started');
};
