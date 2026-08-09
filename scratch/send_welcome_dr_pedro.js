import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'contato@plantayraiz.com.br',
    pass: '95654045Pa#'
  }
});

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bem-vindo à Planta y Raíz, Dr. João Pedro!</title>
</head>
<body style="margin:0; padding:0; background-color:#0d1117; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e6edf3;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #161b22; border-radius: 16px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    
    <div style="background: linear-gradient(135deg, #1f6feb 0%, #238636 100%); padding: 35px 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800;">🌿 Seja Bem-vindo à Planta y Raíz!</h1>
      <p style="color: #e6edf3; font-size: 15px; margin-top: 8px; opacity: 0.9;">Plataforma Médica Digital & Rede Integrada de Telemedicina</p>
    </div>

    <div style="padding: 30px;">
      <h2 style="color: #3fb950; font-size: 20px; margin-top: 0;">Olá, Dr. João Pedro! 👋</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #c9d1d9;">
        É uma grande satisfação dar-lhe as boas-vindas à equipe de especialistas da <strong>Planta y Raíz Ltda</strong>. Seu cadastro foi concluído e seu Card Médico Oficial já está publicado e ativo!
      </p>

      <div style="background-color: #0d1117; border-left: 4px solid #2ea043; padding: 18px; border-radius: 10px; margin: 25px 0;">
        <h3 style="color: #2ea043; margin-top: 0; font-size: 16px;">✅ Status do Cadastro & Atendimento:</h3>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Card Profissional:</strong> Publicado em <a href="https://plantayraiz.com.br/profissionais" style="color: #58a6ff; text-decoration: none;">plantayraiz.com.br/profissionais</a></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Consultório Virtual:</strong> <a href="https://plantayraiz.com.br/consultorio" style="color: #58a6ff; text-decoration: none;">plantayraiz.com.br/consultorio</a></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>WhatsApp Cadastrado:</strong> +55 54 9364-6065</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Especialidade:</strong> Médicos Prescritores — Medicina Canabinoide & Clínica Geral</p>
      </div>

      <h3 style="color: #e6edf3; font-size: 17px; margin-top: 25px;">🚀 O Que Você Pode Fazer Agora no Seu Consultório Virtual:</h3>
      <ul style="padding-left: 20px; font-size: 14px; color: #8b949e; line-height: 1.8;">
        <li><strong style="color: #c9d1d9;">🎭 Paciente Teste IA (Simulação 360°):</strong> Pratique atendimentos, anamnese e prescrição simulada.</li>
        <li><strong style="color: #c9d1d9;">🧠 Copiloto IA (Decisão Clínica):</strong> Consulte dosagens, evidências científicas e interações farmacológicas.</li>
        <li><strong style="color: #c9d1d9;">📹 Atendimento HD & Telemed WhatsApp:</strong> Atenda pacientes em vídeo ou chat direto com histórico unificado.</li>
        <li><strong style="color: #c9d1d9;">🏆 Ranking & PlantaCoins:</strong> Ganhe recompensas conforme realiza atendimentos e indicações.</li>
      </ul>

      <div style="text-align: center; margin-top: 35px; margin-bottom: 20px;">
        <a href="https://plantayraiz.com.br/consultorio" style="background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(46, 160, 67, 0.4);">
          🚀 Entrar no Meu Consultório Virtual
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #30363d; margin: 30px 0 20px 0;" />
      
      <p style="font-size: 12px; color: #8b949e; text-align: center; margin: 0;">
        Planta y Raíz Ltda — Diretoria Técnica & Suporte Médico<br/>
        Suporte com Enfª Brisa: +55 11 99136-3154 | contato@plantayraiz.com.br
      </p>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  console.log('Sending Welcome Email to Dr. João Pedro...');
  try {
    const info = await transporter.sendMail({
      from: '"Enfª Brisa | Planta y Raíz" <contato@plantayraiz.com.br>',
      to: 'contato@plantayraiz.com.br',
      subject: '🌿 Seja Bem-vindo à Planta y Raíz, Dr. João Pedro! — Seu Consultório Virtual Está Pronto',
      html: htmlContent
    });
    console.log('✅ Welcome Email Sent Successfully! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending Welcome Email:', err);
  }
}

main();
