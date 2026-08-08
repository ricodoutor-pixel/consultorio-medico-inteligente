import * as fs from 'fs';
import * as path from 'path';

const targetFile = path.join(process.cwd(), 'scripts', 'prescritores_master_list.json');
let list = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));

let withEmail = list.filter(i => i.email && i.email.includes('@'));
let withPhone = list.filter(i => i.phone && i.phone.startsWith('55'));

console.log(`📊 Estatísticas da Nova Base Master Integrada:`);
console.log(`- Total de Prescritores Únicos Processados: ${list.length}`);
console.log(`- Com E-mail Válido para Disparo E-mail: ${withEmail.length}`);
console.log(`- Com WhatsApp Válido (DDD + 55): ${withPhone.length}`);
