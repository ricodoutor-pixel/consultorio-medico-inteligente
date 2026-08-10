/**
 * 🌿 Planta y Raíz — Instagram Scraper Autônomo
 * Script: instagram-scraper.mjs
 *
 * Busca 100 médicos prescritores por dia usando hashtags relevantes
 * no Instagram e salva os leads no Supabase CRM.
 *
 * Uso: node scripts/crm/02_instagram-scraper.mjs
 * Com PM2: pm2 start scripts/crm/02_instagram-scraper.mjs --cron "0 9 * * *"
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIG ────────────────────────────────────────────────
const SUPABASE_URL = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';
const LEADS_PER_DAY = 100;
const DELAY_BETWEEN_PROFILES_MS = 3000; // 3 segundos entre perfis

// Hashtags para buscar médicos prescritores no Brasil e América Latina
const HASHTAGS = [
  'medicinacanabinoide',
  'medicocanabidiol',
  'cannabismedicinal',
  'medicinaintegrativa',
  'medicointegral',
  'psiquiatriabrasileira',
  'neurologiabrasileira',
  'medicobrasileiro',
  'dorescronica',
  'epilepsiabrasil',
  'ansiedadebrasileira',
  'prescritorcannabis',
  'medicinacanabinoidebr',
  'cbdmedico',
  'endocannabinoidesistema',
  'medicinaamazonica',
  'plantamedicinal',
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── FUNÇÕES AUXILIARES ────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 1500, max = 4000) {
  return sleep(Math.floor(Math.random() * (max - min) + min));
}

/**
 * Extrai número de telefone do WhatsApp de texto da bio do Instagram
 */
function extractPhone(text) {
  if (!text) return null;

  // WhatsApp link
  const waMatch = text.match(/wa\.me\/(\d{10,15})/i)
    || text.match(/whatsapp\.com\/send\?phone=(\d{10,15})/i);
  if (waMatch) return waMatch[1];

  // Número brasileiro com DDI
  const brMatch = text.match(/(?:\+55|55)?[\s.-]?\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/g);
  if (brMatch) {
    const cleaned = brMatch[0].replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    }
  }

  return null;
}

/**
 * Identifica o estado do médico pelo texto da bio
 */
function extractState(text) {
  if (!text) return null;
  const states = {
    'SP': ['são paulo', 'sp', 'sampa'], 'RJ': ['rio de janeiro', 'rj'],
    'MG': ['minas gerais', 'mg', 'belo horizonte', 'bhz'],
    'RS': ['rio grande do sul', 'rs', 'porto alegre'],
    'PR': ['paraná', 'pr', 'curitiba'], 'SC': ['santa catarina', 'sc', 'florianópolis'],
    'BA': ['bahia', 'ba', 'salvador'], 'CE': ['ceará', 'ce', 'fortaleza'],
    'PE': ['pernambuco', 'pe', 'recife'], 'GO': ['goiás', 'go', 'goiânia'],
    'DF': ['brasília', 'df', 'distrito federal'], 'AM': ['amazonas', 'am', 'manaus'],
    'PA': ['pará', 'pa', 'belém'], 'MT': ['mato grosso', 'mt'],
    'MS': ['mato grosso do sul', 'ms'], 'ES': ['espírito santo', 'es', 'vitória'],
    'RN': ['rio grande do norte', 'rn', 'natal'], 'PB': ['paraíba', 'pb', 'joão pessoa'],
    'AL': ['alagoas', 'al', 'maceió'], 'PI': ['piauí', 'pi', 'teresina'],
    'MA': ['maranhão', 'ma', 'são luís'], 'SE': ['sergipe', 'se', 'aracaju'],
    'TO': ['tocantins', 'to', 'palmas'], 'RO': ['rondônia', 'ro', 'porto velho'],
    'AC': ['acre', 'ac', 'rio branco'], 'AP': ['amapá', 'ap', 'macapá'],
    'RR': ['roraima', 'rr', 'boa vista'],
    // América Latina
    'COL': ['colombia', 'bogotá', 'medellin'],
    'ARG': ['argentina', 'buenos aires'],
    'MEX': ['mexico', 'ciudad de mexico'],
    'PER': ['peru', 'lima'],
    'CHI': ['chile', 'santiago'],
  };
  const lower = text.toLowerCase();
  for (const [code, keywords] of Object.entries(states)) {
    if (keywords.some(k => lower.includes(k))) return code;
  }
  return null;
}

/**
 * Identifica a especialidade pelo texto da bio
 */
