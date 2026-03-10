/**
 * Multilingual AI Service
 * Support for 15+ languages with localized AI responses
 */

type SupportedLanguage = 
  | 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'ja-JP' 
  | 'zh-CN' | 'ko-KR' | 'ru-RU' | 'ar-SA' | 'hi-IN' | 'pl-PL' | 'nl-NL' | 'tr-TR';

interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currencySymbol: string;
  decimalSeparator: string;
  thousandsSeparator: string;
}

interface AIResponse {
  id: string;
  language: SupportedLanguage;
  originalText: string;
  translatedText: string;
  aiResponse: string;
  confidence: number;
  timestamp: Date;
}

interface TranslationCache {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  sourceText: string;
  translatedText: string;
  timestamp: Date;
}

export class MultilingualAIService {
  private languageConfigs: Map<SupportedLanguage, LanguageConfig> = new Map();
  private translationCache: Map<string, TranslationCache> = new Map();
  private responses: Map<string, AIResponse> = new Map();

  constructor() {
    this.initializeLanguages();
  }

  /**
   * Initialize language configurations
   */
  private initializeLanguages(): void {
    const languages: LanguageConfig[] = [
      {
        code: 'pt-BR',
        name: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: 'R$',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'en-US',
        name: 'English (USA)',
        nativeName: 'English',
        direction: 'ltr',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '$',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      {
        code: 'es-ES',
        name: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '€',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'fr-FR',
        name: 'French',
        nativeName: 'Français',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '€',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'de-DE',
        name: 'German',
        nativeName: 'Deutsch',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '€',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'it-IT',
        name: 'Italian',
        nativeName: 'Italiano',
        direction: 'ltr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '€',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'ja-JP',
        name: 'Japanese',
        nativeName: '日本語',
        direction: 'ltr',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '¥',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      {
        code: 'zh-CN',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        direction: 'ltr',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '¥',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      {
        code: 'ko-KR',
        name: 'Korean',
        nativeName: '한국어',
        direction: 'ltr',
        dateFormat: 'YYYY.MM.DD',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '₩',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      {
        code: 'ru-RU',
        name: 'Russian',
        nativeName: 'Русский',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '₽',
        decimalSeparator: ',',
        thousandsSeparator: ' ',
      },
      {
        code: 'ar-SA',
        name: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: 'ر.س',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'hi-IN',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        direction: 'ltr',
        dateFormat: 'DD-MM-YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '₹',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      {
        code: 'pl-PL',
        name: 'Polish',
        nativeName: 'Polski',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: 'zł',
        decimalSeparator: ',',
        thousandsSeparator: ' ',
      },
      {
        code: 'nl-NL',
        name: 'Dutch',
        nativeName: 'Nederlands',
        direction: 'ltr',
        dateFormat: 'DD-MM-YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '€',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      {
        code: 'tr-TR',
        name: 'Turkish',
        nativeName: 'Türkçe',
        direction: 'ltr',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm:ss',
        currencySymbol: '₺',
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
    ];

    for (const lang of languages) {
      this.languageConfigs.set(lang.code, lang);
    }
  }

  /**
   * Translate text
   */
  async translateText(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<string> {
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    // Check cache
    const cacheKey = `${sourceLanguage}_${targetLanguage}_${text}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached) {
      return cached.translatedText;
    }

    // Mock translation (in production, use Google Translate API or similar)
    const translatedText = this.mockTranslate(text, sourceLanguage, targetLanguage);

    // Cache translation
    this.translationCache.set(cacheKey, {
      sourceLanguage,
      targetLanguage,
      sourceText: text,
      translatedText,
      timestamp: new Date(),
    });

    console.log(`[MULTILINGUAL] Tradução: ${sourceLanguage} → ${targetLanguage}`);

    return translatedText;
  }

  /**
   * Mock translation (replace with real API)
   */
  private mockTranslate(text: string, from: SupportedLanguage, to: SupportedLanguage): string {
    // In production, call Google Translate API or similar
    const translations: Record<string, Record<string, string>> = {
      'pt-BR': {
        'en-US': text.replace(/ã/g, 'a').replace(/ç/g, 'c'),
      },
      'en-US': {
        'pt-BR': text.replace(/a/g, 'ã').replace(/c/g, 'ç'),
      },
    };

    return translations[from]?.[to] || text;
  }

  /**
   * Get AI response in specific language
   */
  async getAIResponse(
    prompt: string,
    language: SupportedLanguage
  ): Promise<AIResponse> {
    // Translate prompt to English for AI processing
    const englishPrompt = language !== 'en-US' 
      ? await this.translateText(prompt, language, 'en-US')
      : prompt;

    // Get AI response (mock)
    const aiResponse = this.generateMockAIResponse(englishPrompt);

    // Translate response back to target language
    const translatedResponse = language !== 'en-US'
      ? await this.translateText(aiResponse, 'en-US', language)
      : aiResponse;

    const response: AIResponse = {
      id: `resp_${Date.now()}`,
      language,
      originalText: prompt,
      translatedText: englishPrompt,
      aiResponse: translatedResponse,
      confidence: 0.95,
      timestamp: new Date(),
    };

    this.responses.set(response.id, response);
    console.log(`[MULTILINGUAL] Resposta IA: ${language}`);

    return response;
  }

  /**
   * Generate mock AI response
   */
  private generateMockAIResponse(prompt: string): string {
    const responses: Record<string, string> = {
      'anxiety': 'Anxiety can be managed through various approaches including meditation, exercise, and professional support.',
      'pain': 'Chronic pain management often requires a multidisciplinary approach including medication, therapy, and lifestyle changes.',
      'sleep': 'Sleep quality can be improved through consistent sleep schedules, relaxation techniques, and environmental optimization.',
    };

    for (const [key, value] of Object.entries(responses)) {
      if (prompt.toLowerCase().includes(key)) {
        return value;
      }
    }

    return 'Thank you for your question. Please consult with a healthcare professional for personalized advice.';
  }

  /**
   * Get language configuration
   */
  getLanguageConfig(language: SupportedLanguage): LanguageConfig | null {
    return this.languageConfigs.get(language) || null;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Array.from(this.languageConfigs.values());
  }

  /**
   * Format number for language
   */
  formatNumber(value: number, language: SupportedLanguage): string {
    const config = this.languageConfigs.get(language);
    if (!config) return value.toString();

    const parts = value.toFixed(2).split('.');
    const integerPart = parseInt(parts[0]).toLocaleString(language);
    const decimalPart = parts[1];

    return `${integerPart}${config.decimalSeparator}${decimalPart}`;
  }

  /**
   * Format currency for language
   */
  formatCurrency(value: number, language: SupportedLanguage): string {
    const config = this.languageConfigs.get(language);
    if (!config) return `$${value}`;

    const formatted = this.formatNumber(value, language);
    return `${config.currencySymbol} ${formatted}`;
  }

  /**
   * Format date for language
   */
  formatDate(date: Date, language: SupportedLanguage): string {
    const config = this.languageConfigs.get(language);
    if (!config) return date.toLocaleDateString();

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const formats: Record<string, string> = {
      'DD/MM/YYYY': `${day}/${month}/${year}`,
      'MM/DD/YYYY': `${month}/${day}/${year}`,
      'DD.MM.YYYY': `${day}.${month}.${year}`,
      'YYYY/MM/DD': `${year}/${month}/${day}`,
      'YYYY-MM-DD': `${year}-${month}-${day}`,
      'DD-MM-YYYY': `${day}-${month}-${year}`,
      'YYYY.MM.DD': `${year}.${month}.${day}`,
    };

    return formats[config.dateFormat] || date.toLocaleDateString();
  }

  /**
   * Get multilingual statistics
   */
  async getMultilingualStatistics(): Promise<{
    totalLanguages: number;
    totalTranslations: number;
    totalResponses: number;
    cacheSize: number;
    averageConfidence: number;
  }> {
    let totalConfidence = 0;
    const responsesArray = Array.from(this.responses.values());
    for (const resp of responsesArray) {
      totalConfidence += resp.confidence;
    }

    return {
      totalLanguages: this.languageConfigs.size,
      totalTranslations: this.translationCache.size,
      totalResponses: responsesArray.length,
      cacheSize: this.translationCache.size,
      averageConfidence: responsesArray.length > 0 ? totalConfidence / responsesArray.length : 0,
    };
  }
}

export const multilingualAIService = new MultilingualAIService();
