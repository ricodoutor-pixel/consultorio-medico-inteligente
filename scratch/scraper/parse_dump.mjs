import fs from 'fs';

function parseDoctors() {
  const text = fs.readFileSync("apepi_dump.txt", "utf-8");
  
  // Split by "---"
  const blocks = text.split("---").map(b => b.trim()).filter(b => b.length > 10);
  
  const doctors = [];
  
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let nome = "";
    let email = "";
    let telefone = "";
    let especialidade = "";
    let cidade = "";
    let crm = "";
    
    // Simple heuristic
    nome = lines[0]; // Usually the first line is the name
    
    for (const line of lines) {
      if (line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
        email = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)[0];
      }
      if (line.includes('Especialidade:')) {
        especialidade = line.replace('Especialidade:', '').trim();
      } else if (!especialidade && /pediatra|clínica|psiquiatra|nutricionista|médic|dor|ortoped/i.test(line)) {
        especialidade = line;
      }
      
      if (line.includes('CRM') || line.includes('CRO') || line.includes('CRMV')) {
        crm = line;
      }
      
      if (line.includes('Telefone') || line.includes('WhatsApp')) {
        telefone = line.replace(/Telefone:|WhatsApp:/gi, '').trim();
      } else if (!telefone && /\(\d{2}\)\s*\d{4,5}-\d{4}/.test(line)) {
        telefone = line.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)[0];
      }
      
      if (line.includes('- SP') || line.includes('- RJ') || line.includes('- MG')) {
         // rough city parsing
         cidade = line;
      }
    }
    
    if (email || telefone || crm) {
       doctors.push({
         nome, email, telefone, especialidade, cidade, crm
       });
    }
  }
  
  console.log(`Parsed ${doctors.length} doctors.`);
  fs.writeFileSync("../apepi_parsed.json", JSON.stringify(doctors, null, 2));
}

parseDoctors();
