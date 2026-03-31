/**
 * Club Planta y Raiz - Catálogo de Produtos
 * E-commerce de Lifestyle focado em público jovem (18-24 anos)
 */

export interface ClubProduct {
  id: string;
  name: string;
  category: 'camisetas' | 'bones' | 'chapeus' | 'canecas';
  price: number;
  image: string;
  description: string;
  stampDescription: string;
  material: string;
  colors: string[];
  isLimitedEdition: boolean;
  memberDiscount: number;
  stock: number;
  rating: number;
  reviews: number;
}

export const clubProducts: ClubProduct[] = [
  // CATEGORIA: CAMISETAS (4 modelos)
  {
    id: 'camiseta-verdinho-explorer',
    name: 'Camiseta "Verdinho Explorer"',
    category: 'camisetas',
    price: 89.90,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663065229674/XQPvBCLCnwZajUp4KoE3Kh/camiseta-verdinho-explorer-HUz6nKKN2zFSvE2NJuhfzs.webp',
    description: 'Camiseta de algodão premium, cor Verde Musgo. Modelagem oversized (estilo skatista).',
    stampDescription: 'No centro, ilustração em estilo cartoon rústico do personagem "Verdinho" usando mochila de trilha e binóculos. Abaixo dele, em fonte cursiva amigável: "Explorando o Nosso Mundo". Na barra da manga esquerda, o domínio "plantayraiz.com.br".',
    material: 'Algodão 100% premium',
    colors: ['Verde Musgo'],
    isLimitedEdition: false,
    memberDiscount: 15,
    stock: 45,
    rating: 4.8,
    reviews: 234,
  },
  {
    id: 'camiseta-logo-roots-gradient',
    name: 'Camiseta "Logo Roots - Gradient"',
    category: 'camisetas',
    price: 94.90,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663065229674/XQPvBCLCnwZajUp4KoE3Kh/camiseta-logo-roots-gradient-aPqCQwy8kkqjj3XRJVZfRX.webp',
    description: 'Camiseta Branca de gola redonda. Tecido leve e confortável.',
    stampDescription: 'O logotipo oficial "Planta y Raiz" grande no peito, preenchido com gradiente suave do Laranja Pôr do Sol para o Roxo Neon. Ao redor do logo, pequenas silhuetas minimalistas de montanhas e ondas. O domínio está discretamente nas costas.',
    material: 'Algodão 100% leve',
    colors: ['Branco'],
    isLimitedEdition: false,
    memberDiscount: 15,
    stock: 38,
    rating: 4.9,
    reviews: 312,
  },
  {
    id: 'camiseta-cachoeira-relax',
    name: 'Camiseta "Cachoeira Relax"',
    category: 'camisetas',
    price: 99.90,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663065229674/XQPvBCLCnwZajUp4KoE3Kh/camiseta-cachoeira-relax-QY99yeZXX8H326H586pPjk.webp',
    description: 'Camiseta Azul Petróleo, tecido estonado (efeito lavado).',
    stampDescription: 'Arte psicodélica leve misturando uma cachoeira fluida com raízes de árvores. O personagem Verdinho está relaxando em uma bóia na base da cachoeira. Texto sutil em branco: "Flow with Nature" e o domínio na lateral inferior.',
    material: 'Algodão 100% estonado',
    colors: ['Azul Petróleo'],
    isLimitedEdition: true,
    memberDiscount: 20,
    stock: 22,
    rating: 5.0,
    reviews: 189,
  },
  {
    id: 'camiseta-noite-estrelas',
    name: 'Camiseta "Noite nas Estrelas"',
    category: 'camisetas',
    price: 104.90,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663065229674/XQPvBCLCnwZajUp4KoE3Kh/camiseta-noite-estrelas-VGAoCh8amHKCas9Fgk8F8cz.webp',
    description: 'Camiseta Preta, corte slim fit.',
    stampDescription: 'Estampa fotográfica em tons de cinza de uma barraca de acampamento sob um céu estrelado massivo (Via Láctea). As estrelas têm um brilho sutil amarelado. No topo, o domínio "plantayraiz.com.br" imitando uma constelação.',
    material: 'Algodão 100% premium',
    colors: ['Preto'],
    isLimitedEdition: true,
    memberDiscount: 20,
    stock: 18,
    rating: 4.9,
    reviews: 267,
  },

  // CATEGORIA: BONÉS (2 modelos)
  {
    id: 'bone-trucker-roots',
    name: 'Boné "Trucker Roots"',
    category: 'bones',
    price: 79.90,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    description: 'Boné modelo Trucker (frente de espuma, traseira de redinha). Cores: Marrom e Creme.',
    stampDescription: 'Painel frontal creme com um patch circular de tecido bordado. O patch contém o logo "Planta y Raiz" em relevo marrom, rodeado por folhas de samambaia. Aba curva marrom.',
    material: 'Espuma + Redinha + Bordado',
    colors: ['Marrom', 'Creme'],
    isLimitedEdition: false,
    memberDiscount: 12,
    stock: 56,
    rating: 4.7,
    reviews: 145,
  },
  {
    id: 'bone-dad-hat-verdinho',
    name: 'Boné "Dad Hat Verdinho Sketch"',
    category: 'bones',
    price: 74.90,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    description: 'Boné modelo Dad Hat (tecido mole, sem estrutura frontal). Cor: Rosa Millennial Desbotado.',
    stampDescription: 'Bordado minimalista e pequeno no centro frontal apenas do contorno do rosto do personagem "Verdinho", feito em linha branca. Na lateral esquerda, o domínio em letras minúsculas.',
    material: 'Algodão mole + Bordado',
    colors: ['Rosa Millennial'],
    isLimitedEdition: false,
    memberDiscount: 12,
    stock: 42,
    rating: 4.8,
    reviews: 198,
  },

  // CATEGORIA: CHAPÉUS DE PRAIA (2 modelos)
  {
    id: 'chapeu-bucket-tropical',
    name: 'Chapéu Bucket "Tropical Vibe"',
    category: 'chapeus',
    price: 84.90,
    image: 'https://images.unsplash.com/photo-1529074290759-fbf8caf787f1?w=500&h=500&fit=crop',
    description: 'Chapéu Bucket (estilo pescador) reversível. Lado 1: Estampa total. Lado 2: Cor sólida.',
    stampDescription: 'Lado 1: Estampa corrida (pattern) com miniaturas do personagem Verdinho usando óculos de sol, folhas tropicais e o logo Planta y Raiz. Cores: Amarelo, Verde e Azul Turquesa.',
    material: 'Algodão + Poliéster reversível',
    colors: ['Amarelo', 'Verde', 'Azul Turquesa'],
    isLimitedEdition: false,
    memberDiscount: 15,
    stock: 35,
    rating: 4.9,
    reviews: 276,
  },
  {
    id: 'viseira-sol-sal',
    name: 'Viseira "Sol e Sal"',
    category: 'chapeus',
    price: 69.90,
    image: 'https://images.unsplash.com/photo-1529074290759-fbf8caf787f1?w=500&h=500&fit=crop',
    description: 'Viseira de praia aberta no topo. Material: Palha natural trançada e tecido.',
    stampDescription: 'A aba é de palha natural. A faixa de cabeça é de tecido Branco com o logo Planta y Raiz e o domínio repetidos em estampa preta e fina.',
    material: 'Palha natural + Tecido branco',
    colors: ['Natural', 'Branco'],
    isLimitedEdition: false,
    memberDiscount: 12,
    stock: 51,
    rating: 4.6,
    reviews: 134,
  },

  // CATEGORIA: CANECAS (2 modelos)
  {
    id: 'caneca-aventura-matinal',
    name: 'Caneca "Aventura Matinal" (Cerâmica)',
    category: 'canecas',
    price: 49.90,
    image: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=500&h=500&fit=crop',
    description: 'Caneca de cerâmica robusta, 350ml. Cor: Branco Esmaltado com borda preta rústica (estilo ágata).',
    stampDescription: 'De um lado, o logo "Club Planta y Raiz". Do outro, a frase: "O melhor café é o da trilha" com uma pequena ilustração de montanhas. O domínio está na base interna da caneca.',
    material: 'Cerâmica esmaltada',
    colors: ['Branco', 'Preto'],
    isLimitedEdition: false,
    memberDiscount: 10,
    stock: 78,
    rating: 4.7,
    reviews: 412,
  },
  {
    id: 'caneca-termica-natureza',
    name: 'Caneca Térmica "Gole de Natureza" (Aço)',
    category: 'canecas',
    price: 129.90,
    image: 'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=500&h=500&fit=crop',
    description: 'Caneca térmica de aço inoxidável com tampa. Cor: Laranja Neon (vibrante).',
    stampDescription: 'Gravação a laser (efeito prata fosco no laranja) do personagem Verdinho escalando uma raiz gigante que forma o logo. O domínio "plantayraiz.com.br" está gravado verticalmente perto da alça.',
    material: 'Aço inoxidável 304 + Tampa',
    colors: ['Laranja Neon'],
    isLimitedEdition: true,
    memberDiscount: 18,
    stock: 28,
    rating: 5.0,
    reviews: 356,
  },
];

