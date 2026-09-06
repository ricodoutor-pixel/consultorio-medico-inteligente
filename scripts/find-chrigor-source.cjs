const fs = require('fs');
const path = require('path');

function searchAllFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.gemini') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchAllFiles(fullPath);
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('chrigorkayk71@gmail.com') || content.toLowerCase().includes('chrigor kayk')) {
          console.log(`[MATCH FOUND] File: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((l, i) => {
            if (l.includes('chrigorkayk71@gmail.com') || l.toLowerCase().includes('chrigor kayk')) {
              console.log(`  Line ${i+1}: ${l}`);
            }
          });
        }
      } catch (e) {}
    }
  }
}

searchAllFiles('.');
