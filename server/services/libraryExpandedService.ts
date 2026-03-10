export interface PlantaVariety {
  id: string;
  name: string;
  scientificName: string;
  thcContent: number; // %
  cbdContent: number; // %
  effects: string[];
  medicalUses: string[];
  growthTime: number; // dias
  difficulty: 'easy' | 'medium' | 'hard';
  climate: string;
  flavor: string[];
  aroma: string[];
  images: string[];
  description: string;
  rating: number;
  reviews: number;
  origin: string;
  breeder: string;
}

export class LibraryExpandedService {
  /**
   * Gera 100+ variedades de cannabis
   */
  static generatePlantaVarieties(): PlantaVariety[] {
    const varieties: PlantaVariety[] = [
      // Sativas
      {
        id: 'sativa_001',
        name: 'Green Crack',
        scientificName: 'Cannabis sativa',
        thcContent: 15,
        cbdContent: 0.5,
        effects: ['Energetic', 'Creative', 'Focus'],
        medicalUses: ['Depression', 'Fatigue', 'ADHD'],
        growthTime: 60,
        difficulty: 'easy',
        climate: 'Tropical',
        flavor: ['Citrus', 'Mango'],
        aroma: ['Fruity', 'Sweet'],
        images: [
          'https://example.com/green-crack-1.jpg',
          'https://example.com/green-crack-2.jpg',
        ],
        description: 'Energetic sativa known for its uplifting effects',
        rating: 4.8,
        reviews: 245,
        origin: 'USA',
        breeder: 'Subcool',
      },
      {
        id: 'sativa_002',
        name: 'Sour Diesel',
        scientificName: 'Cannabis sativa',
        thcContent: 18,
        cbdContent: 0.3,
        effects: ['Uplifting', 'Energetic', 'Creative'],
        medicalUses: ['Depression', 'Pain', 'Stress'],
        growthTime: 70,
        difficulty: 'medium',
        climate: 'Temperate',
        flavor: ['Diesel', 'Citrus'],
        aroma: ['Pungent', 'Sour'],
        images: ['https://example.com/sour-diesel-1.jpg'],
        description: 'Classic sativa with strong diesel aroma',
        rating: 4.7,
        reviews: 312,
        origin: 'USA',
        breeder: 'Unknown',
      },
      // Indicas
      {
        id: 'indica_001',
        name: 'Northern Lights',
        scientificName: 'Cannabis indica',
        thcContent: 16,
        cbdContent: 0.8,
        effects: ['Relaxing', 'Sleepy', 'Euphoric'],
        medicalUses: ['Insomnia', 'Pain', 'Anxiety'],
        growthTime: 50,
        difficulty: 'easy',
        climate: 'Cold',
        flavor: ['Pine', 'Sweet'],
        aroma: ['Earthy', 'Piney'],
        images: ['https://example.com/northern-lights-1.jpg'],
        description: 'Legendary indica for sleep and relaxation',
        rating: 4.9,
        reviews: 567,
        origin: 'Netherlands',
        breeder: 'Sensi Seeds',
      },
      {
        id: 'indica_002',
        name: 'Granddaddy Purple',
        scientificName: 'Cannabis indica',
        thcContent: 17,
        cbdContent: 0.7,
        effects: ['Relaxing', 'Happy', 'Sleepy'],
        medicalUses: ['Insomnia', 'Stress', 'Pain'],
        growthTime: 55,
        difficulty: 'easy',
        climate: 'Temperate',
        flavor: ['Grape', 'Berry'],
        aroma: ['Sweet', 'Fruity'],
        images: ['https://example.com/gdp-1.jpg'],
        description: 'Purple indica with fruity flavor',
        rating: 4.8,
        reviews: 423,
        origin: 'USA',
        breeder: 'Ken Estes',
      },
      // Hybrids
      {
        id: 'hybrid_001',
        name: 'Blue Dream',
        scientificName: 'Cannabis hybrid',
        thcContent: 17,
        cbdContent: 0.5,
        effects: ['Balanced', 'Creative', 'Relaxing'],
        medicalUses: ['Depression', 'Pain', 'Anxiety'],
        growthTime: 60,
        difficulty: 'medium',
        climate: 'Temperate',
        flavor: ['Blueberry', 'Vanilla'],
        aroma: ['Sweet', 'Fruity'],
        images: ['https://example.com/blue-dream-1.jpg'],
        description: 'Popular hybrid with balanced effects',
        rating: 4.7,
        reviews: 678,
        origin: 'USA',
        breeder: 'DJ Short',
      },
      {
        id: 'hybrid_002',
        name: 'Girl Scout Cookies',
        scientificName: 'Cannabis hybrid',
        thcContent: 19,
        cbdContent: 0.4,
        effects: ['Euphoric', 'Relaxing', 'Happy'],
        medicalUses: ['Stress', 'Pain', 'Depression'],
        growthTime: 65,
        difficulty: 'medium',
        climate: 'Temperate',
        flavor: ['Sweet', 'Minty'],
        aroma: ['Earthy', 'Sweet'],
        images: ['https://example.com/gsc-1.jpg'],
        description: 'Award-winning hybrid with sweet flavor',
        rating: 4.9,
        reviews: 812,
        origin: 'USA',
        breeder: 'Unknown',
      },
    ];

    // Gerar 94 variedades adicionais
    for (let i = 7; i <= 100; i++) {
      const types = ['sativa', 'indica', 'hybrid'];
      const type = types[Math.floor(Math.random() * types.length)];
      const typeId = type === 'sativa' ? 'sativa' : type === 'indica' ? 'indica' : 'hybrid';

      varieties.push({
        id: `${typeId}_${String(i).padStart(3, '0')}`,
        name: `Variety ${i}`,
        scientificName: `Cannabis ${type}`,
        thcContent: Math.floor(Math.random() * 20) + 5,
        cbdContent: Math.random() * 2,
        effects: this.generateRandomEffects(),
        medicalUses: this.generateRandomMedicalUses(),
        growthTime: Math.floor(Math.random() * 40) + 45,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any,
        climate: ['Tropical', 'Temperate', 'Cold'][Math.floor(Math.random() * 3)],
        flavor: this.generateRandomFlavors(),
        aroma: this.generateRandomAromas(),
        images: [`https://example.com/variety-${i}-1.jpg`],
        description: `High-quality ${type} variety with unique characteristics`,
        rating: Math.round((Math.random() * 2 + 3.5) * 10) / 10,
        reviews: Math.floor(Math.random() * 500) + 50,
        origin: ['USA', 'Netherlands', 'Spain', 'Canada', 'Australia'][
          Math.floor(Math.random() * 5)
        ],
        breeder: `Breeder ${Math.floor(Math.random() * 100)}`,
      });
    }

    return varieties;
  }

