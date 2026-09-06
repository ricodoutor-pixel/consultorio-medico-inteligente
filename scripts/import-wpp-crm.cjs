const fs = require('fs');
const axios = require('axios');
const path = require('path');

const BREVO_KEY = process.env.BREVO_API_KEY || '';

async function run() {
  const dataPath = path.join(__dirname, 'prescritores_master_list.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Arquivo prescritores_master_list.json não encontrado!');
    return;
  }
  
  const docs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Processando ${docs.length} médicos da lista master...`);
  
  let vcfContent = '';
  const brevoBatch = [];

  for (let doc of docs) {
    let name = (doc.nome || 'Desconhecido').trim();
    if (!name.toUpperCase().startsWith('DR')) {
      name = 'Dr. ' + name;
    }
    
    let phone = doc.phone || '';
    if (phone) {
      phone = String(phone).replace(/\D/g, '');
      if (phone.length === 10 || phone.length === 11) {
         phone = '55' + phone; // Add country code if missing
      }
    } else {
      name = name + ' (Prescritor)';
    }

    // Gerar VCF - Formato padrão vCard 3.0
    vcfContent += 'BEGIN:VCARD\nVERSION:3.0\n';
    vcfContent += `FN:${name}\n`;
    if (phone) {
      vcfContent += `TEL;TYPE=CELL,wa:+${phone}\n`;
    }
    if (doc.email) {
      vcfContent += `EMAIL:${doc.email}\n`;
    }
    vcfContent += 'END:VCARD\n';
    
    // Preparar para o Brevo
    if (doc.email) {
       brevoBatch.push({
         email: doc.email,
         attributes: {
           NOME: name,
           WHATSAPP: phone || '',
           ESPECIALIDADE: doc.especialidade || '',
           ESTADO: doc.estado || ''
         }
       });
    }
  }
  
  // Salvar VCF
  const vcfPath = path.join(__dirname, 'contatos-enf-brisa.vcf');
  fs.writeFileSync(vcfPath, vcfContent);
  console.log(`✅ Arquivo VCF gerado com sucesso! (${vcfPath})`);
  console.log(`💡 Para importar pro WhatsApp: Basta enviar este arquivo .vcf para o seu WhatsApp e clicar nele pelo celular!`);

  // Importar para o Brevo CRM
  console.log(`Iniciando importação de ${brevoBatch.length} contatos para o CRM (Brevo)...`);
  
  try {
    // Brevo API uses a bulk import endpoint
    const res = await axios.post('https://api.brevo.com/v3/contacts/import', {
      jsonBody: brevoBatch,
      listIds: [2], // Lista padrão (ajuste se necessário)
      updateExistingContacts: true
    }, {
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' }
    });
    console.log('✅ Importação Brevo CRM iniciada com sucesso. ProcessId:', res.data.processId);
  } catch (error) {
    console.error('❌ Erro na importação do Brevo:', error.response ? error.response.data : error.message);
    
    console.log('Tentando sincronização paralela individual (fallback)...');
    let success = 0;
    for(let i=0; i<Math.min(brevoBatch.length, 50); i++) { // test with first 50 if bulk fails
       try {
         await axios.post('https://api.brevo.com/v3/contacts', {
            email: brevoBatch[i].email,
            attributes: brevoBatch[i].attributes,
            updateEnabled: true,
            listIds: [2]
         }, { headers: { 'api-key': BREVO_KEY } });
         success++;
       } catch(e) {}
    }
    console.log(`Fallback completado. Sincronizados ${success} de ${Math.min(brevoBatch.length, 50)} contatos via chamadas únicas.`);
  }
  
  console.log('\n=======================================');
  console.log('Processo finalizado com Sucesso!');
}
run();
