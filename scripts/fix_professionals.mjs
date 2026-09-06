import fs from 'fs';

const file = 'src/data/professionals.ts';
let content = fs.readFileSync(file, 'utf8');

// Find the corrupt lines around 126-129 and replace the broken content
// The broken section starts with `{ name: "Consulta por Vídeo"` at line 126 that should be inside STANDARD_DOCTOR_SERVICES
// Let's find that corrupt fragment and put the proper structure

// The file is missing STANDARD_DOCTOR_SERVICES export and the categories array after duplicated Professional type
// Let's find the second export type Professional and remove it, and add what's missing

const COUNCIL_CONFIG = `
/** Configuração dinâmica de Conselho por categoria */
export const COUNCIL_CONFIG: Record<string, {
  councilLabel: string;
  councilFull: string;
  councilPlaceholder: string;
  docFrentLabel: string;
  specialtyLabel: string;
  specialtyPlaceholder: string;
  areas: string[];
}> = {
  "Médicos Prescritores": {
    councilLabel: "CRM",
    councilFull: "Conselho Regional de Medicina",
    councilPlaceholder: "123456",
    docFrentLabel: "CRM — frente",
    specialtyLabel: "Especialidade Médica",
    specialtyPlaceholder: "Ex: Clínica Geral, Neurologia, Ortopedia",
    areas: ["Clínica Geral","Neurologia","Psiquiatria","Oncologia","Ortopedia","Geriatria","Medicina de Família","Medicina do Trabalho","Medicina Integrativa","Cannabis Medicinal"],
  },
  "Dentista Prescritor": {
    councilLabel: "CRO",
    councilFull: "Conselho Regional de Odontologia",
    councilPlaceholder: "SP-12345",
    docFrentLabel: "CRO — frente",
    specialtyLabel: "Especialidade Odontológica",
    specialtyPlaceholder: "Ex: Endodontia, Periodontia, Odontopediatria",
    areas: ["Clínico Geral","Endodontia","Periodontia","Odontopediatria","Cirurgia Bucomaxilofacial","Ortodontia","Odontologia do Sono","Medicina Oral","Dor Orofacial","Cannabis Medicinal"],
  },
  "Médico Veterinário Prescritor": {
    councilLabel: "CRMV",
    councilFull: "Conselho Regional de Medicina Veterinária",
    councilPlaceholder: "SP-12345",
    docFrentLabel: "CRMV — frente",
    specialtyLabel: "Espécies Atendidas / Especialidade",
    specialtyPlaceholder: "Ex: Pequenos Animais, Equinos, Silvestre",
    areas: ["Pequenos Animais","Equinos","Bovinos","Aves","Silvestres","Animais Exóticos","Medicina Veterinária Integrativa","Fitoterapia Veterinária"],
  },
  "Psicologia & Terapias": {
    councilLabel: "CRP",
    councilFull: "Conselho Regional de Psicologia",
    councilPlaceholder: "06/12345",
    docFrentLabel: "CRP — frente",
    specialtyLabel: "Abordagem Terapêutica",
    specialtyPlaceholder: "Ex: TCC, Psicanálise, Terapia Integrativa",
    areas: ["TCC","Psicanálise","Terapia Integrativa","EMDR","Terapia Sistêmica","Mindfulness","Neuropsicologia","Terapia de Casal","Psicoterapia Breve"],
  },
  "Farmácia Clínica": {
    councilLabel: "CRF",
    councilFull: "Conselho Regional de Farmácia",
    councilPlaceholder: "SP-12345",
    docFrentLabel: "CRF — frente",
    specialtyLabel: "Área de Atuação",
    specialtyPlaceholder: "Ex: Farmácia Magistral, Oncologia, Cannabis",
    areas: ["Farmácia Hospitalar","Farmácia Magistral","Atenção Farmacêutica","Farmacoterapia","Cannabis Medicinal","Cosmetologia"],
  },
  "Enfermagem": {
    councilLabel: "COREN",
    councilFull: "Conselho Regional de Enfermagem — Enfermeiro",
    councilPlaceholder: "SP-123456-ENF",
    docFrentLabel: "COREN — frente",
    specialtyLabel: "Área de Atuação",
    specialtyPlaceholder: "Ex: UTI, Oncologia, Saúde da Família",
    areas: ["UTI","Centro Cirúrgico","Saúde da Família","Pediatria","Gerontologia","Oncologia","Saúde Mental","Neonatologia"],
  },
  "Téc. Enfermagem": {
    councilLabel: "COREN-TÉC",
    councilFull: "Conselho Regional de Enfermagem — Técnico",
    councilPlaceholder: "SP-123456-TEC",
    docFrentLabel: "COREN Técnico — frente",
    specialtyLabel: "Área de Atuação",
    specialtyPlaceholder: "Ex: UTI, Ambulatório, Domiciliar",
    areas: ["UTI","Ambulatório","Atendimento Domiciliar","Centro Cirúrgico","Pediatria","Psiquiatria"],
  },
  "Aux. de Enfermagem": {
    councilLabel: "COREN-AUX",
    councilFull: "Conselho Regional de Enfermagem — Auxiliar",
    councilPlaceholder: "SP-123456-AUX",
    docFrentLabel: "COREN Auxiliar — frente",
    specialtyLabel: "Área de Atuação",
    specialtyPlaceholder: "Ex: Domiciliar, Clínica Geral",
    areas: ["Atendimento Domiciliar","Clínica Geral","Cuidados Básicos"],
  },
  "Saúde Ocupacional": {
    councilLabel: "CRM / CFO / CREA",
    councilFull: "Conselho Profissional da Área",
    councilPlaceholder: "Número do registro",
    docFrentLabel: "Registro profissional — frente",
    specialtyLabel: "Área de Atuação",
    specialtyPlaceholder: "Ex: Medicina do Trabalho, Ergonomia",
    areas: ["Medicina do Trabalho","Enfermagem do Trabalho","Segurança do Trabalho","Ergonomia","Higiene Ocupacional"],
  },
  "Acupuntura": {
    councilLabel: "CRM / COFFITO",
    councilFull: "Conselho Profissional (Médico, Fisioterapeuta, etc.)",
    councilPlaceholder: "Número do registro",
    docFrentLabel: "Registro — frente",
    specialtyLabel: "Técnica Praticada",
    specialtyPlaceholder: "Ex: Acupuntura Chinesa, Auriculoterapia",
    areas: ["Acupuntura Chinesa","Auriculoterapia","Eletroacupuntura","Acupuntura Sistêmica","Moxibustão"],
  },
  "Medicina Integrativa": {
    councilLabel: "CRM",
    councilFull: "Conselho Regional de Medicina",
    councilPlaceholder: "123456",
    docFrentLabel: "CRM — frente",
    specialtyLabel: "Modalidades Praticadas",
    specialtyPlaceholder: "Ex: Ayurveda, Fitoterapia, Homeopatia",
    areas: ["Ayurveda","Fitoterapia","Homeopatia","Medicina Chinesa","Naturopatia","Ozonioterapia","Terapia Neural"],
  },
  "Jardineiros & Cultivo": {
    councilLabel: "CREA / CFB",
    councilFull: "Conselho de Registro Profissional",
    councilPlaceholder: "Número do registro (se houver)",
    docFrentLabel: "Registro — frente (se houver)",
    specialtyLabel: "Especialidade em Cultivo",
    specialtyPlaceholder: "Ex: Cultivo Indoor, Hidroponia, Cannabis",
    areas: ["Cultivo Indoor","Cultivo Outdoor","Hidroponia","Aeroponia","Cannabis Medicinal","Botânica Aplicada"],
  },
  "Cuidadores de Idosos": {
    councilLabel: "—",
    councilFull: "Sem conselho obrigatório",
    councilPlaceholder: "N/A",
    docFrentLabel: "Documento de identidade",
    specialtyLabel: "Tipo de Cuidado",
    specialtyPlaceholder: "Ex: Alzheimer, Parkinson, Cuidados Paliativos",
    areas: ["Alzheimer","Parkinson","Cuidados Paliativos","Reabilitação","Cuidados Gerais","Demências"],
  },
};

export const categories = [
  "Médicos Prescritores",
  "Dentista Prescritor",
  "Médico Veterinário Prescritor",
  "Psicologia & Terapias",
  "Farmácia Clínica",
  "Saúde Ocupacional",
  "Acupuntura",
  "Jardineiros & Cultivo",
  "Aux. de Enfermagem",
  "Enfermagem",
  "Téc. Enfermagem",
  "Cuidadores de Idosos",
  "Medicina Integrativa",
];

export const STANDARD_DOCTOR_SERVICES = [
  { name: "Orientação Técnica (Mentoria Especializada)", price: "R$ 30,00", desc: "Chat até 30 min para mentoria e tira-dúvidas (sem receita médica)" },
  { name: "Consulta por Chat", price: "R$ 100,00", desc: "Avaliação clínica completa por chat com receita médica assinada digitalmente" },
  { name: "Consulta por Vídeo", price: "R$ 150,00", desc: "Teleconsulta humanizada por vídeo com receita assinada digitalmente" },
  { name: "Retorno de Renovação", price: "R$ 90,00", desc: "Exclusivo via chat para pacientes antigos renovarem receita a cada 3 meses" },
  { name: "Consulta Premium (Vídeo + Chat Integrado)", price: "R$ 180,00", desc: "Experiência completa com vídeo HD, chat e envio de exames em tempo real" },
];

`;

