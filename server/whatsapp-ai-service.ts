/**
 * 🏢 Planta y Raiz - Mega Clínica Digital
 * 🚀 Manus CEO: Cérebro de IA para WhatsApp
 */

export const processWhatsAppAI = async (message: string) => {
  const prompt = `
    Você é o assistente virtual oficial da Planta y Raiz - Mega Clínica Digital.
    Sua missão é ajudar pacientes com:
    1. Triagem para cannabis medicinal.
    2. Agendamento de consultas com o Dr. Edilson Bezerra e equipe.
    3. Dúvidas sobre o Shopping de bem-estar.
    
    Mensagem do Paciente: "${message}"
    
    Responda de forma profissional, acolhedora e eficiente. 
    Se o paciente quiser agendar, peça o nome completo e o objetivo da consulta.
  `;

  // Simulação de chamada de IA
  // Em produção, aqui integraríamos com OpenAI/Gemini
  return "Olá! Sou o assistente da Planta y Raiz. Como posso ajudar na sua jornada de saúde hoje?";
};
