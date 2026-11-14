/**
 * scripts/agent_cadence_10min_inviter.mjs
 * 
 * 🌿 Planta y Raíz Ltda — Missão 50 Médicos na Vitrine
 * 
 * Agente Autônomo de Convites WhatsApp (Cadência Estrita: 1 convite a cada 10 min):
 * 1. Prioridade 1: Lista VCF fornecida pelo Dr. Edilson (contatos-enf-brisa.vcf)
 * 2. Prioridade 2: Leads captados pelo Apify (LinkedIn, Instagram, Google Places)
 * 
 * - Filtra estritamente médicos já cadastrados na vitrine (79 cadastrados)
 * - Respeita bloqueios de modo humano e opt-out
 * - Dispara mensagem oficial no WhatsApp e e-mail institucional
 * - Persiste estado em scripts/medico_socio_campaign_state.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

dns.setDefaultResultOrder('ipv4first');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Caminhos de arquivos
const VCF_PATHS = [
  'C:\\Users\\ricod\\Desktop\\contatos-enf-brisa.vcf',
  path.join(ROOT_DIR, 'scripts', 'contatos-enf-brisa.vcf'),
  path.join(ROOT_DIR, 'data', 'contatos-enf-brisa.vcf'),
  path.join(__dirname, 'contatos-enf-brisa.vcf')
];

const STATE_FILE = path.join(__dirname, 'medico_socio_campaign_state.json');
const LOG_FILE = path.join(__dirname, 'cadence_10min_inviter.log');
const HUMAN_LOCK_FILE = path.join(__dirname, 'evolution_human_mode_contacts.json');
const BLACKLIST_FILE = path.join(__dirname, 'evolution_optout_blacklist.json');
const PAUSE_FILE = path.join(__dirname, 'PAUSE_AUTOMATION.flag');

// Credenciais e APIs
const EVO_URL = process.env.EVOLUTION_URL_VPS || process.env.EVOLUTION_URL || 'https://whatsapp.plantayraiz.com.br';
const EVO_KEY = process.env.EVOLUTION_API_KEY_VPS || process.env.EVOLUTION_API_KEY || '';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'plantayraiz';

const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_BASE = 'https://api.brevo.com/v3';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '';

const CADENCE_MS = 10 * 60 * 1000; // Exatamente 10 minutos por envio bem-sucedido

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  pool: true,
  maxConnections: 1,
  rateLimit: 1
});

function log(msg) {
  const line = `[${new Date().toISOString()}] [CADENCE-10MIN] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function loadState() {
  let state = {
    sentEmails: [],
    sentWhatsapps: [],
    invalidWhatsapps: [],
    history: {},
    summary: {
      totalVcf: 0,
      totalApify: 0,
      excludedVitrine: 0,
      eligible: 0,
      emailsSent: 0,
      whatsappsSent: 0,
      errors: 0
    },
    lastRunAt: null
  };
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      state = { ...state, ...parsed };
      if (!Array.isArray(state.invalidWhatsapps)) state.invalidWhatsapps = [];
      if (!Array.isArray(state.sentWhatsapps)) state.sentWhatsapps = [];
      if (!Array.isArray(state.sentEmails)) state.sentEmails = [];
    }
  } catch (e) {}
  return state;
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function loadHumanLocked() {
  try {
    if (fs.existsSync(HUMAN_LOCK_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(HUMAN_LOCK_FILE, 'utf8')));
    }
  } catch (e) {}
  return new Set();
}

function loadBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8')));
    }
  } catch (e) {}
  return new Set();
}

function cleanDoctorName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/^dr\(a\)\.?\s+/i, '')
    .replace(/^dr\.?\s+/i, '')
    .replace(/^dra\.?\s+/i, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function sanitizeDisplayDoctorName(raw) {
  return (raw || 'Doutor(a)')
    .replace(/^dr\(a\)\.?\s+/i, '')
    .replace(/^dr\.?\s+/i, '')
    .replace(/^dra\.?\s+/i, '')
    .trim();
}

function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return digits;
  }
  // Números internacionais válidos do grupo (EUA +1, Portugal +351, Bolívia +591)
  if ((digits.startsWith('1') || digits.startsWith('351') || digits.startsWith('591')) && digits.length >= 11 && digits.length <= 13) {
    return digits;
  }
  return null;
}

// Lista exata dos 170 membros do grupo de WhatsApp que NUNCA receberam mensagem individual (auditada em 14/11/2026)
const MISSING_170_GROUP_PHONES = [
  "17866583579","5511911196538","5511919254085","5511934361818","5511934892491","5511938067457","5511942821200","5511948725335","5511953051500","5511964138413",
  "5511964324575","5511966038822","5511967287022","5511967727679","5511971201185","5511975157001","5511976464092","5511976719041","5511976789574","5511981125793",
  "5511982853898","5511984199261","5511994684273","5511995138467","5511997118951","5511999923382","5512991786195","5513981271529","5513997536856","5515981876000",
  "5515997331193","5517991062492","5518997299199","5519971030507","5519991735673","5519992756446","5519998276951","5519999041142","5521964373722","5521964707669",
  "5521967068981","5521969118600","5521969686592","5521971819910","5521973672270","5521979977153","5521980714095","5521981110901","5521981143787","5521982601988",
  "5521983623033","5521983951979","5521986811971","5521991206232","5521992313929","5521992591023","5521993240932","5521993519979","5521993763192","5521995214479",
  "5521996423921","5521997627700","5522997092095","5522997144295","5522997865409","5522998402428","5522998888397","5524998338225","5527989012851","5527992425344",
  "5527993167777","5527997002328","5528999387711","553188410572","553191047220","553191165471","553192395067","553194415678","553199836921","553288618753",
  "553488108514","553491056719","553491392300","553492523793","553588779173","553592230288","553798230328","554188531042","554196664962","554198859775",
  "554199811958","554388606868","554391416070","554484549062","554488292971","554588028384","554591287934","554599959575","554791912407","554796640377",
  "554796646002","554796672246","554891630172","554892257649","554899259912","554999012600","554999228959","555184121575","555185007294","555193137771",
  "555198900989","555199121406","5553920002491","555496897393","555499794235","555599627092","556182214999","556191517263","556192685111","556195468484",
  "556196089040","556196785425","556296897776","556299354838","556499487724","556598073170","556599845383","556781324342","556784531606","556793379276",
  "556798258220","556899526051","556992059194","556999841987","556999964510","557187364200","557192574707","557196047253","557196285199","557391343461",
  "557399082105","557399878505","557399944523","557788174701","557798165053","557798685562","558181162774","558296080909","558299041262","558299468448",
  "558488382092","558494694355","558588592263","558599448848","558699166661","559181776407","559281006447","559295138774","559481180000","559484502530",
  "559491239923","559492621143","559681364995","559688053381","559884227784","559885224388","559988618888","559991247689","559992172340","59162161015"
];

function loadGroupMemberLeads() {
  return MISSING_170_GROUP_PHONES.map(phone => ({
    name: 'Doutor(a)',
    phone,
    email: '',
    source: 'grupo_whatsapp_170_faltantes'
  }));
}

async function hasAlreadyReceivedWelcomeOnEvolution(phone) {
  if (!EVO_KEY || !phone) return false;
  try {
    const variants = getPhoneVariants(phone);
    for (const v of variants) {
      const jid = `${v}@s.whatsapp.net`;
      const res = await fetch(`${EVO_URL}/chat/findMessages/${EVO_INSTANCE}`, {
        method: 'POST',
        headers: {
          'apikey': EVO_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          where: { key: { remoteJid: jid } },
          limit: 30
        })
      });
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      const records = data?.messages?.records || (Array.isArray(data) ? data : []);
      const alreadySent = records.some(m => {
        if (!m?.key?.fromMe) return false;
        const txt = String(
          m?.message?.conversation ||
          m?.message?.extendedTextMessage?.text ||
          ''
        ).toLowerCase();
        return (
          txt.includes('parabéns, dr') ||
          txt.includes('parabens, dr') ||
          txt.includes('selecionado(a) para integrar') ||
          txt.includes('cadastro-profissional')
        );
      });
      if (alreadySent) return true;
    }
  } catch (e) {}
  return false;
}

function getPhoneVariants(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return [];
  const variants = [norm];
  if (norm.startsWith('55') && norm.length === 13) {
    const ddd = norm.slice(2, 4);
    const rest = norm.slice(5);
    variants.push(`55${ddd}${rest}`);
  } else if (norm.startsWith('55') && norm.length === 12) {
    const ddd = norm.slice(2, 4);
    const rest = norm.slice(4);
    variants.push(`55${ddd}9${rest}`);
  }
  return variants;
}

function getVitrineDoctorsSet() {
  const vitrineNames = new Set();
  const profPath = path.join(ROOT_DIR, 'src', 'data', 'professionals.ts');
  if (fs.existsSync(profPath)) {
    const profFile = fs.readFileSync(profPath, 'utf8');
    const nameMatches = profFile.matchAll(/name:\s*"([^"]+)"/g);
    for (const m of nameMatches) {
      vitrineNames.add(cleanDoctorName(m[1]));
    }
  }
  const dbListPath = path.join(__dirname, 'database_doctors_list.json');
  if (fs.existsSync(dbListPath)) {
    try {
      const dbList = JSON.parse(fs.readFileSync(dbListPath, 'utf8'));
      for (const d of dbList) {
        if (d.name) vitrineNames.add(cleanDoctorName(d.name));
        if (d.full_name) vitrineNames.add(cleanDoctorName(d.full_name));
      }
    } catch (e) {}
  }
  return vitrineNames;
}

// 1. Carrega contatos da Lista VCF fornecida pelo Dr. Edilson
function loadVcfContacts() {
  const contacts = [];
  let foundPath = VCF_PATHS.find(p => fs.existsSync(p));
  if (!foundPath) return contacts;

  try {
    const vcfContent = fs.readFileSync(foundPath, 'utf8');
    const cards = vcfContent.split('BEGIN:VCARD');
    for (const card of cards) {
      if (!card.trim()) continue;
      const fnMatch = card.match(/FN:(.*)/);
      const telMatch = card.match(/TEL[^:]*:(.*)/);
      const emailMatch = card.match(/EMAIL[^:]*:(.*)/);

      const name = fnMatch ? fnMatch[1].trim() : '';
      const phone = telMatch ? telMatch[1].trim() : '';
      const email = emailMatch ? emailMatch[1].trim() : '';

      if (name && (phone || email)) {
        contacts.push({ name, phone, email, source: 'vcf_edilson' });
      }
    }
  } catch (e) {
    log(`⚠️ Erro ao ler VCF: ${e.message}`);
  }
  return contacts;
}

// 2. Carrega contatos captados pelo Apify (LinkedIn, Instagram, Google Places)
function loadApifyHarvestedLeads() {
  const leads = [];
  const apifyFiles = [
    'unregistered_doctors_leads.json',
    'clinicos_gerais_pos2020_leads.json',
    'linkedin_prescribers_leads.json',
    'apify_harvested_leads.json',
    'doctor_leads_collected.json'
  ];

  for (const fileName of apifyFiles) {
    const fullPath = path.join(__dirname, fileName);
    if (fs.existsSync(fullPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (Array.isArray(data)) {
          for (const item of data) {
            const name = item.name || item.full_name || item.title || '';
            const phone = item.phone || item.whatsapp || item.tel || item.cell || '';
            const email = item.email || '';
            if (name && (phone || email)) {
              leads.push({
                name,
                phone,
                email,
                specialty: item.specialty || item.role || item.headline || '',
                source: `apify_${fileName}`
              });
            }
          }
        }
      } catch (e) {}
    }
  }
  return leads;
}

// Template HTML Oficial de E-mail de Convite Médico Sócio
function buildCampaignEmailHtml(doctorName) {
  const cleanName = sanitizeDisplayDoctorName(doctorName);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Convite Especial: Médico Sócio WeCann Planta y Raíz</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7faf8; margin: 0; padding: 24px; color: #1f2937;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
    
    <!-- Cabeçalho Oficial -->
    <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">WeCann Planta y Raíz 🌿🩺</h1>
      <p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 500; opacity: 0.95;">Mega Clínica Digital • Telemedicina CFM • Medicina Integrativa</p>
    </div>

    <!-- Conteúdo -->
    <div style="padding: 32px 28px; line-height: 1.6; font-size: 15px;">
      
      <div style="background-color: #ecfdf5; border-left: 5px solid #10b981; padding: 18px; margin-bottom: 24px; border-radius: 6px;">
        <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #065f46; font-weight: 700;">
          🎉 Parabéns, Dr(a). ${cleanName}!
        </h2>
        <p style="margin: 0; font-size: 15px; color: #047857; line-height: 1.5;">
          Você foi escolhido(a) para integrar o quadro exclusivo de <strong>médicos prescritores sócios com direito a participação dos lucros</strong> da <strong>WeCann Planta y Raíz Mega Clínica Digital</strong>!
        </p>
      </div>

      <p>
        Me chamo <strong>Dr. Edilson Bezerra</strong>, sou diretor técnico da Planta y Raíz, e é com imensa satisfação que envio este convite institucional personalizado ao colega.
      </p>

      <p>
        Estruturamos a maior plataforma de telemedicina e medicina integrativa canabinoide do país, desenvolvida por médicos e para médicos, com tecnologia de ponta para que você atenda com total comodidade e autonomia clínica.
      </p>

      <h3 style="color: #064e3b; margin-top: 28px; margin-bottom: 12px; font-size: 17px; font-weight: 700;">
        🌿 Principais vantagens de ser Médico Sócio na Planta y Raíz:
      </h3>

      <ul style="padding-left: 20px; color: #374151; margin-bottom: 24px;">
        <li style="margin-bottom: 10px;">
          <strong>Consultório Virtual Completo & Prontuário CFM Integrado:</strong> Anamnese, histórico clínico longitudinal e acompanhamento contínuo dos seus pacientes.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Emissor de Receitas Digitais com QR Code:</strong> Aceito em 100% das farmácias do Brasil e em processos de autorização de importação da ANVISA (RDC 660 e RDC 327).
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Apoio da Enfermeira Brisa e Copilot de IA:</strong> Seus pacientes chegam educados e pré-triados para a consulta médica, otimizando o seu tempo clínico.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Pacientes 100% Seus:</strong> Total soberania na conduta, prescrição e retornos agendados diretamente na sua agenda.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Repasse Financeiro Instantâneo via PIX (93% Líquido):</strong> Retenção fixa de apenas 7% de manutenção da plataforma, sem burocracia após o atendimento.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Plano Premium Opcional (R$ 99/mês):</strong> Prioridade na fila de pacientes, destaque na vitrine e ferramentas de IA clínica.
        </li>
      </ul>

      <!-- CTA Principal -->
      <div style="text-align: center; margin: 32px 0 20px 0;">
        <a href="https://www.plantayraiz.com.br/cadastro-profissional?origem=convite_socio" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 15px 36px; font-size: 16px; font-weight: 700; border-radius: 8px; box-shadow: 0 3px 8px rgba(5,150,105,0.35);">
          Ativar Meu Consultório Virtual Gratuito Agora 🚀
        </a>
      </div>

      <p style="font-size: 13px; text-align: center; color: #6b7280; margin-bottom: 24px;">
        O cadastro leva menos de 2 minutos. Envie seu CRM e documento para ativação imediata.
      </p>

      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 14px; margin-top: 24px;">
        <p style="margin: 0 0 6px 0;">
          🌐 <strong>Conheça nossa Vitrine de Especialistas:</strong><br>
          <a href="https://www.plantayraiz.com.br/profissionais" style="color: #059669; text-decoration: none; font-weight: 600;">www.plantayraiz.com.br/profissionais</a>
        </p>
        <p style="margin: 10px 0 0 0;">
          💬 <strong>Dúvidas ou auxílio com seu cadastro?</strong><br>
          Fale diretamente com nossa enfermeira chefe Enfª Brisa no WhatsApp:<br>
          <a href="https://wa.me/5511991363154" style="color: #059669; text-decoration: none; font-weight: 600;">wa.me/5511991363154</a>
        </p>
      </div>

      <p style="margin-top: 32px; font-size: 14px; color: #4b5563;">
        Com os melhores cumprimentos,<br>
        <strong>Dr. Edilson Bezerra</strong><br>
        Diretor Técnico Médico — WeCann Planta y Raíz Ltda<br>
        <span style="font-size: 12px; color: #9ca3af;">CRM Médico & Equipe de Telemedicina</span>
      </p>
    </div>

    <!-- Rodapé -->
    <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
      <p style="margin: 0;">Planta y Raíz Ltda • Plataforma de Telemedicina e Saúde Integrativa</p>
      <p style="margin: 4px 0 0 0;">Este é um convite institucional exclusivo e confidencial para médicos prescritores convidados.</p>
    </div>

  </div>
</body>
</html>`;
}

// Disparo de E-mail (Brevo com fallback Hostinger SMTP)
async function sendEmailInvite(doctor) {
  const email = (doctor.email || '').toLowerCase().trim();
  if (!email || !email.includes('@')) return false;

  const cleanName = sanitizeDisplayDoctorName(doctor.name);
  const subject = `Parabéns Dr(a). ${cleanName}, você foi escolhido(a) como Médico(a) Prescritor(a) Sócio(a) da Planta y Raíz 🌿🩺`;
  const html = buildCampaignEmailHtml(doctor.name);

  // 1. Brevo API
  if (BREVO_KEY) {
    try {
      const res = await fetch(`${BREVO_BASE}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': BREVO_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Dr. Edilson Bezerra | Planta y Raíz', email: 'contato@plantayraiz.com.br' },
          to: [{ email, name: `Dr(a). ${cleanName}` }],
          subject,
          htmlContent: html
        })
      });

      if (res.ok || res.status === 201) {
        log(`✉️ [E-MAIL BREVO] Sucesso: Dr(a). ${cleanName} <${email}>`);
        return true;
      } else {
        const err = await res.text().catch(() => '');
        log(`⚠️ [BREVO ERRO ${res.status}]: ${err}`);
      }
    } catch (e) {
      log(`⚠️ [BREVO FALHA]: ${e.message}, tentando SMTP Hostinger`);
    }
  }

  // 2. SMTP Hostinger
  if (SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: `"Dr. Edilson Bezerra | Planta y Raíz" <${SMTP_USER}>`,
        replyTo: SMTP_USER,
        to: email,
        subject,
        html
      });
      log(`✉️ [E-MAIL HOSTINGER] Sucesso: Dr(a). ${cleanName} <${email}>`);
      return true;
    } catch (e) {
      log(`❌ [E-MAIL ERRO]: ${email} - ${e.message}`);
      return false;
    }
  }

  return false;
}

// Mensagem Oficial WhatsApp (enxuta, humana e direta para aumentar a taxa de resposta sem parecer spam)
function buildCampaignWhatsAppMessage(doctorName) {
  const cleanName = sanitizeDisplayDoctorName(doctorName);
  const greeting = cleanName && cleanName.toLowerCase() !== 'doutor(a)'
    ? `Olá, Dr(a). ${cleanName}! Tudo bem? 🌿`
    : `Olá, Doutor(a)! Tudo bem? 🌿`;

  return `${greeting}

Vi que você faz parte do nosso grupo médico da *Planta y Raíz* e gostaria de saber se já ativou seu Consultório Digital gratuito na nossa vitrine de prescritores.

• *Repasse líquido de 93% via PIX* após cada teleconsulta (taxa fixa de apenas 7% da plataforma);
• *Prontuário CFM e prescrição com assinatura ICP-Brasil / Gov.br*;
• *Encaminhamento de pacientes* que passam pela nossa triagem.

Para ativar seu perfil (leva menos de 2 minutos), acesse:
👉 https://www.plantayraiz.com.br/cadastro-profissional

Ou, se preferir, pode me enviar seu CRM por aqui mesmo que nossa equipe te ajuda na ativação!`;
}

// Disparo WhatsApp
async function sendWhatsAppInvite(doctor, humanLocked, blacklist) {
  const phone = normalizePhone(doctor.phone);
  if (!phone) return { success: false, reason: 'NO_PHONE' };

  if (humanLocked.has(phone)) {
    log(`🔒 [HUMAN LOCK] Pulando Dr(a). ${doctor.name} (${phone}) - Em atendimento humano`);
    return { success: false, reason: 'HUMAN_LOCKED' };
  }

  if (blacklist.has(phone)) {
    log(`⛔ [BLACKLIST] Pulando Dr(a). ${doctor.name} (${phone}) - Opt-out`);
    return { success: false, reason: 'BLACKLISTED' };
  }

  const message = buildCampaignWhatsAppMessage(doctor.name);

  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: phone,
        text: message,
        options: {
          delay: 1500,
          presence: 'composing',
          linkPreview: true
        }
      })
    });

    if (res.ok) {
      log(`💬 [WHATSAPP ENVIADO] Sucesso: Dr(a). ${doctor.name} (${phone}) [Origem: ${doctor.source}]`);
      return { success: true };
    } else {
      const err = await res.text().catch(() => '');
      log(`⚠️ [WHATSAPP FALHA (${res.status})]: ${phone} - ${err}`);
      const isNotRegistered = err.includes('exists":false') || res.status === 400;
      return { success: false, reason: isNotRegistered ? 'NOT_ON_WHATSAPP' : `HTTP_${res.status}` };
    }
  } catch (e) {
    log(`❌ [WHATSAPP ERRO CONEXÃO]: ${phone} - ${e.message}`);
    return { success: false, reason: e.message };
  }
}

// Loop Principal de Cadência Estrita (1 envio a cada 10 min)
async function startCadenceInviter() {
  log(`🌟 INICIANDO AGENTE DE CADÊNCIA: 1 CONVITE A CADA 10 MINUTOS`);
  log(`Objetivo: 50 Médicos Ativos na Vitrine | Ordem: VCF do Dr. Edilson -> Apify Harvested Leads`);

  const vitrineSet = getVitrineDoctorsSet();
  log(`Médicos da vitrine carregados para exclusão estrita: ${vitrineSet.size}`);

  const vcfContacts = loadVcfContacts();
  const groupLeads = loadGroupMemberLeads();
  const apifyLeads = loadApifyHarvestedLeads();
  log(`Base carregada: VCF Edilson = ${vcfContacts.length} contatos | Grupo WhatsApp = ${groupLeads.length} membros | Apify = ${apifyLeads.length} leads`);

  // Deduplica por sufixo de 8 dígitos preservando o primeiro contato com nome real (VCF -> Grupo -> Apify)
  const seenSuffixes = new Set();
  const allCandidateLeads = [];
  for (const item of [...vcfContacts, ...groupLeads, ...apifyLeads]) {
    const p = normalizePhone(item.phone);
    if (!p) continue;
    const suffix = p.slice(-8);
    if (seenSuffixes.has(suffix)) continue;
    seenSuffixes.add(suffix);
    allCandidateLeads.push(item);
  }
  log(`Total de contatos únicos na fila de convites: ${allCandidateLeads.length}`);

  while (true) {
    if (fs.existsSync(PAUSE_FILE)) {
      log(`⏸️ PAUSE_AUTOMATION.flag detectado. Aguardando 1 minuto...`);
      await sleep(60000);
      continue;
    }

    const state = loadState();
    const humanLocked = loadHumanLocked();
    const blacklist = loadBlacklist();

    const sentWhatsappsSet = new Set(state.sentWhatsapps.flatMap(getPhoneVariants));
    const invalidWhatsappsSet = new Set(state.invalidWhatsapps.flatMap(getPhoneVariants));

    // Encontra o próximo médico elegível que ainda NÃO recebeu WhatsApp
    let targetDoctor = null;

    for (const lead of allCandidateLeads) {
      const phone = normalizePhone(lead.phone);
      if (!phone) continue;

      const variants = getPhoneVariants(phone);
      if (variants.some(v => sentWhatsappsSet.has(v) || invalidWhatsappsSet.has(v))) {
        continue;
      }

      const clean = cleanDoctorName(lead.name);
      let isVitrine = false;
      for (const vn of vitrineSet) {
        if (vn && (clean === vn || clean.includes(vn) || vn.includes(clean))) {
          isVitrine = true;
          break;
        }
      }
      if (isVitrine) continue;

      if (variants.some(v => humanLocked.has(v) || blacklist.has(v))) continue;

      targetDoctor = lead;
      break;
    }

    if (!targetDoctor) {
      log(`🎉 Todos os contatos da lista VCF e do Apify já foram convidados! Verificando novamente em 30 min.`);
      await sleep(30 * 60 * 1000);
      continue;
    }

    const targetPhone = normalizePhone(targetDoctor.phone);
    const variants = getPhoneVariants(targetPhone);

    // Trava extra no Evolution API: confere se já recebeu boas-vindas antes de disparar (evita qualquer envio duplicado aos 254 que já receberam)
    const alreadyInEvolution = await hasAlreadyReceivedWelcomeOnEvolution(targetPhone);
    if (alreadyInEvolution) {
      variants.forEach(v => {
        if (!state.sentWhatsapps.includes(v)) state.sentWhatsapps.push(v);
      });
      state.history[targetDoctor.name || targetPhone] = {
        phone: targetPhone,
        email: targetDoctor.email || null,
        source: targetDoctor.source,
        whatsappAt: new Date().toISOString(),
        status: 'JA_ENVIADO_NO_EVOLUTION'
      };
      saveState(state);
      log(`⏭️ [JÁ RECEBEU NO WHATSAPP] Contato ${targetDoctor.name} (${targetPhone}) já consta com convite enviado no histórico da Evolution. Marcado e avançando...`);
      await sleep(800);
      continue;
    }

    log(`\n🎯 [VEZ DO DISPARO] Convidando Dr(a). ${targetDoctor.name} (${targetPhone}) [${targetDoctor.source}]`);

    // 1. Envia E-mail se disponível e ainda não enviado
    const doctorEmail = (targetDoctor.email || '').toLowerCase().trim();
    if (doctorEmail && doctorEmail.includes('@') && !state.sentEmails.includes(doctorEmail)) {
      const emailSent = await sendEmailInvite(targetDoctor);
      if (emailSent) {
        state.sentEmails.push(doctorEmail);
        state.summary.emailsSent = (state.summary.emailsSent || 0) + 1;
        saveState(state);
      }
    }

    // 2. Dispara WhatsApp
    const result = await sendWhatsAppInvite(targetDoctor, humanLocked, blacklist);

    if (result.success) {
      variants.forEach(v => {
        if (!state.sentWhatsapps.includes(v)) state.sentWhatsapps.push(v);
      });
      state.summary.whatsappsSent = (state.summary.whatsappsSent || 0) + 1;
      state.history[targetDoctor.name] = {
        phone: targetPhone,
        email: targetDoctor.email || null,
        source: targetDoctor.source,
        whatsappAt: new Date().toISOString(),
        status: 'ENVIADO'
      };
      state.lastRunAt = new Date().toISOString();
      saveState(state);

      const nextTime = new Date(Date.now() + CADENCE_MS).toLocaleTimeString('pt-BR');
      log(`✅ Convite entregue com sucesso! Aguardando 10 minutos para o próximo envio (próximo disparo às ${nextTime})...\n`);

      // Espera exatamente 10 minutos (com log a cada 1 minuto)
      const intervals = 10;
      for (let i = 1; i <= intervals; i++) {
        await sleep(CADENCE_MS / intervals);
        log(`⏱️ Contagem regressiva: ${10 - i} minuto(s) restante(s) para o próximo convite.`);
      }
    } else {
      // Número inválido ou sem WhatsApp -> grava para nunca repetir e avança IMEDIATAMENTE sem esperar 10 min
      variants.forEach(v => {
        if (!state.invalidWhatsapps.includes(v)) state.invalidWhatsapps.push(v);
      });
      state.history[targetDoctor.name] = {
        phone: targetPhone,
        email: targetDoctor.email || null,
        source: targetDoctor.source,
        whatsappAt: null,
        status: result.reason
      };
      state.lastRunAt = new Date().toISOString();
      saveState(state);

      log(`⏩ Número não registrado no WhatsApp (${result.reason}). Avançando imediatamente para o próximo médico...`);
      await sleep(2500); // 2.5 segundos apenas para não sobrecarregar
    }
  }
}

startCadenceInviter().catch(e => {
  log(`💥 Erro fatal no agente de cadência: ${e.message}`);
});
