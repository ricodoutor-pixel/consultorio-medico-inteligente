/**
 * scripts/apify_lead_harvester.mjs
 * 
 * Motor Autônomo de Captura de Leads via Apify API -> Brevo CRM 24x7
 * Planta y Raíz Ltda
 * 
 * Atores Utilizados:
 * 1. dataji/apify-linkdin-jobs (dataji~apify-linkdin-jobs) -> Extração corporativa/prescritores no LinkedIn
 * 2. apify/instagram-scraper (apify~instagram-scraper)   -> Extração de médicos e pacientes em tags canábicas
 * 3. compass/crawler-google-places (compass~crawler-google-places) -> Acelerador de clínicas e farmácias
 * 
 * Categorias no Brevo CRM:
 * - Médicos Prescritores (Lista ID: 6)
 * - Farmácias Distribuidoras (Lista ID: 5)
 * - Pacientes / Tratamento Canabidiol (Lista ID: 7)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';
import dotenv from 'dotenv';
import {
  isValidDoctorEmailSyntax,
  syncLeadToOfficialSupabase
} from './lib/email_validator.mjs';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const LEADS_CACHE_FILE = path.join(ROOT_DIR, 'scripts', 'apify_harvested_leads.json');
const LOG_FILE = path.join(ROOT_DIR, 'scripts', 'apify_harvester.log');

// Credenciais
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_BASE = 'https://api.brevo.com/v3';

// Listas no Brevo
const LIST_MEDICOS = Number(process.env.BREVO_LIST_MEDICOS || 6);
const LIST_FARMACIAS = Number(process.env.BREVO_LIST_FARMACIAS || 5);
const LIST_PACIENTES = Number(process.env.BREVO_LIST_PACIENTES || 7);

// Metas da Plataforma
const TARGET_DOCTORS = 50;
const TARGET_PHARMACIES = 2;
const TARGET_PATIENTS = 1000;

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

function loadCache() {
  try {
    if (fs.existsSync(LEADS_CACHE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEADS_CACHE_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        return { 
          medicos: parsed.map(p => p.email || p.phone || p.name).filter(Boolean), 
          farmacias: [], 
          pacientes: [], 
          syncHistory: [] 
        };
      }
      return {
        medicos: Array.isArray(parsed.medicos) ? parsed.medicos : [],
        farmacias: Array.isArray(parsed.farmacias) ? parsed.farmacias : [],
        pacientes: Array.isArray(parsed.pacientes) ? parsed.pacientes : [],
        syncHistory: Array.isArray(parsed.syncHistory) ? parsed.syncHistory : []
      };
    }
  } catch (e) {}
  return { medicos: [], farmacias: [], pacientes: [], syncHistory: [] };
}

function saveCache(cache) {
  try {
    fs.writeFileSync(LEADS_CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {}
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Classifica e formata telefone para padrões brasileiros (celular WhatsApp vs fixo)
function parsePhone(raw) {
  if (!raw) return { whatsapp: null, landline: null, raw: null };
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  if (!digits.startsWith('55')) return { whatsapp: null, landline: null, raw: null };

  // Celular BR: 55 + DDD (2 dígitos) + 9 + 8 dígitos = 13 dígitos
  if (/^55[1-9]{2}9\d{8}$/.test(digits)) {
    return { whatsapp: digits, landline: null, raw: digits };
  }
  // Telefone fixo ou comercial:
  if (digits.length >= 10 && digits.length <= 13) {
    return { whatsapp: null, landline: digits, raw: digits };
  }
  return { whatsapp: null, landline: null, raw: null };
}

// Extrai e-mail de texto
function extractEmail(text) {
  if (!text) return null;
  const m = String(text).match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
  return m ? m[0].toLowerCase() : null;
}

// Extrai CRM de texto
function extractCRM(text) {
  if (!text) return null;
  const m = String(text).match(/\bCRM\s*(?:[-/]?\s*([A-Z]{2}))?\s*[:.-]?\s*(\d{4,7})\b/i)
         || String(text).match(/\bCRM\s*[:.-]?\s*(\d{4,7})\s*[-/]?\s*([A-Z]{2})\b/i);
  if (m) {
    return m[0].toUpperCase();
  }
  return null;
}

// Envia contato para o Brevo CRM e para o Supabase Oficial (Lovable Cloud CRM) com validação estrita
async function sendContactToBrevo({ email, attributes, listId }) {
  const emailCheck = email ? isValidDoctorEmailSyntax(email, null) : { valid: false };
  const verifiedEmail = emailCheck.valid ? emailCheck.email : null;

  if (!verifiedEmail && !attributes.WHATSAPP && !attributes.LANDLINE_NUMBER) return false;
  
  const cleanAttr = { ...attributes };
  delete cleanAttr.SMS; // Remove SMS para evitar erro de identificador único duplicado

  // Garante que WHATSAPP só receba celular válido; caso contrário, joga em LANDLINE_NUMBER
  if (cleanAttr.WHATSAPP && !/^55[1-9]{2}9\d{8}$/.test(String(cleanAttr.WHATSAPP).replace(/\D/g, ''))) {
    if (!cleanAttr.LANDLINE_NUMBER) cleanAttr.LANDLINE_NUMBER = cleanAttr.WHATSAPP;
    delete cleanAttr.WHATSAPP;
  }

  // Sincroniza sempre no CRM Oficial da Plataforma (leads_contatos / medicos_parceiros_leads / pacientes_leads)
  await syncLeadToOfficialSupabase({
    name: cleanAttr.NOME || cleanAttr.NOME_FANTASIA || 'Contato Apify',
    email: verifiedEmail,
    phone: cleanAttr.WHATSAPP || cleanAttr.LANDLINE_NUMBER || '',
    category: listId === LIST_PACIENTES ? 'paciente' : (listId === LIST_FARMACIAS ? 'farmacia' : '1-medico'),
    source: cleanAttr.FONTE || 'apify_harvester',
    specialty: cleanAttr.JOB_TITLE || '',
    city: cleanAttr.CIDADE || '',
    uf: cleanAttr.UF || '',
    status: 'scraped'
  });

  // Só envia para o Brevo se tiver e-mail real verificado ou WhatsApp válido (evita criar @lead.plantayraiz.com.br que gera bounce!)
  if (!verifiedEmail) {
    return true;
  }

  const finalEmail = verifiedEmail;

  try {
    const payload = {
      email: finalEmail,
      attributes: {
        ...cleanAttr,
        STATUS_PROSPECCAO: 'PENDENTE'
      },
      listIds: [listId],
      updateEnabled: true
    };

    let res = await fetch(`${BREVO_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      const telLabel = cleanAttr.WHATSAPP ? `WA: ${cleanAttr.WHATSAPP}` : (cleanAttr.LANDLINE_NUMBER ? `Tel: ${cleanAttr.LANDLINE_NUMBER}` : 'sem tel');
      log(`   ✅ Lead inserido no Brevo [Lista ${listId}]: ${cleanAttr.NOME || finalEmail} (${telLabel})`);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.code === 'duplicate_parameter') return true;

      // Se der erro de WhatsApp/phone, tenta novamente sem o atributo WHATSAPP
      if (err.message && (err.message.toLowerCase().includes('whatsapp') || err.message.toLowerCase().includes('phone'))) {
        delete payload.attributes.WHATSAPP;
        const retryRes = await fetch(`${BREVO_BASE}/contacts`, {
          method: 'POST',
          headers: {
            'api-key': BREVO_KEY,
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (retryRes.ok || retryRes.status === 201 || retryRes.status === 204) {
          log(`   ✅ Lead inserido no Brevo [Lista ${listId}] (fallback sem WHATSAPP): ${cleanAttr.NOME || finalEmail}`);
          return true;
        }
      }

      log(`⚠️ Brevo resposta (${res.status}): ${err.message || res.statusText}`);
      return false;
    }
  } catch (err) {
    log(`⚠️ Falha de conexão ao salvar no Brevo: ${err.message}`);
    return false;
  }
}

/**
 * Dispara e aguarda um Ator Apify (com recuperação de dados em caso de timeout)
 */
