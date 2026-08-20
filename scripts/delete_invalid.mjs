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

async function deleteFromBrevo(email) {
  const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { 'api-key': BREVO_API_KEY }
  });
  return res.ok || res.status === 404;
}

async function main() {
  const invalidContacts = JSON.parse(fs.readFileSync('drsaude_fakes.json', 'utf8'));
  console.log(`Iniciando a remoção de ${invalidContacts.length} contatos inválidos do Brevo...`);
  
  let successCount = 0;
  for (let i = 0; i < invalidContacts.length; i++) {
    const c = invalidContacts[i];
    const ok = await deleteFromBrevo(c.email);
    if (ok) {
      successCount++;
      console.log(`[${i+1}/${invalidContacts.length}] Excluído: ${c.email}`);
    } else {
      console.log(`[${i+1}/${invalidContacts.length}] Falha ao excluir: ${c.email}`);
    }
  }
  
  console.log(`Limpeza finalizada! ${successCount} contatos removidos do Brevo com sucesso.`);
}

main().catch(console.error);
