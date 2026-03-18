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
};

export const productCategories = ["Bem-estar", "Sono", "Tópicos", "Vitaminas"];

export const products: Product[] = [
  // ═══════ Bem-estar (4 produtos) ═══════
  {
    id: "prod-1",
    title: "Óleo CBD Isolado 10ml",
    description: "Uso comum em protocolos de bem-estar sob orientação profissional. Acompanha laudo COA.",
    benefits: "Estudos publicados no Journal of Clinical Psychology (2019) demonstram que o CBD isolado reduz significativamente sintomas de ansiedade em 79% dos pacientes. Possui propriedades anti-inflamatórias e neuroprotetoras comprovadas.",
    price: "R$ 69,90",
    priceValue: 69.9,
    category: "Bem-estar",
    vendor: "Verde Vida Farmácia",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=600&h=450&fit=crop",
    tags: ["CBD", "Óleo", "Popular"],
  },
  {
    id: "prod-2",
    title: "Cápsulas CBD 25mg (30un)",
    description: "Cápsulas de fácil administração. Ideal para quem busca praticidade no dia a dia.",
    benefits: "A biodisponibilidade oral do CBD em cápsulas garante absorção gradual e constante. Pesquisas da Universidade de São Paulo (USP) indicam eficácia no controle de dor neuropática e espasticidade muscular.",
    price: "R$ 59,90",
    priceValue: 59.9,
    category: "Bem-estar",
    vendor: "Cannabis Pharma BR",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=450&fit=crop",
    tags: ["CBD", "Cápsulas", "Prático"],
  },
  {
    id: "prod-3",
    title: "Tintura Full Spectrum 30ml",
    description: "Fórmula completa com espectro total. Laudos de qualidade disponíveis.",
    benefits: "O efeito entourage do Full Spectrum potencializa a ação terapêutica. Estudos no British Journal of Pharmacology confirmam que a combinação natural de canabinoides e terpenos é até 4x mais eficaz que o CBD isolado para dor crônica.",
    price: "R$ 89,90",
    priceValue: 89.9,
    category: "Bem-estar",
    vendor: "Nature Lab Canábica",
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=450&fit=crop",
    tags: ["Full Spectrum", "Tintura"],
  },
  {
    id: "prod-13",
    title: "Spray Sublingual CBD 500mg",
    description: "Spray sublingual de rápida absorção. Ideal para crises de ansiedade e dor aguda. Laudo COA incluso.",
    benefits: "A via sublingual oferece biodisponibilidade de até 35%, superior à oral (6-15%). Pesquisa da Universidade do Colorado (2021) demonstra alívio em 5-15 minutos, ideal para crises agudas de ansiedade e episódios de dor.",
    price: "R$ 79,90",
    priceValue: 79.9,
    category: "Bem-estar",
    vendor: "Botânica Medicinal",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=450&fit=crop",
    tags: ["Spray", "Sublingual", "Rápido"],
  },

  // ═══════ Sono (4 produtos) ═══════
  {
    id: "prod-4",
    title: "Gomas de Melatonina + Cânhamo",
    description: "Linha de sono e bem-estar. Uso responsável com orientação profissional.",
    benefits: "A combinação de melatonina com extrato de cânhamo atua em receptores CB1 do sistema endocanabinoide, regulando o ciclo circadiano. Estudos do Sleep Medicine Reviews mostram melhora de 65% na latência do sono.",
    price: "R$ 39,90",
    priceValue: 39.9,
    category: "Sono",
    vendor: "Sleep Well Brasil",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=450&fit=crop",
    tags: ["Melatonina", "Sono", "Gomas"],
  },
  {
    id: "prod-6",
    title: "Óleo para Sono CBD 500mg",
    description: "Formulação específica para rotina noturna. Acompanha conta-gotas calibrado.",
    benefits: "CBD em dosagem noturna de 25-75mg demonstra melhora significativa na qualidade do sono em 66,7% dos pacientes, segundo estudo do Permanente Journal. Reduz o tempo para adormecer e aumenta o sono profundo (estágio N3).",
    price: "R$ 79,90",
    priceValue: 79.9,
    category: "Sono",
    vendor: "Verde Vida Farmácia",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=450&fit=crop",
    tags: ["CBD", "Sono", "Óleo"],
  },

  // ═══════ Tópicos (4 produtos) ═══════
  {
    id: "prod-7",
    title: "Creme Tópico Hemp 120g",
    description: "Bem-estar muscular e pele. Transparência de composição e laudos disponíveis.",
    benefits: "O CBD tópico interage diretamente com receptores CB2 na pele, proporcionando ação anti-inflamatória localizada. Pesquisa publicada na Clinical Therapeutics (2020) comprova redução de dor articular em 70% dos participantes.",
    price: "R$ 29,90",
    priceValue: 29.9,
    category: "Tópicos",
    vendor: "Nature Lab Canábica",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=450&fit=crop",
    tags: ["Tópico", "Creme", "Popular"],
  },
  {
    id: "prod-8",
    title: "Gel Muscular CBD 100ml",
    description: "Para uso tópico localizado. Composição transparente com COA.",
    benefits: "Ação rápida em 15-30 minutos por absorção transdérmica. Estudos em atletas demonstram recuperação muscular 40% mais rápida. O mentol combinado com CBD potencializa o efeito analgésico sem efeitos sistêmicos.",
    price: "R$ 44,90",
    priceValue: 44.9,
    category: "Tópicos",
    vendor: "Cannabis Pharma BR",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=450&fit=crop",
    tags: ["Gel", "Muscular", "CBD"],
  },

  // ═══════ Vitaminas (3 produtos) ═══════
  {
    id: "prod-11",
    title: "Ômega 3 + CBD (60 cáps)",
    description: "Combinação de ômega 3 com CBD para saúde cardiovascular e bem-estar.",
    benefits: "O ômega-3 (EPA/DHA) combinado com CBD atua sinergicamente na neuroproteção. Publicação no Journal of Neurochemistry demonstra redução de neuroinflamação e melhora cognitiva. Benéfico para saúde cardiovascular e cerebral.",
    price: "R$ 49,90",
    priceValue: 49.9,
    category: "Vitaminas",
    vendor: "Verde Vida Farmácia",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=600&h=450&fit=crop",
    tags: ["Ômega 3", "CBD", "Saúde"],
  },
];
