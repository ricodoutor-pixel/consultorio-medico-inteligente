import { describe, it, expect, beforeEach, vi } from 'vitest';
import { professionalsRouter } from './professionals';

describe('Professionals Router', () => {
  describe('list', () => {
    it('should return list of professionals', async () => {
      const caller = professionalsRouter.createCaller({
        user: null,
        db: {} as any,
      });

      const result = await caller.list({
        page: 1,
        limit: 20,
      });

      expect(result).toHaveProperty('professionals');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.professionals)).toBe(true);
    });

    it('should filter by specialty', async () => {
      const caller = professionalsRouter.createCaller({
        user: null,
        db: {} as any,
      });

      const result = await caller.list({
        specialty: 'Psiquiatria',
        page: 1,
      });

      expect(result.professionals).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return professional details', async () => {
      const caller = professionalsRouter.createCaller({
        user: null,
        db: {} as any,
      });

      const result = await caller.getById({ id: 1 });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('specialty');
      expect(result).toHaveProperty('rating');
    });
  });

  describe('scheduleConsultation', () => {
    it('should schedule a consultation for authenticated user', async () => {
      const caller = professionalsRouter.createCaller({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        db: {} as any,
      });

      const result = await caller.scheduleConsultation({
        professionalId: 1,
        date: '2026-02-24',
        time: '14:00',
        reason: 'Consulta de rotina',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('scheduled');
      expect(result).toHaveProperty('confirmationCode');
    });

    it('should throw error for unauthenticated user', async () => {
      const caller = professionalsRouter.createCaller({
        user: null,
        db: {} as any,
      });

      expect(async () => {
        await caller.scheduleConsultation({
          professionalId: 1,
          date: '2026-02-24',
          time: '14:00',
          reason: 'Consulta',
        });
      }).rejects.toThrow();
    });
  });

  describe('leaveReview', () => {
    it('should create a review for authenticated user', async () => {
      const caller = professionalsRouter.createCaller({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        db: {} as any,
      });

      const result = await caller.leaveReview({
        professionalId: 1,
        rating: 5,
        text: 'Excelente profissional!',
      });

      expect(result).toHaveProperty('id');
      expect(result.rating).toBe(5);
      expect(result.text).toBe('Excelente profissional!');
    });

    it('should validate rating between 1 and 5', async () => {
      const caller = professionalsRouter.createCaller({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        db: {} as any,
      });

      expect(async () => {
        await caller.leaveReview({
          professionalId: 1,
          rating: 6,
          text: 'Invalid rating',
        });
      }).rejects.toThrow();
    });
  });

  describe('getRecommendedProfessionals', () => {
    it('should return recommended professionals based on symptoms', async () => {
      const caller = professionalsRouter.createCaller({
        user: null,
        db: {} as any,
      });

      const result = await caller.getRecommendedProfessionals({
        symptoms: ['Ansiedade', 'Insônia'],
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('matchScore');
    });
  });
});
