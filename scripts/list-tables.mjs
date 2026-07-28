// scripts/list-tables.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const typesPath = path.resolve(__dirname, '../src/integrations/supabase/types.ts');

if (!fs.existsSync(typesPath)) {
  console.error("types.ts not found!");
  process.exit(1);
}

const content = fs.readFileSync(typesPath, 'utf8');

// Match all tables under Database["public"]["Tables"]
const regex = /(\w+):\s*\{\s*Row:/g;
let match;
const tables = [];
while ((match = regex.exec(content)) !== null) {
  tables.push(match[1]);
}

console.log("Tables found:", tables.join(', '));