/**
 * Feed Social de Turismo - Posts de Usuários
 */
export interface SocialPost {
  id: string;
  userId: string;
  author: string;
  avatar: string;
  content: string;
  images: string[];
  location: string;
  locationType: 'trilha' | 'cachoeira' | 'pousada' | 'praia' | 'cafe';
  likes: number;
  comments: number;
  timestamp: Date;
  memberBadge?: boolean;
}

export const socialPosts: SocialPost[] = [
  {
    id: 'post-1',
    userId: 'user-1',
    author: 'Marina Silva',
    avatar: '👩‍🦱',
    content: 'Que manhã perfeita na Cachoeira do Poço Verde! A água estava tão cristalina... 💚 Já vou voltar!',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
    ],
    location: 'Cachoeira do Poço Verde, RJ',
    locationType: 'cachoeira',
    likes: 342,
    comments: 28,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    memberBadge: true,
  },
  {
    id: 'post-2',
    userId: 'user-2',
    author: 'Lucas Oliveira',
    avatar: '👨‍🦱',
    content: 'Trilha da Serra da Mantiqueira no amanhecer... Nada se compara! 🏔️✨',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
    ],
    location: 'Serra da Mantiqueira, SP',
    locationType: 'trilha',
    likes: 567,
    comments: 45,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    memberBadge: false,
  },
  {
    id: 'post-3',
    userId: 'user-3',
    author: 'Ana Costa',
    avatar: '👩‍🦲',
    content: 'Pousada Refúgio da Natureza é simplesmente incrível! Recomendo demais para quem quer desconectar. 🌿',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
    ],
    location: 'Pousada Refúgio da Natureza, MG',
    locationType: 'pousada',
    likes: 289,
    comments: 32,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    memberBadge: true,
  },
  {
    id: 'post-4',
    userId: 'user-4',
    author: 'Felipe Santos',
    avatar: '👨‍🦲',
    content: 'Dia de praia em Jericoacoara! O pôr do sol aqui é de outro mundo 🌅',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=500&fit=crop',
    ],
    location: 'Jericoacoara, CE',
    locationType: 'praia',
    likes: 678,
    comments: 67,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    memberBadge: false,
  },
  {
    id: 'post-5',
    userId: 'user-5',
    author: 'Juliana Rocha',
    avatar: '👩‍🦳',
    content: 'Café da manhã com vista para a mata atlântica! ☕🍃 Melhor jeito de começar o dia!',
    images: [
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=500&fit=crop',
    ],
    location: 'Café Montanha Verde, SC',
    locationType: 'cafe',
    likes: 423,
    comments: 38,
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    memberBadge: true,
  },
];

