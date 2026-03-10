/**
 * Image Service for Cannabis Strains
 * Fetches real plant images from public APIs (Unsplash, Pexels, Pixabay)
 */

export interface ImageSource {
  url: string;
  source: "unsplash" | "pexels" | "pixabay" | "placeholder";
  credit?: string;
  license?: string;
}

/**
 * Get image URLs for cannabis strains
 * Uses public APIs to fetch real plant images
 */
export class ImageService {
  /**
   * Fetch image from Unsplash API
   */
  static async fetchUnsplashImage(query: string): Promise<ImageSource | null> {
    try {
      // Using Unsplash API (requires API key in production)
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1&client_id=demo`,
        { headers: { "Accept-Version": "v1" } }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json() as any;
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        return {
          url: photo.urls.regular,
          source: "unsplash",
          credit: photo.user.name,
          license: "Unsplash License"
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching from Unsplash:", error);
      return null;
    }
  }

  /**
   * Fetch image from Pexels API
   */
  static async fetchPexelsImage(query: string): Promise<ImageSource | null> {
    try {
      // Using Pexels API (requires API key in production)
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
        { headers: { "Authorization": "demo" } }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json() as any;
      if (data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        return {
          url: photo.src.medium,
          source: "pexels",
          credit: photo.photographer,
          license: "Pexels License"
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching from Pexels:", error);
      return null;
    }
  }

  /**
   * Fetch image from Pixabay API
   */
  static async fetchPixabayImage(query: string): Promise<ImageSource | null> {
    try {
      // Using Pixabay API (requires API key in production)
      const response = await fetch(
        `https://pixabay.com/api/?q=${query}&image_type=photo&per_page=1&key=demo`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json() as any;
      if (data.hits && data.hits.length > 0) {
        const image = data.hits[0];
        return {
          url: image.webformatURL,
          source: "pixabay",
          credit: image.user,
          license: "Pixabay License"
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching from Pixabay:", error);
      return null;
    }
  }

  /**
   * Get best available image for a strain
   */
  static async getStrainImage(strainName: string): Promise<ImageSource> {
    // Try multiple sources in order
    const sources = [
      () => this.fetchUnsplashImage(strainName),
      () => this.fetchPexelsImage(strainName),
      () => this.fetchPixabayImage(strainName)
    ];

    for (const source of sources) {
      const image = await source();
      if (image) return image;
    }

    // Fallback to placeholder
    return this.getPlaceholderImage(strainName);
  }

  /**
   * Get placeholder image (fallback)
   */
  static getPlaceholderImage(strainName: string): ImageSource {
    // Using a placeholder service that generates consistent images
    const encodedName = encodeURIComponent(strainName);
    return {
      url: `https://via.placeholder.com/400x400/1a1a1a/FFD700?text=${encodedName}`,
      source: "placeholder",
      credit: "Placeholder",
      license: "Placeholder"
    };
  }

  /**
   * Get images for multiple strains (batch)
   */
  static async getStrainImages(strainNames: string[]): Promise<Record<string, ImageSource>> {
    const images: Record<string, ImageSource> = {};
    
    for (const name of strainNames) {
      images[name] = await this.getStrainImage(name);
    }
    
    return images;
  }

  /**
   * Predefined image URLs for top strains (fallback database)
   */
  static getTopStrainImages(): Record<string, string> {
    return {
      "Charlotte's Web": "https://images.unsplash.com/photo-1600883694542-f049cd1338df?w=400&h=400&fit=crop",
      "Harlequin": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
      "ACDC": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
      "Cannatonic": "https://images.unsplash.com/photo-1600883694542-f049cd1338df?w=400&h=400&fit=crop",
      "Pennywise": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
      "Ringo's Gift": "https://images.unsplash.com/photo-1600883694542-f049cd1338df?w=400&h=400&fit=crop",
      "Sour Tsunami": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
      "Remedy": "https://images.unsplash.com/photo-1600883694542-f049cd1338df?w=400&h=400&fit=crop",
      "Harle-Tsu": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
      "Canna-Tsu": "https://images.unsplash.com/photo-1600883694542-f049cd1338df?w=400&h=400&fit=crop",
      "Blue Dream": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
      "OG Kush": "https://images.unsplash.com/photo-1600883694542-f049cd1338df?w=400&h=400&fit=crop",
      "Gelato": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop",
      "Sour Diesel": "https://images.unsplash.com/photo-1600883694542-f049cd1338df?w=400&h=400&fit=crop",
      "Granddaddy Purple": "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop"
    };
  }
}
