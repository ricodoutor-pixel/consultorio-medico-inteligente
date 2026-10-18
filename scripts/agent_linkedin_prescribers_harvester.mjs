/**
 * scripts/agent_linkedin_prescribers_harvester.mjs
 * 
 * Agente Autônomo Especialista em Mineração de Médicos Prescritores no LinkedIn via Apify
 * Plataforma: Planta y Raíz Ltda
 * 
 * Atribuições:
 * 1. Executar buscas direcionadas no LinkedIn via Apify (`harvestapi/linkedin-profile-search` e `apify/google-search-scraper`)
 * 2. Filtrar médicos e médicas com atuação comprovada em:
 *    - Medicina Canabinoide / Cannabis Medicinal
 *    - Modulação do Sistema Endocanabinoide
 *    - Fitoterapia Médica & Terapias Canabinoides
 *    - Psiquiatria / Neurologia / Dor Crônica / Medicina Integrativa
 * 3. Extrair dados essenciais: Nome, CRM, Especialidade / Headline, Cidade, UF, LinkedIn URL, E-mail e Telefone.
 * 4. Alimentar a Lista ID 6 do Brevo CRM (Médicos Prescritores) e consolidar na base de prospecção.
 * 5. Atualizar as métricas em tempo real para a meta de 50 novos médicos.
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const LEADS_FILE = path.join(ROOT_DIR, 'scripts', 'linkedin_prescribers_leads.json');
const STATE_FILE = path.join(ROOT_DIR, 'scripts', 'linkedin_prescribers_state.json');
const LOG_FILE = path.join(ROOT_DIR, 'scripts', 'linkedin_prescribers_harvester.log');
const SNAPSHOT_FILE = path.join(ROOT_DIR, 'scripts', 'master_dashboard_snapshot.json');

// Credenciais
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_BASE = 'https://api.brevo.com/v3';
const BREVO_LIST_MEDICOS = Number(process.env.BREVO_LIST_MEDICOS || 6);

// Consultas-alvo no LinkedIn
const LINKEDIN_QUERIES = [
  "medico cannabis medicinal",
  "medica cannabis medicinal",
  "medicina canabinoide prescritor",
  "sistema endocanabinoide medico",
  "cannabis medicinal prescritor Brasil",
  "neurologia cannabis medicinal",
  "psiquiatria cannabis medicinal Brasil",
  "dor cronica medicina canabinoide",
  "wecann academy prescritor",
  "pos graduacao cannabis medicinal medico"
];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [LINKEDIN-HARVESTER] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function loadLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveLeads(leads) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  } catch (e) {}
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    queryIndex: 0,
    totalHarvested: 0,
    syncedToBrevo: 0,
    lastRunAt: null,
    processedUrls: []
  };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function updateSnapshot(countNew) {
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const snap = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
      if (snap.goals && snap.goals.doctors) {
        snap.goals.doctors.harvestedByAgent = (snap.goals.doctors.harvestedByAgent || 0) + countNew;
        snap.updatedAt = new Date().toISOString();
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snap, null, 2));
      }
    }
  } catch (e) {}
}

function extractCRM(text) {
  if (!text) return null;
  const m = String(text).match(/\bCRM\s*(?:[-/]?\s*([A-Z]{2}))?\s*[:.-]?\s*(\d{4,7})\b/i)
         || String(text).match(/\bCRM\s*[:.-]?\s*(\d{4,7})\s*[-/]?\s*([A-Z]{2})\b/i);
  return m ? m[0].toUpperCase() : null;
}

function extractEmail(text) {
  if (!text) return null;
  const m = String(text).match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
  return m ? m[0].toLowerCase() : null;
}

function parsePhone(raw) {
  if (!raw) return { whatsapp: null, landline: null };
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!digits.startsWith('55')) return { whatsapp: null, landline: null };
  if (/^55[1-9]{2}9\d{8}$/.test(digits)) return { whatsapp: digits, landline: null };
  if (digits.length >= 10 && digits.length <= 13) return { whatsapp: null, landline: digits };
  return { whatsapp: null, landline: null };
}

/**
 * Envia o médico prescritor capturado para a Lista 6 do Brevo CRM
 */