/**
 * Drops Exclusivos - Lançamentos Limitados
 */
export interface ExclusiveDrop {
  id: string;
  name: string;
  description: string;
  launchDate: Date;
  quantity: number;
  image: string;
  discount: number;
  isMemberOnly: boolean;
}

export const exclusiveDrops: ExclusiveDrop[] = [
  {
    id: 'drop-1',
    name: 'Edição Especial: Verdinho Astronauta',
    description: 'Camiseta com estampa especial do Verdinho no espaço. Apenas 100 unidades!',
    launchDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    quantity: 100,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    discount: 25,
    isMemberOnly: true,
  },
  {
    id: 'drop-2',
    name: 'Colação Colaborativa: Artista Local',
    description: 'Parceria com artista de SP. Edição limitada de bonés customizados.',
    launchDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    quantity: 50,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    discount: 20,
    isMemberOnly: false,
  },
];

/**
 * Locais de Check-in (Mapa Interativo)
 */
export interface CheckinLocation {
  id: string;
  name: string;
  type: 'trilha' | 'cachoeira' | 'pousada' | 'praia' | 'cafe';
  latitude: number;
  longitude: number;
  description: string;
  difficulty?: 'fácil' | 'médio' | 'difícil';
  rating: number;
  checkins: number;
  image: string;
}

export const checkinLocations: CheckinLocation[] = [
  {
    id: 'loc-1',
    name: 'Cachoeira do Poço Verde',
    type: 'cachoeira',
    latitude: -22.5,
    longitude: -44.5,
    description: 'Cachoeira com piscina natural cristalina',
    rating: 4.9,
    checkins: 1243,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
  },
  {
    id: 'loc-2',
    name: 'Trilha da Serra da Mantiqueira',
    type: 'trilha',
    latitude: -22.4,
    longitude: -44.6,
    description: 'Trilha com vista panorâmica e amanhecer espetacular',
    difficulty: 'médio',
    rating: 4.8,
    checkins: 856,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
  },
  {
    id: 'loc-3',
    name: 'Praia de Jericoacoara',
    type: 'praia',
    latitude: -2.6,
    longitude: -40.1,
    description: 'Praia paradisíaca com dunas e pôr do sol inesquecível',
    rating: 5.0,
    checkins: 2134,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=500&fit=crop',
  },
];
