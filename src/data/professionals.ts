import drEdilsonImg from "@/assets/dr-edilson-bezerra.jpg";
import draJulianaImg from "@/assets/dra-juliana-ferreira.jpg";
import drMarcosImg from "@/assets/dr-marcos-oliveira.jpg";
import draIsabellaImg from "@/assets/dra-isabella-moreno.jpg";
import drAntonioImg from "@/assets/dr-antonio-silva.jpg";
import draYukiImg from "@/assets/dra-yuki-tanaka.jpg";
import drPabloImg from "@/assets/dr-pablo-quispe.jpg";
import draRenataImg from "@/assets/dra-renata-costa.jpg";

export type Professional = {
  id: string;
  name: string;
  category: string;
  bio: string;
  experience: string;
  tags: string[];
  price: string;
  priceValue: number;
  whatsapp: string;
  rating: number;
  consults: number;
  avatar: string;
  imageUrl: string;
  paymentLink: string;
  services: { name: string; price: string; desc: string }[];
  slots: string[];
  reviews: { name: string; rating: number; text: string }[];
  online?: boolean;
  crm?: string;
  hospital?: string;
  hospitalUrl?: string;
  flags?: string[];
};

export const categories = [
  "Médicos Prescritores",
  "Psicologia & Terapias",
  "Farmácia Clínica",
  "Saúde Ocupacional",
  "Acupuntura",
  "Jardineiros & Cultivo",
];

