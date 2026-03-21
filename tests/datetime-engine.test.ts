// tests/datetime-engine.test.ts
import { describe, it, expect } from 'vitest';
import { computeDatetime } from '../src/engines/datetime.js';

describe('computeDatetime', () => {
  describe('difference', () => {
    it('computes breakdown between two dates', () => {
      const result = computeDatetime('difference', {
        from: '2026-01-01',
        to: '2026-03-15',
      });
      expect(result).not.toHaveProperty('error');
      const r = result as {
        result: string;
        breakdown: { years: number; months: number; days: number };
      };
      expect(r.breakdown.months).toBe(2);
      expect(r.breakdown.days).toBe(14);
    });

    it('computes difference in a specific unit', () => {
      const result = computeDatetime('difference', {
        from: '2026-01-01',
        to: '2026-01-31',
        unit: 'days',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('30 days');
    });

    it('returns negative values when from > to', () => {
      const result = computeDatetime('difference', {
        from: '2026-03-15',
        to: '2026-01-01',
        unit: 'days',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toContain('-');
    });

    it('computes difference in hours for datetime strings', () => {
      const result = computeDatetime('difference', {
        from: '2026-01-01T08:00:00',
        to: '2026-01-01T17:30:00',
        unit: 'hours',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('9 hours');
    });

    it('returns error for missing from', () => {
      const result = computeDatetime('difference', { to: '2026-03-15' });
      expect(result).toHaveProperty('error');
    });

    it('returns error for invalid date', () => {
      const result = computeDatetime('difference', {
        from: 'not-a-date',
        to: '2026-03-15',
      });
      expect(result).toHaveProperty('error');
    });
  });

  describe('add', () => {
    it('adds days to a date', () => {
      const result = computeDatetime('add', {
        date: '2026-01-01',
        amount: 10,
        unit: 'days',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('2026-01-11');
    });

    it('adds months to a date', () => {
      const result = computeDatetime('add', {
        date: '2026-01-15',
        amount: 2,
        unit: 'months',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('2026-03-15');
    });

    it('clamps to end of month when adding months', () => {
      const result = computeDatetime('add', {
        date: '2026-01-31',
        amount: 1,
        unit: 'months',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('2026-02-28');
    });

    it('handles leap year boundary when adding years', () => {
      const result = computeDatetime('add', {
        date: '2024-02-29',
        amount: 1,
        unit: 'years',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('2025-02-28');
    });

    it('adds hours to datetime and returns datetime format', () => {
      const result = computeDatetime('add', {
        date: '2026-01-01T08:00:00',
        amount: 5,
        unit: 'hours',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('2026-01-01T13:00:00');
    });

    it('returns error for missing date', () => {
      const result = computeDatetime('add', { amount: 10, unit: 'days' });
      expect(result).toHaveProperty('error');
    });

    it('returns error for missing unit', () => {
      const result = computeDatetime('add', { date: '2026-01-01', amount: 10 });
      expect(result).toHaveProperty('error');
    });
  });

  describe('subtract', () => {
    it('subtracts days from a date', () => {
      const result = computeDatetime('subtract', {
        date: '2026-01-11',
        amount: 10,
        unit: 'days',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('2026-01-01');
    });

    it('subtracts months crossing year boundary', () => {
      const result = computeDatetime('subtract', {
        date: '2026-02-15',
        amount: 3,
        unit: 'months',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string }).result).toBe('2025-11-15');
    });
  });

  describe('business_days', () => {
    it('counts business days Mon–Fri', () => {
      // 2026-01-05 is Monday, 2026-01-09 is Friday
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; businessDays: number }).businessDays).toBe(4);
    });

    it('counts business days spanning a weekend', () => {
      // 2026-01-05 (Mon) to 2026-01-12 (Mon)
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-12',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; businessDays: number }).businessDays).toBe(5);
    });

    it('subtracts custom holidays that fall on weekdays', () => {
      // 2026-01-05 (Mon) to 2026-01-09 (Fri), holiday on Wed 2026-01-07
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-07'],
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; businessDays: number }).businessDays).toBe(3);
    });

    it('subtracts holiday on start date', () => {
      // Holiday on Mon 2026-01-05, range Mon-Fri
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-05'],
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; businessDays: number }).businessDays).toBe(3);
    });

    it('subtracts holiday on end date', () => {
      // Holiday on Fri 2026-01-09, range Mon-Fri
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-09'],
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; businessDays: number }).businessDays).toBe(3);
    });

    it('ignores holidays that fall on weekends', () => {
      // 2026-01-10 is Saturday
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-10'],
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; businessDays: number }).businessDays).toBe(4);
    });

    it('returns negative for reversed range', () => {
      const result = computeDatetime('business_days', {
        from: '2026-01-09',
        to: '2026-01-05',
      });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; businessDays: number }).businessDays).toBe(-4);
    });
  });

  describe('days_in_month', () => {
    it('returns 28 for Feb in non-leap year', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 2 });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; days: number }).days).toBe(28);
    });

    it('returns 31 for March', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 3 });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; days: number }).days).toBe(31);
    });

    it('returns 29 for Feb in leap year', () => {
      const result = computeDatetime('days_in_month', { year: 2024, month: 2 });
      expect(result).not.toHaveProperty('error');
      expect((result as { result: string; days: number }).days).toBe(29);
    });

    it('returns error for month 0', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 0 });
      expect(result).toHaveProperty('error');
    });

    it('returns error for month 13', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 13 });
      expect(result).toHaveProperty('error');
    });
  });

  describe('age', () => {
    it('calculates full age breakdown', () => {
      const result = computeDatetime('age', {
        birthDate: '1990-06-15',
        asOf: '2026-03-21',
      });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; years: number; months: number; days: number };
      expect(r.years).toBe(35);
      expect(r.months).toBe(9);
      expect(r.days).toBe(6);
    });

    it('handles birthday not yet reached in year', () => {
      const result = computeDatetime('age', {
        birthDate: '1990-12-25',
        asOf: '2026-03-21',
      });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; years: number };
      expect(r.years).toBe(35);
    });

    it('returns error for missing birthDate', () => {
      const result = computeDatetime('age', { asOf: '2026-03-21' });
      expect(result).toHaveProperty('error');
    });

    it('returns error for missing asOf', () => {
      const result = computeDatetime('age', { birthDate: '1990-06-15' });
      expect(result).toHaveProperty('error');
    });
  });

  describe('quarter', () => {
    it('returns Q1 for January', () => {
      const result = computeDatetime('quarter', { date: '2026-01-15' });
      expect(result).not.toHaveProperty('error');
      const r = result as {
        result: string;
        quarter: number;
        quarterStart: string;
        quarterEnd: string;
      };
      expect(r.quarter).toBe(1);
      expect(r.quarterStart).toBe('2026-01-01');
      expect(r.quarterEnd).toBe('2026-03-31');
    });

    it('returns Q4 for December', () => {
      const result = computeDatetime('quarter', { date: '2026-12-15' });
      expect(result).not.toHaveProperty('error');
      const r = result as {
        result: string;
        quarter: number;
        quarterStart: string;
        quarterEnd: string;
      };
      expect(r.quarter).toBe(4);
      expect(r.quarterStart).toBe('2026-10-01');
      expect(r.quarterEnd).toBe('2026-12-31');
    });
  });

  describe('day_of_week', () => {
    it('returns Saturday for 2026-03-21', () => {
      const result = computeDatetime('day_of_week', { date: '2026-03-21' });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; dayOfWeek: string; dayNumber: number };
      expect(r.dayOfWeek).toBe('Saturday');
      expect(r.dayNumber).toBe(6);
    });

    it('returns Monday for 2026-03-16', () => {
      const result = computeDatetime('day_of_week', { date: '2026-03-16' });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; dayOfWeek: string; dayNumber: number };
      expect(r.dayOfWeek).toBe('Monday');
      expect(r.dayNumber).toBe(1);
    });

    it('returns Thursday for 2024-02-29 (leap day)', () => {
      const result = computeDatetime('day_of_week', { date: '2024-02-29' });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; dayOfWeek: string; dayNumber: number };
      expect(r.dayOfWeek).toBe('Thursday');
      expect(r.dayNumber).toBe(4);
    });
  });

  describe('is_leap_year', () => {
    it('returns true for 2024', () => {
      const result = computeDatetime('is_leap_year', { year: 2024 });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; isLeapYear: boolean };
      expect(r.result).toBe('true');
      expect(r.isLeapYear).toBe(true);
    });

    it('returns false for 2026', () => {
      const result = computeDatetime('is_leap_year', { year: 2026 });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; isLeapYear: boolean };
      expect(r.result).toBe('false');
      expect(r.isLeapYear).toBe(false);
    });

    it('returns false for 1900 (century not divisible by 400)', () => {
      const result = computeDatetime('is_leap_year', { year: 1900 });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; isLeapYear: boolean };
      expect(r.result).toBe('false');
      expect(r.isLeapYear).toBe(false);
    });

    it('returns true for 2000 (century divisible by 400)', () => {
      const result = computeDatetime('is_leap_year', { year: 2000 });
      expect(result).not.toHaveProperty('error');
      const r = result as { result: string; isLeapYear: boolean };
      expect(r.result).toBe('true');
      expect(r.isLeapYear).toBe(true);
    });

    it('returns error for missing year', () => {
      const result = computeDatetime('is_leap_year', {});
      expect(result).toHaveProperty('error');
    });
  });

  describe('error handling', () => {
    it('returns error for unknown operation', () => {
      const result = computeDatetime('unknown_op' as any, {});
      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('Unknown operation');
    });

    it('returns error for ambiguous date format with slashes', () => {
      const result = computeDatetime('day_of_week', { date: '12/03/2026' });
      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('ambiguous');
    });
  });
});