async function runApifyActor(actorId, input) {
  const actorSlug = actorId.replace('/', '~');
  log(`🚀 Disparando Ator Apify [${actorId}]...`);
  
  try {
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorSlug}/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!runRes.ok) {
      const err = await runRes.json().catch(() => ({}));
      log(`⚠️ Falha ao iniciar ator ${actorId}: ${JSON.stringify(err)}`);
      return [];
    }

    const runData = await runRes.json();
    const runId = runData.data?.id;
    const datasetId = runData.data?.defaultDatasetId;
    log(`⏳ Ator ${actorId} iniciado (Run ID: ${runId}). Monitorando execução...`);

    // Polling até terminar (máximo 5 minutos)
    const maxRetries = 60;
    for (let i = 0; i < maxRetries; i++) {
      await sleep(5000);
      const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const pollData = await pollRes.json();
      const status = pollData.data?.status;
      
      if (status === 'SUCCEEDED') {
        log(`✅ Ator ${actorId} finalizado com sucesso! Extraindo itens do dataset ${datasetId}...`);
        const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=100`);
        const items = await dataRes.json();
        log(`📦 ${items.length} registros recebidos do Apify.`);
        return items;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        log(`❌ Ator ${actorId} encerrou com status: ${status}. Tentando recuperar itens parciais...`);
        const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=100`);
        const items = await dataRes.json().catch(() => []);
        if (Array.isArray(items) && items.length > 0) {
          log(`📦 ${items.length} registros parciais recuperados do dataset.`);
          return items;
        }
        return [];
      }
    }

    log(`⚠️ Limite de tempo no ator ${actorId}. Extraindo itens acumulados no dataset ${datasetId}...`);
    const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=100`);
    const items = await dataRes.json().catch(() => []);
    if (Array.isArray(items) && items.length > 0) {
      log(`📦 ${items.length} registros recuperados do dataset.`);
      return items;
    }
    return [];
  } catch (err) {
    log(`⚠️ Erro de rede no ator ${actorId}: ${err.message}`);
    return [];
  }
}

/**
 * 👨‍⚕️ 1. COLHEITA PRIORITÁRIA DE PROFISSIONAIS (RUMO A 500 MIL)
 * 
 * PRIORIDADE 1 (Tier 1 - Principal):
 * - Médicos Clínicos Gerais (formados em 2020 / Telemedicina / Atendimento Online)
 * - Médicos Prescritores Anunciados (Cannabis Medicinal / Terapia Canabinoide / Integrativa)
 * 
 * PRIORIDADE 2 (Tier 2 - Segundo Plano / Catálogo Completo):
 * - Médicos Veterinários Prescritores
 * - Médicos Psiquiatras e Neurologistas Integrativos
 * - Especialistas em Dor Crônica & Ortopedia
 * - Psicólogos, Nutricionistas, Fisioterapeutas e Terapeutas Integrativos
 */

function loadLocalDoctorSeeds() {
  const file = path.join(__dirname, 'unregistered_doctors_leads.json');
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data)) return data;
    } catch (e) {}
  }
  return [];
}

async function harvestDoctors(cache) {
  log(`\n════════════════════════════════════════════════════════════════════`);
  log(`👨‍⚕️ 1. EXTRAÇÃO DE MÉDICOS & PROFISSIONAIS (META 500K) -> Brevo Lista ${LIST_MEDICOS}`);
  log(`   🎯 PRIORIDADE 1: Clínicos Gerais (2020 / Telemedicina) & Médicos Prescritores`);
  log(`   🥈 PRIORIDADE 2: Veterinários, Psiquiatras, Nutricionistas, Psicólogos`);
  log(`════════════════════════════════════════════════════════════════════`);

  let added = 0;
  const cycleIndex = (cache.syncHistory?.length || 0);

  // 1A. Google Places Scraper — Consultórios, Clínicas e Telemedicina
  // Alterna entre queries de Tier 1 (Clínicos Gerais 2020 / Prescritores) e Tier 2 (Outros profissionais)
  const tier1Queries = [
    // Clínicos Gerais & Telemedicina (Foco 2020)
    "medico clinico geral telemedicina sao paulo",
    "medico clinica geral consulta online rio de janeiro",
    "medico generalista atendimento online belo horizonte",
    "medico clinico geral telemedicina curitiba",
    "medico clinico geral teleconsulta porto alegre",
    "medico clinico geral atendimento online salvador",
    "medico clinico geral telemedicina brasilia",
    "medico clinica geral campinas",
    "medico clinico geral goiania",
    "medico plantonista telemedicina clinico geral",
    // Médicos Prescritores Anunciados (Cannabis & Integrativa)
    "medico prescritor cannabis medicinal sao paulo",
    "prescritor cannabis medicinal rio de janeiro",
    "medico canabidiol curitiba",
    "clinica cannabis medicinal belo horizonte",
    "prescritor canabidiol brasilia",
    "medico terapia canabinoide salvador",
    "medico prescritor cannabis florianopolis",
    "consultorio endocanabinologia campinas",
    "medico cannabis medicinal porto alegre",
    "medicina integrativa cannabis medicinal goiania"
  ];

  const tier2Queries = [
    // Catálogo secundário
    "medico veterinario prescritor cannabis sao paulo",
    "clinica veterinaria cannabis medicinal curitiba",
    "psiquiatra cannabis medicinal sao paulo",
    "neurologista canabidiol epilepsia rio de janeiro",
    "medico especialista dor cronica cannabis",
    "psicologo integrativo saude mental brasil",
    "nutricionista integrativa saude funcional sao paulo",
    "fisioterapeuta reabilitacao integrativa dor"
  ];

  // 75% das buscas no Tier 1 (Prioridade Absoluta) e 25% no Tier 2 (Segundo Plano)
  const isTier2Cycle = (cycleIndex % 4 === 3);
  const selectedQueries = isTier2Cycle 
    ? tier2Queries.sort(() => 0.5 - Math.random()).slice(0, 4)
    : tier1Queries.sort(() => 0.5 - Math.random()).slice(0, 6);

  log(`🔎 Executando busca Apify Google Places (${isTier2Cycle ? 'Tier 2: Catálogo Secundário' : 'Tier 1: Clínicos 2020 & Prescritores'})...`);

  const placesInput = {
    searchStringsArray: selectedQueries,
    locationQuery: "Brazil",
    maxCrawledPlacesPerSearch: 15,
    language: "pt-BR"
  };

  const placesResults = await runApifyActor('compass/crawler-google-places', placesInput);
  if (Array.isArray(placesResults)) {
    for (const item of placesResults) {
      const { whatsapp, landline } = parsePhone(item.phone || item.phoneUnformatted);
      const name = item.title || item.name || '';
      const email = extractEmail(item.websiteDescription || item.description || '') || item.email;
      const key = whatsapp || landline || email || name;

      if (key && !cache.medicos.includes(key)) {
        cache.medicos.push(key);
        
        // Classifica especialidade e categoria
        const desc = `${name} ${item.description || ''} ${item.categoryName || ''}`.toLowerCase();
        let jobTitle = 'Clínico Geral / Telemedicina (CRM ~2020)';
        let categoria = 'MEDICO_CLINICO_GERAL';
        let prioridade = 'ALTA_CLINICO_2020';

        if (desc.includes('cannabis') || desc.includes('canabi') || desc.includes('prescrit')) {
          jobTitle = 'Médico Prescritor de Cannabis Medicinal';
          categoria = 'MEDICO_PRESCRITOR';
          prioridade = 'ALTA_PRESCRITOR';
        } else if (desc.includes('vet') || desc.includes('animal')) {
          jobTitle = 'Médico Veterinário Prescritor';
          categoria = 'VETERINARIO';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('psiqui')) {
          jobTitle = 'Médico Psiquiatra Integrativo';
          categoria = 'PSIQUIATRA';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('neuro')) {
          jobTitle = 'Médico Neurologista';
          categoria = 'NEUROLOGISTA';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('dor') || desc.includes('ortop')) {
          jobTitle = 'Médico Especialista em Dor Crônica';
          categoria = 'DOR_CRONICA';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('psico')) {
          jobTitle = 'Psicólogo Clínico Integrativo';
          categoria = 'PSICOLOGO';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('nutri')) {
          jobTitle = 'Nutricionista Integrativa Funcional';
          categoria = 'NUTRICIONISTA';
          prioridade = 'CATALOGO_SECUNDARIO';
        }

        const ok = await sendContactToBrevo({
          email,
          attributes: {
            NOME: name.slice(0, 50),
            JOB_TITLE: jobTitle,
            ...(whatsapp ? { WHATSAPP: whatsapp } : {}),
            ...(landline ? { LANDLINE_NUMBER: landline } : {}),
            CIDADE: item.city || 'São Paulo',
            UF: item.state || 'SP',
            CATEGORIA: categoria,
            PRIORIDADE: prioridade,
            FONTE: 'APIFY_GOOGLE_PLACES'
          },
          listId: LIST_MEDICOS
        });
        if (ok) added++;
        await sleep(200);
      }
    }
  }

  // 1B. Instagram Scraper: Perfis e Postagens
  const tier1InstaTags = [
    "https://www.instagram.com/explore/tags/medicocanabico/",
    "https://www.instagram.com/explore/tags/prescritorcannabis/",
    "https://www.instagram.com/explore/tags/medicinacanabica/",
    "https://www.instagram.com/explore/tags/clinicogeral/",
    "https://www.instagram.com/explore/tags/telemedicinabrasil/",
    "https://www.instagram.com/explore/tags/endocanabinologia/"
  ];
  const tier2InstaTags = [
    "https://www.instagram.com/explore/tags/veterinariocanabico/",
    "https://www.instagram.com/explore/tags/psiquiatriaintegrativa/",
    "https://www.instagram.com/explore/tags/neurologiaintegrativa/"
  ];

  const selectedInstaUrls = isTier2Cycle
    ? tier2InstaTags
    : tier1InstaTags.sort(() => 0.5 - Math.random()).slice(0, 3);

  log(`📸 Executando busca Apify Instagram Scraper (${selectedInstaUrls.length} hashtags)...`);

  const instaInput = {
    directUrls: selectedInstaUrls,
    resultsType: "posts",
    resultsLimit: 25
  };

  const instaResults = await runApifyActor('apify/instagram-scraper', instaInput);
  if (Array.isArray(instaResults)) {
    for (const post of instaResults) {
      const bio = post.caption || '';
      const email = extractEmail(bio) || extractEmail(post.ownerFullName);
      const { whatsapp, landline } = parsePhone(bio);
      const crm = extractCRM(bio);
      const fullName = post.ownerFullName || post.ownerUsername || '';
      const key = email || whatsapp || landline || fullName;

      if ((email || whatsapp || landline) && key && !cache.medicos.includes(key)) {
        cache.medicos.push(key);

        const desc = `${fullName} ${bio}`.toLowerCase();
        let jobTitle = crm ? `Médico Prescritor (${crm})` : 'Clínico Geral / Prescritor Cannabis';
        let categoria = 'MEDICO_PRESCRITOR';
        let prioridade = 'ALTA_PRESCRITOR';

        if (desc.includes('veterin')) {
          jobTitle = 'Médico Veterinário Prescritor';
          categoria = 'VETERINARIO';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('psico')) {
          jobTitle = 'Psicólogo Clínico Integrativo';
          categoria = 'PSICOLOGO';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('nutri')) {
          jobTitle = 'Nutricionista Integrativa';
          categoria = 'NUTRICIONISTA';
          prioridade = 'CATALOGO_SECUNDARIO';
        } else if (desc.includes('clinico geral') || desc.includes('clínico geral') || desc.includes('2020')) {
          jobTitle = crm ? `Clínico Geral (${crm})` : 'Clínico Geral / Telemedicina (CRM ~2020)';
          categoria = 'MEDICO_CLINICO_GERAL';
          prioridade = 'ALTA_CLINICO_2020';
        }

        const ok = await sendContactToBrevo({
          email,
          attributes: {
            NOME: fullName.slice(0, 50),
            JOB_TITLE: jobTitle,
            ...(whatsapp ? { WHATSAPP: whatsapp } : {}),
            ...(landline ? { LANDLINE_NUMBER: landline } : {}),
            CATEGORIA: categoria,
            PRIORIDADE: prioridade,
            FONTE: 'APIFY_INSTAGRAM'
          },
          listId: LIST_MEDICOS
        });
        if (ok) added++;
        await sleep(200);
      }
    }
  }

  // 1C. LinkedIn Jobs & Prescritores (dataji/apify-linkdin-jobs)
  const linkedinKeyword = isTier2Cycle ? "veterinario cannabis" : "medico clinico geral telemedicina";
  const linkedinInput = {
    keywords: linkedinKeyword,
    location: "Brazil",
    maxResults: 15,
    scrapeDetails: true,
    scrapeCompany: true,
    proxyConfiguration: { useApifyProxy: true }
  };

  const linkedinResults = await runApifyActor('dataji/apify-linkdin-jobs', linkedinInput);
  if (Array.isArray(linkedinResults)) {
    for (const job of linkedinResults) {
      const company = job.company || job.companyName || '';
      const email = extractEmail(job.description) || extractEmail(job.companyUrl);
      const { whatsapp, landline } = parsePhone(job.description);
      const key = email || whatsapp || landline || `${company}_${job.title}`;

      if ((email || whatsapp || landline) && !cache.medicos.includes(key)) {
        cache.medicos.push(key);
        const ok = await sendContactToBrevo({
          email,
          attributes: {
            NOME: (job.title || 'Profissional de Saúde').slice(0, 50),
            JOB_TITLE: (job.title || 'Clínico Geral / Telemedicina').slice(0, 50),
            RAZAO_SOCIAL: company.slice(0, 50),
            ...(whatsapp ? { WHATSAPP: whatsapp } : {}),
            ...(landline ? { LANDLINE_NUMBER: landline } : {}),
            CATEGORIA: isTier2Cycle ? 'CATALOGO_SECUNDARIO' : 'MEDICO_CLINICO_GERAL',
            PRIORIDADE: isTier2Cycle ? 'CATALOGO_SECUNDARIO' : 'ALTA_CLINICO_2020',
            FONTE: 'APIFY_LINKEDIN'
          },
          listId: LIST_MEDICOS
        });
        if (ok) added++;
        await sleep(200);
      }
    }
  }

  log(`✨ Novos profissionais de saúde inseridos no Brevo CRM: ${added}`);
  saveCache(cache);
}

/**
 * 🏪 2. COLHEITA DE FARMÁCIAS & DISTRIBUIDORAS
 */
async function harvestPharmacies(cache) {
  log(`\n════════════════════════════════════════════════════════════════════`);
  log(`🏪 2. EXTRAÇÃO DE FARMÁCIAS & DISTRIBUIDORAS -> Brevo Lista ID ${LIST_FARMACIAS}`);
  log(`════════════════════════════════════════════════════════════════════`);

  let added = 0;

  const pharmaPlacesInput = {
    searchStringsArray: [
      "farmacia manipulacao cannabis sao paulo",
      "farmacia manipulacao canabidiol campinas",
      "distribuidora cannabis medicinal curitiba",
      "farmacia especial canabinoides rio de janeiro",
      "farmacia de manipulacao florianopolis"
    ],
    locationQuery: "Brazil",
    maxCrawledPlacesPerSearch: 10,
    language: "pt-BR"
  };

  const results = await runApifyActor('compass/crawler-google-places', pharmaPlacesInput);
  if (Array.isArray(results)) {
    for (const item of results) {
      const { whatsapp, landline } = parsePhone(item.phone || item.phoneUnformatted);
      const name = item.title || item.name || '';
      const email = extractEmail(item.websiteDescription || item.description || '') || item.email;
      const key = whatsapp || landline || email || name;

      if (key && !cache.farmacias.includes(key)) {
        cache.farmacias.push(key);
        const ok = await sendContactToBrevo({
          email,
          attributes: {
            NOME_FANTASIA: name.slice(0, 50),
            RAZAO_SOCIAL: name.slice(0, 50),
            ...(whatsapp ? { WHATSAPP: whatsapp } : {}),
            ...(landline ? { LANDLINE_NUMBER: landline } : {}),
            CIDADE: item.city || 'São Paulo',
            UF: item.state || 'SP',
            CATEGORIA: 'FARMACIA',
            FONTE: 'APIFY_GOOGLE_PLACES'
          },
          listId: LIST_FARMACIAS
        });
        if (ok) added++;
        await sleep(200);
      }
    }
  }

  log(`✨ Novas farmácias/distribuidoras inseridas no Brevo CRM: ${added}`);
  saveCache(cache);
}

/**
 * 👥 3. COLHEITA DE PACIENTES / TRATAMENTOS
 */
async function harvestPatients(cache) {
  log(`\n════════════════════════════════════════════════════════════════════`);
  log(`👥 3. EXTRAÇÃO DE PACIENTES / INTERESSADOS -> Brevo Lista ID ${LIST_PACIENTES}`);
  log(`════════════════════════════════════════════════════════════════════`);

  let added = 0;

  // Instagram: Busca em postagens de comunidades de pacientes
  const patientInput = {
    directUrls: [
      "https://www.instagram.com/explore/tags/cannabismedicinalbrasil/",
      "https://www.instagram.com/explore/tags/oleodecannabis/",
      "https://www.instagram.com/explore/tags/autismoecannabis/"
    ],
    resultsType: "posts",
    resultsLimit: 30
  };

  const results = await runApifyActor('apify/instagram-scraper', patientInput);
  if (Array.isArray(results)) {
    for (const post of results) {
      const caption = post.caption || '';
      const email = extractEmail(caption);
      const { whatsapp, landline } = parsePhone(caption);
      const username = post.ownerUsername;
      const fullName = post.ownerFullName || username;
      const key = email || whatsapp || landline || username;

      if ((email || whatsapp || landline) && key && !cache.pacientes.includes(key)) {
        cache.pacientes.push(key);
        const ok = await sendContactToBrevo({
          email,
          attributes: {
            NOME: fullName.slice(0, 50),
            JOB_TITLE: 'Paciente / Interesse em Tratamento Canabinoide',
            ...(whatsapp ? { WHATSAPP: whatsapp } : {}),
            ...(landline ? { LANDLINE_NUMBER: landline } : {}),
            CATEGORIA: 'PACIENTE',
            FONTE: 'APIFY_INSTAGRAM'
          },
          listId: LIST_PACIENTES
        });
        if (ok) added++;
        await sleep(200);
      }
    }
  }

  log(`✨ Novos pacientes inseridos no Brevo CRM: ${added}`);
  saveCache(cache);
}

/**
 * 🔄 Ingestão de datasets históricos existentes no Apify
 */
async function ingestPendingHistoricalDatasets(cache) {
  // 1. Farmácias do dataset mMu8RfBxDpWux9yPn
  try {
    const pharmaRes = await fetch(`https://api.apify.com/v2/datasets/mMu8RfBxDpWux9yPn/items?token=${APIFY_TOKEN}&limit=100`);
    const pharmaItems = await pharmaRes.json().catch(() => []);
    if (Array.isArray(pharmaItems) && pharmaItems.length > 0) {
      let pharmaAdded = 0;
      for (const item of pharmaItems) {
        const { whatsapp, landline } = parsePhone(item.phone || item.phoneUnformatted);
        const name = item.title || item.name || '';
        const email = extractEmail(item.websiteDescription || item.description || '') || item.email;
        const key = whatsapp || landline || email || name;
        if (key && !cache.farmacias.includes(key)) {
          cache.farmacias.push(key);
          const ok = await sendContactToBrevo({
            email,
            attributes: {
              NOME_FANTASIA: name.slice(0, 50),
              RAZAO_SOCIAL: name.slice(0, 50),
              ...(whatsapp ? { WHATSAPP: whatsapp } : {}),
              ...(landline ? { LANDLINE_NUMBER: landline } : {}),
              CIDADE: item.city || 'Campinas',
              UF: item.state || 'SP',
              CATEGORIA: 'FARMACIA',
              FONTE: 'APIFY_GOOGLE_PLACES'
            },
            listId: LIST_FARMACIAS
          });
          if (ok) pharmaAdded++;
          await sleep(150);
        }
      }
      if (pharmaAdded > 0) log(`📦 Dataset de farmácias ingerido: ${pharmaAdded} novas farmácias.`);
    }
  } catch (e) {}

  saveCache(cache);
}

