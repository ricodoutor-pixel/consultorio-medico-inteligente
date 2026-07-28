import fs from 'fs';
import path from 'path';

function searchFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(fullPath));
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('técnic') && content.toLowerCase().includes('edilson')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const dirToSearch = 'c:\\Users\\ricod\\Documents\\Planta y Raiz Ltda\\src';
const found = searchFiles(dirToSearch);
console.log('Files containing "Técnic" and "Edilson":');
console.log(found);
