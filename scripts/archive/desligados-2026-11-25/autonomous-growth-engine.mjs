import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { scrapeInstagramLeads } from './instagram-scraper.mjs';
import { processOutboundMessages, startWebhookServer, processFollowUps } from './whatsapp-crm-engine.mjs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_DOCTORS_COUNT = 500;

async function checkTargetReached() {
  // Substitua 'doctors' pelo nome correto da sua tabela de médicos aprovados
  const { count, error } = await supabase
    .from('profiles') // Ajustado caso a tabela real seja profiles com role='medico'
    .select('*', { count: 'exact', head: true })
    .eq('role', 'doctor'); // Ajuste conforme sua modelagem

  if (error) {
    console.error('[Orchestrator] Erro ao checar meta:', error);
    return false;
  }
  
  // Usando um número fake caso a tabela doctors não exista exatamente assim no schema
  const currentCount = count || 0;
  console.log(`[Orchestrator] Progresso da Meta: ${currentCount} / ${TARGET_DOCTORS_COUNT} Médicos.`);
  
  return currentCount >= TARGET_DOCTORS_COUNT;
}

async function runEngineLoop() {
  console.log('==================================================');
  console.log('🚀 Iniciando Ciclo do Motor Autônomo de Growth...');
  console.log('==================================================');
  
  const targetReached = await checkTargetReached();
  
  if (targetReached) {
    console.log('🎉 META ALCANÇADA! 500+ Médicos ativos.');
    console.log('O motor entrará em modo Standby. Nenhuma nova prospecção será feita.');
    return;
  }
  
  try {
    // 1. Captação (Descomentar se estiver usando proxies seguros, senão a carga inicial supre)
    // await scrapeInstagramLeads();
    
    // 2. Disparo de Convites (processa leads 'scraped')
    await processOutboundMessages();
    
    // 3. Verifica e envia follow-ups
    await processFollowUps();
    
  } catch (error) {
    console.error('[Orchestrator] Erro no ciclo:', error);
  }
  
  console.log('[Orchestrator] Ciclo finalizado. Aguardando próximo agendamento...');
}

// Inicia o servidor para receber respostas da WAHA
startWebhookServer();

// Agenda o script para rodar a cada 30 minutos (ajuste conforme necessidade)
cron.schedule('*/30 * * * *', () => {
  runEngineLoop();
});

console.log('==================================================');
console.log('🤖 Motor de Automação Iniciado (PID:', process.pid, ')');
console.log('O servidor de webhook da Enfermeira Brisa está ouvindo...');
console.log('Cron job configurado para rodar a cada 30 minutos.');
console.log('Para forçar uma execução imediata, chamando runEngineLoop()...');
console.log('==================================================');

// Roda a primeira vez imediatamente
runEngineLoop();
