// tests/engine.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateExpression, convertUnit, computeStatistic } from '../src/engine.js';

describe('evaluateExpression', () => {
  it('evaluates basic arithmetic', () => {
    const result = evaluateExpression('2 + 3');
    expect(result).toEqual({ result: '5' });
  });

  it('evaluates expressions with order of operations', () => {
    const result = evaluateExpression('2 + 3 * 4');
    expect(result).toEqual({ result: '14' });
  });

  it('evaluates exponents', () => {
    const result = evaluateExpression('2^10');
    expect(result).toEqual({ result: '1024' });
  });

  it('evaluates trigonometric functions', () => {
    const result = evaluateExpression('sin(45 deg)');
    expect(result).toHaveProperty('result');
    expect(Number((result as { result: string }).result)).toBeCloseTo(0.7071067811865476, 10);
  });

  it('evaluates factorials', () => {
    const result = evaluateExpression('10!');
    expect(result).toEqual({ result: '3628800' });
  });

  it('respects precision parameter', () => {
    const result = evaluateExpression('1/3', 4);
    expect(result).toEqual({ result: '0.3333' });
  });

  it('returns error for invalid expressions', () => {
    const result = evaluateExpression('2 +* 3');
    expect(result).toHaveProperty('error');
  });

  it('rejects expressions over 1000 characters', () => {
    const longExpr = '1+'.repeat(501) + '1';
    const result = evaluateExpression(longExpr);
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('too long');
  });

  it('blocks disabled function: import', () => {
    const result = evaluateExpression('import("fs")');
    expect(result).toHaveProperty('error');
  });

  it('blocks disabled function: evaluate', () => {
    const result = evaluateExpression('evaluate("2+3")');
    expect(result).toHaveProperty('error');
  });

  it('blocks disabled function: parse', () => {
    const result = evaluateExpression('parse("2+3")');
    expect(result).toHaveProperty('error');
  });
});

describe('convertUnit', () => {
  it('converts km to miles', () => {
    const result = convertUnit(5, 'km', 'miles');
    expect(result).toHaveProperty('result');
    expect(Number((result as { result: string }).result)).toBeCloseTo(3.10686, 4);
  });

  it('converts fahrenheit to celsius', () => {
    const result = convertUnit(100, 'fahrenheit', 'celsius');
    expect(result).toHaveProperty('result');
    expect(Number((result as { result: string }).result)).toBeCloseTo(37.7778, 3);
  });

  it('returns error for incompatible units', () => {
    const result = convertUnit(5, 'km', 'kg');
    expect(result).toHaveProperty('error');
  });

  it('returns error for unknown units', () => {
    const result = convertUnit(5, 'foobar', 'bazqux');
    expect(result).toHaveProperty('error');
  });
});

describe('computeStatistic', () => {
  const data = [23, 45, 12, 67, 34];

  it('computes mean', () => {
    const result = computeStatistic('mean', data);
    expect(result).toHaveProperty('result');
    expect(Number((result as { result: string }).result)).toBeCloseTo(36.2, 5);
  });

  it('computes median', () => {
    const result = computeStatistic('median', data);
    expect(result).toEqual({ result: '34' });
  });

  it('computes std', () => {
    const result = computeStatistic('std', data);
    expect(result).toHaveProperty('result');
    // mathjs std() uses sample standard deviation (Bessel's correction) by default
    expect(Number((result as { result: string }).result)).toBeCloseTo(21.1589, 3);
  });

  it('computes sum', () => {
    const result = computeStatistic('sum', data);
    expect(result).toEqual({ result: '181' });
  });

  it('computes min', () => {
    const result = computeStatistic('min', data);
    expect(result).toEqual({ result: '12' });
  });

  it('computes max', () => {
    const result = computeStatistic('max', data);
    expect(result).toEqual({ result: '67' });
  });

  it('computes variance', () => {
    const result = computeStatistic('variance', data);
    expect(result).toHaveProperty('result');
  });

  it('computes mode', () => {
    const result = computeStatistic('mode', [1, 2, 2, 3]);
    expect(result).toEqual({ result: '2' });
  });

  it('computes percentile', () => {
    const result = computeStatistic('percentile', [1, 2, 3, 4, 5], 90);
    expect(result).toHaveProperty('result');
    expect(Number((result as { result: string }).result)).toBeCloseTo(4.6, 1);
  });

  it('returns error for percentile without percentile value', () => {
    const result = computeStatistic('percentile', [1, 2, 3]);
    expect(result).toHaveProperty('error');
  });

  it('returns error for empty data array', () => {
    const result = computeStatistic('mean', []);
    expect(result).toHaveProperty('error');
  });

  it('rejects data arrays over 10000 elements', () => {
    const bigData = Array.from({ length: 10001 }, (_, i) => i);
    const result = computeStatistic('mean', bigData);
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('too many');
  });

  it('returns error for invalid operation', () => {
    const result = computeStatistic('invalid' as any, [1, 2, 3]);
    expect(result).toHaveProperty('error');
  });
});
