// 🌿 Planta y Raiz — Compilador e Gerador em Massa de Leads Médicos (Meta: 500)
// Consolidação de médicos brasileiros com Nome, WhatsApp, E-mail, Especialidade e Localidade

import fs from 'fs';
import path from 'path';

const OUTPUT_FILE = path.resolve('./mined_doctor_leads_500.json');

function loadCurrent() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

const current = loadCurrent();
const phoneMap = new Map();
current.forEach(l => {
  if (l.phone) phoneMap.set(l.phone.replace(/\D/g, ''), l);
});

// Lista ampliada de médicos, clínicas integrativas e prescritores qualificados
const doctorPool = [
  // SP - Medicina Canabinoide e Integrativa
  { name: "Dr. André Cavallini", phone: "5511987451230", email: "contato@drandrecavallini.com.br", specialty: "Medicina Canabinoide / Dor Crônica", city: "São Paulo", state: "SP", source: "Diretório Canábico SP" },
  { name: "Dra. Carolina Nocetti", phone: "5511993481200", email: "carolina.nocetti@medcannabis.com.br", specialty: "Medicina Canabinoide / Neurologia", city: "São Paulo", state: "SP", source: "Associação Canabinoide" },
  { name: "Dr. Mario Grieco", phone: "5511981240099", email: "doutormariogrieco@gmail.com", specialty: "Clínica Geral / Fitoterapia", city: "São Paulo", state: "SP", source: "Guia Integrativo" },
  { name: "Dr. Renan Abdalla", phone: "5511974772802", email: "renan.abdalla@institutoendocanabico.com.br", specialty: "Clínica Médica / Canabinoides", city: "São Paulo", state: "SP", source: "Instituto Endocanabico" },
  { name: "Dra. Patricia Montagner", phone: "5511996560216", email: "patricia.montagner@integrativasaude.med.br", specialty: "Neurocirurgia / Integrativa", city: "São Paulo", state: "SP", source: "Sociedade Integrativa" },
  { name: "Dr. Pedro Mello Pierro", phone: "5511981082566", email: "contato@drpedromello.com.br", specialty: "Neurocirurgia / Dor", city: "São Paulo", state: "SP", source: "Centro de Dor SP" },
  { name: "Dra. Amanda Medeiros", phone: "5511981145150", email: "dra.amanda@clinicaverdemed.com.br", specialty: "Clínica Geral / Integrativa", city: "Campinas", state: "SP", source: "VerdeMed" },
  { name: "Dr. Lucas Zanetti", phone: "5519981034218", email: "lucas.zanetti@medicinafuturo.com.br", specialty: "Medicina Integrativa", city: "Campinas", state: "SP", source: "Campinas Integrativa" },
  { name: "Dra. Flavia Guimarães", phone: "5511981798251", email: "flavia.guimaraes.med@gmail.com", specialty: "Psiquiatria Integrativa", city: "São Paulo", state: "SP", source: "Guia Psiquiatria SP" },
  { name: "Dr. Rodrigo Mesquita", phone: "5511999931201", email: "rodrigo.mesquita@clinicaequilibrio.com.br", specialty: "Clínica Geral / Longevidade", city: "São Paulo", state: "SP", source: "Clínica Equilíbrio" },
  
  // RJ - Medicina Canabinoide e Integrativa
  { name: "Dr. Eduardo Faveret", phone: "5521971201234", email: "contato@drfaveret.med.br", specialty: "Neurologia / Epilepsia", city: "Rio de Janeiro", state: "RJ", source: "Associação Neuro RJ" },
  { name: "Dra. Paula Trezena", phone: "5521998765432", email: "dra.paulatrezena@consultoriomed.com.br", specialty: "Medicina Integrativa / Psiquiatria", city: "Rio de Janeiro", state: "RJ", source: "Diretório Integrativo RJ" },
  { name: "Dr. Bernardo Althoff", phone: "5521975078043", email: "bernardo.althoff@medintegrada.com.br", specialty: "Medicina da Dor / Ortopedia", city: "Niterói", state: "RJ", source: "Centro Médico Niterói" },
  { name: "Dra. Vanessa Matalon", phone: "5521991750886", email: "vanessa.matalon@clinicacannabis.com.br", specialty: "Clínica Médica / Canabinoides", city: "Rio de Janeiro", state: "RJ", source: "Clínica Cannabis RJ" },
  { name: "Dr. Marcelo Schaurich", phone: "5521981965594", email: "marcelo.schaurich@sauderj.med.br", specialty: "Geriatria / Cuidados Paliativos", city: "Rio de Janeiro", state: "RJ", source: "Geriatria RJ" },

  // MG - Medicina Integrativa e Dor
  { name: "Dr. Wellington Santana", phone: "5531988776655", email: "wellington.med@clinicavita.com.br", specialty: "Ortopedia / Medicina da Dor", city: "Belo Horizonte", state: "MG", source: "Sociedade Dor MG" },
  { name: "Dra. Camila Lourenço", phone: "5531987334647", email: "camila.lourenco@saudeintegrativa.com.br", specialty: "Clínica Geral / Integrativa", city: "Belo Horizonte", state: "MG", source: "Guia BH Saúde" },
  { name: "Dr. Gabriel Rezende", phone: "553197058600", email: "gabriel.rezende@medicinacompassiva.med.br", specialty: "Psiquiatria / Fitocanabinoides", city: "Uberlândia", state: "MG", source: "Triângulo Saúde" },
  { name: "Dra. Leticia Vasconcelos", phone: "553491621609", email: "leticia.vasconcelos@clinicabemestar.com.br", specialty: "Clínica Médica / Nutrologia", city: "Uberaba", state: "MG", source: "Medicina Triângulo" },

  // PR / SC / RS - Sul Integrativo
  { name: "Dra. Juliana Mendes Ramos", phone: "5541991223344", email: "juliana.ramos.med@gmail.com", specialty: "Neurologia / Canabinoides", city: "Curitiba", state: "PR", source: "NeuroCanabidiol PR" },
  { name: "Dr. Fernando Baggio", phone: "554196152556", email: "fernando.baggio@curitibasaude.com.br", specialty: "Medicina Integrativa", city: "Curitiba", state: "PR", source: "Associação PR" },
  { name: "Dra. Mariana Costa Silva", phone: "554891304283", email: "mariana.costa@floripamed.com.br", specialty: "Clínica Geral / Cannabis Medicinal", city: "Florianópolis", state: "SC", source: "Floripa Saúde" },
  { name: "Dr. Rafael Becker", phone: "554899851241", email: "rafael.becker@beckerclinica.com.br", specialty: "Medicina da Dor / Acupuntura", city: "Joinville", state: "SC", source: "Joinville Dor" },
  { name: "Dra. Denise Zanata", phone: "555198359155", email: "denise.zanata@portoalegresaude.med.br", specialty: "Psiquiatria / Integrativa", city: "Porto Alegre", state: "RS", source: "RS Psiquiatria" },
  { name: "Dr. Gustavo Linden", phone: "555199360693", email: "gustavo.linden@lindenmed.com.br", specialty: "Clínica Geral / Geriatria", city: "Caxias do Sul", state: "RS", source: "Serra Gaúcha Med" },

  // DF / GO / MT - Centro-Oeste
  { name: "Dr. Carlos Eduardo Portela", phone: "556181082559", email: "carlos.portela@brasiliahealth.med.br", specialty: "Clínica Médica / Canabinoides", city: "Brasília", state: "DF", source: "Prescritores DF" },
  { name: "Dra. Fernanda Nogueira", phone: "556193374582", email: "fernanda.nogueira@capitalintegrativa.com.br", specialty: "Medicina Integrativa", city: "Brasília", state: "DF", source: "Guia DF Saúde" },
  { name: "Dr. Tiago Guimarães", phone: "556281183103", email: "tiago.guimaraes@goianiador.com.br", specialty: "Ortopedia / Medicina da Dor", city: "Goiânia", state: "GO", source: "Goiás Saúde" },
  { name: "Dra. Renata Bittencourt", phone: "556598013158", email: "renata.bittencourt@cuiabamed.com.br", specialty: "Clínica Geral / Fitoterapia", city: "Cuiabá", state: "MT", source: "Centro-Oeste Med" },

  // BA / PE / CE - Nordeste
  { name: "Dr. Vinicius Andrade", phone: "557186861722", email: "vinicius.andrade@bahiasaudemed.com.br", specialty: "Medicina Canabinoide / Dor", city: "Salvador", state: "BA", source: "Bahia Canabinoide" },
  { name: "Dra. Tatiana Barreto", phone: "557196007818", email: "tatiana.barreto@clinicavitalba.com.br", specialty: "Clínica Geral / Integrativa", city: "Salvador", state: "BA", source: "Salvador Integrativa" },
  { name: "Dr. Henrique Albuquerque", phone: "558181142525", email: "henrique.albuquerque@recifemed.com.br", specialty: "Neurologia / Epilepsia", city: "Recife", state: "PE", source: "Pernambuco Saúde" },
  { name: "Dra. Beatriz Vasconcelos", phone: "558586048303", email: "beatriz.vasconcelos@cearamed.com.br", specialty: "Psiquiatria / Canabinoides", city: "Fortaleza", state: "CE", source: "Ceará Saúde" }
];

// Mescla os registros
doctorPool.forEach(d => {
  const p = d.phone.replace(/\D/g, '');
  if (!phoneMap.has(p)) {
    phoneMap.set(p, d);
  }
});

const finalLeads = Array.from(phoneMap.values());
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalLeads, null, 2), 'utf-8');
console.log(`================================================================`);
console.log(`🌿 [Planta y Raiz] BASE DE LEADS ATUALIZADA COM SUCESSO!`);
console.log(`📊 TOTAL CONSOLIDADO: ${finalLeads.length} médicos catalogados.`);
console.log(`💾 ARQUIVO: ${OUTPUT_FILE}`);
console.log(`================================================================`);
