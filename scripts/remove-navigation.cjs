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
console.log(`Checking ${files.length} files in src/ for Navigation imports...`);

let updatedCount = 0;

for (const file of files) {
  if (file.endsWith('Navigation.tsx')) continue;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('@/components/Navigation') || content.includes('./Navigation') || content.includes('../Navigation')) {
    console.log(`Found Navigation in: ${path.relative(process.cwd(), file)}`);
    content = content.replace(/@\/components\/Navigation/g, '@/components/Navbar');
    content = content.replace(/import\s+{\s*Navigation\s*}\s*from/g, 'import { Navbar as Navigation } from');
    content = content.replace(/import\s+Navigation\s+from/g, 'import { Navbar as Navigation } from');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`✅ Updated Navigation import in ${path.relative(process.cwd(), file)}`);
  }
}

// Remove src/components/Navigation.tsx
const navPath = path.join(__dirname, '..', 'src', 'components', 'Navigation.tsx');
if (fs.existsSync(navPath)) {
  fs.unlinkSync(navPath);
  console.log('🗑️ Deleted src/components/Navigation.tsx');
}

// Also remove old open-graph files
const og1 = path.join(__dirname, '..', 'src', 'lib', 'open-graph.ts');
const og2 = path.join(__dirname, '..', 'src', 'lib', 'open-graph-expanded.ts');
if (fs.existsSync(og1)) {
  fs.unlinkSync(og1);
  console.log('🗑️ Deleted src/lib/open-graph.ts');
}
if (fs.existsSync(og2)) {
  fs.unlinkSync(og2);
  console.log('🗑️ Deleted src/lib/open-graph-expanded.ts');
}

console.log(`\nNavigation migration completed (${updatedCount} files updated).`);
