// scripts/read-types-doctors.mjs
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

// Find the segment containing the doctors table definition
const searchStr = 'doctors: {';
const index = content.indexOf(searchStr);
if (index === -1) {
  console.log("Could not find doctors: { in types.ts");
} else {
  console.log("Found doctors table definition:");
  console.log(content.slice(index, index + 1500));
}
