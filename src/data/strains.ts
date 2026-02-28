import charlottesWeb from "@/assets/strains/charlottes-web.jpg";
import acdc from "@/assets/strains/acdc.jpg";
import harlequin from "@/assets/strains/harlequin.jpg";
import cannatonic from "@/assets/strains/cannatonic.jpg";
import blueDream from "@/assets/strains/blue-dream.jpg";
import ogKush from "@/assets/strains/og-kush.jpg";
import granddaddyPurple from "@/assets/strains/granddaddy-purple.jpg";
import northernLights from "@/assets/strains/northern-lights.jpg";
import sourDiesel from "@/assets/strains/sour-diesel.jpg";

export interface CannabisStrain {
  id: number;
  nome: string;
  tipo: string;
  thc: string;
  cbd: string;
  descricao: string;
  efeitos: string[];
  sabores: string[];
  beneficiosSaude: string[];
  origem: string;
  florescimento: string;
  dificuldade: string;
  rendimento: string;
  avaliacao: number;
  imagem: string;
}

export const getPlantImage = (id: number) => {
  const strain = strains.find(s => s.id === id);
  return strain?.imagem || "/placeholder.svg";
};

export const getPlantImageFallback = (_id: number) => "/placeholder.svg";

export const strainCategories = [
  { nome: "Alto CBD", emoji: "💚", descricao: "Fins terapêuticos" },
  { nome: "Sativa", emoji: "☀️", descricao: "Energia e criatividade" },
  { nome: "Indica", emoji: "🌙", descricao: "Relaxamento profundo" },
  { nome: "Híbrida", emoji: "🌿", descricao: "Efeitos balanceados" },
];

