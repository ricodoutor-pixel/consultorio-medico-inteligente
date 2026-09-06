const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/professionals.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace mock-suelen block
const targetRegex = /id:\s*"mock-suelen"[\s\S]*?services:\s*\[/;
const replacement = `id: "mock-suelen",
    name: "Dra. Suelen Naves Rodrigues",
    category: "Médicos Prescritores",
    bio: "Supervisora Técnica da Planta y Raíz Ltda e Médica Prescritora com atendimento humanizado e individualizado. Prescrição de cannabis medicinal baseada em evidências científicas, com foco na qualidade de vida, bem-estar e cuidado integral do paciente.",
    experience: "8 anos",
    tags: ["Supervisora Técnica", "Cannabis Medicinal", "Qualidade de Vida", "Cuidado Integral"],
    price: "R$ 100,00",
    priceValue: 100,
    paymentLink: "https://mpago.la/12KAwmH",
    whatsapp: "5511991363154",
    rating: 4.9,
    consults: 185,
    avatar: "SR",
    imageUrl: draSuelenImg,
    crm: "49354 - PR",
    flags: ["🇧🇷"],
    online: false,
    plan_tier: "premium",
    services: [`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Dra. Suelen updated successfully in professionals.ts!');
} else {
  console.error('❌ Could not match mock-suelen in professionals.ts');
}
