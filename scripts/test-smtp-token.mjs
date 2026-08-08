import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const user = 'contato@plantayraiz.com.br';
const pass = 'a3da008aa3e5b42f6684bb528086c343701ce123d58ee6e3ae2b4a37dc6e952f';

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
