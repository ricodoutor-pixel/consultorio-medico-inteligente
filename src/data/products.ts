export type Product = {
  id: string;
  title: string;
  description: string;
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
  // Bem-estar
  {
    id: "prod-1",
    title: "Óleo CBD Isolado 10ml",
    description: "Uso comum em protocolos de bem-estar sob orientação profissional. Acompanha laudo COA.",
    price: "R$ 69,90",
    priceValue: 69.9,
    category: "Bem-estar",
    vendor: "Verde Vida",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=400&h=300&fit=crop",
    tags: ["CBD", "Óleo", "Popular"],
  },
  {
    id: "prod-2",
    title: "Cápsulas CBD 25mg (30un)",
    description: "Cápsulas de fácil administração. Ideal para quem busca praticidade no dia a dia.",
    price: "R$ 59,90",
    priceValue: 59.9,
    category: "Bem-estar",
    vendor: "Cannabis Pharma",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
    tags: ["CBD", "Cápsulas", "Prático"],
  },
  {
    id: "prod-3",
    title: "Tintura Full Spectrum 30ml",
    description: "Fórmula completa com espectro total. Laudos de qualidade disponíveis.",
    price: "R$ 89,90",
    priceValue: 89.9,
    category: "Bem-estar",
    vendor: "Nature Lab",
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
    tags: ["Full Spectrum", "Tintura"],
  },
  // Sono
  {
    id: "prod-4",
    title: "Gomas de Melatonina + Cânhamo",
    description: "Linha de sono e bem-estar. Uso responsável com orientação profissional.",
    price: "R$ 39,90",
    priceValue: 39.9,
    category: "Sono",
    vendor: "Sleep Well",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
    tags: ["Melatonina", "Sono", "Gomas"],
  },
  {
    id: "prod-5",
    title: "Chá Relaxante com Hemp",
    description: "Blend de ervas com hemp para momentos de relaxamento. 20 sachês.",
    price: "R$ 24,90",
    priceValue: 24.9,
    category: "Sono",
    vendor: "Herbal Mix",
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    tags: ["Chá", "Relaxante", "Acessível"],
  },
  {
    id: "prod-6",
    title: "Óleo para Sono CBD 500mg",
    description: "Formulação específica para rotina noturna. Acompanha conta-gotas calibrado.",
    price: "R$ 79,90",
    priceValue: 79.9,
    category: "Sono",
    vendor: "Verde Vida",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop",
    tags: ["CBD", "Sono", "Óleo"],
  },
  // Tópicos
  {
    id: "prod-7",
    title: "Creme Tópico Hemp 120g",
    description: "Bem-estar muscular e pele. Transparência de composição e laudos disponíveis.",
    price: "R$ 29,90",
    priceValue: 29.9,
    category: "Tópicos",
    vendor: "Nature Lab",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop",
    tags: ["Tópico", "Creme", "Popular"],
  },
  {
    id: "prod-8",
    title: "Gel Muscular CBD 100ml",
    description: "Para uso tópico localizado. Composição transparente com COA.",
    price: "R$ 44,90",
    priceValue: 44.9,
    category: "Tópicos",
    vendor: "Cannabis Pharma",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop",
    tags: ["Gel", "Muscular", "CBD"],
  },
  {
    id: "prod-9",
    title: "Balm Labial Hemp",
    description: "Hidratante labial com extrato de hemp. Proteção e nutrição diária.",
    price: "R$ 14,90",
    priceValue: 14.9,
    category: "Tópicos",
    vendor: "Herbal Mix",
    rating: 4.4,
    imageUrl: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=300&fit=crop",
    tags: ["Labial", "Hemp", "Acessível"],
  },
  // Vitaminas
  {
    id: "prod-10",
    title: "Vitamina D3 + Hemp (60 cáps)",
    description: "Suplementação com vitamina D3 e extrato de hemp para imunidade.",
    price: "R$ 34,90",
    priceValue: 34.9,
    category: "Vitaminas",
    vendor: "Sleep Well",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=300&fit=crop",
    tags: ["Vitamina D", "Imunidade"],
  },
  {
    id: "prod-11",
    title: "Ômega 3 + CBD (60 cáps)",
    description: "Combinação de ômega 3 com CBD para saúde cardiovascular e bem-estar.",
    price: "R$ 49,90",
    priceValue: 49.9,
    category: "Vitaminas",
    vendor: "Verde Vida",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=400&h=300&fit=crop",
    tags: ["Ômega 3", "CBD", "Saúde"],
  },
  {
    id: "prod-12",
    title: "Multivitamínico Hemp (90 cáps)",
    description: "Complexo vitamínico com extrato de hemp. Para uso diário com orientação.",
    price: "R$ 54,90",
    priceValue: 54.9,
    category: "Vitaminas",
    vendor: "Nature Lab",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=300&fit=crop",
    tags: ["Multivitamínico", "Hemp"],
  },
];
