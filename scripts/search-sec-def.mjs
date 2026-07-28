// scripts/search-sec-def.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../supabase/migrations');

const results = [];
fs.readdirSync(migrationsDir).forEach(file => {
  if (file.endsWith('.sql')) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('SECURITY DEFINER')) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE FUNCTION')) {
          results.push({ file, lineNum: idx+1, lineContent: line.trim() });
        }
      });
    }
  }
});

console.log(`Found ${results.length} security definer functions:`);
results.forEach(r => {
  console.log(`${r.file}:${r.lineNum} -> ${r.lineContent}`);
});
