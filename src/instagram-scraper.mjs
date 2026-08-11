import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Hashtags alvo para médicos na América Latina/Brasil
const TARGET_HASHTAGS = [
  'medicinacanabinoide',
  'medicinaintegrativa',
  'psiquiatria',
  'neurologia',
  'endocrinologia'
];

/**
 * Função para extrair números de telefone de um texto (bio)
 * Focado em números do Brasil (55) com formatações variadas
 */
function extractPhone(bio) {
  if (!bio) return null;
  
  // Remove caracteres que não são números, exceto o + inicial
  const cleanBio = bio.replace(/[^0-9+]/g, ' ');
  
  // Expressão regular básica para capturar sequências numéricas que parecem telefone
  // Exemplo: 5511999999999
  const phoneRegex = /(?:55|0)?\s?[1-9]{2}\s?9?\s?[0-9]{4}\s?[0-9]{4}/g;
  const matches = cleanBio.match(phoneRegex);
  
  if (matches && matches.length > 0) {
    let number = matches[0].replace(/\s/g, '');
    // Adiciona 55 se não tiver
    if (number.length === 11 || number.length === 10) {
      number = '55' + number;
    }
    return number;
  }
  return null;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function scrapeInstagramLeads() {
  console.log('[Scraper] Iniciando captação de leads no Instagram...');
  
  const browser = await puppeteer.launch({
    headless: 'new', // Use 'new' para o novo modo headless
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  
  let newLeadsCount = 0;
  
  try {
    // Escolhe uma hashtag aleatória
    const hashtag = TARGET_HASHTAGS[Math.floor(Math.random() * TARGET_HASHTAGS.length)];
    console.log(`[Scraper] Buscando pela hashtag: #${hashtag}`);
    
    // NOTA: Navegar diretamente para hashtags requer login na maioria das vezes hoje em dia.
    // Esta é uma versão simplificada de demonstração.
    await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, { waitUntil: 'networkidle2' });
    
    // Aguarda um pouco e faz scroll para carregar posts
    await sleep(3000);
    
    // Lógica simplificada de extração (em um cenário real, precisaríamos de login e proxies rotativos)
    // Vamos simular a coleta para evitar bloqueios reais durante o teste do orquestrador
    console.log('[Scraper] Coleta simulada devido a restrições de bloqueio sem proxy/sessão autenticada.');
    
    // Exemplo de um lead coletado
    // const sampleLead = { name: 'Dr. João Exemplo', phone: '5511999999999', source: 'instagram' };
    // const { error } = await supabase.from('leads_crm').upsert(sampleLead, { onConflict: 'phone' });
    
    console.log(`[Scraper] Operação finalizada. (Para uso real, insira suas credenciais do Instagram e sistema de proxies)`);
  } catch (error) {
    console.error('[Scraper] Erro durante a captação:', error);
  } finally {
    await browser.close();
  }
  
  return newLeadsCount;
}

// Executar isoladamente se chamado via CLI
if (process.argv[1] === new URL(import.meta.url).pathname) {
  scrapeInstagramLeads().then(() => process.exit(0));
}
