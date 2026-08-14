import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

function parseCSV(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { values.push(cur.trim().replace(/^"|"$/g, '')); cur = ''; }
      else cur += ch;
    }
    values.push(cur.trim().replace(/^"|"$/g, ''));
    const obj = {};
    header.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(c => c.EMAIL && c.EMAIL.includes('@'));
}

async function importContact(contact) {
  const payload = {
    email: contact.EMAIL,
    attributes: {
      FIRSTNAME:  contact.FIRSTNAME  || '',
      LASTNAME:   contact.LASTNAME   || '',
      SPECIALTY:  contact.SPECIALTY  || '',
      CITY:       contact.CITY       || '',
      STATE:      contact.STATE      || '',
      // NÃO ENVIAR SMS se não estiver formatado (+55...), pois a Brevo recusa o contato inteiro.
    },
    listIds: [2],
    updateEnabled: true,
  };

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  return res.ok || res.status === 204 || text.includes('duplicate_parameter');
}

async function main() {
  const csvPath = path.join(__dirname, '..', 'prescritores_abrace.csv');
  const contacts = parseCSV(csvPath);
  console.log(`Lendo ${contacts.length} contatos para importação no CRM Brevo...`);
  
  let success = 0;
  for (let i = 0; i < contacts.length; i++) {
    const ok = await importContact(contacts[i]);
    if (ok) success++;
    
    if (i % 100 === 0 && i > 0) {
      console.log(`Progresso: ${i}/${contacts.length} importados...`);
    }
    // Brevo API rate limit: ~10 requests per second
    await new Promise(r => setTimeout(r, 100)); 
  }
  
  console.log(`\n✅ Finalizado! Importados: ${success}/${contacts.length}`);
}

main().catch(console.error);
