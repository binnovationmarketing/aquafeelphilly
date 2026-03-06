import { describe, it, expect } from 'vitest';
import { getCreditRange, calculateMonthlyInstallment, formatCurrency } from '../../utils/financials';

describe('getCreditRange', () => {
    it('returns default range when score is undefined', () => {
        const result = getCreditRange(undefined);
        expect(result.label).toBe('-');
        expect(result.color).toBe('text-slate-400');
    });

    it('returns Excellent range for score >= 740', () => {
        const result = getCreditRange(740);
        expect(result.label).toBe('Excellent (740+)');
        expect(result.color).toBe('text-emerald-600');
        expect(result.factors['180x']).toBe(1.14);
    });

    it('returns Great range for score 700-739', () => {
        const result = getCreditRange(720);
        expect(result.label).toBe('Great (700-739)');
    });

    it('returns Good range for score 660-699', () => {
        const result = getCreditRange(680);
        expect(result.label).toBe('Good (660-699)');
    });

    it('returns Fair range for score 620-659', () => {
        const result = getCreditRange(640);
        expect(result.label).toBe('Fair (620-659)');
    });

    it('returns Challenged range for score < 620', () => {
        const result = getCreditRange(580);
        expect(result.label).toBe('Challenged (<620)');
        expect(result.color).toBe('text-red-500');
    });
});

describe('calculateMonthlyInstallment', () => {
    it('returns 0 when score is undefined', () => {
        expect(calculateMonthlyInstallment(undefined)).toBe(0);
    });

    it('calculates correct installment for excellent credit, 180 months', () => {
        // score=750, basePrice=8790, months=180: factor=1.14 → 8790 * 1.14 / 100 = 100.2 → rounded to 100
        const result = calculateMonthlyInstallment(750, 8790, 180);
        expect(result).toBe(100);
    });

    it('calculates correct installment for excellent credit, 60 months', () => {
        // score=750, basePrice=8790, months=60: factor=2.17 → 8790 * 2.17 / 100 = 190.7 → 191
        const result = calculateMonthlyInstallment(750, 8790, 60);
        expect(result).toBe(191);
    });

    it('uses default basePrice of 8790 and months of 180', () => {
        const result = calculateMonthlyInstallment(750);
        expect(result).toBeGreaterThan(0);
    });
});

describe('formatCurrency', () => {
    it('formats a number as USD currency', () => {
        expect(formatCurrency(1000)).toBe('$1,000');
    });

    it('formats zero correctly', () => {
        expect(formatCurrency(0)).toBe('$0');
    });

    it('rounds to nearest dollar (no cents)', () => {
        expect(formatCurrency(9.99)).toBe('$10');
    });

    it('formats large numbers with commas', () => {
        expect(formatCurrency(50000)).toBe('$50,000');
    });
});
