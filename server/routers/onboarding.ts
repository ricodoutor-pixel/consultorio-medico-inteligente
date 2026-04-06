/**
 * FUNCIONALIDADE 1: Onboarding Interativo com Brisa IA
 * 
 * Fluxo:
 * 1. Usuário inicia onboarding
 * 2. Brisa IA faz 5 perguntas personalizadas
 * 3. Respostas salvas no BD
 * 4. Perfil criado com preferências
 * 5. Redirecionado para dashboard
 */

import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "../db";
import { invokeLLM } from "../_core/llm";

// Schema de onboarding
export const onboardingSchema = z.object({
  userId: z.string(),
  step: z.number().min(1).max(5),
  answers: z.record(z.string()),
  preferences: z.object({
    healthGoals: z.array(z.string()),
    cannabisExperience: z.enum(["beginner", "intermediate", "advanced"]),
    preferredLanguage: z.string(),
    timezone: z.string(),
  }).optional(),
  completed: z.boolean().default(false),
});

export const onboardingRouter = router({
  /**
   * Inicia o fluxo de onboarding
   */
  startOnboarding: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Salvar no BD
        const onboarding = await db.insert("onboarding", {
          userId: input.userId,
          step: 1,
          answers: {},
          preferences: null,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return {
          success: true,
          onboardingId: onboarding.id,
          step: 1,
          question: "Qual é seu principal objetivo de saúde?",
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Brisa IA gera pergunta personalizada
   */
  getNextQuestion: protectedProcedure
    .input(z.object({ onboardingId: z.string(), currentStep: z.number() }))
    .query(async ({ input }) => {
      const questions = [
        "Qual é seu principal objetivo de saúde? (Dor, ansiedade, insônia, etc)",
        "Você já usou cannabis medicinal antes? Qual foi sua experiência?",
        "Possui alergias ou sensibilidades a medicamentos?",
        "Qual é seu nível de experiência com tecnologia?",
        "Como você prefere receber informações sobre saúde?",
      ];

      const question = questions[input.currentStep - 1] || "Obrigado por responder!";

      // Usar Brisa IA para personalizar pergunta
      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é Brisa, uma assistente de saúde compassiva. Faça perguntas personalizadas e empáticas.",
          },
          {
            role: "user",
            content: `Reformule esta pergunta de forma mais empática e personalizada: "${question}"`,
          },
        ],
      });

      return {
        step: input.currentStep,
        question: aiResponse.choices[0]?.message.content || question,
        totalSteps: 5,
      };
    }),

  /**
   * Salva resposta e avança para próxima etapa
   */
  saveAnswer: protectedProcedure
    .input(
      z.object({
        onboardingId: z.string(),
        step: z.number(),
        answer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Salvar resposta no BD
        const updated = await db.update("onboarding", input.onboardingId, {
          answers: {
            [`step_${input.step}`]: input.answer,
          },
          step: input.step + 1,
          updatedAt: new Date(),
        });

        // Se chegou na última etapa, processar com IA
        if (input.step === 5) {
          const preferences = await generatePreferences(input.answer);
          await db.update("onboarding", input.onboardingId, {
            preferences,
            completed: true,
            updatedAt: new Date(),
          });

          return {
            success: true,
            completed: true,
            preferences,
            message: "Onboarding concluído! Bem-vindo ao Planta y Raiz!",
          };
        }

        return {
          success: true,
          completed: false,
          nextStep: input.step + 1,
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Obtém status do onboarding
   */
  getStatus: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const onboarding = await db.query("onboarding", {
          where: { userId: input.userId },
          orderBy: { createdAt: "desc" },
          limit: 1,
        });

        if (!onboarding.length) {
          return { completed: false, step: 0 };
        }

        return {
          completed: onboarding[0].completed,
          step: onboarding[0].step,
          preferences: onboarding[0].preferences,
        };
      } catch (error) {
        return { completed: false, error: String(error) };
      }
    }),

  /**
   * Pula onboarding (usuários avançados)
   */
  skipOnboarding: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.update("onboarding", input.userId, {
          completed: true,
          skipped: true,
          updatedAt: new Date(),
        });

        return { success: true, message: "Onboarding pulado" };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),
});

/**
 * Gera preferências do usuário baseado nas respostas
 */
async function generatePreferences(finalAnswer: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em análise de perfil de saúde. Extraia as preferências do usuário.",
      },
      {
        role: "user",
        content: `Baseado nesta resposta final, gere um perfil JSON: ${finalAnswer}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "user_preferences",
        strict: true,
        schema: {
          type: "object",
          properties: {
            healthGoals: {
              type: "array",
              items: { type: "string" },
            },
            cannabisExperience: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
            },
            preferredLanguage: { type: "string" },
            timezone: { type: "string" },
          },
          required: [
            "healthGoals",
            "cannabisExperience",
            "preferredLanguage",
            "timezone",
          ],
        },
      },
    },
  });

  try {
    return JSON.parse(response.choices[0]?.message.content || "{}");
  } catch {
    return {
      healthGoals: ["Saúde geral"],
      cannabisExperience: "beginner",
      preferredLanguage: "pt-BR",
      timezone: "America/Sao_Paulo",
    };
  }
}
