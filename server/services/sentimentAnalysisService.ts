/**
 * 🎭 SENTIMENT ANALYSIS SERVICE — Análise de Emoções e Sentimentos
 * 
 * Funcionalidades:
 * - Detectar sentimento (positivo, negativo, neutro)
 * - Identificar emoção (feliz, frustrado, confuso, etc)
 * - Calcular score de sentimento (-100 a 100)
 * - Extrair palavras-chave de emoção
 * - Sugerir respostas personalizadas
 * - Atualizar estatísticas de sentimento do usuário
 */

import { invokeLLM } from '../_core/llm';

export interface SentimentAnalysisResult {
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  emotion: 'happy' | 'satisfied' | 'neutral' | 'confused' | 'frustrated' | 'angry' | 'sad';
  score: number; // -100 to 100
  keywords: string[];
  suggestion: string;
  icon: string;
  responseTemplate: string;
}

export class SentimentAnalysisService {
  /**
   * Analisar sentimento de uma mensagem usando IA
   */
  static async analyzeSentiment(message: string): Promise<SentimentAnalysisResult> {
    try {
      const systemPrompt = `Você é um especialista em análise de sentimentos e emoções. 
Analise a mensagem do usuário e retorne um JSON com:
- sentiment: 'very_positive', 'positive', 'neutral', 'negative', ou 'very_negative'
- emotion: 'happy', 'satisfied', 'neutral', 'confused', 'frustrated', 'angry', ou 'sad'
- score: número de -100 (muito negativo) a 100 (muito positivo)
- keywords: array com palavras-chave que indicam emoção
- suggestion: sugestão de como responder (máx 50 caracteres)

Responda APENAS com JSON válido, sem explicações adicionais.`;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analise esta mensagem: "${message}"`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sentiment_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                sentiment: {
                  type: 'string',
                  enum: ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'],
                  description: 'Sentimento geral da mensagem'
                },
                emotion: {
                  type: 'string',
                  enum: ['happy', 'satisfied', 'neutral', 'confused', 'frustrated', 'angry', 'sad'],
                  description: 'Emoção específica detectada'
                },
                score: {
                  type: 'integer',
                  minimum: -100,
                  maximum: 100,
                  description: 'Score de sentimento'
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Palavras-chave de emoção'
                },
                suggestion: {
                  type: 'string',
                  description: 'Sugestão de resposta'
                }
              },
              required: ['sentiment', 'emotion', 'score', 'keywords', 'suggestion'],
              additionalProperties: false
            }
          }
        }
      } as any);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Nenhuma resposta da IA');
      }

      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      return {
        sentiment: parsed.sentiment,
        emotion: parsed.emotion,
        score: parsed.score,
        keywords: parsed.keywords,
        suggestion: parsed.suggestion,
        icon: this.getEmotionIcon(parsed.emotion),
        responseTemplate: this.getResponseTemplate(parsed.emotion, parsed.sentiment)
      };
    } catch (error) {
      console.error('[SENTIMENT] Erro ao analisar sentimento:', error);
      // Fallback para análise simples
      return this.simpleSentimentAnalysis(message);
    }
  }

  /**
   * Análise simples de sentimento (fallback)
   */
  private static simpleSentimentAnalysis(message: string): SentimentAnalysisResult {
    const lowerMessage = message.toLowerCase();

    // Palavras-chave positivas
    const positiveKeywords = [
      'obrigado',
      'ótimo',
      'excelente',
      'adorei',
      'perfeito',
      'maravilhoso',
      'feliz',
      'alegre',
      'bom',
      'legal',
      'amei'
    ];

    // Palavras-chave negativas
    const negativeKeywords = [
      'não funciona',
      'problema',
      'erro',
      'frustrado',
      'raiva',
      'chato',
      'ruim',
      'péssimo',
      'horrível',
      'terrível',
      'ódio',
      'decepção'
    ];

    // Palavras-chave de confusão
    const confusionKeywords = [
      'não entendo',
      'confuso',
      'dúvida',
      'como',
      'por quê',
      'explicar',
      'entender',
      'não sei'
    ];

    let sentiment: SentimentAnalysisResult['sentiment'] = 'neutral';
    let emotion: SentimentAnalysisResult['emotion'] = 'neutral';
    let score = 0;
    let keywords: string[] = [];

    // Detectar sentimento
    const positiveCount = positiveKeywords.filter((kw) => lowerMessage.includes(kw)).length;
    const negativeCount = negativeKeywords.filter((kw) => lowerMessage.includes(kw)).length;
    const confusionCount = confusionKeywords.filter((kw) => lowerMessage.includes(kw)).length;

    if (positiveCount > negativeCount && positiveCount > confusionCount) {
      sentiment = positiveCount > 2 ? 'very_positive' : 'positive';
      emotion = 'happy';
      score = 50 + positiveCount * 10;
      keywords = positiveKeywords.filter((kw) => lowerMessage.includes(kw));
    } else if (negativeCount > positiveCount && negativeCount > confusionCount) {
      sentiment = negativeCount > 2 ? 'very_negative' : 'negative';
      emotion = negativeCount > 3 ? 'angry' : 'frustrated';
      score = -50 - negativeCount * 10;
      keywords = negativeKeywords.filter((kw) => lowerMessage.includes(kw));
    } else if (confusionCount > 0) {
      sentiment = 'neutral';
      emotion = 'confused';
      score = -10;
      keywords = confusionKeywords.filter((kw) => lowerMessage.includes(kw));
    }

    // Limitar score
    score = Math.max(-100, Math.min(100, score));

    return {
      sentiment,
      emotion,
      score,
      keywords,
      suggestion: this.getSuggestionForEmotion(emotion),
      icon: this.getEmotionIcon(emotion),
      responseTemplate: this.getResponseTemplate(emotion, sentiment)
    };
  }

  /**
   * Obter ícone para cada emoção
   */
  private static getEmotionIcon(emotion: string): string {
    const icons: Record<string, string> = {
      happy: '😊',
      satisfied: '🙂',
      neutral: '😐',
      confused: '🤔',
      frustrated: '😤',
      angry: '😠',
      sad: '😢'
    };
    return icons[emotion] || '😐';
  }

  /**
   * Obter template de resposta personalizada
   */
  private static getResponseTemplate(emotion: string, sentiment: string): string {
    const templates: Record<string, string> = {
      happy_very_positive: 'Fico feliz em ajudar! 🎉 Vejo que você está satisfeito. Como posso melhorar ainda mais?',
      happy_positive: 'Que bom! 😊 Fico feliz em poder ajudar. Tem mais algo que eu possa fazer?',
      satisfied_positive: 'Ótimo! Fico satisfeito em ajudar. Qualquer dúvida, é só chamar.',
      neutral_neutral: 'Entendi. Como posso ajudá-lo melhor?',
      confused_neutral: '🤔 Vejo que você tem dúvidas. Deixe-me explicar melhor...',
      frustrated_negative: '😤 Entendo sua frustração. Vamos resolver isso juntos!',
      frustrated_very_negative: '😤 Sinto sua frustração. Deixe-me conectar você com nosso suporte especializado.',
      angry_very_negative: '😠 Vejo que você está muito insatisfeito. Vou conectar você imediatamente com um especialista.',
      sad_negative: '😢 Sinto que você está triste. Estou aqui para ajudar. Quer conversar?'
    };

    const key = `${emotion}_${sentiment}`;
    return templates[key] || 'Como posso ajudá-lo?';
  }

  /**
   * Obter sugestão para cada emoção
   */
  private static getSuggestionForEmotion(emotion: string): string {
    const suggestions: Record<string, string> = {
      happy: 'Que ótimo! Quer explorar mais recursos?',
      satisfied: 'Fico feliz em ajudar!',
      neutral: 'Como posso ajudá-lo?',
      confused: 'Deixe-me explicar melhor...',
      frustrated: 'Vamos resolver isso juntos!',
      angry: 'Conectando com suporte especializado...',
      sad: 'Estou aqui para ajudar.'
    };
    return suggestions[emotion] || 'Como posso ajudá-lo?';
  }

  /**
   * Calcular estatísticas agregadas de sentimento
   */
  static calculateAggregateStats(sentiments: Array<{ score: number; emotion: string }>) {
    if (sentiments.length === 0) {
      return {
        avgScore: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        mostFrequentEmotion: 'neutral'
      };
    }

    const avgScore = Math.round(
      sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length
    );

    const positiveCount = sentiments.filter((s) => s.score > 0).length;
    const negativeCount = sentiments.filter((s) => s.score < 0).length;
    const neutralCount = sentiments.filter((s) => s.score === 0).length;

    // Encontrar emoção mais frequente
    const emotionCounts = sentiments.reduce(
      (acc, s) => {
        acc[s.emotion] = (acc[s.emotion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostFrequentEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

    return {
      avgScore,
      positiveCount,
      negativeCount,
      neutralCount,
      mostFrequentEmotion
    };
  }

  /**
   * Gerar recomendação de ação baseada em sentimento
   */
  static getActionRecommendation(emotion: string, sentiment: string): {
    action: string;
    priority: 'low' | 'medium' | 'high';
    notifySupport: boolean;
  } {
    if (emotion === 'angry' || emotion === 'very_negative') {
      return {
        action: 'Conectar com suporte especializado imediatamente',
        priority: 'high',
        notifySupport: true
      };
    }

    if (emotion === 'frustrated' || sentiment === 'very_negative') {
      return {
        action: 'Oferecer suporte adicional',
        priority: 'high',
        notifySupport: false
      };
    }

    if (emotion === 'confused') {
      return {
        action: 'Fornecer explicação mais detalhada',
        priority: 'medium',
        notifySupport: false
      };
    }

    return {
      action: 'Continuar conversa normalmente',
      priority: 'low',
      notifySupport: false
    };
  }
}

export default SentimentAnalysisService;
