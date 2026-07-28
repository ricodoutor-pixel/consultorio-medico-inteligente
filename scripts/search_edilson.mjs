import fs from 'fs';
import path from 'path';

function searchFiles(dir, query) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(fullPath, query));
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(query)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const dirToSearch = 'c:\\Users\\ricod\\Documents\\Planta y Raiz Ltda\\src';
console.log('Searching in:', dirToSearch);
const found = searchFiles(dirToSearch, 'Edilson');
console.log('Files containing "Edilson":');
console.log(found);
