import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const LEADS_FILE = path.join(ROOT_DIR, 'scripts', 'apify_harvested_leads.json');
const LINKEDIN_FILE = path.join(ROOT_DIR, 'scripts', 'linkedin_prescribers_leads.json');
const SNAPSHOT_FILE = path.join(ROOT_DIR, 'scripts', 'master_dashboard_snapshot.json');

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

function extractEmail(str) {
  if (!str) return null;
  const match = String(str).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function sanitizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) return digits;
  return null;
}

async function deepMine() {
  console.log('=== INICIANDO MINERAÇÃO PROFUNDA DOS DATASETS DA APIFY ===');
  const res = await fetch('https://api.apify.com/v2/datasets?unnamed=true&limit=60', {
    headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
  });
  const data = await res.json();
  const datasets = (data.data?.items || []).filter(d => d.itemCount > 0);
  console.log(`📦 Encontrados ${datasets.length} datasets com conteúdo.`);

  const doctors = [];
  const pharmacies = [];
  const patients = [];

  for (const ds of datasets) {
    try {
      const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${ds.id}/items?limit=100`, {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
      });
      const items = await itemsRes.json();
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        // 1. Google Places (Farmácias ou Clínicas/Médicos)
        if (item.placeId || item.categoryName || item.categories) {
          const title = item.title || item.name || '';
          const phone = sanitizePhone(item.phone || item.phoneUnformatted);
          const email = extractEmail(item.website || item.description || item.additionalInfo);
          const city = item.city || '';
          const state = item.state || '';
          const address = item.address || '';

          const isPharma = /farm[aá]cia|drogaria|manipula|distribuidora/i.test(title + ' ' + (item.categoryName || ''));
          const isDoc = /m[eé]dic|cl[ií]nic|doutor|cannabis|canab/i.test(title + ' ' + (item.categoryName || ''));

          if (isPharma) {
            pharmacies.push({
              name: title,
              phone,
              email,
              city,
              state,
              address,
              source: 'APIFY_PLACES'
            });
          } else if (isDoc) {
            doctors.push({
              name: title,
              phone,
              email,
              city,
              state,
              headline: item.categoryName || 'Clínica/Médico Prescritor',
              source: 'APIFY_PLACES'
            });
          }
        }

        // 2. LinkedIn ou Social
        if (item.fullName || item.profileUrl || item.publicIdentifier || item.headline) {
          const name = item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim();
          const headline = item.headline || item.jobTitle || '';
          const email = item.email || extractEmail(headline + ' ' + (item.summary || ''));
          const phone = sanitizePhone(item.phone);
          const profileUrl = item.profileUrl || (item.publicIdentifier ? `https://www.linkedin.com/in/${item.publicIdentifier}` : '');

          doctors.push({
            name: name.startsWith('Dr') ? name : `Dr(a). ${name}`,
            headline,
            email,
            phone,
            profileUrl,
            source: 'APIFY_LINKEDIN'
          });
        }

        // 3. Instagram Social
        if (item.ownerUsername || item.caption) {
          const username = item.ownerUsername || '';
          const fullName = item.ownerFullName || '';
          const caption = item.caption || '';
          const email = extractEmail(caption);
          const phone = sanitizePhone(caption);

          const isDoc = /dr\.|dra\.|crm|m[eé]dic|prescritor/i.test(fullName + ' ' + caption);
          if (isDoc) {
            doctors.push({
              name: fullName || username,
              email,
              phone,
              headline: 'Prescritor Cannabis Medicinal (Instagram)',
              source: 'APIFY_INSTAGRAM'
            });
          } else {
            patients.push({
              name: fullName || username,
              email,
              phone,
              caption: caption.slice(0, 120),
              source: 'APIFY_INSTAGRAM'
            });
          }
        }
      }
    } catch (e) {
      console.error(`Erro ao minerar dataset ${ds.id}:`, e.message);
    }
  }

  // Deduplicação
  const uniqueDocs = [];
  const seenDocs = new Set();
  for (const d of doctors) {
    const k = (d.email || d.phone || d.name).toLowerCase().trim();
    if (k && !seenDocs.has(k)) {
      seenDocs.add(k);
      uniqueDocs.push(d);
    }
  }

  const uniquePharms = [];
  const seenPharms = new Set();
  for (const p of pharmacies) {
    const k = (p.email || p.phone || p.name).toLowerCase().trim();
    if (k && !seenPharms.has(k)) {
      seenPharms.add(k);
      uniquePharms.push(p);
    }
  }

  const uniquePatients = [];
  const seenPatients = new Set();
  for (const pt of patients) {
    const k = (pt.email || pt.phone || pt.name).toLowerCase().trim();
    if (k && !seenPatients.has(k)) {
      seenPatients.add(k);
      uniquePatients.push(pt);
    }
  }

  console.log(`\n🎉 Consolidação Final:`);
  console.log(` - 🩺 Médicos únicos minerados: ${uniqueDocs.length}`);
  console.log(` - 🏪 Farmácias únicas mineradas: ${uniquePharms.length}`);
  console.log(` - 👥 Pacientes/leads únicos: ${uniquePatients.length}`);

  // Salva no arquivo de leads
  fs.writeFileSync(LEADS_FILE, JSON.stringify({
    medicos: uniqueDocs,
    farmacias: uniquePharms,
    pacientes: uniquePatients,
    minedAt: new Date().toISOString()
  }, null, 2));

  // Salva médicos no linkedin_prescribers_leads.json
  fs.writeFileSync(LINKEDIN_FILE, JSON.stringify(uniqueDocs, null, 2));

  // Atualiza master_dashboard_snapshot.json
  if (fs.existsSync(SNAPSHOT_FILE)) {
    const snap = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
    snap.goals.doctors.harvestedByAgent = uniqueDocs.length;
    snap.goals.pharmacies.harvestedByAgent = uniquePharms.length;
    snap.goals.patients.harvestedByAgent = uniquePatients.length;
    snap.updatedAt = new Date().toISOString();
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snap, null, 2));
  }
}

deepMine().catch(console.error);
