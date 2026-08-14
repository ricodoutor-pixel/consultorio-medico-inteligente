import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

async function testImport() {
  const payload = {
    email: 'vanessahashimoto@gmail.com', // One of the emails from the last batch
    attributes: {
      FIRSTNAME:  'Vanessa',
      LASTNAME:   'Hashimoto',
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
  console.log('Status:', res.status);
  console.log('Response:', text);
}

testImport().catch(console.error);