function extractSpecialty(text) {
  if (!text) return 'Médico';
  const lower = text.toLowerCase();
  if (lower.includes('psiquiatr')) return 'Psiquiatria';
  if (lower.includes('neurolog')) return 'Neurologia';
  if (lower.includes('oncolog')) return 'Oncologia';
  if (lower.includes('pediatr')) return 'Pediatria';
  if (lower.includes('ginecolog') || lower.includes('obstet')) return 'Ginecologia';
  if (lower.includes('ortoped')) return 'Ortopedia';
  if (lower.includes('dermatolog')) return 'Dermatologia';
  if (lower.includes('cardiol')) return 'Cardiologia';
  if (lower.includes('endocrinolog')) return 'Endocrinologia';
  if (lower.includes('reumatolog')) return 'Reumatologia';
  if (lower.includes('clínico geral') || lower.includes('clinica geral')) return 'Clínica Geral';
  if (lower.includes('dor') || lower.includes('pain')) return 'Medicina da Dor';
  if (lower.includes('canabin') || lower.includes('cannabis') || lower.includes('cbd')) return 'Medicina Canabinoide';
  return 'Medicina Geral';
}

// ── SCRAPER PRINCIPAL ────────────────────────────────────

async function scrapeInstagramHashtag(browser, hashtag, limit = 20) {
  const page = await browser.newPage();
  const results = [];

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    );

    console.log(`   🔎 Buscando hashtag #${hashtag}...`);
    await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await randomDelay(2000, 4000);

    // Coletar links de posts
    const postLinks = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href*="/p/"]');
      return Array.from(new Set(Array.from(anchors).map(a => a.href))).slice(0, 30);
    });

    console.log(`      📸 ${postLinks.length} posts encontrados`);

    // Visitar perfis dos autores
    const visitedProfiles = new Set();
    for (const postUrl of postLinks.slice(0, limit)) {
      if (results.length >= limit) break;

      try {
        await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await randomDelay(1500, 3000);

        // Extrair link do perfil do autor
        const profileUrl = await page.evaluate(() => {
          const profileLink = document.querySelector('a[href^="/"][class*="notranslate"]')
            || document.querySelector('header a[href^="/"]');
          return profileLink ? `https://www.instagram.com${profileLink.getAttribute('href')}` : null;
        });

        if (!profileUrl || visitedProfiles.has(profileUrl)) continue;
        visitedProfiles.add(profileUrl);

        // Visitar perfil
        await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await randomDelay(2000, 3500);

        const profileData = await page.evaluate(() => {
          const nameEl = document.querySelector('h2, h1, [class*="fullName"]');
          const bioEl = document.querySelector('[class*="biography"], [data-testid="user-bio"]');
          const metaDesc = document.querySelector('meta[name="description"]');

          let bio = bioEl?.innerText || '';
          if (!bio && metaDesc) {
            bio = metaDesc.getAttribute('content') || '';
          }
          return {
            name: nameEl?.innerText?.trim() || '',
            bio: bio.trim(),
            url: window.location.href,
          };
        });

        // Filtrar apenas médicos (bio deve conter CRM, médico, doutor, Dr., etc.)
        const bioLower = profileData.bio.toLowerCase();
        const isMedic = bioLower.includes('crm') || bioLower.includes('médico')
          || bioLower.includes('medico') || bioLower.includes('doutor')
          || bioLower.includes('dr.') || bioLower.includes('dra.')
          || bioLower.includes('médica') || bioLower.includes('psiquiatra')
          || bioLower.includes('neurologista') || bioLower.includes('oncologista');

        if (!isMedic) continue;

        const phone = extractPhone(profileData.bio);

        results.push({
          name: profileData.name,
          phone: phone,
          bio: profileData.bio,
          instagram_url: profileUrl,
          state: extractState(profileData.bio),
          specialty: extractSpecialty(profileData.bio),
          source: 'instagram',
          hashtag: `#${hashtag}`,
        });

        console.log(`      ✅ Médico: ${profileData.name} | Tel: ${phone || 'não encontrado'}`);

      } catch (err) {
        // Pula post com erro
      }
    }
  } catch (err) {
    console.error(`   ⚠️  Erro na hashtag #${hashtag}:`, err.message);
  } finally {
    await page.close();
  }

  return results;
}

/**
 * Salva leads no Supabase, evitando duplicatas
 */
