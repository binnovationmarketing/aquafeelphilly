import { describe, it, expect } from 'vitest';
import {
    getCreditRange,
    calculateMonthlyInstallment,
    formatCurrency,
} from '../../utils/financials';

// ─── getCreditRange ────────────────────────────────────────────────

describe('getCreditRange', () => {
    it('returns default (no score) when undefined is passed', () => {
        const result = getCreditRange(undefined);
        expect(result.label).toBe('-');
        expect(result.color).toBe('text-slate-400');
        expect(result.factors['180x']).toBeCloseTo(1.62);
    });

    it('returns Excellent for score >= 740', () => {
        expect(getCreditRange(740).label).toBe('Excellent (740+)');
        expect(getCreditRange(800).label).toBe('Excellent (740+)');
        expect(getCreditRange(740).factors['180x']).toBeCloseTo(1.14);
    });

    it('returns Great for score 700–739', () => {
        expect(getCreditRange(700).label).toBe('Great (700-739)');
        expect(getCreditRange(739).label).toBe('Great (700-739)');
    });

    it('returns Good for score 660–699', () => {
        expect(getCreditRange(660).label).toBe('Good (660-699)');
        expect(getCreditRange(699).label).toBe('Good (660-699)');
    });

    it('returns Fair for score 620–659', () => {
        expect(getCreditRange(620).label).toBe('Fair (620-659)');
        expect(getCreditRange(659).label).toBe('Fair (620-659)');
    });

    it('returns Challenged for score < 620', () => {
        expect(getCreditRange(619).label).toBe('Challenged (<620)');
        expect(getCreditRange(300).label).toBe('Challenged (<620)');
        expect(getCreditRange(619).factors['180x']).toBeCloseTo(1.62);
    });
});

// ─── calculateMonthlyInstallment ──────────────────────────────────

describe('calculateMonthlyInstallment', () => {
    it('returns 0 when score is undefined', () => {
        expect(calculateMonthlyInstallment(undefined)).toBe(0);
    });

    it('calculates correct installment for Excellent score (180x)', () => {
        // basePrice 8790 * factor 1.14 / 100 = ~100.21 → rounds to 100
        expect(calculateMonthlyInstallment(780, 8790, 180)).toBe(100);
    });

    it('calculates correct installment for Excellent score (60x)', () => {
        // basePrice 8790 * factor 2.17 / 100 = ~190.74 → rounds to 191
        expect(calculateMonthlyInstallment(780, 8790, 60)).toBe(191);
    });

    it('calculates correct installment for Fair score (120x)', () => {
        // basePrice 8790 * 1.74 / 100 = 152.946 → rounds to 153
        expect(calculateMonthlyInstallment(640, 8790, 120)).toBe(153);
    });

    it('calculates correct installment for Challenged score (180x)', () => {
        // basePrice 8790 * 1.62 / 100 = 142.398 → rounds to 142
        expect(calculateMonthlyInstallment(500, 8790, 180)).toBe(142);
    });

    it('uses default basePrice and term when not provided', () => {
        // Same as Excellent 180x calculation: 8790 * 1.14 / 100 = 100
        const result = calculateMonthlyInstallment(780);
        expect(result).toBeGreaterThan(0);
        expect(typeof result).toBe('number');
    });
});

// ─── formatCurrency ───────────────────────────────────────────────

describe('formatCurrency', () => {
    it('formats positive numbers as USD', () => {
        expect(formatCurrency(1000)).toMatch(/\$1,000/);
    });

    it('formats zero correctly', () => {
        expect(formatCurrency(0)).toMatch(/\$0/);
    });

    it('removes decimal places (maximumFractionDigits = 0)', () => {
        expect(formatCurrency(1234.99)).not.toContain('.');
    });

    it('formats large values with thousand separators', () => {
        expect(formatCurrency(8790)).toMatch(/\$8,790/);
    });
});
