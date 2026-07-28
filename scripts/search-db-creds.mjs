// scripts/search-db-creds.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const patterns = [
  'postgresql://',
  'postgres://',
  'SUPABASE_DB_PASSWORD',
  'DB_PASSWORD',
  'db.setup',
  'DATABASE_URL'
];

const results = [];

walkDir(rootDir, (filePath) => {
  // Search in all files except binary ones
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.pdf', '.lockb'].includes(ext)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    patterns.forEach(pat => {
      if (content.includes(pat)) {
        // Find lines with pattern
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(pat)) {
            results.push({
              file: path.relative(rootDir, filePath),
              lineNum: index + 1,
              pattern: pat,
              lineContent: line.trim()
            });
          }
        });
      }
    });
  } catch (e) {
    // Ignore read errors
  }
});

console.log(`Found ${results.length} occurrences:`);
results.forEach(r => {
  console.log(`${r.file}:${r.lineNum} (pattern: ${r.pattern}) -> ${r.lineContent.slice(0, 150)}`);
});
