import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'vip_lifecycle_state.json');

const EVO_URL = (process.env.EVOLUTION_API_URL || process.env.EVOLUTION_URL_VPS || process.env.EVOLUTION_URL || 'https://whatsapp.plantayraiz.com.br').replace(/\/$/, '');
const EVO_KEY = process.env.EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY_VPS || '39d3c0208169d52717027e27477cdc9f63d70fda54296c501fbe409c10562a59';
const INSTANCE = process.env.EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE_NAME || 'plantayraiz';
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP || '5511991363154'; // Dr. Edilson

const VIP_DOCTORS = [
  {
    id: "med-victor-fonseca",
    name: "Dr. Victor Henrique Bueno da Fonseca",
    crm: "206873/SP",
    phone: "5511953045378",
    email: "contato@doutorvictorfonseca.com",
    planTier: "vip",
    // Data de ativação original / vigência
    activatedAt: "2026-10-06T06:54:36Z",
    // Revalidado e regularizado conforme instrução do Dr. Edilson
    expiresAt: "2026-12-06T23:59:59Z",
    paymentRef: "MP_181628605551"
  },
  {
    id: "med-milton-urban",
    name: "Dr. Milton Dimas Tadeu Urban",
    crm: "58169/SP",
    phone: "5519999059665",
    email: "drmiltonurban@gmail.com",
    planTier: "vip",
    activatedAt: "2026-11-01T10:18:22Z",
    expiresAt: "2026-12-01T23:59:59Z",
    paymentRef: "PIX_R$99_VALIDADO"
  }
];

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading state file:', e);
  }
  return { doctors: {}, history: [] };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving state file:', e);
  }
}

