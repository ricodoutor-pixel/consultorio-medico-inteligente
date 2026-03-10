/**
 * Clinical Research Router
 * tRPC endpoints for clinical research management
 */

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { clinicalResearchService } from '../services/clinicalResearchService';

export const clinicalResearchRouter = router({
  /**
   * Get all studies
   */
  getAllStudies: publicProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return await clinicalResearchService.getAllStudies(input?.status);
    }),

  /**
   * Get study details
   */
  getStudyDetails: publicProcedure
    .input(z.object({ studyId: z.string() }))
    .query(async ({ input }) => {
      return await clinicalResearchService.getStudyDetails(input.studyId);
    }),

  /**
   * Create new study (admin only)
   */
  createStudy: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      principalInvestigator: z.string(),
      institution: z.string(),
      targetParticipants: z.number(),
      inclusionCriteria: z.array(z.string()),
      exclusionCriteria: z.array(z.string()),
      primaryOutcome: z.string(),
      secondaryOutcomes: z.array(z.string()),
      studyArm: z.string(),
      duration: z.number(),
      budget: z.number(),
      fundingSource: z.string(),
      cannabisStrains: z.array(z.string()),
      dosageRange: z.object({ min: z.number(), max: z.number() }),
      administrationRoute: z.enum(['oral', 'sublingual', 'topical', 'inhalation']),
    }))
    .mutation(async ({ input }) => {
      return await clinicalResearchService.createStudy(input);
    }),

  /**
   * Enroll patient in study
   */
  enrollPatient: protectedProcedure
    .input(z.object({
      studyId: z.string(),
      patientId: z.string(),
      baselineData: z.object({
        age: z.number(),
        gender: z.string(),
        diagnosis: z.string(),
        symptomSeverity: z.number(),
        comorbidities: z.array(z.string()),
        currentMedications: z.array(z.string()),
      }),
    }))
    .mutation(async ({ input }) => {
      return await clinicalResearchService.enrollPatient(
        input.studyId,
        input.patientId,
        input.baselineData
      );
    }),

  /**
   * Record study visit
   */
  recordVisit: protectedProcedure
    .input(z.object({
      studyId: z.string(),
      participantId: z.string(),
      visitNumber: z.number(),
      visitType: z.enum(['screening', 'baseline', 'treatment', 'followup', 'final']),
      symptomScore: z.number(),
      sideEffects: z.array(z.string()),
      adherence: z.number(),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await clinicalResearchService.recordVisit(
        input.studyId,
        input.participantId,
        {
          visitNumber: input.visitNumber,
          visitType: input.visitType,
          assessments: {
            symptomScore: input.symptomScore,
            sideEffects: input.sideEffects,
            adherence: input.adherence,
          },
          notes: input.notes,
        }
      );
    }),

  /**
   * Analyze study results
   */
  analyzeResults: protectedProcedure
    .input(z.object({ studyId: z.string() }))
    .query(async ({ input }) => {
      return await clinicalResearchService.analyzeResults(input.studyId);
    }),

  /**
   * Get participant data
   */
  getParticipantData: protectedProcedure
    .input(z.object({ participantId: z.string() }))
    .query(async ({ input }) => {
      return await clinicalResearchService.getParticipantData(input.participantId);
    }),

  /**
   * Export study data
   */
  exportStudyData: protectedProcedure
    .input(z.object({ studyId: z.string() }))
    .query(async ({ input }) => {
      return await clinicalResearchService.exportStudyData(input.studyId);
    }),

  /**
   * Get research statistics
   */
  getResearchStatistics: publicProcedure
    .query(async () => {
      return await clinicalResearchService.getResearchStatistics();
    }),
});
