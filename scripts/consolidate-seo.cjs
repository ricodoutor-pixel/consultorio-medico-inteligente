const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(walk(filePath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '..', 'src'));
console.log(`Checking ${files.length} files in src/ for SEO imports...`);

let modifiedCount = 0;

for (const file of files) {
  // Don't modify the SEO files themselves while inspecting
  if (file.includes('open-graph') || file.includes('schema-org')) continue;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace open-graph and open-graph-expanded with open-graph-complete
  if (content.includes('@/lib/open-graph"') || content.includes('@/lib/open-graph\'')) {
    content = content.replace(/@\/lib\/open-graph(['"])/g, '@/lib/open-graph-complete$1');
    changed = true;
  }
  if (content.includes('@/lib/open-graph-expanded')) {
    content = content.replace(/@\/lib\/open-graph-expanded/g, '@/lib/open-graph-complete');
    changed = true;
  }

  // Check schema-org-complete -> schema-org if needed
  if (content.includes('@/lib/schema-org-complete')) {
    // Check what is imported
    console.log(`File ${file} imports schema-org-complete`);
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`✅ Updated imports in ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\nUpdated ${modifiedCount} files.`);
