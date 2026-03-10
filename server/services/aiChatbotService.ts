import { invokeLLM } from "../_core/llm";

export interface PreInterviewData {
  patientId: string;
  symptoms: string[];
  medicalHistory: string;
  currentMedications: string[];
  allergies: string[];
  duration: string;
  severity: number;
  recommendedSpecialties: string[];
  estimatedConsultationPrice: number;
  urgency: "low" | "medium" | "high";
  nextSteps: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * AI Chatbot Service for automated pre-interview
 * Uses LLM to collect patient information intelligently
 */
export class AIChatbotService {
  private conversationHistory: ChatMessage[] = [];
  private patientData: Partial<PreInterviewData> = {};

  constructor(private patientId: string) {}

  /**
   * Start pre-interview conversation
   */
  async startPreInterview(): Promise<string> {
    const systemPrompt = `You are a professional healthcare intake specialist AI for Planta & Raiz platform. 
    Your role is to conduct a friendly, efficient pre-interview with patients seeking cannabis medicinal consultation.
    
    IMPORTANT RULES:
    1. Be empathetic and professional
    2. Ask one question at a time
    3. Collect: symptoms, duration, severity, medical history, current medications, allergies
    4. Suggest appropriate specialists based on symptoms
    5. Estimate consultation price
    6. Determine urgency level
    7. Provide next steps
    8. Always respond in Portuguese (Brazil)
    9. Never provide medical advice - only collect information
    10. If patient mentions emergency symptoms, recommend immediate medical attention
    
    Start with a warm greeting and ask about their main concern.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Olá, preciso de ajuda" }
      ]
    });

    const assistantMessage = response.choices[0]?.message?.content || "Olá! Como posso ajudá-lo?";
    const contentStr = typeof assistantMessage === "string" ? assistantMessage : "Olá! Como posso ajudá-lo?";
    
    this.conversationHistory.push({
      role: "assistant",
      content: contentStr,
      timestamp: new Date()
    });

    return contentStr;
  }

  /**
   * Continue conversation with patient response
   */
  async continueConversation(userMessage: string): Promise<string> {
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
      timestamp: new Date()
    });

    const systemPrompt = `You are a professional healthcare intake specialist AI for Planta & Raiz platform.
    Continue collecting patient information for pre-interview.
    
    Based on the conversation so far, extract and track:
    - Symptoms
    - Duration of symptoms
    - Severity (1-10)
    - Medical history
    - Current medications
    - Allergies
    - Recommended specialists
    - Estimated consultation price
    - Urgency level
    
    If you have enough information, provide a summary and ask if they want to proceed with booking.
    Always respond in Portuguese (Brazil).`;

    const messages = this.conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    const assistantMessage = response.choices[0]?.message?.content || "Desculpe, não entendi. Pode repetir?";
    const contentStr = typeof assistantMessage === "string" ? assistantMessage : "Desculpe, não entendi. Pode repetir?";
    
    this.conversationHistory.push({
      role: "assistant",
      content: contentStr,
      timestamp: new Date()
    });

    // Extract data from conversation
    await this.extractPatientData();

    return contentStr;
  }

  /**
   * Extract structured data from conversation using LLM
   */
  private async extractPatientData(): Promise<void> {
    const conversationText = this.conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

    const extractionPrompt = `Extract patient information from this conversation and return as JSON:
    
    ${conversationText}
    
    Return ONLY valid JSON with this structure:
    {
      "symptoms": ["symptom1", "symptom2"],
      "medicalHistory": "brief history",
      "currentMedications": ["med1", "med2"],
      "allergies": ["allergy1"],
      "duration": "how long symptoms",
      "severity": 5,
      "recommendedSpecialties": ["specialty1"],
      "estimatedConsultationPrice": 150,
      "urgency": "medium",
      "nextSteps": ["step1", "step2"]
    }`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a data extraction specialist. Extract information and return ONLY valid JSON." },
          { role: "user", content: extractionPrompt }
        ]
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : "{}";
      if (contentStr) {
        const extractedData = JSON.parse(contentStr);
        this.patientData = {
          patientId: this.patientId,
          ...extractedData
        };
      }
    } catch (error) {
      console.error("Error extracting patient data:", error);
    }
  }

  /**
   * Get extracted patient data
   */
  getPatientData(): Partial<PreInterviewData> {
    return this.patientData;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Determine if pre-interview is complete
   */
  isPreInterviewComplete(): boolean {
    return !!(
      this.patientData.symptoms?.length &&
      this.patientData.severity &&
      this.patientData.recommendedSpecialties?.length &&
      this.patientData.urgency
    );
  }

  /**
   * Generate summary for professional
   */
  generateSummary(): string {
    const data = this.patientData;
    return `
RESUMO DA PRÉ-ENTREVISTA
========================

Sintomas: ${data.symptoms?.join(", ") || "Não informado"}
Duração: ${data.duration || "Não informado"}
Severidade: ${data.severity}/10
Histórico Médico: ${data.medicalHistory || "Não informado"}
Medicamentos Atuais: ${data.currentMedications?.join(", ") || "Nenhum"}
Alergias: ${data.allergies?.join(", ") || "Nenhuma"}

Especialistas Recomendados: ${data.recommendedSpecialties?.join(", ") || "Não determinado"}
Preço Estimado: R$ ${data.estimatedConsultationPrice || 0}
Urgência: ${data.urgency || "Não determinada"}

Próximos Passos:
${data.nextSteps?.map((step, i) => `${i + 1}. ${step}`).join("\n") || "Não determinados"}
    `;
  }
}

/**
 * Automated recommendation engine
 */
export class RecommendationEngine {
  /**
   * Recommend specialists based on symptoms
   */
  static async recommendSpecialists(symptoms: string[]): Promise<string[]> {
    const symptomText = symptoms.join(", ");
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a medical specialist recommendation AI. Based on symptoms, recommend appropriate specialists for cannabis medicinal consultation. Return ONLY a JSON array of specialist names."
        },
        {
          role: "user",
          content: `Symptoms: ${symptomText}\n\nRecommend specialists (return as JSON array of strings only).`
        }
      ]
    });

    try {
      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : "[]";
      return JSON.parse(contentStr);
    } catch {
      return ["Clínico Geral"];
    }
  }

  /**
   * Estimate consultation price based on urgency and complexity
   */
  static estimatePrice(urgency: "low" | "medium" | "high", complexity: number): number {
    const basePrice = 100;
    const urgencyMultiplier = { low: 1, medium: 1.2, high: 1.5 }[urgency];
    const complexityMultiplier = 1 + (complexity * 0.1);
    
    return Math.round(basePrice * urgencyMultiplier * complexityMultiplier);
  }

  /**
   * Determine urgency level
   */
  static async determineUrgency(symptoms: string[]): Promise<"low" | "medium" | "high"> {
    const symptomText = symptoms.join(", ");
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a medical urgency assessment AI. Based on symptoms, determine urgency level. Return ONLY one word: \"low\", \"medium\", or \"high\"."
        },
        {
          role: "user",
          content: `Symptoms: ${symptomText}\n\nUrgency level (low/medium/high)?`
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    const contentStr = typeof content === "string" ? content.toLowerCase() : "low";
    
    if (contentStr.includes("high")) return "high";
    if (contentStr.includes("medium")) return "medium";
    return "low";
  }
}

/**
 * Fraud detection using AI
 */
export class FraudDetectionService {
  /**
   * Detect suspicious patterns in pre-interview
   */
  static async detectFraud(chatHistory: ChatMessage[], patientData: Partial<PreInterviewData>): Promise<{
    isSuspicious: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    const conversationText = chatHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n");
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a fraud detection AI for healthcare platform. Analyze conversation for suspicious patterns. Return JSON with isSuspicious (boolean), riskScore (0-100), and reasons (array)."
        },
        {
          role: "user",
          content: `Analyze for fraud:\n\n${conversationText}`
        }
      ]
    });

    try {
      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : "{}";
      return JSON.parse(contentStr);
    } catch {
      return { isSuspicious: false, riskScore: 0, reasons: [] };
    }
  }
}
