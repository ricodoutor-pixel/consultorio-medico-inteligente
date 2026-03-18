import cbdOilTincture from "@/assets/products/cbd-oil-tincture.jpg";
import cbdCapsules from "@/assets/products/cbd-capsules.jpg";
import fullSpectrumOil from "@/assets/products/full-spectrum-oil.jpg";
import cbdSpray from "@/assets/products/cbd-spray.jpg";
import cbdGummiesSleep from "@/assets/products/cbd-gummies-sleep.jpg";
import cbdSleepOil from "@/assets/products/cbd-sleep-oil.jpg";
import cbdCreamTopical from "@/assets/products/cbd-cream-topical.jpg";
import cbdMuscleGel from "@/assets/products/cbd-muscle-gel.jpg";
import cbdOmega3 from "@/assets/products/cbd-omega3.jpg";
import cbdPatches from "@/assets/products/cbd-patches.jpg";

export type Product = {
  id: string;
  title: string;
  description: string;
  benefits: string;
  price: string;
  priceValue: number;
  category: string;
  vendor: string;
  rating: number;
  imageUrl: string;
  tags: string[];
  freeShipping?: boolean;
};

export const productCategories = ["Bem-estar", "Sono", "Tópicos", "Vitaminas", "Medicinais"];

export const products: Product[] = [
  // ═══════ Bem-estar ═══════
  {
    id: "prod-1",
    title: "Óleo CBD Isolado 1000mg",
    description: "Óleo CBD de alta concentração com laudo COA. Conta-gotas calibrado para dosagem precisa.",
    benefits: "Estudos do Journal of Clinical Psychology (2019) demonstram redução de ansiedade em 79% dos pacientes. Propriedades anti-inflamatórias e neuroprotetoras comprovadas.",
    price: "R$ 189,90",
    priceValue: 189.9,
    category: "Bem-estar",
    vendor: "Verde Vida Farmácia",
    rating: 4.9,
    imageUrl: cbdOilTincture,
    tags: ["CBD", "Óleo", "1000mg", "Popular"],
    freeShipping: true,
  },
  {
    id: "prod-2",
    title: "Cápsulas CBD 25mg (30un)",
    description: "Cápsulas softgel de fácil administração. Ideal para quem busca praticidade no dia a dia.",
    benefits: "Biodisponibilidade oral garante absorção gradual e constante. Pesquisas da USP indicam eficácia no controle de dor neuropática e espasticidade muscular.",
    price: "R$ 129,90",
    priceValue: 129.9,
    category: "Bem-estar",
    vendor: "Cannabis Pharma BR",
    rating: 4.7,
    imageUrl: cbdCapsules,
    tags: ["CBD", "Cápsulas", "Prático"],
    freeShipping: true,
  },
  {
    id: "prod-3",
    title: "Tintura Full Spectrum 30ml",
    description: "Fórmula completa com espectro total de canabinoides. Laudos de qualidade disponíveis.",
    benefits: "O efeito entourage potencializa a ação terapêutica. Combinação natural de canabinoides e terpenos é até 4x mais eficaz que CBD isolado para dor crônica.",
    price: "R$ 249,90",
    priceValue: 249.9,
    category: "Bem-estar",
    vendor: "Nature Lab Canábica",
    rating: 4.9,
    imageUrl: fullSpectrumOil,
    tags: ["Full Spectrum", "Tintura", "Premium"],
    freeShipping: true,
  },
  {
    id: "prod-4",
    title: "Spray Sublingual CBD 500mg",
    description: "Spray sublingual de rápida absorção. Ideal para crises de ansiedade e dor aguda.",
    benefits: "Via sublingual oferece biodisponibilidade de até 35%. Alívio em 5-15 minutos, ideal para crises agudas de ansiedade.",
    price: "R$ 159,90",
    priceValue: 159.9,
    category: "Bem-estar",
    vendor: "Botânica Medicinal",
    rating: 4.8,
    imageUrl: cbdSpray,
    tags: ["Spray", "Sublingual", "Rápido"],
    freeShipping: true,
  },

  // ═══════ Sono ═══════
  {
    id: "prod-5",
    title: "Gomas CBD + Melatonina (30un)",
    description: "Gomas mastigáveis com CBD e melatonina para indução natural do sono.",
    benefits: "Combinação de melatonina com CBD atua em receptores CB1, regulando o ciclo circadiano. Melhora de 65% na latência do sono.",
    price: "R$ 89,90",
    priceValue: 89.9,
    category: "Sono",
    vendor: "Sleep Well Brasil",
    rating: 4.8,
    imageUrl: cbdGummiesSleep,
    tags: ["Melatonina", "Sono", "Gomas"],
    freeShipping: true,
  },
  {
    id: "prod-6",
    title: "Óleo CBD Sleep 500mg",
    description: "Formulação noturna com lavanda e CBD. Conta-gotas calibrado incluso.",
    benefits: "CBD em dosagem noturna demonstra melhora na qualidade do sono em 66,7% dos pacientes. Reduz tempo para adormecer.",
    price: "R$ 179,90",
    priceValue: 179.9,
    category: "Sono",
    vendor: "Verde Vida Farmácia",
    rating: 4.9,
    imageUrl: cbdSleepOil,
    tags: ["CBD", "Sono", "Óleo", "Noturno"],
    freeShipping: true,
  },

  // ═══════ Tópicos ═══════
  {
    id: "prod-7",
    title: "Creme Tópico CBD 120g",
    description: "Creme para alívio localizado de dores musculares e articulares. Grau farmacêutico.",
    benefits: "CBD tópico interage com receptores CB2 na pele, proporcionando ação anti-inflamatória localizada. Redução de dor articular em 70% dos participantes.",
    price: "R$ 99,90",
    priceValue: 99.9,
    category: "Tópicos",
    vendor: "Nature Lab Canábica",
    rating: 4.7,
    imageUrl: cbdCreamTopical,
    tags: ["Tópico", "Creme", "Articular"],
    freeShipping: true,
  },
  {
    id: "prod-8",
    title: "Gel Muscular CBD 100ml",
    description: "Gel de recuperação muscular com CBD e mentol. Ação rápida em 15-30 minutos.",
    benefits: "Absorção transdérmica com recuperação muscular 40% mais rápida. Mentol + CBD potencializa efeito analgésico sem efeitos sistêmicos.",
    price: "R$ 79,90",
    priceValue: 79.9,
    category: "Tópicos",
    vendor: "Cannabis Pharma BR",
    rating: 4.6,
    imageUrl: cbdMuscleGel,
    tags: ["Gel", "Muscular", "Esportivo"],
    freeShipping: true,
  },
  {
    id: "prod-9",
    title: "Adesivos Transdérmicos CBD (10un)",
    description: "Patches de liberação prolongada de CBD. Até 12h de efeito contínuo por adesivo.",
    benefits: "Liberação controlada e constante de CBD por via transdérmica. Ideal para dor crônica que requer ação contínua ao longo do dia.",
    price: "R$ 119,90",
    priceValue: 119.9,
    category: "Tópicos",
    vendor: "Botânica Medicinal",
    rating: 4.8,
    imageUrl: cbdPatches,
    tags: ["Patches", "Transdérmico", "12h"],
    freeShipping: true,
  },

  // ═══════ Vitaminas ═══════
  {
    id: "prod-10",
    title: "Ômega 3 + CBD (60 cáps)",
    description: "Combinação sinérgica de ômega-3 (EPA/DHA) com CBD para saúde cerebral e cardiovascular.",
    benefits: "Ômega-3 combinado com CBD atua na neuroproteção. Redução de neuroinflamação e melhora cognitiva comprovada.",
    price: "R$ 109,90",
    priceValue: 109.9,
    category: "Vitaminas",
    vendor: "Verde Vida Farmácia",
    rating: 4.8,
    imageUrl: cbdOmega3,
    tags: ["Ômega 3", "CBD", "Neuro"],
    freeShipping: true,
  },
];
