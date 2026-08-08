import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const user = 'contato@plantayraiz.com.br';
const pass = '95654045Pa#';

const hosts = [
  { host: 'smtp.hostinger.com', port: 465, secure: true },
  { host: 'smtp.hostinger.com', port: 587, secure: false },
  { host: 'smtp.titan.email', port: 465, secure: true },
  { host: 'smtp.titan.email', port: 587, secure: false },
  { host: 'mail.plantayraiz.com.br', port: 465, secure: true },
  { host: 'mail.plantayraiz.com.br', port: 587, secure: false },
];

async function testAll() {
  console.log(`🔎 Testando endpoints SMTP para ${user}...`);

  for (const cfg of hosts) {
    try {
      console.log(`\n🧪 Testando ${cfg.host}:${cfg.port} (secure: ${cfg.secure})...`);
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
      await transporter.verify();
      console.log(`✅ SUCESSO ABSOLUTO! Conectado e Autenticado em ${cfg.host}:${cfg.port}!`);
      return cfg;
    } catch (err) {
      console.error(`❌ Falhou (${cfg.host}:${cfg.port}):`, err.message);
    }
  }

  console.log("\n⚠️ Nenhum endpoint SMTP aceitou as credenciais diretamente.");
}

testAll();
