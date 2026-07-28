// scripts/search-get-doctor-display.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../supabase/migrations');

fs.readdirSync(migrationsDir).forEach(file => {
  if (file.endsWith('.sql')) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('get_doctor_display')) {
      console.log(`Found in: ${file}`);
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('get_doctor_display')) {
          console.log(`  Line ${idx+1}: ${line.trim()}`);
        }
      });
    }
  }
});