export const strains: CannabisStrain[] = [
  {
    id: 1,
    nome: "Charlotte's Web",
    tipo: "Alto CBD",
    thc: "0.3% - 1%",
    cbd: "15% - 20%",
    descricao: "Variedade com altíssimo teor de CBD, desenvolvida pelos irmãos Stanley nos EUA. Ficou mundialmente famosa pelo caso de Charlotte Figi, uma criança com epilepsia severa (Síndrome de Dravet) que obteve melhora significativa com seu uso.",
    efeitos: ["Relaxamento", "Clareza mental", "Sem efeito psicoativo significativo"],
    sabores: ["Terroso", "Herbáceo", "Pinho"],
    beneficiosSaude: ["Epilepsia", "Ansiedade", "Inflamação", "Dor crônica"],
    origem: "EUA — Irmãos Stanley",
    florescimento: "9-12 semanas",
    dificuldade: "Moderada",
    rendimento: "400-500g/m²",
    avaliacao: 4.9,
    imagem: charlottesWeb,
  },
  {
    id: 2,
    nome: "ACDC",
    tipo: "Alto CBD",
    thc: "1% - 6%",
    cbd: "14% - 20%",
    descricao: "Fenótipo de alto CBD derivado da Cannatonic, com proporção CBD:THC de até 20:1. Uma das variedades mais utilizadas em terapias com canabidiol no mundo.",
    efeitos: ["Calmante", "Foco", "Leve relaxamento corporal"],
    sabores: ["Terroso", "Madeira", "Cereja"],
    beneficiosSaude: ["Ansiedade", "Dor neuropática", "Esclerose múltipla", "Artrite"],
    origem: "Espanha",
    florescimento: "9-10 semanas",
    dificuldade: "Fácil",
    rendimento: "350-450g/m²",
    avaliacao: 4.8,
    imagem: acdc,
  },
  {
    id: 3,
    nome: "Harlequin",
    tipo: "Sativa dominante (rica em CBD)",
    thc: "4% - 10%",
    cbd: "8% - 15%",
    descricao: "Sativa dominante com proporção consistente de CBD:THC de 5:2. Permite alívio terapêutico sem efeitos psicoativos intensos, mantendo clareza e funcionalidade durante o dia.",
    efeitos: ["Equilíbrio mental", "Alívio da dor", "Leve euforia controlada"],
    sabores: ["Manga", "Terroso", "Cítrico"],
    beneficiosSaude: ["Dor crônica", "Inflamação", "Ansiedade", "Enxaqueca"],
    origem: "Colômbia/Tailândia/Suíça",
    florescimento: "8-9 semanas",
    dificuldade: "Moderada",
    rendimento: "300-400g/m²",
    avaliacao: 4.7,
    imagem: harlequin,
  },
  {
    id: 4,
    nome: "Cannatonic",
    tipo: "Híbrida (rica em CBD)",
    thc: "5% - 8%",
    cbd: "6% - 17%",
    descricao: "Híbrida medicinal resultado do cruzamento entre MK Ultra e G13 Haze. Conhecida pelo baixo THC e alto CBD, é amplamente prescrita para tratamento de dor e espasmos musculares.",
    efeitos: ["Relaxamento", "Calma mental", "Pouco efeito psicoativo"],
    sabores: ["Cítrico", "Terroso", "Amadeirado"],
    beneficiosSaude: ["Espasmos musculares", "Dor crônica", "Estresse", "Inflamação"],
    origem: "Espanha — Resin Seeds",
    florescimento: "9-10 semanas",
    dificuldade: "Moderada",
    rendimento: "400-500g/m²",
    avaliacao: 4.6,
    imagem: cannatonic,
  },
  {
    id: 5,
    nome: "Blue Dream",
    tipo: "Híbrida (Sativa dominante)",
    thc: "17% - 24%",
    cbd: "0.1% - 0.2%",
    descricao: "Cruzamento de Blueberry Indica com Super Silver Haze. Uma das variedades mais populares da Califórnia, oferece equilíbrio perfeito entre relaxamento corporal e estimulação cerebral criativa.",
    efeitos: ["Energia", "Criatividade", "Euforia leve"],
    sabores: ["Mirtilo", "Baunilha", "Doce"],
    beneficiosSaude: ["Depressão", "Fadiga", "Dor leve", "Estresse"],
    origem: "EUA — Califórnia",
    florescimento: "9-10 semanas",
    dificuldade: "Fácil",
    rendimento: "500-600g/m²",
    avaliacao: 4.8,
    imagem: blueDream,
  },
  {
    id: 6,
    nome: "OG Kush",
    tipo: "Híbrida (Indica dominante)",
    thc: "19% - 26%",
    cbd: "<1%",
    descricao: "Linhagem icônica da costa oeste americana. Base genética para inúmeras variedades modernas, oferece potente efeito cerebral e corporal balanceado. Uma das mais prescritas para dor crônica.",
    efeitos: ["Relaxamento profundo", "Sedação leve", "Alívio da tensão"],
    sabores: ["Pinho", "Terroso", "Amadeirado"],
    beneficiosSaude: ["Dor crônica", "Insônia", "Ansiedade", "Estresse"],
    origem: "EUA — Flórida/Califórnia",
    florescimento: "8-9 semanas",
    dificuldade: "Difícil",
    rendimento: "350-450g/m²",
    avaliacao: 4.7,
    imagem: ogKush,
  },
  {
    id: 7,
    nome: "Granddaddy Purple",
    tipo: "Indica",
    thc: "17% - 23%",
    cbd: "<1%",
    descricao: "Indica clássica resultado do cruzamento de Purple Urkle e Big Bud. Reconhecida pelos tricomas densos e coloração púrpura intensa, é amplamente usada para insônia e dores intensas.",
    efeitos: ["Sedação", "Relaxamento corporal intenso", "Efeito calmante"],
    sabores: ["Uva", "Baga", "Doce"],
    beneficiosSaude: ["Insônia", "Espasmos musculares", "Dor intensa", "Perda de apetite"],
    origem: "EUA — Ken Estes",
    florescimento: "8-11 semanas",
    dificuldade: "Moderada",
    rendimento: "400-500g/m²",
    avaliacao: 4.6,
    imagem: granddaddyPurple,
  },
  {
    id: 8,
    nome: "Northern Lights",
    tipo: "Indica",
    thc: "16% - 21%",
    cbd: "<1%",
    descricao: "Uma das indicas puras mais famosas do mundo. Reconhecida por seu crescimento compacto, resina cristalina e efeitos profundamente relaxantes. Base genética de muitas variedades modernas.",
    efeitos: ["Relaxamento profundo", "Sensação de bem-estar", "Auxílio no sono"],
    sabores: ["Pinho", "Terroso", "Doce"],
    beneficiosSaude: ["Insônia", "Ansiedade", "Dor crônica", "Estresse"],
    origem: "EUA — Pacific Northwest",
    florescimento: "7-9 semanas",
    dificuldade: "Fácil",
    rendimento: "500-600g/m²",
    avaliacao: 4.7,
    imagem: northernLights,
  },
  {
    id: 9,
    nome: "Sour Diesel",
    tipo: "Sativa",
    thc: "20% - 25%",
    cbd: "<1%",
    descricao: "Sativa de ação rápida com aroma pungente de combustível diesel. Derivada possivelmente de Chemdawg 91 e Super Skunk, é uma das sativas mais energizantes e estimulantes disponíveis.",
    efeitos: ["Energia intensa", "Foco", "Estimulação mental"],
    sabores: ["Diesel", "Cítrico", "Terroso"],
    beneficiosSaude: ["Depressão", "Fadiga", "Estresse", "Dor leve"],
    origem: "EUA — Costa Leste",
    florescimento: "10-11 semanas",
    dificuldade: "Difícil",
    rendimento: "400-500g/m²",
    avaliacao: 4.7,
    imagem: sourDiesel,
  },
];
