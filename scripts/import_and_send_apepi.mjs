import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

const emailCopy = `Assunto: Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz | A Revolução da Medicina Canabinoide

Prezado(a) Doutor(a),

A medicina canabinoide no Brasil vive uma expansão sem precedentes. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.

É com grande honra que convidamos você para se tornar um Sócio Prescritor na Planta y Raíz, a plataforma mais inovadora, mais rentável e mais justa para os médicos de todo o planeta.

🏆 Planta y Raíz vs. Mercado Tradicional
Compilamos os nossos diferenciais para demonstrar por que a nossa plataforma é incomparável:

Diferenciais da Planta y Raíz:
✓ Repasse de 100% do Valor da Consulta: Não cobramos taxas ou comissões sobre o seu trabalho. Todo o valor da sua consulta é integralmente seu.
✓ Recebimento Imediato: Os valores caem na sua conta instantaneamente via Pix, sem esperas de D+14 ou D+30. O dinheiro é seu na hora.
✓ Autonomia Completa na Precificação: Você define o valor da sua própria consulta, mantendo o controle total sobre a sua rentabilidade.
✓ Zero Mensalidades para Médicos: Você tem acesso gratuito a uma plataforma robusta, com ferramentas de IA, CRM e marketing embutidas, sem pagar nenhuma taxa de assinatura.
✓ Gestão Tecnológica com IA: Prontuário eletrônico inteligente, prescrição integrada, resumo automático de consultas e uma "Enfermeira Virtual (IA)" que faz a triagem do paciente antes mesmo de ele chegar até você.
✓ Flexibilidade Total: Trabalhe quando, como e de onde quiser, utilizando o seu próprio painel administrativo exclusivo.

O Que o Mercado Tradicional Faz:
❌ Cobram de 20% a 50% de comissão sobre o valor da sua consulta.
❌ Repasses demorados, retendo o seu dinheiro por semanas ou até meses.
❌ Impõem tetos ou limites no valor da consulta, nivelando os profissionais por baixo.
❌ Cobram mensalidades caras apenas para usar o sistema, independente do seu volume de pacientes.
❌ Prontuários engessados, sistemas lentos e suporte demorado.
❌ Horários impostos e falta de liberdade para gerenciar a sua própria agenda.

🌱 Como Funciona a Planta y Raíz para o Paciente?
Para mantermos a plataforma 100% gratuita e com repasse integral para os médicos, operamos com um modelo transparente focado no paciente: o paciente paga o valor da consulta (definido por você) + uma taxa de serviço fixa de R$45,00 para a plataforma. É simples, justo e permite que você maximize os seus ganhos sem dividir os seus lucros.

🚀 Faça Parte da Revolução!
Convidamos você a conhecer o ecossistema Planta y Raíz e a experimentar uma nova era na telemedicina canabinoide, onde o médico é valorizado, remunerado de forma justa e equipado com o que há de mais avançado em tecnologia.

👉 Acesse agora o nosso portal exclusivo para médicos e cadastre-se: https://plantayraiz.com/convite-medico

Estamos à disposição para qualquer dúvida.

Atenciosamente,
Equipe de Relacionamento Médico
Planta y Raíz`;

async function addContactAndSend() {
  if (!BREVO_API_KEY) {
    console.error("ERRO: BREVO_API_KEY não configurada no ambiente.");
    return;
  }
  
  const rawData = fs.readFileSync('apepi_doctors_final.json', 'utf8');
  const doctors = JSON.parse(rawData);
  
  console.log(`Iniciando importação de ${doctors.length} médicos para a Brevo...`);
  
  let validEmails = 0;
  for (const doc of doctors) {
    if (!doc.email) continue;
    validEmails++;
    
    // Split name
    const parts = doc.nome.replace(/^Dr\.\s*|^Dra\.\s*/i, '').trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    const payload = {
      email: doc.email,
      attributes: {
        FIRSTNAME: firstName,
        LASTNAME: lastName,
        CRM: doc.crm || '',
        TELEFONE: doc.telefone || ''
      },
      listIds: [2], // Lista de contatos médicos
      updateEnabled: true,
    };

    try {
      // 1. Add contact
      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY.replace(/"/g, '').trim() },
        body: JSON.stringify(payload),
      });
      
      if (res.status === 201 || res.status === 204) {
        console.log(`[OK] Contato importado: ${doc.email}`);
      } else {
        const txt = await res.text();
        console.log(`[WARN] Erro ao importar ${doc.email}: ${txt}`);
      }
      
      // 2. Send email directly
      const emailPayload = {
        sender: { name: "Planta y Raíz", email: "contato@plantayraiz.com" },
        to: [{ email: doc.email, name: doc.nome }],
        subject: "Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz",
        htmlContent: emailCopy.replace(/\n/g, '<br/>'),
        tags: ["convite_apepi"]
      };
      
      const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY.replace(/"/g, '').trim() },
        body: JSON.stringify(emailPayload),
      });
      
      if (emailRes.status === 201) {
        console.log(`[ENVIADO] Email despachado para: ${doc.email}`);
      } else {
        console.log(`[FALHA] Email para ${doc.email} não enviado: ${await emailRes.text()}`);
      }
      
      // Delay to avoid rate limit (Brevo has limits on fast API calls)
      await new Promise(r => setTimeout(r, 400));
      
    } catch (e) {
      console.error(`Erro processando ${doc.email}:`, e.message);
    }
  }
  
  console.log(`Processo finalizado. ${validEmails} médicos com email processados.`);
}

addContactAndSend().catch(console.error);