export const professionals: Professional[] = [
  // ═══════ Médicos Prescritores (6) ═══════
  {
    id: "med-0",
    name: "Dr. Edilson Bezerra",
    category: "Médicos Prescritores",
    flags: ["🇧🇷", "🇧🇴"],
    experience: "18 anos",
    tags: ["Responsável Técnico", "Hemodinâmica BP", "Cannabis Medicinal", "Dor Crônica"],
    price: "R$ 49,90",
    priceValue: 49.9,
    paymentLink: "https://mpago.la/12KAwmH",
    whatsapp: "5511987131241",
    rating: 5.0,
    consults: 850,
    avatar: "EB",
    imageUrl: drEdilsonImg,
    online: true,
    crm: "10963 - Bolívia",
    hospital: "Beneficência Portuguesa (SP) / Hospital Menino Jesus",
    hospitalUrl: "https://www.beneficencia.org.br",
    services: [
      { name: "Consulta Inicial", price: "R$ 49,90", desc: "Avaliação completa + plano terapêutico canábico" },
      { name: "Retorno", price: "R$ 35,00", desc: "Acompanhamento e ajuste de dosagem" },
      { name: "Laudo ANVISA", price: "R$ 50,00", desc: "Documentação para importação ou uso compassivo" },
    ],
    slots: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
    reviews: [
      { name: "Carlos S.", rating: 5, text: "Profissional excepcional, mudou minha vida com o tratamento." },
      { name: "Maria A.", rating: 5, text: "Atencioso, acessível e muito competente. Recomendo!" },
      { name: "José R.", rating: 5, text: "Finalmente encontrei um médico que entende cannabis medicinal de verdade." },
    ],
  },
  {
    id: "med-1",
    name: "Dr. Felipe Andrade",
    category: "Médicos Prescritores",
    bio: "Neurologista com 12 anos de experiência em tratamentos com cannabis medicinal. Especialista em dor crônica e epilepsia refratária. Formado pela UNIFESP com residência no Hospital Albert Einstein.",
    experience: "12 anos",
    tags: ["Neurologia", "Dor Crônica", "Epilepsia"],
    price: "R$ 130,00",
    priceValue: 130,
    paymentLink: "https://mpago.la/12KAwmH",
    whatsapp: "5511987131241",
    rating: 4.9,
    consults: 340,
    avatar: "FA",
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face",
    services: [
      { name: "Consulta Inicial", price: "R$ 130,00", desc: "Avaliação completa + plano terapêutico" },
      { name: "Retorno", price: "R$ 80", desc: "Acompanhamento e ajuste de dosagem" },
      { name: "Laudo/Relatório", price: "R$ 60", desc: "Documentação para ANVISA ou importação" },
    ],
    slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    reviews: [
      { name: "Maria L.", rating: 5, text: "Excelente profissional, muito atencioso e paciente." },
      { name: "João P.", rating: 5, text: "Me ajudou muito com dor crônica que sofria há anos." },
      { name: "Ana C.", rating: 5, text: "Competente e humano, recomendo sem hesitar." },
    ],
  },
  {
    id: "med-2",
    name: "Dra. Camila Rocha",
    category: "Médicos Prescritores",
    bio: "Psiquiatra focada em ansiedade, insônia e TEPT. Abordagem integrativa com cannabis medicinal há 8 anos. Membro da SBEC e palestrante internacional.",
    experience: "8 anos",
    tags: ["Psiquiatria", "Ansiedade", "Insônia"],
    price: "R$ 90,00",
    priceValue: 90,
    paymentLink: "https://mpago.la/12KAwmH",
    whatsapp: "5511987131241",
    rating: 4.8,
    consults: 275,
    avatar: "CR",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
    services: [
      { name: "Consulta Inicial", price: "R$ 90,00", desc: "Avaliação psiquiátrica + orientação" },
      { name: "Retorno", price: "R$ 75", desc: "Acompanhamento mensal" },
      { name: "Receita Especial", price: "R$ 50", desc: "Prescrição controlada quando aplicável" },
    ],
    slots: ["08:00", "09:00", "10:00", "13:00", "14:00"],
    reviews: [
      { name: "Ana S.", rating: 5, text: "Mudou minha qualidade de vida completamente." },
      { name: "Pedro M.", rating: 4, text: "Ótima consulta, muito acolhedora." },
    ],
  },
  {
    id: "med-3",
    name: "Dr. Ricardo Mendes",
    category: "Médicos Prescritores",
    bio: "Clínico geral com pós em medicina da dor. Atende pacientes oncológicos e com fibromialgia. 15 anos de experiência no Hospital Sírio-Libanês.",
    experience: "15 anos",
    tags: ["Clínica da Dor", "Oncologia", "Fibromialgia"],
    price: "R$ 49,90",
    priceValue: 49.9,
    paymentLink: "https://mpago.la/12KAwmH",
    whatsapp: "5511987131241",
    rating: 4.7,
    consults: 410,
    avatar: "RM",
    imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
    services: [
      { name: "Consulta Inicial", price: "R$ 49,90", desc: "Avaliação geral + plano" },
      { name: "Retorno", price: "R$ 70", desc: "Acompanhamento" },
      { name: "Parecer Técnico", price: "R$ 90", desc: "Para importação ou habeas corpus" },
    ],
    slots: ["10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
    reviews: [
      { name: "Lúcia F.", rating: 5, text: "Muito humano e competente." },
      { name: "Carlos R.", rating: 5, text: "Preço justo e atendimento excelente." },
    ],
  },
  {
    id: "med-4",
    name: "Dra. Juliana Ferreira",
    category: "Médicos Prescritores",
    bio: "Reumatologista com especialização em cannabis medicinal pela IACM (Alemanha). Tratamento de artrite reumatoide, lúpus e esclerose múltipla com canabinoides. Autora de 12 artigos científicos na área.",
    experience: "10 anos",
    tags: ["Reumatologia", "Artrite", "Esclerose Múltipla"],
    price: "R$ 110,00",
    priceValue: 110,
    paymentLink: "https://mpago.la/12KAwmH",
    whatsapp: "5511987131241",
    rating: 4.9,
    consults: 295,
    avatar: "JF",
    imageUrl: draJulianaImg,
    services: [
      { name: "Consulta Reumatológica", price: "R$ 110,00", desc: "Avaliação completa + protocolo CBD/THC" },
      { name: "Retorno", price: "R$ 75", desc: "Ajuste de dosagem e acompanhamento" },
      { name: "Laudo para Importação", price: "R$ 65", desc: "Documentação ANVISA" },
    ],
    slots: ["08:00", "09:00", "10:00", "14:00", "15:00"],
    reviews: [
      { name: "Teresa M.", rating: 5, text: "Minha artrite melhorou 80% com o tratamento." },
      { name: "Roberto S.", rating: 5, text: "Profissional excepcional, muito atualizada." },
      { name: "Marta R.", rating: 5, text: "Finalmente encontrei uma médica que entende minha dor." },
    ],
  },
  {
    id: "med-5",
    name: "Dr. Eduardo Nascimento",
    category: "Médicos Prescritores",
    bio: "Oncologista com foco em cuidados paliativos e manejo de dor oncológica com cannabis medicinal. Mestre pela USP com experiência no ICESP. Defensor do acesso universal à cannabis medicinal.",
    experience: "18 anos",
    tags: ["Oncologia", "Paliativos", "Dor Oncológica"],
    price: "R$ 85,00",
    priceValue: 85,
    paymentLink: "https://mpago.la/12KAwmH",
    whatsapp: "5511987131241",
    rating: 4.8,
    consults: 520,
    avatar: "EN",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
    services: [
      { name: "Consulta Oncológica", price: "R$ 85,00", desc: "Avaliação + plano paliativo canábico" },
      { name: "Acompanhamento", price: "R$ 60", desc: "Follow-up quinzenal" },
      { name: "Relatório Médico", price: "R$ 55", desc: "Para importação ou uso compassivo" },
    ],
    slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    reviews: [
      { name: "Família Santos", rating: 5, text: "Deu qualidade de vida ao meu pai nos últimos meses." },
      { name: "Cláudia V.", rating: 5, text: "Humano, competente e acessível. Gratidão eterna." },
    ],
  },

  // ═══════ Psicologia & Terapias (5) ═══════
  {
    id: "psi-1",
    name: "Dra. Larissa Monteiro",
    category: "Psicologia & Terapias",
    bio: "Psicóloga clínica com abordagem cognitivo-comportamental. Especialista em ansiedade, depressão e manejo de estresse. Doutoranda em neurociências pela UNICAMP.",
    experience: "9 anos",
    tags: ["TCC", "Ansiedade", "Depressão"],
    price: "R$ 90",
    priceValue: 90,
    paymentLink: "https://link.mercadopago.com.br/assinaturaplantaerai",
    whatsapp: "5511987131241",
    rating: 4.9,
    consults: 310,
    avatar: "LM",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    services: [
      { name: "Sessão de Psicoterapia", price: "R$ 90", desc: "Sessão individual 50 min" },
      { name: "Avaliação Psicológica", price: "R$ 120", desc: "Avaliação completa" },
      { name: "Acompanhamento Mensal", price: "R$ 70", desc: "Sessão de follow-up" },
    ],
    slots: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
    reviews: [
      { name: "Carolina S.", rating: 5, text: "Me ajudou muito com ansiedade generalizada." },
      { name: "Marcos T.", rating: 5, text: "Profissional excelente e acolhedora." },
    ],
  },
  {
    id: "psi-2",
    name: "Dr. Gustavo Reis",
    category: "Psicologia & Terapias",
    bio: "Psicólogo com foco em trauma, TEPT e terapia de casal. Abordagem humanista e integrativa. Certificado em EMDR pela EMDR Brasil.",
    experience: "12 anos",
    tags: ["Trauma", "TEPT", "Casal"],
    price: "R$ 100",
    priceValue: 100,
    paymentLink: "https://link.mercadopago.com.br/assinaturaplantaerai",
    whatsapp: "5511987131241",
    rating: 4.8,
    consults: 250,
    avatar: "GR",
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
    services: [
      { name: "Terapia de Casal", price: "R$ 150", desc: "Sessão conjunta 80 min" },
      { name: "Terapia Individual", price: "R$ 100", desc: "Sessão individual 50 min" },
    ],
    slots: ["10:00", "11:00", "14:00", "15:00", "16:00"],
    reviews: [
      { name: "Fernanda R.", rating: 5, text: "Salvou meu casamento, excelente mediador." },
    ],
  },
];