/**
 * 🔄 LOOP PRINCIPAL 24X7
 */
async function main() {
  log(`╔══════════════════════════════════════════════════════════════════╗`);
  log(`║   PLANTA Y RAÍZ — MOTOR AUTÔNOMO APIFY -> BREVO CRM 24X7         ║`);
  log(`║   Meta: 50 Médicos | 2 Farmácias | 1.000 Pacientes              ║`);
  log(`╚══════════════════════════════════════════════════════════════════╝`);

  const isOnce = process.argv.includes('--once');
  const cache = loadCache();

  // Ingestão de datasets históricos existentes no Apify
  await ingestPendingHistoricalDatasets(cache);

  do {
    try {
      log(`\n⏰ [NOVO CICLO DE COLHEITA INICIADO] - ${new Date().toLocaleString('pt-BR')}`);
      log(`📊 Banco local atual: ${cache.medicos.length} médicos | ${cache.farmacias.length} farmácias | ${cache.pacientes.length} pacientes.`);

      // 1. Médicos
      await harvestDoctors(cache);

      // 2. Farmácias
      await harvestPharmacies(cache);

      // 3. Pacientes
      await harvestPatients(cache);

      log(`\n🎉 Ciclo de colheita finalizado com sucesso!`);
      log(`📊 Total consolidado: ${cache.medicos.length} médicos | ${cache.farmacias.length} farmácias | ${cache.pacientes.length} pacientes.`);

      if (isOnce) {
        log(`🏁 Modo --once concluído. Encerrando execução.`);
        process.exit(0);
      }

      // Intervalo de 30 minutos entre rodadas completas
      log(`⏳ Aguardando 30 minutos para a próxima rodada autônoma...`);
      await sleep(30 * 60 * 1000);

    } catch (err) {
      log(`🚨 Erro no ciclo de colheita: ${err.message}`);
      if (isOnce) process.exit(1);
      await sleep(60 * 1000);
    }
  } while (true);
}

main();
