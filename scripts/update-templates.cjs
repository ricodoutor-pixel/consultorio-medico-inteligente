const fs = require('fs');
let content = fs.readFileSync('supabase/functions/send-welcome-email/index.ts', 'utf8');

const htmlDocTemplate = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">PLANTA Y RAÍZ LTDA</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; font-weight: bold;">MEGA CLÍNICA DIGITAL</p>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p>Prezado(a) <strong>Dr(a). \${name}</strong>,</p>
            <p>Seja muito bem-vindo(a) à Planta y Raíz! É uma imensa satisfação ter você conosco como nosso médico(a) sócio(a) prescritor(a). A plataforma foi projetada para eliminar sobrecargas administrativas, garantir segurança jurídica e valorizar o seu tempo clínico.</p>

            <h3 style="color: #059669;">O Fluxo de Atendimento na Plataforma</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Recepção Acolhedora:</strong> O paciente inicia o contato diretamente pelo WhatsApp com a Enfermeira Brisa, sendo recebido de forma humanizada e ágil.</li>
              <li><strong>Triagem Automatizada:</strong> Coletamos o histórico de saúde preliminar, queixas principais e exames prévios para que você receba o caso clínico já organizado antes da teleconsulta.</li>
              <li><strong>Pagamento Seguro:</strong> O processamento financeiro é transparente e pré-pago, garantindo a liquidação do valor antes do agendamento final.</li>
              <li><strong>Atendimento Clínico Completo:</strong> A teleconsulta ocorre em ambiente criptografado de alta estabilidade, integrado diretamente ao prontuário eletrônico e às ferramentas de emissão de receituários digitais.</li>
            </ul>

            <h3 style="color: #059669;">Total Autonomia e Benefícios para Você</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Liberdade de Honorários:</strong> Você define o valor da sua consulta de forma 100% autônoma, sem tabelamentos engessados.</li>
              <li><strong>Flexibilidade de Tempo:</strong> Sem consultas cronometradas ou pressão de agenda. Você determina o tempo necessário para uma escuta qualificada e um plano terapêutico individualizado.</li>
              <li><strong>Seu Link Exclusivo:</strong> Você conta com um link direto e personalizado de agendamento para divulgar em suas redes sociais e enviar para sua base de pacientes particulares.</li>
              <li><strong>Programa de Indicação:</strong> Nosso ecossistema bonifica a sua participação ativa na expansão da rede através do nosso plano de indicação de novos pacientes e colegas médicos.</li>
            </ul>

            <h3 style="color: #059669;">Próximos Passos</h3>
            <p>Para explorar a plataforma e iniciar seus atendimentos, acesse o botão "Passo a Passo / Manual do Médico" diretamente no menu do seu Consultório Virtual. Lá você encontrará o guia detalhado sobre o uso da sala de vídeo, emissão de prescrições e suporte clínico.</p>
            <p>Estamos prontos para caminhar juntos!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://plantayraiz.com.br/login" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">Acessar Meu Consultório Virtual</a>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #475569;">
            <p style="margin: 0;">Atenciosamente,<br><strong>Enfª Brisa | Marketing Médico & Suporte Clínico</strong><br>📱 WhatsApp: (11) 99136-3154 (À disposição 24/7)<br>🌿 Planta y Raíz — Inovação, Autonomia e Cuidado Integral</p>
          </div>
        </div>
`;

content = content.replace(/if \(isDoctor\) \{[\s\S]*?\} else \{/, 'if (isDoctor) {\n      htmlContent = `' + htmlDocTemplate + '`;\n    } else {');

fs.writeFileSync('supabase/functions/send-welcome-email/index.ts', content);
console.log('Template email atualizado!');

// UPDATE WHATSAPP FUNCTION TEXT
let waContent = fs.readFileSync('supabase/functions/send-doctor-welcome-whatsapp/index.ts', 'utf8');

const newWaText = `Prezado(a) Dr(a). \${fullName},

Seja muito bem-vindo(a) à Planta y Raíz! É uma imensa satisfação ter você conosco como nosso médico(a) sócio(a) prescritor(a). A plataforma foi projetada para eliminar sobrecargas administrativas, garantir segurança jurídica e valorizar o seu tempo clínico.

O Fluxo de Atendimento na Plataforma
• Recepção Acolhedora: O paciente inicia o contato diretamente pelo WhatsApp com a Enfermeira Brisa, sendo recebido de forma humanizada e ágil.
• Triagem Automatizada: Coletamos o histórico de saúde preliminar para que você receba o caso clínico já organizado antes da teleconsulta.
• Pagamento Seguro: O processamento financeiro é transparente e pré-pago.
• Atendimento Clínico Completo: A teleconsulta ocorre em ambiente criptografado, integrado ao prontuário eletrônico e às ferramentas de receituários digitais.

Total Autonomia e Benefícios para Você
• Liberdade de Honorários: Você define o valor da sua consulta de forma 100% autônoma.
• Flexibilidade de Tempo: Você determina o tempo necessário para uma escuta qualificada.
• Seu Link Exclusivo: Você conta com um link direto e personalizado de agendamento para divulgar em suas redes sociais.
• Programa de Indicação: Nosso ecossistema bonifica a sua participação ativa na expansão da rede.

Próximos Passos
Para explorar a plataforma e iniciar seus atendimentos, acesse o botão "Passo a Passo / Manual do Médico" diretamente no menu do seu Consultório Virtual.

Estamos prontos para caminhar juntos!
Enfª Brisa | Marketing Médico & Suporte Clínico
🌿 Planta y Raíz — Inovação, Autonomia e Cuidado Integral`;

waContent = waContent.replace(/const message = country[\s\S]*?Avisaremos por aqui assim que o Card Online for liberado!`;/, 'const message = `' + newWaText + '`;');

fs.writeFileSync('supabase/functions/send-doctor-welcome-whatsapp/index.ts', waContent);
console.log('Template whatsapp atualizado!');
