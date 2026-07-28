// scripts/search-migrations-inserts.mjs
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
    if (content.toLowerCase().includes('insert') && (content.toLowerCase().includes('auth.users') || content.toLowerCase().includes('profiles') || content.toLowerCase().includes('doctors'))) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        if (lower.includes('insert') && (lower.includes('auth.users') || lower.includes('profiles') || lower.includes('doctors'))) {
          results.push({ file, lineNum: idx+1, lineContent: line.trim() });
        }
      });
    }
  }
});

console.log(`Found ${results.length} inserts:`);
results.forEach(r => {
  console.log(`${r.file}:${r.lineNum} -> ${r.lineContent.slice(0, 150)}`);
});
