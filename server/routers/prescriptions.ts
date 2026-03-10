import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import digitalPrescriptionService, { DigitalPrescription, MedicationPrescription } from '../services/digitalPrescriptionService';

/**
 * Router tRPC para Prescrições Digitais
 * Implementa RDC ANVISA nº 20/2011 e CFM nº 2.113/2021
 */

const MedicationSchema = z.object({
  medicationName: z.string().min(1, 'Nome do medicamento obrigatório'),
  dosage: z.string().min(1, 'Dosagem obrigatória'),
  frequency: z.string().min(1, 'Frequência obrigatória'),
  duration: z.string().min(1, 'Duração obrigatória'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  instructions: z.string().optional().default(''),
  warnings: z.array(z.string()).default([]),
  thcPercentage: z.number().optional(),
  cbdPercentage: z.number().optional(),
  strainName: z.string().optional(),
});

const GeneratePrescriptionSchema = z.object({
  patientId: z.string(),
  patientName: z.string().min(1, 'Nome do paciente obrigatório'),
  patientCPF: z.string().min(11, 'CPF inválido'),
  patientAge: z.number().min(18, 'Paciente deve ter 18 anos ou mais'),
  patientDateOfBirth: z.date(),
  patientAddress: z.string().min(1, 'Endereço obrigatório'),
  patientPhone: z.string().min(10, 'Telefone inválido'),
  specialistId: z.string(),
  specialistName: z.string().min(1, 'Nome do profissional obrigatório'),
  specialistCRM: z.string().min(1, 'CRM obrigatório'),
  specialistCRMState: z.string().length(2, 'Estado deve ter 2 caracteres'),
  specialistEmail: z.string().email('Email inválido'),
  medications: z.array(MedicationSchema).min(1, 'Pelo menos um medicamento obrigatório'),
  diagnosis: z.string().min(1, 'Diagnóstico obrigatório'),
  medicalIndication: z.string().min(3, 'CID-10 obrigatório'),
  observations: z.string().optional(),
});

export const prescriptionsRouter = router({
  /**
   * Gera prescrição digital
   * Etapa 3 do fluxo: Prescrição Digital
   */
  generate: protectedProcedure
    .input(GeneratePrescriptionSchema)
    .mutation(async ({ input }) => {
      try {
        const prescription = await digitalPrescriptionService.generatePrescription(input);
        return {
          success: true,
          prescription,
          message: 'Prescrição gerada com sucesso',
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Assina prescrição com certificado ICP-Brasil
   */
  sign: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.string(),
        prescription: z.any(),
        certificateSerialNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const signedPrescription = await digitalPrescriptionService.signPrescription(
          input.prescription,
          input.certificateSerialNumber
        );
        return {
          success: true,
          prescription: signedPrescription,
          message: 'Prescrição assinada com sucesso',
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Valida prescrição com ANVISA
   */
  validate: protectedProcedure
    .input(z.object({ prescription: z.any() }))
    .mutation(async ({ input }) => {
      try {
        const validatedPrescription = await digitalPrescriptionService.validateWithANVISA(
          input.prescription
        );
        return {
          success: true,
          prescription: validatedPrescription,
          validationCode: validatedPrescription.anvisaValidation.validationCode,
          message: 'Prescrição validada pela ANVISA',
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Registra dispensação em farmácia
   */
  recordDispensation: protectedProcedure
    .input(
      z.object({
        prescription: z.any(),
        pharmacyName: z.string(),
        dispensedBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const dispensedPrescription = await digitalPrescriptionService.recordDispensation(
          input.prescription,
          input.pharmacyName,
          input.dispensedBy
        );
        return {
          success: true,
          prescription: dispensedPrescription,
          message: 'Dispensação registrada com sucesso',
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Gera PDF da prescrição
   */
  generatePDF: protectedProcedure
    .input(z.object({ prescription: z.any() }))
    .mutation(async ({ input }) => {
      try {
        const pdfBuffer = await digitalPrescriptionService.generatePDF(input.prescription);
        return {
          success: true,
          pdf: pdfBuffer.toString('base64'),
          message: 'PDF gerado com sucesso',
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Verifica interações medicamentosas
   */
  checkInteractions: publicProcedure
    .input(z.object({ medications: z.array(MedicationSchema) }))
    .query(async ({ input }) => {
      try {
        const interactions = await digitalPrescriptionService.checkDrugInteractions(
          input.medications
        );
        return {
          success: true,
          interactions,
          hasInteractions: interactions.length > 0,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Renova prescrição
   */
  renew: protectedProcedure
    .input(z.object({ originalPrescription: z.any() }))
    .mutation(async ({ input }) => {
      try {
        const newPrescription = await digitalPrescriptionService.renewPrescription(
          input.originalPrescription
        );
        return {
          success: true,
          prescription: newPrescription,
          message: 'Prescrição renovada com sucesso',
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),
});