async function sendWhatsAppMessage(to, text) {
  const cleanPhone = to.replace(/\D/g, '');
  if (!cleanPhone) return null;

  try {
    const endpoint = `${EVO_URL}/message/sendText/${INSTANCE}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVO_KEY,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: text,
      }),
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function processVipDoctorLifecycle(options = { sendWhatsApp: false }) {
  console.log('=== PROCESSANDO CICLO DE VIDA DOS MÉDICOS VIP ===');
  console.log(`Evolution API: ${EVO_URL} | Instância: ${INSTANCE}`);

  const state = loadState();
  const now = new Date();
  const results = [];

  for (const doc of VIP_DOCTORS) {
    console.log(`\nVerificando médico VIP: ${doc.name} (${doc.crm})`);
    const docState = state.doctors[doc.id] || {
      welcomeSent: false,
      adminNotified: false,
      expirationNotified: false,
      currentTier: doc.planTier,
      active: true
    };

    const expiresAt = new Date(doc.expiresAt);
    const isExpired = expiresAt < now;

    if (isExpired) {
      console.log(`- Assinatura VENCIDA em ${doc.expiresAt}`);
      if (!docState.expirationNotified) {
        const expirationMsg = `Olá, ${doc.name}!

Identificamos que a vigência mensal do seu Plano Médico VIP na Planta y Raíz expirou.

⚠️ *Atenda mais, não atrase seu plano!*

Para manter sua taxa de intermediação ZERO (0%), destaque de topo na vitrine médica, fila prioritária e o Copiloto Clínico VIP de Consultas, renove sua assinatura agora:
👉 https://plantayraiz.com.br/precos

🛡️ *Seus Prontuários e Pacientes Estão Seguros:*
O histórico de seus pacientes e prontuários permanece 100% íntegro, protegido e disponível em conformidade com as regras do CFM e LGPD.

Equipe Planta y Raíz | Cuidado & Medicina Canabinoide`;

        if (options.sendWhatsApp) {
          console.log(`  -> Enviando aviso de vencimento para o médico: ${doc.phone}`);
          const res = await sendWhatsAppMessage(doc.phone, expirationMsg);
          console.log(`  -> Resposta Evolution:`, res?.status || res?.error);
        }

        docState.expirationNotified = true;
        docState.active = false;
        docState.expiredAt = now.toISOString();
      }
    } else {
      console.log(`- Assinatura VIP ATIVA até ${doc.expiresAt}`);
      docState.active = true;

      // 1. Mensagem de Boas-Vindas com Lista de Vantagens VIP
      if (!docState.welcomeSent) {
        const welcomeMsg = `🌟 *PARABÉNS E SEJA BEM-VINDO(A) AO PLANO MÉDICO VIP!*

Prezado(a) ${doc.name} (CRM ${doc.crm}),

Confirmamos a ativação do seu *Plano Médico VIP Assinante* na Planta y Raíz (plantayraiz.com.br)!

Seu perfil foi oficialmente reconhecido pelo sistema e todos os privilégios VIP de alta performance estão liberados para você:

👑 *SUAS VANTAGENS EXCLUSIVAS DE MÉDICO VIP:*
1. 💸 *Taxa de Intermediação ZERO (0%):* 100% do valor líquido das suas teleconsultas é repassado a você.
2. 🏆 *Destaque Ouro na Vitrine:* Posicionamento de topo prioritário na vitrine médica oficial.
3. 🤖 *Prioridade na Triagem IA (Enfª Brisa):* Roteamento de pacientes pré-triados diretamente para o seu agendamento.
4. 📋 *Prontuário Eletrônico Inteligente:* Histórico longitudinal, anamnese digital e armazenamento seguro CFM/LGPD.
5. 🧠 *Copiloto Clínico VIP de Consultas (IA):* Inteligência de apoio à decisão clínica treinada nas diretrizes ANVISA (RDC 660 e 327), literatura endocanabinoide e interações medicamentosas.
6. 🎥 *Telemedicina HD Integrada:* Sala criptografada de videochamada sem limite de tempo com chat integrado.

Para acessar seu Consultório Virtual completo com o Copiloto IA e Prontuário, acesse agora:
👉 https://plantayraiz.com.br/consultorio

Conte sempre conosco para alavancar a sua prática clínica com tecnologia e humanização!

Enfª Brisa | Gestão & Relacionamento Médico
🌿 Planta y Raíz — Democratizando a Medicina e Cuidado Canabinoide`;

        if (options.sendWhatsApp) {
          console.log(`  -> Enviando Boas-Vindas VIP para: ${doc.phone}`);
          const res = await sendWhatsAppMessage(doc.phone, welcomeMsg);
          console.log(`  -> Resposta Evolution:`, res?.status || res?.error);
        }
        docState.welcomeSent = true;
        docState.welcomeSentAt = now.toISOString();
      }

      // 2. Aviso no Celular do Dr. Edilson (Admin)
      if (!docState.adminNotified) {
        const adminMsg = `👑 *MÉDICO VIP RECONHECIDO NO SISTEMA!*
Nome: ${doc.name}
CRM: ${doc.crm}
WhatsApp: ${doc.phone}
Plano: VIP Prescritor (R$ 99/mês)
Privilégios liberados: Taxa 0%, Vitrine Topo, Prontuário Eletrônico e Copiloto Clínico VIP.`;

        if (options.sendWhatsApp && ADMIN_PHONE) {
          console.log(`  -> Notificando Dr. Edilson (Admin): ${ADMIN_PHONE}`);
          const res = await sendWhatsAppMessage(ADMIN_PHONE, adminMsg);
          console.log(`  -> Resposta Evolution:`, res?.status || res?.error);
        }
        docState.adminNotified = true;
        docState.adminNotifiedAt = now.toISOString();
      }
    }

    state.doctors[doc.id] = docState;
    results.push({ doctor: doc.name, crm: doc.crm, active: docState.active, welcomeSent: docState.welcomeSent, adminNotified: docState.adminNotified });
  }

  saveState(state);
  console.log('\n=== RESULTADO FINAL ===');
  console.table(results);
  return { ok: true, results };
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('agent_doctor_vip_lifecycle.mjs')) {
  const shouldSend = process.argv.includes('--send');
  processVipDoctorLifecycle({ sendWhatsApp: shouldSend }).catch(console.error);
}
