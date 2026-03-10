import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { aiDiagnosisService } from '../services/aiDiagnosisService';

export const aiDiagnosisRouter = router({
  /**
   * Analisa sintomas do paciente
   * Público: Qualquer usuário pode usar para pré-diagnóstico
   */
  analyzeSymptoms: publicProcedure
    .input(
      z.object({
        symptoms: z.array(z.string()).min(1, 'Mínimo 1 sintoma'),
        age: z.number().min(18, 'Mínimo 18 anos').max(150),
      })
    )
    .mutation(async ({ input }) => {
      return await aiDiagnosisService.analyzeSymptoms(input.symptoms, input.age);
    }),

  /**
   * Gera TCLE (Termo de Consentimento Livre e Esclarecido)
   * Protegido: Apenas pacientes autenticados
   */
  generateTCLE: protectedProcedure
    .input(
      z.object({
        symptoms: z.array(z.string()),
        recommendedStrains: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tcle = await aiDiagnosisService.generateTCLE(
        ctx.user.name || 'Paciente',
        input.symptoms,
        input.recommendedStrains
      );

      return {
        tcle,
        timestamp: new Date(),
        userId: ctx.user.id,
      };
    }),

  /**
   * Valida prescrição conforme regulamentações brasileiras
   * Protegido: Apenas profissionais
   */
  validatePrescription: protectedProcedure
    .input(
      z.object({
        professionalId: z.string(),
        patientId: z.string(),
        strainName: z.string(),
        dosageMgDay: z.number().min(5).max(1000),
        duration: z.number().min(1).max(90),
        medicalIndication: z.string(),
        viaAdministration: z.enum(['inalação', 'ingestão', 'tópica', 'sublingual']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar que é um profissional
      // TODO: Implementar validação de role quando schema for atualizado

      return await aiDiagnosisService.validatePrescription(input);
    }),

  /**
   * Monitora resposta ao tratamento
   * Protegido: Apenas pacientes e profissionais
   */
  monitorTreatmentResponse: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.string(),
        efficacyScore: z.number().min(1).max(10),
        sideEffects: z.array(z.string()),
        adherencePercentage: z.number().min(0).max(100),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await aiDiagnosisService.monitorTreatmentResponse(
        String(ctx.user.id),
        input.prescriptionId,
        {
          efficacyScore: input.efficacyScore,
          sideEffects: input.sideEffects,
          adherencePercentage: input.adherencePercentage,
          notes: input.notes || '',
        }
      );
    }),
});
