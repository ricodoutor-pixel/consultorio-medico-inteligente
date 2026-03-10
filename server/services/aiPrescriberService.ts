import { invokeLLM } from "../_core/llm";
import { cannabisStrains } from "../data/cannabis-strains";

const strains = cannabisStrains;

/**
 * AI Prescriber Service
 * Analyzes patient interview and recommends ideal cannabis strains
 */

interface PatientProfile {
  age: number;
  symptoms: string[];
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  previousCannabisExperience: "none" | "occasional" | "regular";
  preferredConsumption: "oil" | "capsule" | "flower" | "edible" | "topical";
  thcTolerance: "low" | "medium" | "high";
}

interface StrainRecommendation {
  strainId: string;
  strainName: string;
  type: string;
  thcPercentage: string;
  cbdPercentage: string;
  recommendedDosage: string;
  expectedEffects: string[];
  reasonForRecommendation: string;
  confidenceScore: number;
  warnings: string[];
}

class AIPrescriber {
  /**
   * Analyze patient interview and generate strain recommendations
   */
  async recommendStrains(patientProfile: PatientProfile): Promise<StrainRecommendation[]> {
    try {
      // Build patient summary
      const patientSummary = this.buildPatientSummary(patientProfile);

      // Get strain database
      const strainDatabase = this.buildStrainDatabase();

      // Use LLM to analyze and recommend
      const prompt = `
You are an expert cannabis medical advisor. Analyze the following patient profile and recommend the 3-5 most appropriate cannabis strains from the database.

PATIENT PROFILE:
${patientSummary}

AVAILABLE STRAINS DATABASE:
${strainDatabase}

Please provide recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "strainName": "strain name",
      "reasonForRecommendation": "why this strain is ideal for this patient",
      "recommendedDosage": "dosage recommendation",
      "expectedEffects": ["effect1", "effect2"],
      "confidenceScore": 0.95,
      "warnings": ["warning1"]
    }
  ]
}

Consider:
1. Patient's symptoms and medical conditions
2. Current medications and potential interactions
3. THC/CBD tolerance level
4. Previous cannabis experience
5. Preferred consumption method
6. Age and health status
7. Allergies and contraindications

Be conservative with recommendations - prioritize safety over effects.
      `;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a medical cannabis expert providing evidence-based recommendations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "strain_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      strainName: { type: "string" },
                      reasonForRecommendation: { type: "string" },
                      recommendedDosage: { type: "string" },
                      expectedEffects: {
                        type: "array",
                        items: { type: "string" },
                      },
                      confidenceScore: { type: "number" },
                      warnings: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: [
                      "strainName",
                      "reasonForRecommendation",
                      "recommendedDosage",
                      "expectedEffects",
                      "confidenceScore",
                      "warnings",
                    ],
                  },
                },
              },
              required: ["recommendations"],
            },
          },
        },
      });

      // Parse LLM response
      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const parsed = JSON.parse(contentStr);

      // Map recommendations to strain data
      const recommendations = parsed.recommendations.map((rec: any) => {
        const strain = strains.find((s: any) => s.name.toLowerCase() === rec.strainName.toLowerCase());

        return {
          strainId: strain?.id || "",
          strainName: rec.strainName,
          type: strain?.type || "Unknown",
          thcPercentage: strain?.thcPercentage?.toString() || "N/A",
          cbdPercentage: strain?.cbdPercentage?.toString() || "N/A",
          recommendedDosage: rec.recommendedDosage,
          expectedEffects: rec.expectedEffects,
          reasonForRecommendation: rec.reasonForRecommendation,
          confidenceScore: rec.confidenceScore,
          warnings: rec.warnings,
        };
      });

      console.log(`[AI PRESCRIBER] Generated ${recommendations.length} recommendations for patient`);
      return recommendations;
    } catch (error) {
      console.error("AI Prescriber error:", error);
      throw error;
    }
  }

  /**
   * Build patient summary from interview data
   */
  private buildPatientSummary(profile: PatientProfile): string {
    return `
Age: ${profile.age} years old
Symptoms: ${profile.symptoms.join(", ")}
Medical History: ${profile.medicalHistory.join(", ")}
Current Medications: ${profile.currentMedications.join(", ")}
Allergies: ${profile.allergies.join(", ")}
Cannabis Experience: ${profile.previousCannabisExperience}
Preferred Consumption: ${profile.preferredConsumption}
THC Tolerance: ${profile.thcTolerance}
    `;
  }

  /**
   * Build strain database summary for LLM
   */
  private buildStrainDatabase(): string {
    return strains
      .slice(0, 50) // Use top 50 strains for context
      .map(
        (s: any) => `
- ${s.name} (${s.type}): THC ${s.thcPercentage}%, CBD ${s.cbdPercentage}%
  Effects: ${s.effects.join(", ")}
  Medical Benefits: ${s.medicalBenefits.join(", ")}
      `
      )
      .join("\n");
  }

  /**
   * Check for drug interactions
   */
  async checkDrugInteractions(medications: string[], strainName: string): Promise<string[]> {
    try {
      const prompt = `
Check for potential interactions between these medications and cannabis strain "${strainName}":
Medications: ${medications.join(", ")}

Provide a list of potential interactions (if any) in JSON format:
{
  "interactions": ["interaction1", "interaction2"]
}

If no interactions, return empty array.
      `;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a pharmacist expert in drug interactions with cannabis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const parsed = JSON.parse(contentStr);
      return parsed.interactions || [];
    } catch (error) {
      console.error("Drug interaction check error:", error);
      return [];
    }
  }

  /**
   * Generate dosage recommendation
   */
  async generateDosageRecommendation(
    strainName: string,
    age: number,
    weight: number,
    thcTolerance: string,
    consumptionMethod: string
  ): Promise<string> {
    try {
      const prompt = `
Generate a safe dosage recommendation for:
Strain: ${strainName}
Patient Age: ${age}
Patient Weight: ${weight}kg
THC Tolerance: ${thcTolerance}
Consumption Method: ${consumptionMethod}

Provide recommendation in simple format (e.g., "Start with 2.5mg THC, increase gradually").
      `;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a medical cannabis dosage expert. Provide conservative, safe recommendations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const msgContent = response.choices[0].message.content;
      const msgStr = typeof msgContent === 'string' ? msgContent : JSON.stringify(msgContent);
      return msgStr;
    } catch (error) {
      console.error("Dosage recommendation error:", error);
      return "Consult with specialist for personalized dosage";
    }
  }

  /**
   * Analyze patient symptoms for best strain match
   */
  async analyzeSymptoms(symptoms: string[]): Promise<{ primaryEffect: string; secondaryEffects: string[] }> {
    try {
      const prompt = `
Analyze these patient symptoms and identify primary and secondary cannabis effects needed:
Symptoms: ${symptoms.join(", ")}

Respond in JSON format:
{
  "primaryEffect": "main effect needed",
  "secondaryEffects": ["effect1", "effect2"]
}
      `;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a medical cannabis expert. Analyze symptoms and identify needed effects.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      return JSON.parse(contentStr);
    } catch (error) {
      console.error("Symptom analysis error:", error);
      return { primaryEffect: "Unknown", secondaryEffects: [] };
    }
  }
}

export default new AIPrescriber();
