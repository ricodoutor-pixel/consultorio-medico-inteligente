// 🛑 DESATIVADO PERMANENTEMENTE: disparos frios em loop de 10 minutos estão proibidos (decisão Dr. Edilson).
console.log('🛑 [WHATSAPP-BOT] Script desativado permanentemente. Convites a médicos só por envio manual do admin em horário comercial (Seg-Sáb, 9h-19h BRT) para médicos com CRM confirmado.');
process.exit(0);

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const MASTER_LIST_PATH = path.join(__dirname, 'prescritores_master_list.json');
const PROGRESS_FILE = path.join(__dirname, 'disparos_concluidos.json');

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return [];
}

function saveProgress(sentList) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(sentList, null, 2));
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function runBot() {
  if (process.env.MANUAL_ADMIN_SEND !== '1') {
    console.log('🚫 Envio automático bloqueado. Somente envio manual do admin.');
    return;
  }
  const guard = await import('../supabase/functions/_shared/whatsapp-outreach-guard.mjs');
  const { T } = await import('../supabase/functions/_shared/brisa-templates.mjs');

  if (!guard.isBusinessHoursBRT()) {
    console.log('⏰ Fora do horário comercial permitido (Seg–Sáb, 09h–19h BRT). Encerrando.');
    return;
  }
  if (!fs.existsSync(MASTER_LIST_PATH)) {
    console.error('Lista mestre não encontrada!');
    return;
  }

  const contacts = JSON.parse(fs.readFileSync(MASTER_LIST_PATH, 'utf8'));
  const sentList = loadProgress();
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: path.join(__dirname, 'whatsapp_session'),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#pane-side', { timeout: 0 });

  for (let i = 0; i < contacts.length; i++) {
    if (!guard.isBusinessHoursBRT()) {
      console.log('⏰ Encerramento automático: fim do horário comercial (Seg–Sáb, 09h–19h BRT).');
      break;
    }
    const doc = contacts[i];
    const uid = doc.email || doc.phone || `doc_${i}`;
    if (sentList.includes(uid)) continue;

    const gate = guard.evaluateOutboundDoctorInvite({
      contact: {
        name: doc.nome || doc.name || '',
        email: doc.email || '',
        specialty: doc.especialidade || doc.specialty || '',
        crm: doc.crm || '',
        crmState: doc.crm_state || doc.uf || '',
        councilType: doc.council_type || '',
      },
      manualAdminSend: process.env.MANUAL_ADMIN_SEND === '1',
      requireConfirmedCrm: true,
    });
    if (!gate.allowed) {
      console.log(`⛔ Bloqueado (${gate.reason}): ${doc.nome || uid}`);
      continue;
    }

    const msg = T.doctorInvite(doc.nome || '', {
      crm: doc.crm || '',
      crmState: doc.crm_state || doc.uf || '',
      councilType: doc.council_type || '',
      email: doc.email || '',
      specialty: doc.especialidade || doc.specialty || '',
    });
    if (!msg) continue;

    if (doc.email) {
      try {
        await transporter.sendMail({
          from: `"Planta y Raiz" <${process.env.SMTP_USER}>`,
          to: doc.email,
          subject: 'Convite Profissional — Consultório Digital Planta y Raiz',
          text: msg
        });
      } catch (err) {
        console.error('❌ Erro no E-mail:', err.message);
      }
    }

    let phone = String(doc.phone || doc.telefone_raw || '').replace(/\D/g, '');
    if (phone.length === 10 || phone.length === 11) phone = '55' + phone;
    if (phone) {
      const link = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
      try {
        await page.goto(link, { waitUntil: 'networkidle2' });
        await page.waitForSelector('span[data-icon="send"]', { timeout: 30000 });
        await delay(2000);
        await page.click('span[data-icon="send"]');
        await delay(3000);
      } catch (err) {
        console.log(`⚠️ Falha WhatsApp para ***${String(phone).slice(-4)}`);
      }
    }

    sentList.push(uid);
    saveProgress(sentList);
  }
}

runBot().catch(console.error);
