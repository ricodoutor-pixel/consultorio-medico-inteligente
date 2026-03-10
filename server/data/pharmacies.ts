/**
 * Planta & Raiz - Pharmacies & Products Database
 * 5 Example Pharmacies with 3 products each (15 products total)
 * All ANVISA authorized and legalized
 */

export interface Product {
  id: number;
  name: string;
  description: string;
  type: "Óleo" | "Cápsula" | "Chá" | "Pomada" | "Spray" | "Flor";
  thcPercentage: number;
  cbdPercentage: number;
  dosage: string; // "10ml", "30 cápsulas", etc
  price: number; // R$
  originalPrice?: number; // For discounts
  stock: number;
  rating: number; // 1-5
  totalReviews: number;
  image: string; // emoji or URL
  benefits: string[];
  instructions: string;
  anvisaApproved: boolean;
  anvisaNumber: string;
  manufacturer: string;
  expiryDate: string; // "2026-12-31"
  shippingTime: string; // "2-3 dias úteis"
  freeShipping: boolean;
}

export interface Pharmacy {
  id: number;
  name: string;
  type: "Farmácia" | "Produtor" | "Importador";
  cnpj: string;
  state: string;
  city: string;
  bio: string;
  rating: number; // 1-5
  totalSales: number;
  verified: boolean;
  anvisaAuthorized: boolean;
  logo: string; // emoji or URL
  pixKey: string; // PIX key for payments
  products: Product[];
  responseTime: string; // "Responde em 2 horas"
  policies: {
    freeShipping: boolean;
    returns: number; // days
    warranty: boolean;
  };
}

