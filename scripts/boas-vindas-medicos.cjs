require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const WELCOME_TEMPLATE = (nome) => `Prezado(a) Dr(a). ${nome},

Seja muito bem-vindo(a) à Planta y Raíz! É uma imensa satisfação ter você conosco como nosso médico(a) sócio(a) prescritor(a). A plataforma foi projetada para eliminar sobrecargas administrativas, garantir segurança jurídica e valorizar o seu tempo clínico.

O Fluxo de Atendimento na Plataforma

Recepção Acolhedora: O paciente inicia o contato diretamente pelo WhatsApp com a Enfermeira Brisa, sendo recebido de forma humanizada e ágil.

Triagem Automatizada: Coletamos o histórico de saúde preliminar, queixas principais e exames prévios para que você receba o caso clínico já organizado antes da teleconsulta.

Pagamento Seguro: O processamento financeiro é transparente e pré-pago, garantindo a liquidação do valor antes do agendamento final.

Atendimento Clínico Completo: A teleconsulta ocorre em ambiente criptografado de alta estabilidade, integrado diretamente ao prontuário eletrônico e às ferramentas de emissão de receituários digitais.

Total Autonomia e Benefícios para Você

Liberdade de Honorários: Você define o valor da sua consulta de forma 100% autônoma, sem tabelamentos engessados.

Flexibilidade de Tempo: Sem consultas cronometradas ou pressão de agenda. Você determina o tempo necessário para uma escuta qualificada e um plano terapêutico individualizado.

Seu Link Exclusivo: Você conta com um link direto e personalizado de agendamento para divulgar em suas redes sociais e enviar para sua base de pacientes particulares.

Programa de Indicação: Nosso ecossistema bonifica a sua participação ativa na expansão da rede através do nosso plano de indicação de novos pacientes e colegas médicos.

Próximos Passos

Para explorar a plataforma e iniciar seus atendimentos, acesse o botão "Passo a Passo / Manual do Médico" diretamente no menu do seu Consultório Virtual. Lá você encontrará o guia detalhado sobre o uso da sala de vídeo, emissão de prescrições e suporte clínico.

Estamos prontos para caminhar juntos!

Atenciosamente,

Enfª Brisa | Marketing Médico & Suporte Clínico
📱 WhatsApp: (11) 99136-3154 (À disposição 24/7)
🌿 Planta y Raíz — Inovação, Autonomia e Cuidado Integral`;

async function run() {
  console.log("=> Buscando médicos cadastrados na plataforma...");
  
  // Buscar perfis
  const req = await fetch(`${SUPABASE_URL}/rest/v1/profiles?role=eq.doctor&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  const profiles = await req.json();
    
  if (!Array.isArray(profiles)) {
    console.error("Erro ao buscar médicos:", profiles);
    return;
  }
  
  console.log(`Encontrados ${profiles.length} médicos cadastrados.`);
  
  const results = [];

  for (const doc of profiles) {
    // 1. Enviar Email
    const nome = doc.full_name || "Médico";
    const emailStr = doc.email;
    const msg = WELCOME_TEMPLATE(nome);
    
    console.log(`\n---------------------------------`);
    console.log(`Processando: ${nome} (${emailStr})`);
    
    if (emailStr) {
      try {
        await transporter.sendMail({
          from: `"Planta y Raiz" <${process.env.SMTP_USER}>`,
          to: emailStr,
          subject: "Bem-vindo à Planta y Raíz - Instruções para Iniciar",
          text: msg
        });
        console.log(`✅ Email enviado com sucesso para ${emailStr}`);
      } catch (e) {
        console.error(`❌ Erro ao enviar email para ${emailStr}:`, e.message);
      }
    }
    
    // 2. Gerar link do WhatsApp
    let phone = doc.phone || doc.whatsapp_number;
    if (phone) {
      phone = phone.replace(/\\D/g, ''); // limpa tudo exceto números
      const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      results.push({ nome, phone, waLink });
      console.log(`📱 Link do WhatsApp gerado para: +${phone}`);
    } else {
      console.log(`⚠️ Médico não possui telefone cadastrado.`);
    }
  }
  
  console.log("\n\n========================================================");
  console.log("🔗 LINKS DE WHATSAPP PRONTOS PARA VOCÊ CLICAR E ENVIAR:");
  console.log("Instrução: Como o WhatsApp da Enf Brisa está pausado, clique nos links abaixo para abrir o WhatsApp Web/App e disparar a mensagem.");
  console.log("========================================================\n");
  
  let mdOut = "# Links do WhatsApp - Mensagens de Boas Vindas\n\n";
  results.forEach(r => {
    console.log(`➡️ ${r.nome} (+${r.phone}):`);
    console.log(`   ${r.waLink}\n`);
    mdOut += `* **${r.nome}** (+${r.phone}): [Clique aqui para Enviar no WhatsApp](${r.waLink})\n`;
  });
  
  fs.writeFileSync('whatsapp-links.md', mdOut);
  console.log("✔️ Lista completa de links salva em 'whatsapp-links.md'");
  console.log("Finalizado!");
}

run();
