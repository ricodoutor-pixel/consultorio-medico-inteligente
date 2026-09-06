const fs = require('fs');
let c = fs.readFileSync('vite.config.ts', 'utf8');
c = c.replace('target: "es2020",', 'target: ["es2020", "safari13", "ios13"],');
fs.writeFileSync('vite.config.ts', c);
console.log('Fixed vite config');