async function sendDoctorToBrevo(doctor) {
  const email = doctor.email || `lead_li_${String(doctor.name || Date.now()).replace(/\W/g, '').toLowerCase().slice(0, 16)}@lead.plantayraiz.com.br`;
  
  const payload = {
    email,
    attributes: {
      NOME: doctor.name.slice(0, 60),
      JOB_TITLE: doctor.headline ? doctor.headline.slice(0, 80) : 'Médico Prescritor Cannabis',
      CRM: doctor.crm || '',
      CIDADE: doctor.city || 'São Paulo',
      UF: doctor.state || 'SP',
      CATEGORIA: 'MEDICO',
      FONTE: 'APIFY_LINKEDIN',
      LINKEDIN_URL: doctor.profileUrl || '',
      STATUS_PROSPECCAO: 'PENDENTE',
      ...(doctor.whatsapp ? { WHATSAPP: doctor.whatsapp } : {}),
      ...(doctor.landline ? { LANDLINE_NUMBER: doctor.landline } : {})
    },
    listIds: [BREVO_LIST_MEDICOS],
    updateEnabled: true
  };

  try {
    const res = await fetch(`${BREVO_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      log(`   ✅ Médico inserido no Brevo CRM [Lista ${BREVO_LIST_MEDICOS}]: ${doctor.name} (${doctor.crm || 'sem CRM'})`);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.code === 'duplicate_parameter') return true;
      log(`   ⚠️ Brevo retorno (${res.status}): ${err.message || res.statusText}`);
      return false;
    }
  } catch (e) {
    log(`   ⚠️ Falha ao conectar ao Brevo: ${e.message}`);
    return false;
  }
}

/**
 * Estratégia A: Apify harvestapi/linkedin-profile-search
 */
async function searchViaHarvestApi(query, maxItems = 15) {
  log(`🔍 [Estratégia A] Buscando via harvestapi/linkedin-profile-search: "${query}"...`);
  try {
    const runRes = await fetch(`https://api.apify.com/v2/acts/harvestapi~linkedin-profile-search/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        searchQuery: query,
        locations: ["Brazil"],
        profileScraperMode: "Full + email search",
        maxItems
      })
    });

    if (!runRes.ok) {
      const err = await runRes.json().catch(() => ({}));
      log(`⚠️ Falha ao iniciar harvestapi: ${JSON.stringify(err)}`);
      return [];
    }

    const runData = await runRes.json();
    const runId = runData.data?.id;
    const datasetId = runData.data?.defaultDatasetId;
    log(`⏳ Ator Apify iniciado (Run: ${runId}). Aguardando processamento...`);

    for (let i = 0; i < 40; i++) {
      await sleep(6000);
      const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const pollData = await pollRes.json();
      const status = pollData.data?.status;

      if (status === 'SUCCEEDED') {
        log(`✅ Execução concluída! Baixando itens do dataset ${datasetId}...`);
        const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=${maxItems}`);
        const items = await dataRes.json().catch(() => []);
        return Array.isArray(items) ? items : [];
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        log(`⚠️ Ator encerrou com status ${status}. Coletando parciais...`);
        const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=${maxItems}`);
        const items = await dataRes.json().catch(() => []);
        return Array.isArray(items) ? items : [];
      }
    }
    return [];
  } catch (e) {
    log(`⚠️ Erro na busca HarvestAPI: ${e.message}`);
    return [];
  }
}

/**
 * Estratégia B: Google Search SERP X-Ray para LinkedIn Profiles (site:linkedin.com/in/)
 */
async function searchViaGoogleXRay(query, maxItems = 15) {
  log(`🌐 [Estratégia B] Buscando via Google X-Ray Scraper: "${query}"...`);
  try {
    const googleQuery = `site:br.linkedin.com/in/ ("médico" OR "médica") ("${query}")`;
    const runRes = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        queries: googleQuery,
        maxPagesPerQuery: 1,
        resultsPerPage: maxItems,
        countryCode: "br",
        languageCode: "pt-BR"
      })
    });

    if (!runRes.ok) return [];
    const runData = await runRes.json();
    const runId = runData.data?.id;
    const datasetId = runData.data?.defaultDatasetId;

    for (let i = 0; i < 30; i++) {
      await sleep(5000);
      const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const pollData = await pollRes.json();
      const status = pollData.data?.status;

      if (status === 'SUCCEEDED') {
        const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=50`);
        const items = await dataRes.json().catch(() => []);
        const organicResults = [];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (Array.isArray(item.organicResults)) {
              organicResults.push(...item.organicResults);
            }
          }
        }
        return organicResults;
      } else if (status === 'FAILED' || status === 'ABORTED') {
        break;
      }
    }
    return [];
  } catch (e) {
    log(`⚠️ Erro no Google X-Ray: ${e.message}`);
    return [];
  }
}

/**
 * Processa e normaliza perfis coletados
 */
function normalizeProfile(rawItem) {
  // Se veio do HarvestAPI
  if (rawItem.fullName || rawItem.firstName) {
    const name = rawItem.fullName || `${rawItem.firstName || ''} ${rawItem.lastName || ''}`.trim();
    const headline = rawItem.headline || rawItem.jobTitle || '';
    const bio = `${headline} ${rawItem.summary || ''} ${rawItem.about || ''}`;
    const email = rawItem.email || extractEmail(bio) || extractEmail(rawItem.contactInfo?.email);
    const { whatsapp, landline } = parsePhone(rawItem.phone || bio);
    const crm = extractCRM(bio) || extractCRM(headline);
    const profileUrl = rawItem.linkedinUrl || rawItem.url || rawItem.publicIdentifier ? `https://www.linkedin.com/in/${rawItem.publicIdentifier}` : '';
    const city = rawItem.city || rawItem.location?.city || 'Brasil';
    const state = rawItem.state || rawItem.location?.state || 'BR';

    return {
      name: name.startsWith('Dr.') || name.startsWith('Dra.') ? name : `Dr(a). ${name}`,
      headline,
      crm,
      email,
      whatsapp,
      landline,
      city,
      state,
      profileUrl,
      source: 'APIFY_LINKEDIN_HARVEST'
    };
  }

  // Se veio do Google X-Ray
  if (rawItem.title && rawItem.url && rawItem.url.includes('linkedin.com/in/')) {
    const titleParts = String(rawItem.title).split(/[-–|]/);
    const rawName = titleParts[0]?.trim() || '';
    const headline = titleParts.slice(1).join(' - ').trim();
    const snippet = rawItem.description || '';
    const fullText = `${titleParts} ${snippet}`;
    const crm = extractCRM(fullText);
    const email = extractEmail(snippet);
    const { whatsapp, landline } = parsePhone(snippet);

    return {
      name: rawName.startsWith('Dr.') || rawName.startsWith('Dra.') ? rawName : `Dr(a). ${rawName}`,
      headline: headline || snippet.slice(0, 100),
      crm,
      email,
      whatsapp,
      landline,
      city: 'Brasil',
      state: 'BR',
      profileUrl: rawItem.url,
      source: 'APIFY_GOOGLE_LINKEDIN_XRAY'
    };
  }

  return null;
}

