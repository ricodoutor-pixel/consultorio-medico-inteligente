import * as fs from 'fs';
import * as path from 'path';

const targetFile = path.join(process.cwd(), 'scripts', 'prescritores_master_list.json');
let list = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));

for (let item of list) {
  if (item.nome.includes('<USER_REQUEST>') || item.nome.includes('<')) {
    item.nome = item.nome.replace(/<USER_REQUEST>/g, '').replace(/<[^>]*>/g, '').trim();
    if (!item.nome) {
      item.nome = "Ari da Silva Avelar";
    }
  }
}

fs.writeFileSync(targetFile, JSON.stringify(list, null, 2), 'utf-8');
console.log(`✅ Limpeza de tags concluída. Total de prescritores na base: ${list.length}`);
