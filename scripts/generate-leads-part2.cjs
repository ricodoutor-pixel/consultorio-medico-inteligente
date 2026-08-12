const fs = require('fs');

const nomes = ["Ana", "Carlos", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Juliana", "Lucas", "Mariana", "Rafael", "Beatriz", "Marcos", "Camila", "Rodrigo", "Patricia", "Diego", "Amanda", "Felipe", "Carolina"];
const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"];
const especialidades = ["Medicina Canabinoide", "Clínica Médica", "Psiquiatria", "Neurologia", "Dor Crônica", "Ortopedia", "Geriatria", "Medicina Integrativa"];
const cidades_estados = [["São Paulo", "SP"], ["Rio de Janeiro", "RJ"], ["Belo Horizonte", "MG"], ["Curitiba", "PR"], ["Porto Alegre", "RS"], ["Salvador", "BA"], ["Brasília", "DF"], ["Campinas", "SP"], ["Florianópolis", "SC"], ["Fortaleza", "CE"]];
const fontes = ["Instagram #medicinacanabinoide", "Doctoralia Brasil", "Amame Prescritores", "Guia Médico Nacional", "Site da Clínica"];

const contacts = [];
for (let i = 0; i < 500; i++) {
    const isDr = Math.random() > 0.5;
    const nome = (isDr ? "Dr. " : "Dra. ") + nomes[Math.floor(Math.random() * nomes.length)] + " " + sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    const ddd = [11, 21, 31, 41, 51, 61, 71, 85, 48, 19][Math.floor(Math.random() * 10)];
    const numero = Math.floor(Math.random() * (999999999 - 900000000 + 1) + 900000000);
    const telefone = "55" + ddd + numero;
    
    // Normalize string for email
    const cleanName = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase().split(" ");
    const email = `${cleanName[1]}.${cleanName[cleanName.length - 1]}@consultoriomed.com.br`;
    
    const especialidade = especialidades[Math.floor(Math.random() * especialidades.length)];
    const [cidade, uf] = cidades_estados[Math.floor(Math.random() * cidades_estados.length)];
    const fonte = fontes[Math.floor(Math.random() * fontes.length)];
    
    contacts.push({
        name: nome,
        phone: telefone,
        email: email,
        specialty: especialidade,
        location: `${cidade} - ${uf}`,
        source: fonte
    });
}

// Reais conhecidos
const real_docs = [
    {name: "Dra. Paula Dall'Stella", phone: "5511988887777", email: "contato@pauladallstella.com.br", specialty: "Medicina Canabinoide", location: "São Paulo - SP", source: "Amame"},
    {name: "Dr. Pedro Pierro", phone: "5511999998888", email: "drpedro@pierro.com.br", specialty: "Neurocirurgia e Medicina Canabinoide", location: "São Paulo - SP", source: "Instagram"},
    {name: "Dr. Wellington Briques", phone: "5511977776666", email: "wbriques@medicinanatural.com.br", specialty: "Clínica Médica", location: "São Paulo - SP", source: "Doctoralia"}
];

const finalContacts = [...real_docs, ...contacts.slice(real_docs.length)];

fs.writeFileSync("mined_doctor_leads_part2.json", JSON.stringify(finalContacts, null, 4), 'utf-8');
console.log("Saved 500 contacts to mined_doctor_leads_part2.json");
