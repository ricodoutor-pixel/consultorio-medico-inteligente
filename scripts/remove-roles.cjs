const fs = require('fs');

let c = fs.readFileSync('src/pages/Cadastro.tsx', 'utf8');

const produtorMatch = /{ id: "produtor"[\s\S]*?},/;
const profissionalMatch = /{ id: "profissional"[\s\S]*?},/;
c = c.replace(produtorMatch, '');
c = c.replace(profissionalMatch, '');

fs.writeFileSync('src/pages/Cadastro.tsx', c);
console.log('Removed extra roles');
