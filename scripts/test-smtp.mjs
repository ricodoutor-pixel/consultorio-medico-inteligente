import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

async function testConfigs() {
  console.log(`Testing SMTP Hostinger with User: ${user}`);

  // Test 1: Port 587 (TLS)
  console.log("\n🧪 Test 1: Port 587 (secure: false)...");
  try {
    const transporter1 = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    await transporter1.verify();
    console.log("✅ Test 1 (Port 587) Conectado e Autenticado com sucesso!");
    return;
  } catch (err) {
    console.error("❌ Test 1 Falhou:", err.message);
  }

  // Test 2: Port 465 (SSL)
  console.log("\n🧪 Test 2: Port 465 (secure: true)...");
  try {
    const transporter2 = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    await transporter2.verify();
    console.log("✅ Test 2 (Port 465) Conectado e Autenticado com sucesso!");
    return;
  } catch (err) {
    console.error("❌ Test 2 Falhou:", err.message);
  }
}

testConfigs();
