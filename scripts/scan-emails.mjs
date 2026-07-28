// scripts/scan-emails.mjs
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

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const results = [];

walkDir(rootDir, (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.pdf', '.lockb'].includes(ext)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = emailRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const line = content.split('\n')[lineNum - 1].trim();
      results.push({
        file: path.relative(rootDir, filePath),
        lineNum,
        email: match[0],
        lineContent: line
      });
    }
  } catch (e) {
    // Ignore read errors
  }
});

console.log(`Found ${results.length} email references:`);
results.forEach(r => {
  console.log(`${r.file}:${r.lineNum} -> Email: ${r.email} | Line: ${r.lineContent.slice(0, 150)}`);
});
