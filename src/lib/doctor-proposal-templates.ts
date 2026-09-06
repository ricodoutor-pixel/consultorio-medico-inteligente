import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'contato@plantayraiz.com.br';
const SMTP_PASS = process.env.SMTP_PASS || '95654045Pa#';

export const DOCTOR_FORMAL_PROPOSAL_HTML = (doctorName = 'Doutor(a)') => {
  const firstName = doctorName.replace(/^(Dr\.|Dra\.|Dr|Dra)\s*/i, '').split(' ')[0] || 'Doutor(a)';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planta y Raíz — Proposta de Parceria Médica</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; }
    .wrapper { max-width: 680px; margin: 20px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; font-weight: 700; opacity: 0.95; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 32px 28px; }
    .salutation { font-size: 17px; font-weight: 700; color: #34d399; margin-bottom: 16px; }
    .lead { font-size: 15px; color: #cbd5e1; margin-bottom: 24px; }
    .highlight-box { background: rgba(5, 150, 105, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .highlight-box h3 { margin: 0 0 12px 0; color: #34d399; font-size: 16px; font-weight: 800; display: flex; items-center; }
    .table-card { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; border-radius: 10px; overflow: hidden; }
    .table-card th { background-color: #0f172a; color: #94a3b8; padding: 12px; text-align: left; font-weight: 700; border-bottom: 2px solid #334155; }
    .table-card td { padding: 12px; border-bottom: 1px solid #334155; color: #e2e8f0; }
    .badge-win { background-color: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 800; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.4); display: inline-block; }
    .badge-lose { color: #f87171; font-weight: 600; }
    .btn-container { text-align: center; margin: 32px 0 20px 0; }
    .btn-cta { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff !important; font-size: 16px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 12px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }
    .direct-link { font-size: 12px; color: #94a3b8; text-align: center; word-break: break-all; margin-top: 10px; }
    .direct-link a { color: #34d399; text-decoration: underline; }
    .footer { background-color: #0f172a; padding: 24px 28px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>PLANTA Y RAÍZ LTDA</h1>
      <p>Mega Clínica Digital · Telemedicina Canabinoide</p>
    </div>

    <div class="content">
      <p class="salutation">Prezado(a) Dr(a). ${firstName},</p>
      
      <p class="lead">
        Agradecemos pelo seu contato e interesse em fazer parte do corpo clínico da <strong>Planta y Raíz</strong>. 
        Nossa plataforma foi concebida sob rigorosa supervisão médica para proporcionar <strong>total autonomia clínica, remuneração justa e ferramentas de ponta</strong> na prescrição de cannabis medicinal e medicina integrativa.
      </p>

      <div class="highlight-box">
        <h3>🏆 Por Que Escolher a Planta y Raíz? (Comparativo Direto)</h3>
        <table class="table-card">
          <thead>
            <tr>
              <th>Diferencial</th>
              <th>Mercado Tradicional</th>
              <th>Planta y Raíz</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Repasse Líquido</strong></td>
              <td><span class="badge-lose">60% a 80%</span></td>
              <td><span class="badge-win">93% DA CONSULTA É SEU (Taxa de apenas 7%)</span></td>
            </tr>
            <tr>
              <td><strong>Prazo de Recebimento</strong></td>
              <td><span class="badge-lose">30 a 60 dias</span></td>
              <td><span class="badge-win">PIX Instantâneo D+0 na sua conta</span></td>
            </tr>
            <tr>
              <td><strong>Valor da Consulta</strong></td>
              <td>Tabelamento fixo</td>
              <td><strong>Você define 100% livremente</strong></td>
            </tr>
            <tr>
              <td><strong>Custo de Adesão / Mensalidade</strong></td>
              <td>Taxas mensais</td>
              <td><span class="badge-win">100% GRATUITO</span></td>
            </tr>
            <tr>
              <td><strong>Prescrição & Receituário</strong></td>
              <td>Sistemas complexos</td>
              <td><strong>Certificação Digital ICP-Brasil / ANVISA RDC 660</strong></td>
            </tr>
            <tr>
              <td><strong>Programa de Indicação</strong></td>
              <td>Inexistente</td>
              <td><strong>Comissionamento Perpétuo em 3 Gerações</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style="color: #34d399; font-size: 16px; margin-top: 24px;">🚀 Infraestrutura Exclusiva do Seu Consultório Virtual:</h3>
      <ul style="padding-left: 20px; color: #cbd5e1; font-size: 14px;">
        <li style="margin-bottom: 8px;"><strong>Acolhimento Inteligente:</strong> A Enfermeira Brisa IA realiza a pré-triagem do paciente, organizando queixas, sintomas e exames antes da consulta.</li>
        <li style="margin-bottom: 8px;"><strong>Teleconsulta HD Criptografada:</strong> Sala WebRTC com prontuário eletrônico CFM integrado em tela única.</li>
        <li style="margin-bottom: 8px;"><strong>Assistência Farmacêutica Garantida:</strong> Nossa Farmácia Oficial e Dispensário ANVISA cuidam do suporte e entrega dos fitocanabinoides ao paciente, assegurando adesão terapêutica contínua.</li>
        <li style="margin-bottom: 8px;"><strong>Blindagem Jurídica:</strong> Total conformidade com as Resoluções CFM 2.314/2022, ANVISA RDC 660/2022 e LGPD.</li>
      </ul>

      <div class="btn-container">
        <a href="https://plantayraiz.com.br/cadastro-profissional" class="btn-cta" target="_blank" rel="noopener noreferrer">
          👉 Finalizar Cadastro de Médico Prescritor
        </a>
        <div class="direct-link">
          Se o botão não responder, copie e cole o link direto em seu navegador:<br>
          <a href="https://plantayraiz.com.br/cadastro-profissional" target="_blank">https://plantayraiz.com.br/cadastro-profissional</a>
        </div>
      </div>

      <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">
        Dúvidas ou suporte imediato? Nosso time médico e a Enfª Brisa estão à sua disposição no WhatsApp:<br>
        <strong style="color: #34d399;">📱 (11) 99136-3154</strong> (Atendimento 24/7)
      </p>
    </div>

    <div class="footer">
      <p><strong>Planta y Raíz Ltda</strong> · CNPJ: 30.740.319/0001-14</p>
      <p>Supervisão Técnica Médica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)</p>
      <p>Diretoria Clínica: Dr. Edilson Bezerra da Silva</p>
      <p>São Paulo / PR · Brasil · <a href="https://plantayraiz.com.br" style="color: #34d399;">plantayraiz.com.br</a></p>
    </div>
  </div>
</body>
</html>`;
};

export const DOCTOR_FORMAL_PROPOSAL_TEXT = (doctorName = 'Doutor(a)') => {
  return `Olá Dr(a). ${doctorName}! 🌿

Sou a Enfermeira Brisa, consultora clínica da Planta y Raíz (Mega Clínica Digital de Telemedicina Canabinoide).

Gostaríamos de apresentar as vantagens exclusivas de atuar como Médico(a) Sócio(a) Prescritor(a) em nossa plataforma:

🏆 DIFERENCIAIS PLANTA Y RAÍZ:
1. 💰 REPASSE DE 93% LÍQUIDO: A menor taxa de intermediação do Brasil (apenas 7% da consulta).
2. ⚡ PAGAMENTO INSTANTÂNEO VIA PIX: Recebimento D+0 direto na sua conta bancária após o atendimento.
3. 🎯 TOTAL AUTONOMIA DE VALORES E AGENDA: Você define livremente o valor dos seus honorários e a duração das consultas.
4. 🩺 CONSULTÓRIO VIRTUAL COMPLETO: Prontuário eletrônico CFM, Telemedicina WebRTC HD e prescrição digital com assinatura ICP-Brasil / ANVISA RDC 660.
5. 🤝 PROGRAMA DE INDICAÇÃO: Ganhe comissões recorrentes por novos pacientes e médicos indicados à rede.
6. 🆓 CADASTRO 100% GRATUITO: Sem mensalidades ou taxas de adesão.

👉 ACESSE O LINK DIRETO PARA CONCLUIR SEU CADASTRO EM 2 MINUTOS:
🔗 https://plantayraiz.com.br/cadastro-profissional

(Caso prefira, acesse também pela nossa página principal: https://plantayraiz.com.br)

Qualquer dúvida, estou à disposição 24/7 aqui pelo WhatsApp ou pelo e-mail contato@plantayraiz.com.br!

Atenciosamente,
Enfª Brisa | Diretoria Médica Planta y Raíz Ltda
Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)
Diretor Clínico: Dr. Edilson Bezerra da Silva
📱 WhatsApp Oficial: (11) 99136-3154`;
};
