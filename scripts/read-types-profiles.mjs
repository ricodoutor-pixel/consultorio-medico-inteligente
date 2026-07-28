// scripts/read-types-profiles.mjs
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

const searchStr = 'doctors_public: {';
const index = content.indexOf(searchStr);
if (index === -1) {
  console.log("Could not find doctors_public: { in types.ts");
} else {
  console.log("Found doctors_public table definition:");
  console.log(content.slice(index, index + 1000));
}