// Find the corrupt block between the end of the second Professional type and export const professionals
// The corrupt block at lines ~126-130 should be cleaned up
const lines = content.split('\n');
let inCorruptBlock = false;
let corruptStart = -1;
let corruptEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{ name: "Consulta por Vídeo"') && !lines[i-1]?.includes('services')) {
    corruptStart = i;
  }
  if (corruptStart >= 0 && lines[i].trim() === '];' && i < 140) {
    corruptEnd = i;
    break;
  }
}

if (corruptStart >= 0 && corruptEnd >= 0) {
  console.log(`Removing corrupt lines ${corruptStart+1}-${corruptEnd+1}`);
  lines.splice(corruptStart, corruptEnd - corruptStart + 1);
  content = lines.join('\n');
} else {
  console.log('Corrupt block not found at expected location');
}

// Now find the second duplicate `export type Professional = {` and remove it along with duplicate type
// Keep only the first occurrence
let firstTypeIdx = content.indexOf('export type Professional = {');
let secondTypeIdx = content.indexOf('export type Professional = {', firstTypeIdx + 1);

if (secondTypeIdx !== -1) {
  // Find the closing `};` of the second type  
  let closingIdx = content.indexOf('\n};\n', secondTypeIdx);
  if (closingIdx !== -1) {
    content = content.slice(0, secondTypeIdx) + content.slice(closingIdx + 4);
    console.log('✅ Removed duplicate Professional type');
  }
}

// Insert COUNCIL_CONFIG + categories + STANDARD_DOCTOR_SERVICES before `export const professionals`
const PROFESSIONALS_MARKER = 'export const professionals: Professional[] = [';
if (!content.includes('COUNCIL_CONFIG')) {
  const idx = content.indexOf(PROFESSIONALS_MARKER);
  if (idx !== -1) {
    content = content.slice(0, idx) + COUNCIL_CONFIG + content.slice(idx);
    console.log('✅ COUNCIL_CONFIG + categories + STANDARD_DOCTOR_SERVICES inserted');
  } else {
    console.log('❌ Could not find professionals marker');
  }
} else {
  console.log('ℹ️  COUNCIL_CONFIG already exists');
}

fs.writeFileSync(file, content, 'utf8');
console.log('✅ professionals.ts fixed and updated');