  private static generateRandomEffects(): string[] {
    const effects = ['Energetic', 'Relaxing', 'Euphoric', 'Creative', 'Focus', 'Happy', 'Sleepy'];
    return effects.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private static generateRandomMedicalUses(): string[] {
    const uses = [
      'Depression',
      'Anxiety',
      'Pain',
      'Insomnia',
      'Stress',
      'ADHD',
      'Inflammation',
      'Nausea',
    ];
    return uses.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private static generateRandomFlavors(): string[] {
    const flavors = [
      'Citrus',
      'Berry',
      'Pine',
      'Diesel',
      'Mint',
      'Vanilla',
      'Chocolate',
      'Fruity',
    ];
    return flavors.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private static generateRandomAromas(): string[] {
    const aromas = ['Sweet', 'Earthy', 'Pungent', 'Fruity', 'Sour', 'Piney', 'Floral'];
    return aromas.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 1);
  }

  /**
   * Busca variedades por filtros
   */
  static searchVarieties(
    varieties: PlantaVariety[],
    filters: {
      thcMin?: number;
      thcMax?: number;
      cbdMin?: number;
      cbdMax?: number;
      effects?: string[];
      medicalUses?: string[];
      difficulty?: string;
      type?: string;
    }
  ): PlantaVariety[] {
    return varieties.filter((variety) => {
      if (filters.thcMin && variety.thcContent < filters.thcMin) return false;
      if (filters.thcMax && variety.thcContent > filters.thcMax) return false;
      if (filters.cbdMin && variety.cbdContent < filters.cbdMin) return false;
      if (filters.cbdMax && variety.cbdContent > filters.cbdMax) return false;
      if (filters.difficulty && variety.difficulty !== filters.difficulty) return false;
      if (filters.type && !variety.scientificName.includes(filters.type)) return false;
      if (
        filters.effects &&
        !filters.effects.some((effect) => variety.effects.includes(effect))
      )
        return false;
      if (
        filters.medicalUses &&
        !filters.medicalUses.some((use) => variety.medicalUses.includes(use))
      )
        return false;
      return true;
    });
  }

  /**
   * Gera página individual de planta
   */
  static generatePlantDetailPage(variety: PlantaVariety): {
    title: string;
    content: string;
    gallery: string[];
    specifications: { [key: string]: string };
    reviews: { author: string; rating: number; comment: string }[];
  } {
    return {
      title: variety.name,
      content: `
        <h1>${variety.name}</h1>
        <p><strong>Scientific Name:</strong> ${variety.scientificName}</p>
        <p><strong>Origin:</strong> ${variety.origin}</p>
        <p><strong>Breeder:</strong> ${variety.breeder}</p>
        <p>${variety.description}</p>
        
        <h2>Effects</h2>
        <p>${variety.effects.join(', ')}</p>
        
        <h2>Medical Uses</h2>
        <p>${variety.medicalUses.join(', ')}</p>
        
        <h2>Growing Information</h2>
        <ul>
          <li>Growth Time: ${variety.growthTime} days</li>
          <li>Difficulty: ${variety.difficulty}</li>
          <li>Climate: ${variety.climate}</li>
        </ul>
      `,
      gallery: variety.images,
      specifications: {
        'THC Content': `${variety.thcContent}%`,
        'CBD Content': `${variety.cbdContent}%`,
        'Flavor': variety.flavor.join(', '),
        'Aroma': variety.aroma.join(', '),
        'Growth Time': `${variety.growthTime} days`,
        'Difficulty': variety.difficulty,
        'Climate': variety.climate,
        'Origin': variety.origin,
      },
      reviews: [
        {
          author: 'User123',
          rating: 5,
          comment: 'Excellent variety, highly recommended!',
        },
        {
          author: 'GrowerPro',
          rating: 4,
          comment: 'Great effects, easy to grow',
        },
      ],
    };
  }

  /**
   * Gera recomendações baseadas em preferências
   */
  static getRecommendations(
    varieties: PlantaVariety[],
    userPreferences: {
      desiredEffects: string[];
      medicalNeeds: string[];
      growthExperience: 'beginner' | 'intermediate' | 'advanced';
    }
  ): PlantaVariety[] {
    const filtered = varieties.filter((variety) => {
      if (
        userPreferences.growthExperience === 'beginner' &&
        variety.difficulty !== 'easy'
      )
        return false;
      if (
        userPreferences.growthExperience === 'intermediate' &&
        variety.difficulty === 'hard'
      )
        return false;

      const effectMatch = userPreferences.desiredEffects.some((effect) =>
        variety.effects.includes(effect)
      );
      const medicalMatch = userPreferences.medicalNeeds.some((need) =>
        variety.medicalUses.includes(need)
      );

      return effectMatch || medicalMatch;
    });

    return filtered.sort((a, b) => b.rating - a.rating).slice(0, 10);
  }
}
