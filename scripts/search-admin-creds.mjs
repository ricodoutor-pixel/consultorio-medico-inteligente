// scripts/search-admin-creds.mjs
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

const results = [];

walkDir(rootDir, (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.pdf', '.lockb'].includes(ext)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.toLowerCase().includes('admin') && (content.toLowerCase().includes('pass') || content.toLowerCase().includes('email') || content.toLowerCase().includes('secret'))) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const lower = line.toLowerCase();
        if (lower.includes('admin') && (lower.includes('pass') || lower.includes('email') || lower.includes('secret') || lower.includes('@'))) {
          results.push({
            file: path.relative(rootDir, filePath),
            lineNum: index + 1,
            lineContent: line.trim()
          });
        }
      });
    }
  } catch (e) {
    // Ignore read errors
  }
});

console.log(`Found ${results.length} occurrences:`);
results.forEach(r => {
  console.log(`${r.file}:${r.lineNum} -> ${r.lineContent.slice(0, 150)}`);
});