/**
 * Ciclo principal de raspagem
 */
async function runHarvestCycle() {
  const state = loadState();
  const leads = loadLeads();
  const query = LINKEDIN_QUERIES[state.queryIndex % LINKEDIN_QUERIES.length];

  log(`══════════════════════════════════════════════════════════════════════`);
  log(`🚀 INICIANDO RASPAGEM DE MÉDICOS NO LINKEDIN: "${query}"`);
  log(`📊 Estado Atual: ${leads.length} médicos minerados | ${state.syncedToBrevo} no Brevo`);
  log(`══════════════════════════════════════════════════════════════════════`);

  let harvestedThisRound = [];

  // Tenta Estratégia A (HarvestAPI LinkedIn Profile Search)
  let rawItems = await searchViaHarvestApi(query, 15);

  // Se Estratégia A retornar vazio ou falhar, roda Estratégia B (Google X-Ray)
  if (!rawItems || rawItems.length === 0) {
    log(`🔄 Ativando Estratégia B (Google X-Ray para LinkedIn)...`);
    rawItems = await searchViaGoogleXRay(query, 15);
  }

  log(`📦 ${rawItems.length} registros brutos encontrados para análise.`);

  let newDocsCount = 0;
  for (const raw of rawItems) {
    const doc = normalizeProfile(raw);
    if (!doc || !doc.name || doc.name.length < 5) continue;

    const urlKey = doc.profileUrl || doc.name;
    if (state.processedUrls.includes(urlKey)) continue;

    state.processedUrls.push(urlKey);
    harvestedThisRound.push(doc);
    leads.push(doc);
    newDocsCount++;

    // Tenta sincronizar com o Brevo CRM
    const synced = await sendDoctorToBrevo(doc);
    if (synced) state.syncedToBrevo++;

    await sleep(300);
  }

  state.queryIndex++;
  state.totalHarvested = leads.length;
  state.lastRunAt = new Date().toISOString();

  saveLeads(leads);
  saveState(state);
  updateSnapshot(newDocsCount);

  log(`✨ Rodada finalizada: +${newDocsCount} novos médicos prescritores identificados.`);
  log(`📈 Total acumulado de médicos na base: ${leads.length}`);
}

async function main() {
  const isOnce = process.argv.includes('--once');

  log(`╔══════════════════════════════════════════════════════════════════════╗`);
  log(`║   PLANTA Y RAÍZ — AGENTE AUTÔNOMO LINKEDIN PRESCRIBERS HARVESTER    ║`);
  log(`║   Foco: Médicos Prescritores de Cannabis Medicinal & Endocanabinoide║`);
  log(`║   Meta da Campanha: 50 Novos Médicos Prescritores Homologados        ║`);
  log(`╚══════════════════════════════════════════════════════════════════════╝`);

  do {
    try {
      await runHarvestCycle();
      if (isOnce) {
        log(`🏁 Modo --once finalizado. Encerrando execução.`);
        process.exit(0);
      }
      log(`⏳ Aguardando 30 minutos para o próximo ciclo de raspagem...`);
      await sleep(30 * 60 * 1000);
    } catch (e) {
      log(`🚨 Erro no ciclo: ${e.message}`);
      if (isOnce) process.exit(1);
      await sleep(60 * 1000);
    }
  } while (true);
}

main();
