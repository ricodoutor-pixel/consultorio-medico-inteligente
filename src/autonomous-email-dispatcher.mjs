// 🌿 Planta y Raiz — Disparador Autônomo de E-mails de Convite para Médicos (Meta: 500)
// Utiliza SMTP Hostinger oficial com formatação HTML profissional, persistência e cadência segura

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const LEADS_FILE = path.resolve('./mined_doctor_leads_500.json');
const STATE_FILE = path.resolve('./email_sent_state.json');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true para 465 (SSL)
  auth: {
    user: process.env.SMTP_USER || 'contato@plantayraiz.com.br',
    pass: process.env.SMTP_PASS || '95654045Pa#'
  }
});

function loadLeads() {
  if (!fs.existsSync(LEADS_FILE)) {
    console.error('❌ Arquivo de leads não encontrado:', LEADS_FILE);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {}
  }
  return { sent: {}, total_sent: 0, started_at: new Date().toISOString() };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('[State] Erro ao salvar estado:', e.message);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildHtmlTemplate(doctorName) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; line-height: 1.6; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 8px 0 0 0; font-size: 15px; opacity: 0.9; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; font-weight: 600; color: #065f46; margin-bottom: 16px; }
    .table-box { margin: 25px 0; border: 1px solid #d1fae5; border-radius: 8px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #ecfdf5; color: #065f46; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #a7f3d0; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .highlight { background: #f0fdf4; font-weight: 600; color: #047857; }
    .card { background: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { background: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(5,150,105,0.3); }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 PLANTA Y RAÍZ</h1>
      <p>A Plataforma nº 1 de Telemedicina Canabinoide e Geral</p>
    </div>
    <div class="content">
      <div class="greeting">Prezado(a) ${doctorName},</div>
      
      <p>A medicina canabinoide no Brasil vive uma expansão sem precedentes. No entanto, sabemos que as plataformas tradicionais de telemedicina costumam impor taxas comissionais abusivas, repasses demorados e pouca autonomia para o profissional prescritor.</p>
      
      <p>É com grande honra que convidamos você para se tornar <strong>Médico Sócio Prescritor na Planta y Raíz</strong> — desenvolvida oficialmente para ser a melhor, mais justa e mais rentável plataforma de telemedicina do país.</p>

      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th>Diferencial</th>
              <th>Mercado Tradicional</th>
              <th>Planta y Raíz</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Taxa da Plataforma</strong></td>
              <td>20% a 40% por consulta</td>
              <td class="highlight">Apenas 7% (você retém 93%)</td>
            </tr>
            <tr>
              <td><strong>Repasse Financeiro</strong></td>
              <td>30 a 60 dias para receber</td>
              <td class="highlight">PIX Instantâneo pós-consulta</td>
            </tr>
            <tr>
              <td><strong>Preço da Consulta</strong></td>
              <td>Tabela fixa imposta</td>
              <td class="highlight">Total liberdade de precificação</td>
            </tr>
            <tr>
              <td><strong>Modelo de Parceria</strong></td>
              <td>Apenas prestador</td>
              <td class="highlight">Sócio Prescritor com bônus</td>
            </tr>
            <tr>
              <td><strong>Suporte Clínico</strong></td>
              <td>Prontuário genérico</td>
              <td class="highlight">Copiloto IA & Triagem Brisa</td>
            </tr>
            <tr>
              <td><strong>Custo de Adesão</strong></td>
              <td>Mensalidades</td>
              <td class="highlight">100% Gratuito</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <strong>🚀 Tecnologia de Ponta Integrada:</strong>
        <ul>
          <li><strong>Workspace Split-Pane:</strong> Sala de teleconsulta em HD criptografada lado a lado com o prontuário.</li>
          <li><strong>Prescritor Inteligente:</strong> Calculadora de titulação Drop-by-Drop e checagem de interações medicamentosas (CYP450).</li>
          <li><strong>Enfermeira Brisa IA:</strong> Triagem prévia automatizada para o paciente chegar preparado para o seu atendimento.</li>
        </ul>
      </div>

      <p style="text-align: center; font-style: italic; color: #4b5563;">
        "Não seja apenas mais um número em plataformas convencionais. Seja sócio de um ecossistema que valoriza o seu conhecimento e a sua liberdade clínica."
      </p>

      <div class="btn-container">
        <a href="https://plantayraiz.com.br" class="btn" target="_blank">GARANTIR MEU CADASTRO GRATUITO 👉</a>
      </div>

      <p>O cadastro é 100% gratuito e leva menos de 2 minutos. Comece a atender com total rentabilidade e independência.</p>

      <p style="margin-top: 30px;">
        Atenciosamente,<br>
        <strong>Dr. Edilson Bezerra & Diretoria Executiva</strong><br>
        <em>Planta y Raíz Ltda — Telemedicina Inteligente</em>
      </p>
    </div>
    <div class="footer">
      Planta y Raíz Ltda | Atendimento e Suporte Médico: contato@plantayraiz.com.br<br>
      Acesse: <a href="https://plantayraiz.com.br" style="color: #059669;">https://plantayraiz.com.br</a>
    </div>
  </div>
</body>
</html>
  `;
}

async function runEmailDispatcher() {
  console.log('================================================================');
  console.log('🌿 [Planta y Raiz] INICIANDO DISPARADOR OFICIAL DE E-MAILS (SMTP)');
  console.log(`📧 REMETENTE: ${process.env.SMTP_USER || 'contato@plantayraiz.com.br'}`);
  console.log('================================================================');

  // Verifica conexão SMTP
  try {
    await transporter.verify();
    console.log('✅ [SMTP] Conexão com Hostinger SMTP verificada com sucesso!');
  } catch (err) {
    console.error('❌ [SMTP] Falha na conexão SMTP:', err.message);
    process.exit(1);
  }

  const leads = loadLeads();
  const state = loadState();

  console.log(`[Queue] Total de médicos na base: ${leads.length}`);
  console.log(`[Queue] Já enviados anteriormente: ${Object.keys(state.sent).length}`);
  console.log(`[Queue] Cadência de segurança: 6 segundos entre e-mails`);

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const email = (lead.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      continue;
    }

    // Se já foi enviado com sucesso, pula
    if (state.sent[email] && state.sent[email].success) {
      continue;
    }

    const currentNum = Object.keys(state.sent).length + 1;
    console.log(`\n------------------------------------------------------------`);
    console.log(`[E-mail ${currentNum}/${leads.length}] Enviando para: ${lead.name} <${email}>`);
    console.log(`Especialidade: ${lead.specialty} | ${lead.city}/${lead.state}`);
    console.log(`Timestamp: ${new Date().toLocaleTimeString('pt-BR')}`);

    const mailOptions = {
      from: `"Dr. Edilson Bezerra | Planta y Raíz" <${process.env.SMTP_USER || 'contato@plantayraiz.com.br'}>`,
      to: `"${lead.name}" <${email}>`,
      subject: `Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz | A Revolução da Medicina Canabinoide`,
      html: buildHtmlTemplate(lead.name),
      text: `Prezado(a) ${lead.name},\n\nConvidamos você para se tornar Médico Sócio Prescritor na Planta y Raíz — a plataforma de telemedicina onde você retém 93% da consulta e recebe via PIX imediato.\n\nCadastre-se gratuitamente: https://plantayraiz.com.br\n\nAtenciosamente,\nDr. Edilson Bezerra & Diretoria Executiva\nPlanta y Raíz Ltda`
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [Sucesso] E-mail entregue com sucesso! (ID: ${info.messageId})`);
      state.sent[email] = {
        name: lead.name,
        phone: lead.phone,
        success: true,
        sent_at: new Date().toISOString(),
        message_id: info.messageId
      };
      state.total_sent = (state.total_sent || 0) + 1;
    } catch (err) {
      console.error(`❌ [Falha] Erro ao enviar para ${email}:`, err.message);
      state.sent[email] = {
        name: lead.name,
        phone: lead.phone,
        success: false,
        last_attempt_at: new Date().toISOString(),
        error: err.message
      };
    }

    saveState(state);

    // Pausa segura de 6 segundos entre envios para manter entregabilidade máxima
    await sleep(6000);
  }

  console.log('================================================================');
  console.log(`🎉 [CAMPANHA CONCLUÍDA] Todos os 500 e-mails de médicos foram processados!`);
  console.log(`📊 Total Entregues com Sucesso: ${state.total_sent}`);
  console.log('================================================================');
}

runEmailDispatcher().catch(err => {
  console.error('[FATAL ERROR no Disparador de E-mail]:', err);
});
