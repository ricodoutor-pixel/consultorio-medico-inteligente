import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[key] = val;
  }
});
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Cache to avoid hitting the API too much for the same domain
const mxCache = new Map();

async function checkMX(domain) {
  if (mxCache.has(domain)) return mxCache.get(domain);
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    if (!res.ok) return false;
    const data = await res.json();
    const hasMX = data.Answer && data.Answer.length > 0;
    mxCache.set(domain, hasMX);
    return hasMX;
  } catch (err) {
    return false;
  }
}

async function main() {
  console.log('Buscando todos os contatos do Brevo...');
  const allBrevoContacts = [];
  let limit = 50;
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const res = await fetch(`https://api.brevo.com/v3/contacts?limit=${limit}&offset=${offset}`, {
      headers: { 'api-key': BREVO_API_KEY }
    });
    if (!res.ok) break;
    const data = await res.json();
    if (data.contacts && data.contacts.length > 0) {
      allBrevoContacts.push(...data.contacts);
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  console.log(`Encontrados ${allBrevoContacts.length} contatos no Brevo. Iniciando validação profunda de domínio (MX)...`);

  const validContacts = [];
  const invalidContacts = [];

  for (let i = 0; i < allBrevoContacts.length; i++) {
    const c = allBrevoContacts[i];
    const email = c.email;
    if (!email || !email.includes('@')) {
      invalidContacts.push({ email, reason: 'Formato inválido' });
      continue;
    }
    
    const domain = email.split('@')[1];
    const hasMX = await checkMX(domain);
    
    if (hasMX) {
      validContacts.push(c);
      console.log(`[${i+1}/${allBrevoContacts.length}] ✅ Válido: ${email}`);
    } else {
      invalidContacts.push({ email, reason: 'Domínio sem servidor de e-mail (MX)' });
      console.log(`[${i+1}/${allBrevoContacts.length}] ❌ Inválido: ${email}`);
    }
  }

  fs.writeFileSync('contatos_validos.json', JSON.stringify(validContacts, null, 2));
  fs.writeFileSync('contatos_invalidos.json', JSON.stringify(invalidContacts, null, 2));

  console.log(`\nValidação concluída!`);
  console.log(`Total de e-mails válidos: ${validContacts.length}`);
  console.log(`Total de e-mails falsos/inválidos: ${invalidContacts.length}`);
  
}

main().catch(console.error);
