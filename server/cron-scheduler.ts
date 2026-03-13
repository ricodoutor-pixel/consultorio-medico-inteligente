/**
 * 🏢 Planta y Raiz - Mega Clínica Digital
 * 🚀 Manus CEO: Agendador de Tarefas Críticas (Cron Jobs)
 * 📅 Execução: Todo dia 1º de cada mês às 00:01h
 */

import cron from 'node-cron';
import { generateMonthlyReportData, createInvestorPDF } from './investor-report-generator';

console.log("🕒 [Manus CEO] Agendador de Relatórios Mensais Ativado...");

// Cron: Seg Min Hora Dia Mes DiaDaSemana
// 0 1 0 1 * * -> Todo dia 1º de cada mês à 00:01h
cron.schedule('0 1 0 1 * *', async () => {
  console.log("🚀 [Manus CEO] Iniciando geração de relatório mensal agendado...");
  
  try {
    const data = await generateMonthlyReportData();
    const markdown = await createInvestorPDF(data);
    
    // Lógica para enviar por E-mail e WhatsApp para investidores
    // (Integrar com SendGrid/Twilio aqui)
    
    console.log(`✅ [Manus CEO] Relatório de ${data.month} enviado com sucesso!`);
  } catch (error) {
    console.error("❌ [Manus CEO] Erro ao gerar relatório agendado:", error);
  }
});
