// scripts/search-code.mjs
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

const searchStr = 'doctors';
const results = [];

walkDir(rootDir, (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchStr)) {
      // Find lines with doctors
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('from(') && line.includes('doctors')) {
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
  console.log(`${r.file}:${r.lineNum} -> ${r.lineContent}`);
});
