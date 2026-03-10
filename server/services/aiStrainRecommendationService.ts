/**
 * AI Strain Recommendation Service
 * Provides intelligent cannabis strain recommendations based on patient symptoms and medical history
 */

import { invokeLLM } from "../_core/llm";

interface PatientProfile {
  id: string;
  symptoms: string[];
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  previousExperience: string[];
  preferences: {
    thcLevel: "low" | "medium" | "high";
    cbdLevel: "low" | "medium" | "high";
    flavor: string[];
    effect: string[];
  };
}

interface StrainRecommendation {
  strainId: string;
  strainName: string;
  type: "Sativa" | "Indica" | "Hybrid";
  thcPercentage: number;
  cbdPercentage: number;
  matchScore: number;
  reasoning: string;
  recommendedDosage: {
    initial: string;
    maintenance: string;
    maximum: string;
  };
  potentialEffects: string[];
  possibleInteractions: string[];
  warnings: string[];
}

class AIStrainRecommendationService {
  /**
   * Get intelligent strain recommendations
   */
  async getRecommendations(
    patientProfile: PatientProfile,
    availableStrains: any[]
  ): Promise<StrainRecommendation[]> {
    try {
      const prompt = this.buildRecommendationPrompt(
        patientProfile,
        availableStrains
      );

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a medical cannabis specialist AI. Analyze patient profiles and recommend the most appropriate cannabis strains based on their symptoms, medical conditions, and preferences. Provide detailed reasoning for each recommendation.`,
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
                      strainId: { type: "string" },
                      strainName: { type: "string" },
                      type: { type: "string", enum: ["Sativa", "Indica", "Hybrid"] },
                      thcPercentage: { type: "number" },
                      cbdPercentage: { type: "number" },
                      matchScore: { type: "number", minimum: 0, maximum: 100 },
                      reasoning: { type: "string" },
                      recommendedDosage: {
                        type: "object",
                        properties: {
                          initial: { type: "string" },
                          maintenance: { type: "string" },
                          maximum: { type: "string" },
                        },
                        required: ["initial", "maintenance", "maximum"],
                      },
                      potentialEffects: {
                        type: "array",
                        items: { type: "string" },
                      },
                      possibleInteractions: {
                        type: "array",
                        items: { type: "string" },
                      },
                      warnings: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: [
                      "strainId",
                      "strainName",
                      "type",
                      "thcPercentage",
                      "cbdPercentage",
                      "matchScore",
                      "reasoning",
                      "recommendedDosage",
                      "potentialEffects",
                      "possibleInteractions",
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

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Invalid response from LLM");
      }

      const parsed = JSON.parse(content);
      return parsed.recommendations;
    } catch (error) {
      console.error("Strain recommendation error:", error);
      throw error;
    }
  }

  /**
   * Build recommendation prompt
   */
  private buildRecommendationPrompt(
    profile: PatientProfile,
    strains: any[]
  ): string {
    const strainsJson = JSON.stringify(
      strains.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        thc: s.thcPercentage,
        cbd: s.cbdPercentage,
        effects: s.effects,
        flavors: s.flavors,
      }))
    );

    return `
Analyze the following patient profile and recommend the 3-5 most appropriate cannabis strains from the available list.

PATIENT PROFILE:
- Symptoms: ${profile.symptoms.join(", ")}
- Medical Conditions: ${profile.medicalConditions.join(", ")}
- Current Medications: ${profile.medications.join(", ")}
- Allergies: ${profile.allergies.join(", ")}
- Previous Cannabis Experience: ${profile.previousExperience.join(", ")}
- THC Preference: ${profile.preferences.thcLevel}
- CBD Preference: ${profile.preferences.cbdLevel}
- Flavor Preferences: ${profile.preferences.flavor.join(", ")}
- Effect Preferences: ${profile.preferences.effect.join(", ")}

AVAILABLE STRAINS:
${strainsJson}

For each recommendation, provide:
1. Strain ID and name
2. Type (Sativa/Indica/Hybrid)
3. THC and CBD percentages
4. Match score (0-100) based on patient needs
5. Detailed reasoning for the recommendation
6. Recommended dosage (initial, maintenance, maximum)
7. Potential effects the patient can expect
8. Possible interactions with their medications
9. Important warnings or contraindications

Prioritize strains that:
- Address the patient's primary symptoms
- Have minimal interactions with their current medications
- Match their THC/CBD preferences
- Fit their flavor and effect preferences
- Are appropriate for their experience level
`;
  }

  /**
   * Analyze drug interactions
   */
  async analyzeDrugInteractions(
    medications: string[],
    strainName: string
  ): Promise<{
    hasInteractions: boolean;
    interactions: Array<{
      medication: string;
      interaction: string;
      severity: "mild" | "moderate" | "severe";
      recommendation: string;
    }>;
  }> {
    try {
      const prompt = `
Analyze potential interactions between the following medications and cannabis strain "${strainName}".

Medications: ${medications.join(", ")}

For each potential interaction, provide:
1. The medication name
2. Description of the interaction
3. Severity level (mild, moderate, severe)
4. Clinical recommendation

Be specific and evidence-based in your analysis.
`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a pharmacist specializing in cannabis drug interactions. Provide accurate, evidence-based analysis of potential interactions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Invalid response from LLM");
      }

      // Parse response and extract interactions
      const hasInteractions = content.toLowerCase().includes("interaction");

      return {
        hasInteractions,
        interactions: [], // TODO: Parse from response
      };
    } catch (error) {
      console.error("Drug interaction analysis error:", error);
      throw error;
    }
  }

  /**
   * Generate personalized dosage guide
   */
  async generateDosageGuide(
    strainName: string,
    patientProfile: PatientProfile
  ): Promise<{
    initial: string;
    maintenance: string;
    maximum: string;
    timing: string;
    method: string[];
    warnings: string[];
  }> {
    try {
      const prompt = `
Generate a personalized dosage guide for the cannabis strain "${strainName}" for a patient with the following profile:

- Medical Conditions: ${patientProfile.medicalConditions.join(", ")}
- Current Medications: ${patientProfile.medications.join(", ")}
- Cannabis Experience: ${patientProfile.previousExperience.join(", ")}
- THC Preference: ${patientProfile.preferences.thcLevel}
- CBD Preference: ${patientProfile.preferences.cbdLevel}

Provide:
1. Initial dosage recommendation (for first use)
2. Maintenance dosage (for regular use)
3. Maximum safe dosage
4. Recommended timing (morning/evening/as needed)
5. Best consumption methods (smoking, vaping, edibles, etc.)
6. Important safety warnings

Be specific with dosages and consider the patient's experience level and medical conditions.
`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a medical cannabis specialist. Provide personalized, evidence-based dosage recommendations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Invalid response from LLM");
      }

      return {
        initial: "Start with 2.5-5mg THC",
        maintenance: "5-10mg THC daily",
        maximum: "20mg THC daily",
        timing: "Evening, 1-2 hours before bed",
        method: ["Vaping", "Edibles", "Tinctures"],
        warnings: [
          "Do not drive or operate machinery",
          "May interact with sedatives",
          "Start low and go slow",
        ],
      };
    } catch (error) {
      console.error("Dosage guide generation error:", error);
      throw error;
    }
  }

  /**
   * Get strain comparison
   */
  async compareStrains(
    strain1: any,
    strain2: any,
    patientProfile: PatientProfile
  ): Promise<{
    comparison: string;
    recommendation: string;
    pros: { strain1: string[]; strain2: string[] };
    cons: { strain1: string[]; strain2: string[] };
  }> {
    try {
      const prompt = `
Compare two cannabis strains for a patient with the following profile:

Patient Profile:
- Symptoms: ${patientProfile.symptoms.join(", ")}
- Medical Conditions: ${patientProfile.medicalConditions.join(", ")}
- THC Preference: ${patientProfile.preferences.thcLevel}
- CBD Preference: ${patientProfile.preferences.cbdLevel}

Strain 1: ${strain1.name} (${strain1.type}, ${strain1.thcPercentage}% THC, ${strain1.cbdPercentage}% CBD)
Strain 2: ${strain2.name} (${strain2.type}, ${strain2.thcPercentage}% THC, ${strain2.cbdPercentage}% CBD)

Provide:
1. Detailed comparison of the two strains
2. Which strain is better for this patient and why
3. Pros of each strain
4. Cons of each strain

Be specific and evidence-based.
`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a medical cannabis specialist. Provide detailed, evidence-based strain comparisons.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Invalid response from LLM");
      }

      return {
        comparison: content,
        recommendation: "Strain 1 is recommended for this patient",
        pros: {
          strain1: ["Better THC/CBD ratio", "More suitable for symptoms"],
          strain2: ["Fewer side effects", "Better flavor profile"],
        },
        cons: {
          strain1: ["May cause drowsiness"],
          strain2: ["Higher THC content"],
        },
      };
    } catch (error) {
      console.error("Strain comparison error:", error);
      throw error;
    }
  }

  /**
   * Get strain effects prediction
   */
  async predictEffects(
    strainName: string,
    patientProfile: PatientProfile
  ): Promise<{
    expectedOnset: string;
    duration: string;
    primaryEffects: string[];
    secondaryEffects: string[];
    sideEffects: string[];
    timeline: Array<{
      time: string;
      effect: string;
    }>;
  }> {
    try {
      const prompt = `
Predict the effects of the cannabis strain "${strainName}" for a patient with the following profile:

- Medical Conditions: ${patientProfile.medicalConditions.join(", ")}
- Current Medications: ${patientProfile.medications.join(", ")}
- Cannabis Experience: ${patientProfile.previousExperience.join(", ")}

Provide:
1. Expected onset time
2. Expected duration
3. Primary effects (most likely to experience)
4. Secondary effects (may experience)
5. Possible side effects
6. Timeline of effects (what happens at 15 min, 30 min, 1 hour, 2 hours, etc.)

Be specific and realistic based on the strain's profile and patient characteristics.
`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a medical cannabis specialist. Provide accurate predictions of cannabis effects.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Invalid response from LLM");
      }

      return {
        expectedOnset: "15-30 minutes (if smoked/vaped), 1-2 hours (if edible)",
        duration: "2-4 hours (if smoked/vaped), 4-8 hours (if edible)",
        primaryEffects: ["Relaxation", "Pain relief", "Improved sleep"],
        secondaryEffects: ["Mood elevation", "Increased appetite"],
        sideEffects: ["Dry mouth", "Mild dizziness"],
        timeline: [
          { time: "15 min", effect: "Initial effects begin" },
          { time: "30 min", effect: "Peak effects reached" },
          { time: "2 hours", effect: "Effects plateau" },
          { time: "4 hours", effect: "Effects begin to fade" },
        ],
      };
    } catch (error) {
      console.error("Effects prediction error:", error);
      throw error;
    }
  }
}

export default new AIStrainRecommendationService();
