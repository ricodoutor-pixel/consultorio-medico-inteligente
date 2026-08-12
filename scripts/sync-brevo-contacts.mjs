import fs from 'fs/promises';
import path from 'path';

// Chave da API vem das variáveis de ambiente para segurança (GitHub)
const API_KEY = process.env.BREVO_API_KEY;

if (!API_KEY) {
  console.error("❌ ERRO: A variável de ambiente BREVO_API_KEY não está definida.");
  console.error("Execute o comando assim: $env:BREVO_API_KEY='sua_chave'; node scripts/sync-brevo-contacts.mjs");
  process.exit(1);
}

const FILE_PATH = path.join(process.cwd(), 'mined_doctor_leads_part2.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("🚀 Iniciando sincronização da lista de médicos com o CRM da Brevo...");

  let leads = [];
  try {
    const fileData = await fs.readFile(FILE_PATH, 'utf-8');
    leads = JSON.parse(fileData);
    console.log(`✅ ${leads.length} leads carregados com sucesso.`);
  } catch (err) {
    console.error("❌ Erro ao ler a lista:", err.message);
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    if (!lead.email || lead.email.toLowerCase() === "n/a" || !lead.email.includes("@")) {
      console.log(`⚠️ Ignorando ${lead.name} - E-mail inválido`);
      continue;
    }

    // Formatar telefone para o padrão E.164 (Ex: +5511999999999) exigido pela Brevo para o atributo SMS
    let phone = lead.phone || "";
    // Remove tudo que não for número
    phone = phone.replace(/\D/g, "");
    
    // Se tiver código de país 55, adiciona o +, senão apenas valida
    if (phone && phone.startsWith("55")) {
      phone = "+" + phone;
    } else if (phone) {
      // Assume Brasil se não tiver o 55
      phone = "+55" + phone;
    }

    // Atributos padrão da Brevo: NOME (Nome), SMS (Celular).
    // Podemos tentar enviar atributos customizados, mas a Brevo exige que eles existam no painel.
    // Vamos usar atributos em CAIXA ALTA (padrão da Brevo)
    const payload = {
      email: lead.email,
      attributes: {
        NOME: lead.name,
        // O campo de celular na Brevo se chama SMS por padrão
        ...(phone.length > 9 ? { SMS: phone } : {})
      },
      // Habilita atualizar caso o contato já exista na lista
      updateEnabled: true,
      // 2 é normalmente a ID da primeira lista ("Sua primeira lista"), mas não é obrigatório
      // listIds: [2] 
    };

    console.log(`⏳ Sincronizando ${lead.name} (${lead.email})...`);

    try {
      const response = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 204) {
        console.log(`✅ ${lead.name} sincronizado no CRM!`);
        successCount++;
      } else {
        const errData = await response.json();
        console.error(`❌ Falha em ${lead.email}:`, errData.message);
        errorCount++;
      }
    } catch (err) {
      console.error(`❌ Erro de rede em ${lead.email}:`, err.message);
      errorCount++;
    }

    // Delay curto (400ms) para respeitar os limites de taxa da API da Brevo
    await sleep(400);
  }

  console.log(`\n🎉 Sincronização Concluída!`);
  console.log(`📈 Sucesso: ${successCount}`);
  console.log(`📉 Erros: ${errorCount}`);
  console.log(`Acesse o painel "Contatos" na Brevo para visualizar a lista completa.`);
}

run();
