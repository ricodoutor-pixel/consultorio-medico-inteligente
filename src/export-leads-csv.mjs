// 🌿 Planta y Raiz — Exportador de Leads Médicos para CSV e Texto Copia e Cola
import fs from 'fs';
import path from 'path';

const JSON_FILE = path.resolve('./mined_doctor_leads_500.json');
const CSV_FILE = path.resolve('./lista_500_medicos_qualificados.csv');
const TXT_FILE = path.resolve('./lista_500_medicos_qualificados.txt');

const leads = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));

// 1. Gera CSV (compatível com Excel / Google Sheets)
const csvHeader = "Nome;Telefone;WhatsApp;Email;Especialidade;Cidade;Estado;Fonte\n";
const csvRows = leads.map(l => {
  return `"${l.name}";"${l.phone}";"https://wa.me/${l.phone}";"${l.email}";"${l.specialty}";"${l.city}";"${l.state}";"${l.source}"`;
}).join('\n');

fs.writeFileSync(CSV_FILE, '\ufeff' + csvHeader + csvRows, 'utf-8');

// 2. Gera formato texto limpo de fácil leitura
const txtContent = leads.map((l, i) => {
  return `${i + 1}. ${l.name} | WhatsApp: +${l.phone} | E-mail: ${l.email} | Especialidade: ${l.specialty} | Local: ${l.city}/${l.state}`;
}).join('\n');

fs.writeFileSync(TXT_FILE, txtContent, 'utf-8');

console.log(`✅ Arquivos exportados com sucesso!`);
console.log(`- CSV: ${CSV_FILE}`);
console.log(`- TXT: ${TXT_FILE}`);
