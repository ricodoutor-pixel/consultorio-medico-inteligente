import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

/**
 * Consultation Router
 * Handles specialist consultations, payments, and interviews
 */

export const consultationRouter = router({
  /**
   * Create consultation payment preference
   */
  createConsultationPreference: publicProcedure
    .input(
      z.object({
        specialistId: z.number(),
        strainId: z.number(),
        amount: z.number()
      })
    )
    .mutation(async ({ input }) => {
      try {
        // TODO: Integrate with Mercado Pago API
        // For now, return mock data
        const orderId = `order_${Date.now()}`;
        const qrCode = `https://via.placeholder.com/300x300/1a1f3a/FFD700?text=QR+Code`;
        const pixCode = `00020126580014br.gov.bcb.pix0136${orderId}520400005303986540510.005802BR5913PLANTA RAIZ6009SAO PAULO62410503***63041D3D`;

        return {
          orderId,
          qrCode,
          pixCode,
          amount: input.amount,
          specialistId: input.specialistId,
          strainId: input.strainId
        };
      } catch (error) {
        console.error("Error creating consultation preference:", error);
        throw new Error("Failed to create payment preference");
      }
    }),

  /**
   * Check payment status
   */
  checkPaymentStatus: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      try {
        // TODO: Query Mercado Pago webhook status
        // For now, simulate payment confirmation after 5 seconds
        const isConfirmed = Math.random() > 0.3; // 70% chance of confirmation

        return {
          orderId: input.orderId,
          status: isConfirmed ? "approved" : "pending",
          timestamp: new Date()
        };
      } catch (error) {
        console.error("Error checking payment status:", error);
        throw new Error("Failed to check payment status");
      }
    }),

  /**
   * Start AI interview for consultation
   */
  startInterview: protectedProcedure
    .input(
      z.object({
        specialistId: z.number(),
        strainId: z.number(),
        orderId: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Create interview session
        const interviewId = `interview_${Date.now()}`;
        const userId = ctx.user.id;

        // TODO: Save to database
        // For now, return mock data

        return {
          interviewId,
          userId,
          specialistId: input.specialistId,
          strainId: input.strainId,
          orderId: input.orderId,
          status: "started",
          createdAt: new Date()
        };
      } catch (error) {
        console.error("Error starting interview:", error);
        throw new Error("Failed to start interview");
      }
    }),

  /**
   * Get interview questions
   */
  getInterviewQuestions: publicProcedure
    .input(z.object({ interviewId: z.string() }))
    .query(async ({ input }) => {
      // Standard medical interview questions
      const questions = [
        {
          id: 1,
          question: "Qual é o seu principal sintoma ou condição médica?",
          type: "text",
          required: true
        },
        {
          id: 2,
          question: "Há quanto tempo você tem esse problema?",
          type: "select",
          options: ["Menos de 1 mês", "1-3 meses", "3-6 meses", "6-12 meses", "Mais de 1 ano"],
          required: true
        },
        {
          id: 3,
          question: "Já usou cannabis medicinal antes?",
          type: "select",
          options: ["Não", "Sim, uma vez", "Sim, várias vezes", "Uso regularmente"],
          required: true
        },
        {
          id: 4,
          question: "Toma algum medicamento atualmente?",
          type: "text",
          required: false
        },
        {
          id: 5,
          question: "Tem alergias conhecidas?",
          type: "text",
          required: false
        },
        {
          id: 6,
          question: "Qual é seu horário preferido para consulta?",
          type: "select",
          options: ["Manhã (8h-12h)", "Tarde (12h-18h)", "Noite (18h-22h)"],
          required: true
        },
        {
          id: 7,
          question: "Prefere consulta por chat ou vídeo?",
          type: "select",
          options: ["Chat", "Vídeo"],
          required: true
        }
      ];

      return {
        interviewId: input.interviewId,
        totalQuestions: questions.length,
        questions
      };
    }),

  /**
   * Submit interview answers
   */
  submitInterviewAnswers: protectedProcedure
    .input(
      z.object({
        interviewId: z.string(),
        answers: z.record(z.string(), z.any())
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Process interview answers with AI
        const prompt = `Analise as seguintes respostas de entrevista médica e gere um resumo executivo:
        ${JSON.stringify(input.answers, null, 2)}
        
        Retorne um JSON com:
        - summary: resumo das principais informações
        - recommendations: recomendações para o especialista
        - urgency: nível de urgência (low, medium, high)
        - nextSteps: próximos passos`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um assistente médico que analisa entrevistas de pacientes. Retorne APENAS JSON válido."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        });

        const content = response.choices[0]?.message?.content;
        const contentStr = typeof content === "string" ? content : "{}";
        const analysis = JSON.parse(contentStr);

        // TODO: Save to database
        // For now, return processed data

        return {
          interviewId: input.interviewId,
          userId: ctx.user.id,
          status: "completed",
          analysis,
          completedAt: new Date()
        };
      } catch (error) {
        console.error("Error submitting interview answers:", error);
        throw new Error("Failed to submit interview answers");
      }
    }),

  /**
   * Get specialist access token
   * Grants access to specialist after interview completion
   */
  grantSpecialistAccess: protectedProcedure
    .input(
      z.object({
        interviewId: z.string(),
        specialistId: z.number()
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate access token for specialist
        const accessToken = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // TODO: Save to database
        // For now, return mock data

        return {
          accessToken,
          specialistId: input.specialistId,
          userId: ctx.user.id,
          interviewId: input.interviewId,
          expiresAt,
          status: "granted"
        };
      } catch (error) {
        console.error("Error granting specialist access:", error);
        throw new Error("Failed to grant specialist access");
      }
    }),

  /**
   * Redirect to shopping with strain context
   */
  getShoppingRedirect: protectedProcedure
    .input(
      z.object({
        strainId: z.number(),
        consultationId: z.string()
      })
    )
    .query(async ({ input, ctx }) => {
      // Generate shopping session with strain context
      const sessionId = `session_${Date.now()}`;

      return {
        sessionId,
        strainId: input.strainId,
        consultationId: input.consultationId,
        userId: ctx.user.id,
        redirectUrl: `/shopping?strain=${input.strainId}&session=${sessionId}`,
        timestamp: new Date()
      };
    })
});
