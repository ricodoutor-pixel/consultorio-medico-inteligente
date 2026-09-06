const axios = require('axios');
const fs = require('fs');
const BREVO_KEY = process.env.BREVO_API_KEY || '';

async function run() {
  try {
    let limit = 100;
    let offset = 0;
    let emails = new Set();
    
    console.log('Fetching bounces from Brevo...');
    while(true) {
      const res = await axios.get('https://api.brevo.com/v3/smtp/statistics/events?event=bounces&limit=100&offset=' + offset, {
        headers: { 'api-key': BREVO_KEY }
      });
      const events = res.data.events || [];
      if (events.length === 0) break;
      events.forEach(e => emails.add(e.email));
      offset += 100;
      if (events.length < 100) break;
    }
    
    const emailList = Array.from(emails);
    console.log('Encontrados ' + emailList.length + ' emails com bounce (inválidos/cheios).');
    
    let sql = '-- Script para remover emails inválidos do banco de dados (auth.users)\n';
    sql += 'DELETE FROM auth.users WHERE email IN (\n';
    sql += emailList.map(e => `  '${e}'`).join(',\n');
    sql += '\n);\n';
    
    fs.writeFileSync('limpar-bounces.sql', sql);
    console.log('Arquivo limpar-bounces.sql gerado com sucesso!');
    
    console.log('Adicionando emails ao Blocklist (Block) no Brevo para higienizar a lista...');
    let blockedCount = 0;
    for(let em of emailList) {
       try {
         await axios.put(`https://api.brevo.com/v3/contacts/${encodeURIComponent(em)}`, { emailBlacklisted: true }, { headers: { 'api-key': BREVO_KEY } });
         blockedCount++;
       } catch(e) {
         // Silently ignore if contact doesn't exist in Brevo CRM
       }
    }
    console.log(`Foram blocklisted ${blockedCount} contatos no Brevo CRM.`);
  } catch (e) { 
    console.error(e.response ? e.response.data : e.message); 
  }
}
run();
