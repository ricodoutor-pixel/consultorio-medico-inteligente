import fs from 'fs';

const file = 'src/data/professionals.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add "Dentista Prescritor" to categories if not already there
if (!content.includes('"Dentista Prescritor"')) {
  content = content.replace(
    '"Médicos Prescritores",',
    '"Médicos Prescritores",\n  "Dentista Prescritor",'
  );
  console.log('✅ Dentista Prescritor added to categories');
} else {
  console.log('ℹ️  Dentista Prescritor already present');
}

// 2. Add COUNCIL_CONFIG after categories block, before STANDARD_DOCTOR_SERVICES
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
`;

if (!content.includes('COUNCIL_CONFIG')) {
  const insertBefore = 'export const STANDARD_DOCTOR_SERVICES';
  const idx = content.indexOf(insertBefore);
  if (idx !== -1) {
    content = content.slice(0, idx) + COUNCIL_CONFIG + '\n' + content.slice(idx);
    console.log('✅ COUNCIL_CONFIG inserted');
  } else {
    console.log('❌ Could not find STANDARD_DOCTOR_SERVICES to insert before');
  }
} else {
  console.log('ℹ️  COUNCIL_CONFIG already present');
}

fs.writeFileSync(file, content, 'utf8');
console.log('✅ professionals.ts updated successfully');