async function saveLeadsToSupabase(leads) {
  let saved = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (!lead.phone) {
      // Sem telefone: salva mesmo assim para enriquecimento futuro
      const { error } = await supabase.from('leads_crm').upsert({
        name: lead.name || 'Nome não identificado',
        phone: `nophone_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        instagram_url: lead.instagram_url,
        state: lead.state,
        specialty: lead.specialty,
        source: lead.source,
        status: 'scraped',
        notes: `Bio: ${lead.bio?.substring(0, 200)}`,
      }, { onConflict: 'phone', ignoreDuplicates: true });
      if (!error) saved++;
      continue;
    }

    const { error } = await supabase.from('leads_crm').upsert({
      name: lead.name || 'Médico Instagram',
      phone: lead.phone,
      instagram_url: lead.instagram_url,
      state: lead.state,
      country: lead.state && ['COL', 'ARG', 'MEX', 'PER', 'CHI'].includes(lead.state) ? lead.state : 'BR',
      specialty: lead.specialty,
      source: 'instagram',
      status: 'scraped',
      notes: `Hashtag: ${lead.hashtag} | Bio: ${lead.bio?.substring(0, 200)}`,
    }, { onConflict: 'phone', ignoreDuplicates: true });

    if (error && error.code !== '23505') {
      console.error('Erro ao salvar lead:', error.message);
    } else {
      saved++;
    }
  }

  return { saved, skipped };
}

/**
 * Importar a lista existente dos 438 médicos já contatados
 */
async function importExistingCampaign() {
  const campaignPath = path.join(__dirname, '../../scratch/campaign_data.json');
  if (!fs.existsSync(campaignPath)) return;

  const data = JSON.parse(fs.readFileSync(campaignPath, 'utf8'));
  const phones = data.phones || [];

  console.log(`\n📥 Importando ${phones.length} médicos da campanha existente...`);

  const progressPath = path.join(__dirname, '../../scratch/campaign_progress.json');
  const progress = fs.existsSync(progressPath)
    ? JSON.parse(fs.readFileSync(progressPath, 'utf8'))
    : { sentNumbers: [] };

  const sentSet = new Set(progress.sentNumbers || []);

  for (const phone of phones) {
    const clean = phone.replace(/\D/g, '');
    const status = sentSet.has(clean) ? 'invited' : 'scraped';

    await supabase.from('leads_crm').upsert({
      phone: clean,
      name: 'Médico Prescritor',
      source: 'whatsapp_campaign',
      status,
      first_contact_at: status === 'invited' ? new Date().toISOString() : null,
      last_contact_at: status === 'invited' ? new Date().toISOString() : null,
    }, { onConflict: 'phone', ignoreDuplicates: true });
  }
  console.log(`   ✅ Importação concluída!`);
}

// ── ENTRY POINT ───────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('🌿 PLANTA Y RAÍZ — INSTAGRAM SCRAPER AUTÔNOMO');
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);
  console.log('='.repeat(60));

  // 1. Importar campanha existente primeiro
  await importExistingCampaign();

  // 2. Verificar quantos leads já temos
  const { count: existingCount } = await supabase
    .from('leads_crm')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📊 Leads já no CRM: ${existingCount}`);

  // 3. Abrir Puppeteer
  console.log('\n🚀 Iniciando Puppeteer Chrome...');
  const browser = await puppeteer.launch({
    headless: false,  // VISÍVEL na tela!
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  let allLeads = [];
  const hashtagsToUse = HASHTAGS.sort(() => Math.random() - 0.5).slice(0, 5);

  for (const hashtag of hashtagsToUse) {
    if (allLeads.length >= LEADS_PER_DAY) break;
    const remaining = LEADS_PER_DAY - allLeads.length;
    const leads = await scrapeInstagramHashtag(browser, hashtag, Math.ceil(remaining / hashtagsToUse.length));
    allLeads = allLeads.concat(leads);
    console.log(`\n   📊 Total coletado até agora: ${allLeads.length}/${LEADS_PER_DAY}`);
    await sleep(DELAY_BETWEEN_PROFILES_MS);
  }

  await browser.close();

  // 4. Salvar no Supabase
  console.log(`\n💾 Salvando ${allLeads.length} leads no Supabase CRM...`);
  const { saved } = await saveLeadsToSupabase(allLeads);
  console.log(`   ✅ ${saved} novos leads salvos!`);

  // 5. Relatório final
  const { count: newTotal } = await supabase
    .from('leads_crm')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log('📈 RELATÓRIO DO DIA');
  console.log(`   Leads capturados: ${allLeads.length}`);
  console.log(`   Novos salvos: ${saved}`);
  console.log(`   Total no CRM: ${newTotal}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('❌ Erro fatal no scraper:', err);
  process.exit(1);
});
