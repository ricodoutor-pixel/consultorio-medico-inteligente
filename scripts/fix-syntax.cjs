const fs = require('fs');
let c = fs.readFileSync('src/pages/Cadastro.tsx', 'utf8');

c = c.replace(/Ao continuar, você aceita os Termos LGPD e autoriza captura de localização para emergências\.\r?\n\s*<\/p>\r?\n\s*<\/div>/g, 
  "Ao continuar, você aceita os Termos LGPD e autoriza captura de localização para emergências.\n                </p>\n              </div>\n              </>\n              )}"
);

fs.writeFileSync('src/pages/Cadastro.tsx', c);
console.log('Fixed closing tags in Cadastro.tsx');
