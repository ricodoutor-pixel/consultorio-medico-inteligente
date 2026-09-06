import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '95654045Pa#';

async function testSmtpConnection() {
  console.log(`🔌 Testando conexão SMTP Hostinger (${SMTP_HOST}:${SMTP_PORT})...`);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.verify();
    console.log(`✅ Conexão SMTP Hostinger AUTENTICADA com sucesso como ${SMTP_USER}!`);
    return transporter;
  } catch (err) {
    console.error(`❌ Erro ao autenticar no SMTP Hostinger:`, err.message);
    return null;
  }
}

testSmtpConnection();
