export interface Product {
  id: string;
  name: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  reviews: number;
  seller: string;
  description: string;
}

export interface UserPreferences {
  categories: string[];
  priceRange: { min: number; max: number };
  minRating: number;
  tags: string[];
  searchHistory: string[];
}

export interface MatchScore {
  productId: string;
  score: number; // 0-100
  breakdown: {
    categoryMatch: number;
    priceMatch: number;
    ratingMatch: number;
    tagMatch: number;
    historyMatch: number;
  };
  recommendation: string;
}

export class MarketplaceMatchService {
  /**
   * Calcula Match Score automático entre produto e preferências do usuário
   */
  static calculateMatchScore(product: Product, userPreferences: UserPreferences): MatchScore {
    const categoryMatch = this.calculateCategoryMatch(product.category, userPreferences.categories);
    const priceMatch = this.calculatePriceMatch(product.price, userPreferences.priceRange);
    const ratingMatch = this.calculateRatingMatch(product.rating, userPreferences.minRating);
    const tagMatch = this.calculateTagMatch(product.tags, userPreferences.tags);
    const historyMatch = this.calculateHistoryMatch(product.name, userPreferences.searchHistory);

    const weights = {
      category: 0.25,
      price: 0.2,
      rating: 0.2,
      tags: 0.2,
      history: 0.15,
    };

    const score = Math.round(
      categoryMatch * weights.category +
        priceMatch * weights.price +
        ratingMatch * weights.rating +
        tagMatch * weights.tags +
        historyMatch * weights.history
    );

    const recommendation = this.generateRecommendation(score, product);

    return {
      productId: product.id,
      score,
      breakdown: {
        categoryMatch,
        priceMatch,
        ratingMatch,
        tagMatch,
        historyMatch,
      },
      recommendation,
    };
  }

  /**
   * Calcula match de categoria (0-100)
   */
  private static calculateCategoryMatch(productCategory: string, userCategories: string[]): number {
    if (userCategories.length === 0) return 50;
    if (userCategories.includes(productCategory)) return 100;
    return 30;
  }

  /**
   * Calcula match de preço (0-100)
   */
  private static calculatePriceMatch(
    productPrice: number,
    priceRange: { min: number; max: number }
  ): number {
    if (productPrice >= priceRange.min && productPrice <= priceRange.max) {
      return 100;
    }
    if (productPrice < priceRange.min) {
      const diff = priceRange.min - productPrice;
      return Math.max(0, 100 - diff / 10);
    }
    const diff = productPrice - priceRange.max;
    return Math.max(0, 100 - diff / 10);
  }

  /**
   * Calcula match de avaliação (0-100)
   */
  private static calculateRatingMatch(productRating: number, minRating: number): number {
    if (productRating >= minRating) {
      return Math.min(100, (productRating / 5) * 100);
    }
    return Math.max(0, (productRating / minRating) * 100);
  }

  /**
   * Calcula match de tags (0-100)
   */
  private static calculateTagMatch(productTags: string[], userTags: string[]): number {
    if (userTags.length === 0) return 50;
    if (productTags.length === 0) return 30;

    const matches = productTags.filter((tag) => userTags.includes(tag)).length;
    return Math.round((matches / userTags.length) * 100);
  }

  /**
   * Calcula match com histórico de busca (0-100)
   */
  private static calculateHistoryMatch(productName: string, searchHistory: string[]): number {
    if (searchHistory.length === 0) return 50;

    const matches = searchHistory.filter((search) =>
      productName.toLowerCase().includes(search.toLowerCase())
    ).length;

    return Math.round((matches / searchHistory.length) * 100);
  }

  /**
   * Gera recomendação textual baseada no score
   */
  private static generateRecommendation(score: number, product: Product): string {
    if (score >= 90) {
      return `Excelente match! ${product.name} é perfeito para você com ${score}% de compatibilidade.`;
    }
    if (score >= 75) {
      return `Ótima recomendação! ${product.name} tem ${score}% de compatibilidade com suas preferências.`;
    }
    if (score >= 60) {
      return `Bom match! ${product.name} pode ser interessante para você (${score}% compatível).`;
    }
    if (score >= 40) {
      return `${product.name} pode ser relevante (${score}% compatível).`;
    }
    return `${product.name} tem baixa compatibilidade (${score}%).`;
  }

  /**
   * Recomenda produtos para usuário
   */
  static recommendProducts(products: Product[], userPreferences: UserPreferences): MatchScore[] {
    const matches = products.map((product) => this.calculateMatchScore(product, userPreferences));

    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Calcula score de compatibilidade de vendedor
   */
  static calculateSellerCompatibility(
    sellerRating: number,
    sellerReviews: number,
    sellerDeliveryTime: number
  ): number {
    const ratingScore = (sellerRating / 5) * 40;
    const reviewsScore = Math.min((sellerReviews / 100) * 30, 30);
    const deliveryScore = Math.max(0, 30 - (deliveryTime - 2) * 5);

    return Math.round(ratingScore + reviewsScore + deliveryScore);
  }

  /**
   * Gera insights de recomendação
   */
  static generateInsights(matches: MatchScore[]): {
    topRecommendation: MatchScore;
    averageScore: number;
    highScoreCount: number;
    recommendations: string[];
  } {
    const topRecommendation = matches[0];
    const averageScore = Math.round(
      matches.reduce((sum, m) => sum + m.score, 0) / matches.length
    );
    const highScoreCount = matches.filter((m) => m.score >= 75).length;

    const recommendations = [
      `Encontramos ${matches.length} produtos relevantes para você`,
      `Score médio de compatibilidade: ${averageScore}%`,
      `${highScoreCount} produtos com excelente compatibilidade (≥75%)`,
      topRecommendation.recommendation,
    ];

    return {
      topRecommendation,
      averageScore,
      highScoreCount,
      recommendations,
    };
  }
}
