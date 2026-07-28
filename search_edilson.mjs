import fs from 'fs';
import path from 'path';

function searchInDir(dir, query, results) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchInDir(fullPath, query, results);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.json') || fullPath.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        results.push(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

const results = [];
searchInDir('./src', 'Edilson', results);
fs.writeFileSync('C:\\Users\\ricod\\.gemini\\antigravity\\brain\\a2b71923-e690-4bd9-ac7f-9c514deba6aa\\scratch\\edilson_search.txt', results.join('\n'));
console.log('Done');
