import { describe, expect, it } from "vitest";
import { calculateCommission, calculateAdminFee, calculateWithdrawalFee } from "./db";

describe("Financial Calculations", () => {
  describe("calculateCommission", () => {
    it("should calculate level 1 commission (50%)", () => {
      const amount = 100;
      const commission = calculateCommission(amount, 1);
      expect(commission).toBe(50);
    });

    it("should calculate level 2 commission (5%)", () => {
      const amount = 100;
      const commission = calculateCommission(amount, 2);
      expect(commission).toBe(5);
    });

    it("should calculate level 3 commission (2%)", () => {
      const amount = 100;
      const commission = calculateCommission(amount, 3);
      expect(commission).toBe(2);
    });

    it("should handle decimal amounts", () => {
      const amount = 99.99;
      const commission = calculateCommission(amount, 1);
      expect(commission).toBeCloseTo(49.995, 2);
    });

    it("should return 0 for invalid level", () => {
      const amount = 100;
      const commission = calculateCommission(amount, 999);
      expect(commission).toBe(0);
    });
  });

  describe("calculateAdminFee", () => {
    it("should charge 5% admin fee for non-subscribers", () => {
      const amount = 100;
      const fee = calculateAdminFee(amount, false);
      expect(fee).toBe(5);
    });

    it("should not charge admin fee for subscribers", () => {
      const amount = 100;
      const fee = calculateAdminFee(amount, true);
      expect(fee).toBe(0);
    });

    it("should calculate correct fee for different amounts", () => {
      const amount = 500;
      const fee = calculateAdminFee(amount, false);
      expect(fee).toBe(25);
    });
  });

  describe("calculateWithdrawalFee", () => {
    it("should charge 5% withdrawal fee for regular users", () => {
      const amount = 100;
      const fee = calculateWithdrawalFee(amount, false);
      expect(fee).toBe(5);
    });

    it("should not charge withdrawal fee for users with exemption", () => {
      const amount = 100;
      const fee = calculateWithdrawalFee(amount, true);
      expect(fee).toBe(0);
    });

    it("should calculate correct fee for different amounts", () => {
      const amount = 1000;
      const fee = calculateWithdrawalFee(amount, false);
      expect(fee).toBe(50);
    });

    it("should handle zero amount", () => {
      const amount = 0;
      const fee = calculateWithdrawalFee(amount, false);
      expect(fee).toBe(0);
    });
  });

  describe("Commission Scenarios", () => {
    it("should calculate correct commission for a doctor plan referral", () => {
      const doctorPlanPrice = 99;
      const level1Commission = calculateCommission(doctorPlanPrice, 1);
      expect(level1Commission).toBeCloseTo(49.5, 1);
    });

    it("should calculate correct commission for a store plan referral", () => {
      const storePlanPrice = 49;
      const level1Commission = calculateCommission(storePlanPrice, 1);
      expect(level1Commission).toBeCloseTo(24.5, 1);
    });

    it("should calculate multi-level commission correctly", () => {
      const transactionAmount = 100;
      const level1 = calculateCommission(transactionAmount, 1);
      const level2 = calculateCommission(transactionAmount, 2);
      const level3 = calculateCommission(transactionAmount, 3);
      
      expect(level1).toBe(50);
      expect(level2).toBe(5);
      expect(level3).toBe(2);
      expect(level1 + level2 + level3).toBe(57);
    });
  });

  describe("Financial Workflow", () => {
    it("should calculate correct net amount after admin fee", () => {
      const amount = 100;
      const adminFee = calculateAdminFee(amount, false);
      const netAmount = amount - adminFee;
      
      expect(adminFee).toBe(5);
      expect(netAmount).toBe(95);
    });

    it("should calculate correct withdrawal amount after fee", () => {
      const amount = 1000;
      const withdrawalFee = calculateWithdrawalFee(amount, false);
      const netWithdrawal = amount - withdrawalFee;
      
      expect(withdrawalFee).toBe(50);
      expect(netWithdrawal).toBe(950);
    });

    it("should calculate withdrawal without fee for exempted users", () => {
      const amount = 1000;
      const withdrawalFee = calculateWithdrawalFee(amount, true);
      const netWithdrawal = amount - withdrawalFee;
      
      expect(withdrawalFee).toBe(0);
      expect(netWithdrawal).toBe(1000);
    });
  });
});
