import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const user = 'contato@plantayraiz.com.br';
const pass = process.env.SMTP_PASS || '';

async function testTokenPass() {
  console.log(`🧪 Testando SMTP Hostinger com o Token/API Key como Senha...`);

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    await transporter.verify();
    console.log("✅ AUTENTICAÇÃO COM TOKEN CONCLUÍDA COM SUCESSO!");
  } catch (err) {
    console.error("❌ Falha na autenticação SMTP com Token:", err.message);
  }
}

testTokenPass();