export const pharmacies: Pharmacy[] = [
  // ===== FARMÁCIA 1: Farmácia Bem-Estar Natural =====
  {
    id: 1,
    name: "Farmácia Bem-Estar Natural",
    type: "Farmácia",
    cnpj: "12.345.678/0001-90",
    state: "SP",
    city: "São Paulo",
    bio: "Farmácia especializada em medicamentos naturais e cannabis medicinal com mais de 8 anos de experiência. Atendimento personalizado e consultoria gratuita.",
    rating: 4.9,
    totalSales: 2847,
    verified: true,
    anvisaAuthorized: true,
    logo: "💚",
    pixKey: "farmacia.bemestarnaturalsp@planta-raiz.com.br",
    policies: {
      freeShipping: true,
      returns: 30,
      warranty: true,
    },
    responseTime: "Responde em 1 hora",
    products: [
      {
        id: 101,
        name: "Óleo CBD 1000mg - Espectro Completo",
        description:
          "Óleo premium com 1000mg de CBD por frasco. Espectro completo com terpenos naturais. Ideal para dor crônica, ansiedade e inflamação.",
        type: "Óleo",
        thcPercentage: 0.3,
        cbdPercentage: 10,
        dosage: "10ml",
        price: 89.9,
        originalPrice: 129.9,
        stock: 45,
        rating: 4.9,
        totalReviews: 234,
        image: "🧴",
        benefits: ["Dor Crônica", "Ansiedade", "Inflamação", "Sono"],
        instructions:
          "Colocar 2-3 gotas sob a língua, 2-3 vezes ao dia. Manter por 60 segundos antes de engolir.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001234",
        manufacturer: "Farmácia Bem-Estar Natural",
        expiryDate: "2026-12-31",
        shippingTime: "2-3 dias úteis",
        freeShipping: true,
      },
      {
        id: 102,
        name: "Cápsulas CBD+THC Balanceadas - 30 caps",
        description:
          "Cápsulas com proporção 1:1 de CBD e THC. Formulação balanceada para alívio de dor e relaxamento. Efeito moderado.",
        type: "Cápsula",
        thcPercentage: 5,
        cbdPercentage: 5,
        dosage: "30 cápsulas",
        price: 75.0,
        originalPrice: 99.9,
        stock: 28,
        rating: 4.8,
        totalReviews: 156,
        image: "💊",
        benefits: ["Dor", "Relaxamento", "Sono", "Bem-estar"],
        instructions:
          "Tomar 1 cápsula ao anoitecer com alimento. Não dirigir ou operar máquinas.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001235",
        manufacturer: "Farmácia Bem-Estar Natural",
        expiryDate: "2026-10-31",
        shippingTime: "2-3 dias úteis",
        freeShipping: true,
      },
      {
        id: 103,
        name: "Chá de Cannabis Medicinal - Mistura Relaxante",
        description:
          "Chá premium com flores e folhas de cannabis medicinal. Blend relaxante com camomila e lavanda. Sem cafeína.",
        type: "Chá",
        thcPercentage: 2,
        cbdPercentage: 8,
        dosage: "50g (15 xícaras)",
        price: 45.0,
        stock: 62,
        rating: 4.7,
        totalReviews: 89,
        image: "🍵",
        benefits: ["Relaxamento", "Sono", "Ansiedade", "Digestão"],
        instructions:
          "Colocar 1 colher de chá em água quente (70-80°C). Deixar em infusão por 5-7 minutos. Beber 1-2 xícaras ao dia.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001236",
        manufacturer: "Farmácia Bem-Estar Natural",
        expiryDate: "2025-08-31",
        shippingTime: "2-3 dias úteis",
        freeShipping: true,
      },
    ],
  },

  // ===== FARMÁCIA 2: Produtor Premium Cannabis RJ =====
  {
    id: 2,
    name: "Produtor Premium Cannabis RJ",
    type: "Produtor",
    cnpj: "23.456.789/0001-01",
    state: "RJ",
    city: "Rio de Janeiro",
    bio: "Produtor artesanal de cannabis medicinal com cultivo sustentável. Flores de alta qualidade e extratos concentrados. Certificado ANVISA.",
    rating: 4.8,
    totalSales: 1923,
    verified: true,
    anvisaAuthorized: true,
    logo: "🌿",
    pixKey: "produtor.premiumcannabis@planta-raiz.com.br",
    policies: {
      freeShipping: true,
      returns: 15,
      warranty: false,
    },
    responseTime: "Responde em 4 horas",
    products: [
      {
        id: 201,
        name: "Flor de Cannabis - Variedade Charlotte's Web",
        description:
          "Flor premium de Charlotte's Web. Alto em CBD, baixo em THC. Aroma floral suave. Ideal para uso medicinal contínuo.",
        type: "Flor",
        thcPercentage: 1,
        cbdPercentage: 12,
        dosage: "7g",
        price: 65.0,
        originalPrice: 85.0,
        stock: 15,
        rating: 4.9,
        totalReviews: 112,
        image: "🌸",
        benefits: ["Epilepsia", "Ansiedade", "Dor", "Inflamação"],
        instructions:
          "Usar em vaporizador a 160-180°C ou preparar chá. Não fumar. Começar com pequenas quantidades.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001237",
        manufacturer: "Produtor Premium Cannabis RJ",
        expiryDate: "2025-06-30",
        shippingTime: "3-4 dias úteis",
        freeShipping: true,
      },
      {
        id: 202,
        name: "Extrato Concentrado - Resina CBD Pura",
        description:
          "Extrato concentrado com 80% de CBD. Resina pura sem solventes. Uso sublingual ou em cápsulas. Muito potente.",
        type: "Óleo",
        thcPercentage: 0.1,
        cbdPercentage: 80,
        dosage: "1ml (1000mg CBD)",
        price: 120.0,
        stock: 8,
        rating: 4.8,
        totalReviews: 67,
        image: "🧴",
        benefits: ["Dor Severa", "Epilepsia", "Inflamação Crônica"],
        instructions:
          "Usar 1-2 gotas sob a língua. Efeito rápido (15-30 min). Não exceder 10mg de CBD por dia sem orientação.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001238",
        manufacturer: "Produtor Premium Cannabis RJ",
        expiryDate: "2026-09-30",
        shippingTime: "3-4 dias úteis",
        freeShipping: true,
      },
      {
        id: 203,
        name: "Pomada Tópica - Alívio Muscular",
        description:
          "Pomada com CBD e THC para aplicação tópica. Alívio rápido de dor muscular, artrite e inflamação local. Sem odor.",
        type: "Pomada",
        thcPercentage: 3,
        cbdPercentage: 7,
        dosage: "50g",
        price: 55.0,
        stock: 32,
        rating: 4.7,
        totalReviews: 94,
        image: "💪",
        benefits: ["Dor Muscular", "Artrite", "Inflamação Local"],
        instructions:
          "Aplicar 1-2 gramas na área afetada. Massagear suavemente. Usar 2-3 vezes ao dia conforme necessário.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001239",
        manufacturer: "Produtor Premium Cannabis RJ",
        expiryDate: "2025-12-31",
        shippingTime: "3-4 dias úteis",
        freeShipping: true,
      },
    ],
  },

  // ===== FARMÁCIA 3: Importadora Cannabis Global MG =====
  {
    id: 3,
    name: "Importadora Cannabis Global MG",
    type: "Importador",
    cnpj: "34.567.890/0001-12",
    state: "MG",
    city: "Belo Horizonte",
    bio: "Importadora oficial de produtos de cannabis medicinal de marcas internacionais renomadas. Todos os produtos certificados e legalizados.",
    rating: 4.7,
    totalSales: 1456,
    verified: true,
    anvisaAuthorized: true,
    logo: "🌍",
    pixKey: "importadora.cannabisglobal@planta-raiz.com.br",
    policies: {
      freeShipping: true,
      returns: 20,
      warranty: true,
    },
    responseTime: "Responde em 2 horas",
    products: [
      {
        id: 301,
        name: "Óleo Espectro Completo - Marca Canadense",
        description:
          "Óleo importado do Canadá. Espectro completo com todos os canabinoides e terpenos. Qualidade farmacêutica garantida.",
        type: "Óleo",
        thcPercentage: 0.5,
        cbdPercentage: 20,
        dosage: "30ml",
        price: 150.0,
        originalPrice: 199.9,
        stock: 12,
        rating: 4.9,
        totalReviews: 178,
        image: "🧴",
        benefits: ["Dor Crônica", "Ansiedade", "Inflamação", "Neuropatia"],
        instructions:
          "Colocar 1ml (20mg CBD) sob a língua, 1-2 vezes ao dia. Manter por 60 segundos.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001240",
        manufacturer: "Canopy Growth (Canadá)",
        expiryDate: "2026-11-30",
        shippingTime: "5-7 dias úteis",
        freeShipping: true,
      },
      {
        id: 302,
        name: "Spray Bucal - Sativex (THC:CBD 1:1)",
        description:
          "Spray bucal importado. Proporção 1:1 de THC e CBD. Absorção rápida. Indicado para espasticidade e dor neuropática.",
        type: "Spray",
        thcPercentage: 2.7,
        cbdPercentage: 2.5,
        dosage: "10ml (90 doses)",
        price: 280.0,
        stock: 5,
        rating: 4.8,
        totalReviews: 45,
        image: "💨",
        benefits: ["Espasticidade", "Dor Neuropática", "Esclerose Múltipla"],
        instructions:
          "Aplicar 1-2 doses na boca. Efeito em 15-20 minutos. Máximo 12 doses por dia.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001241",
        manufacturer: "GW Pharmaceuticals (Reino Unido)",
        expiryDate: "2026-08-31",
        shippingTime: "5-7 dias úteis",
        freeShipping: true,
      },
      {
        id: 303,
        name: "Cápsulas Softgel - Fórmula Balanceada",
        description:
          "Cápsulas softgel importadas com fórmula balanceada. Absorção otimizada. Sem sabor desagradável. Uso diário.",
        type: "Cápsula",
        thcPercentage: 5,
        cbdPercentage: 5,
        dosage: "60 cápsulas",
        price: 95.0,
        originalPrice: 129.9,
        stock: 18,
        rating: 4.7,
        totalReviews: 123,
        image: "💊",
        benefits: ["Dor", "Sono", "Ansiedade", "Bem-estar"],
        instructions:
          "Tomar 1-2 cápsulas ao anoitecer com alimento. Efeito em 1-2 horas.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001242",
        manufacturer: "Charlotte's Web (EUA)",
        expiryDate: "2026-07-31",
        shippingTime: "5-7 dias úteis",
        freeShipping: true,
      },
    ],
  },

  // ===== FARMÁCIA 4: Farmácia Vida Verde BA =====
  {
    id: 4,
    name: "Farmácia Vida Verde BA",
    type: "Farmácia",
    cnpj: "45.678.901/0001-23",
    state: "BA",
    city: "Salvador",
    bio: "Farmácia comunitária com foco em saúde natural. Atendimento personalizado com farmacêutico especializado. Consultoria gratuita.",
    rating: 4.8,
    totalSales: 1678,
    verified: true,
    anvisaAuthorized: true,
    logo: "💚",
    pixKey: "farmacia.vidaverde@planta-raiz.com.br",
    policies: {
      freeShipping: true,
      returns: 30,
      warranty: true,
    },
    responseTime: "Responde em 3 horas",
    products: [
      {
        id: 401,
        name: "Óleo MCT + CBD - Fórmula Premium",
        description:
          "Óleo com base MCT (triglicerídeos de cadeia média) e CBD puro. Absorção rápida e eficiente. Sabor neutro.",
        type: "Óleo",
        thcPercentage: 0.2,
        cbdPercentage: 15,
        dosage: "20ml",
        price: 105.0,
        originalPrice: 149.9,
        stock: 35,
        rating: 4.9,
        totalReviews: 201,
        image: "🧴",
        benefits: ["Dor", "Ansiedade", "Inflamação", "Energia"],
        instructions:
          "Tomar 1ml (15mg CBD) pela manhã ou à noite. Pode ser adicionado a alimentos.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001243",
        manufacturer: "Farmácia Vida Verde BA",
        expiryDate: "2026-10-31",
        shippingTime: "2-3 dias úteis",
        freeShipping: true,
      },
      {
        id: 402,
        name: "Cápsulas Veganas - CBD Isolado",
        description:
          "Cápsulas 100% veganas com CBD isolado puro. Sem THC. Ideal para quem busca máxima pureza e sem efeitos psicoativos.",
        type: "Cápsula",
        thcPercentage: 0,
        cbdPercentage: 25,
        dosage: "30 cápsulas",
        price: 85.0,
        stock: 42,
        rating: 4.8,
        totalReviews: 167,
        image: "💊",
        benefits: ["Ansiedade", "Inflamação", "Sono", "Foco"],
        instructions:
          "Tomar 1 cápsula (25mg CBD) 1-2 vezes ao dia com água. Sem restrições de horário.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001244",
        manufacturer: "Farmácia Vida Verde BA",
        expiryDate: "2026-09-30",
        shippingTime: "2-3 dias úteis",
        freeShipping: true,
      },
      {
        id: 403,
        name: "Chá Medicinal - Blend Energético",
        description:
          "Chá premium com cannabis, gengibre e hortelã. Blend energético para manhã. Aumenta foco e disposição.",
        type: "Chá",
        thcPercentage: 0.5,
        cbdPercentage: 5,
        dosage: "40g (12 xícaras)",
        price: 38.0,
        stock: 58,
        rating: 4.7,
        totalReviews: 76,
        image: "🍵",
        benefits: ["Energia", "Foco", "Digestão", "Bem-estar"],
        instructions:
          "Colocar 1 colher de chá em água quente (80-90°C). Deixar em infusão por 5 minutos. Beber pela manhã.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001245",
        manufacturer: "Farmácia Vida Verde BA",
        expiryDate: "2025-07-31",
        shippingTime: "2-3 dias úteis",
        freeShipping: true,
      },
    ],
  },

  // ===== FARMÁCIA 5: Produtor Artesanal Cannabis SC =====
  {
    id: 5,
    name: "Produtor Artesanal Cannabis SC",
    type: "Produtor",
    cnpj: "56.789.012/0001-34",
    state: "SC",
    city: "Florianópolis",
    bio: "Pequeno produtor artesanal com cultivo sustentável e orgânico. Produtos feitos à mão com ingredientes naturais. Qualidade garantida.",
    rating: 4.9,
    totalSales: 2134,
    verified: true,
    anvisaAuthorized: true,
    logo: "🌱",
    pixKey: "produtor.artesanal.cannabis@planta-raiz.com.br",
    policies: {
      freeShipping: true,
      returns: 10,
      warranty: false,
    },
    responseTime: "Responde em 6 horas",
    products: [
      {
        id: 501,
        name: "Óleo Infusionado - Receita Caseira",
        description:
          "Óleo infusionado artesanalmente com flores de cannabis e óleos essenciais naturais. Feito em pequenos lotes. Qualidade premium.",
        type: "Óleo",
        thcPercentage: 2,
        cbdPercentage: 10,
        dosage: "15ml",
        price: 72.0,
        originalPrice: 99.0,
        stock: 22,
        rating: 4.9,
        totalReviews: 189,
        image: "🧴",
        benefits: ["Dor", "Relaxamento", "Sono", "Bem-estar"],
        instructions:
          "Colocar 2-3 gotas sob a língua, 2 vezes ao dia. Efeito em 30-45 minutos.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001246",
        manufacturer: "Produtor Artesanal Cannabis SC",
        expiryDate: "2025-09-30",
        shippingTime: "4-5 dias úteis",
        freeShipping: true,
      },
      {
        id: 502,
        name: "Manteiga de Cannabis - Para Receitas",
        description:
          "Manteiga infusionada com cannabis. Perfeita para adicionar a receitas doces e salgadas. Dosagem controlada.",
        type: "Óleo",
        thcPercentage: 3,
        cbdPercentage: 8,
        dosage: "200g",
        price: 68.0,
        stock: 16,
        rating: 4.8,
        totalReviews: 112,
        image: "🧈",
        benefits: ["Dor", "Relaxamento", "Digestão"],
        instructions:
          "Usar 1-2 colheres de chá em receitas. Começar com pequenas quantidades. Efeito em 1-2 horas.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001247",
        manufacturer: "Produtor Artesanal Cannabis SC",
        expiryDate: "2025-08-31",
        shippingTime: "4-5 dias úteis",
        freeShipping: true,
      },
      {
        id: 503,
        name: "Bálsamo Labial - Proteção e Hidratação",
        description:
          "Bálsamo labial artesanal com CBD e ingredientes naturais. Proteção solar e hidratação. Uso diário.",
        type: "Pomada",
        thcPercentage: 0,
        cbdPercentage: 5,
        dosage: "15g",
        price: 28.0,
        stock: 48,
        rating: 4.7,
        totalReviews: 98,
        image: "💄",
        benefits: ["Hidratação", "Proteção", "Bem-estar"],
        instructions:
          "Aplicar nos lábios conforme necessário. Uso tópico apenas. Seguro para toda a família.",
        anvisaApproved: true,
        anvisaNumber: "ANVISA-2024-001248",
        manufacturer: "Produtor Artesanal Cannabis SC",
        expiryDate: "2025-12-31",
        shippingTime: "4-5 dias úteis",
        freeShipping: true,
      },
    ],
  },
];

export default pharmacies;
