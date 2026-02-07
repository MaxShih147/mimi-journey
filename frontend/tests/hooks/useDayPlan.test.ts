import { describe, it, expect } from 'vitest';
import { formatDateString, getTodayString } from '../../src/hooks/useDayPlan';

describe('formatDateString', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date('2026-02-08T15:30:00Z');
    const result = formatDateString(date);
    expect(result).toBe('2026-02-08');
  });

  it('pads single-digit month and day', () => {
    const date = new Date('2026-01-05T00:00:00Z');
    const result = formatDateString(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getTodayString', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = getTodayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getTodayString()).toBe(today);
  });
});
