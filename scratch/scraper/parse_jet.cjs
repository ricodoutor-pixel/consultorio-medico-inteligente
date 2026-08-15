const fs = require('fs');

function extractJetEngineData() {
  const html = fs.readFileSync('apepi_download.html', 'utf-8');
  
  // The structure is blocks starting with: <div class="jet-listing jet-listing-dynamic-field display-inline">
  // Let's use regex to extract blocks of doctor info
  const itemsRegex = /<div class="jet-listing-grid__item[^>]*>(.*?)<\/div><\/div><\/div>/gs;
  
  const matches = [...html.matchAll(itemsRegex)];
  console.log(`Found ${matches.length} grid items`);
  
  const doctors = [];
  
  // Alternative simpler approach: find all dynamic field contents
  const fieldRegex = /<div class="jet-listing-dynamic-field__content"[^>]*>(.*?)<\/div>/gs;
  const allFields = [...html.matchAll(fieldRegex)].map(m => m[1].trim());
  
  console.log(`Found ${allFields.length} dynamic fields`);
  
  // Fields usually come in groups: Name, CRM, Specialty, Phone, Email
  let currentDoc = {};
  
  for (let i = 0; i < allFields.length; i++) {
    const field = allFields[i];
    
    if (field.includes('CRM') || field.includes('CRO') || field.includes('CRMV')) {
      if (Object.keys(currentDoc).length > 0 && currentDoc.nome) {
         doctors.push({...currentDoc});
         currentDoc = {};
      }
      currentDoc.crm = field;
      
      // The previous field is usually the name
      if (i > 0 && !allFields[i-1].includes('CRM') && !allFields[i-1].includes('@') && !allFields[i-1].includes('http')) {
        currentDoc.nome = allFields[i-1];
      }
    }
    else if (field.includes('@')) {
      currentDoc.email = field;
    }
    else if (/^\d{8,11}$/.test(field) || /\(\d{2}\)/.test(field) || field.includes('-')) {
      if (!field.includes('CRM') && !field.includes('@') && !field.includes('<')) {
        currentDoc.telefone = field;
      }
    }
    else if (!field.includes('<') && field.length > 5 && field.length < 50) {
       // Could be specialty or state
       if (field === 'Online' || field.includes('Tele')) {
         currentDoc.modalidade = field;
       } else if (!currentDoc.nome && !field.includes('CRM')) {
         // might be a name if we didn't catch it
       } else if (!currentDoc.especialidade) {
         currentDoc.especialidade = field;
       }
    }
  }
  
  if (Object.keys(currentDoc).length > 0) {
    doctors.push(currentDoc);
  }
  
  console.log(`Extracted ${doctors.length} doctors roughly.`);
  fs.writeFileSync('apepi_doctors.json', JSON.stringify(doctors, null, 2));
}

extractJetEngineData();
