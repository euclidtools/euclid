# DateTime Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `datetime` MCP tool (9 operations) to Euclid using `date-fns`, refactor error-hints to a registry pattern, and add skill documentation.

**Architecture:** New `src/engines/datetime.ts` engine module with pure functions for 9 date/time operations, dispatched by a `src/tools/datetime.ts` tool definition following the existing `statistics` umbrella pattern. Error hints are refactored from a monolith (`src/error-hints.ts`) into a per-tool registry (`src/error-hints/*.ts`). Date normalization is added to `src/normalization.ts`.

**Tech Stack:** TypeScript, date-fns, Zod v4, vitest, MCP SDK

**Spec:** `docs/superpowers/specs/2026-03-21-datetime-tools-design.md`

---

## File Map

### New Files

| File                            | Responsibility                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/engines/datetime.ts`       | Pure date/time operation functions (9 ops). Returns `{ result: string, ...structured } \| { error: string }` |
| `src/tools/datetime.ts`         | Tool definition: name, description, Zod schema, handler. Dispatches to engine                                |
| `src/error-hints/index.ts`      | Registry dispatcher: `getErrorHint(tool, error)` routes to per-tool module                                   |
| `src/error-hints/calculate.ts`  | Calculate hints (migrated from monolith)                                                                     |
| `src/error-hints/convert.ts`    | Convert hints (migrated from monolith)                                                                       |
| `src/error-hints/statistics.ts` | Statistics hints (migrated from monolith)                                                                    |
| `src/error-hints/datetime.ts`   | Datetime-specific error hints                                                                                |
| `tests/datetime.test.ts`        | Tests for all 9 datetime operations + edge cases + errors                                                    |
| `skills/math/DATETIME.md`       | LLM reference doc for the datetime tool                                                                      |

### Modified Files

| File                         | Change                                                                 |
| ---------------------------- | ---------------------------------------------------------------------- |
| `src/index.ts`               | Import and register `datetimeTool`                                     |
| `src/normalization.ts`       | Add `normalizeDate()` function                                         |
| `src/tools/calculate.ts`     | Update import: `../error-hints.js` → `../error-hints/index.js`         |
| `src/tools/convert.ts`       | Update import: `../error-hints.js` → `../error-hints/index.js`         |
| `src/tools/statistics.ts`    | Update import: `../error-hints.js` → `../error-hints/index.js`         |
| `tests/error-hints.test.ts`  | Update import: `../src/error-hints.js` → `../src/error-hints/index.js` |
| `skills/math/SKILL.md`       | Add `datetime` to decision table + quick reference                     |
| `hooks/session-start`        | Add `datetime` to the context injection text                           |
| `.claude-plugin/plugin.json` | Update description to include `datetime`                               |
| `package.json`               | Add `date-fns` dependency                                              |

### Deleted Files

| File                 | Reason                                   |
| -------------------- | ---------------------------------------- |
| `src/error-hints.ts` | Replaced by `src/error-hints/` directory |

---

## Task 1: Install `date-fns` dependency

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install date-fns**

Run: `pnpm add date-fns`

- [ ] **Step 2: Verify installation**

Run: `pnpm ls date-fns`
Expected: Shows `date-fns` in the dependency tree.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add date-fns dependency for datetime tool"
```

---

## Task 2: Refactor error-hints to registry pattern

This is a pure refactor — no new functionality. Existing tests must continue passing with zero behavior change.

**Files:**

- Create: `src/error-hints/index.ts`
- Create: `src/error-hints/calculate.ts`
- Create: `src/error-hints/convert.ts`
- Create: `src/error-hints/statistics.ts`
- Modify: `src/tools/calculate.ts:4` (import path)
- Modify: `src/tools/convert.ts:4` (import path)
- Modify: `src/tools/statistics.ts:4` (import path)
- Modify: `tests/error-hints.test.ts:3` (import path)
- Delete: `src/error-hints.ts`

- [ ] **Step 1: Create `src/error-hints/calculate.ts`**

Extract the calculate hints from the monolith. Each per-tool module exports `getHint(errorMessage: string): string` and `EXAMPLES: string[]`.

```typescript
// src/error-hints/calculate.ts

export const EXAMPLES = ['2 * 3', 'sqrt(16)', 'sin(pi / 4)', 'log(100, 10)', '12! / (4! * 8!)'];

export function getHint(errorMessage: string): string {
  if (
    errorMessage.includes('Unexpected') ||
    errorMessage.includes('Parenthesis') ||
    errorMessage.includes('Value expected')
  ) {
    return 'Check expression syntax. Use * for multiplication, / for division, ^ for exponents, and ensure parentheses are balanced.';
  }
  if (errorMessage.includes('Undefined symbol') || errorMessage.includes('Undefined function')) {
    return 'Unknown variable or function. Supported functions include: sqrt, sin, cos, tan, log, exp, abs, ceil, floor, round.';
  }
  if (errorMessage.includes('is disabled')) {
    return 'This function is disabled for security. Use basic arithmetic and math functions only.';
  }
  return 'Invalid expression. Use standard mathematical notation with operators: +, -, *, /, ^.';
}
```

- [ ] **Step 2: Create `src/error-hints/convert.ts`**

```typescript
// src/error-hints/convert.ts

export const EXAMPLES = [
  "convert(5, 'km', 'mile')",
  "convert(100, 'degF', 'degC')",
  "convert(1, 'lb', 'kg')",
];

export function getHint(errorMessage: string): string {
  if (errorMessage.includes('not found')) {
    return 'Unit not recognized. Use standard abbreviations: km, m, ft, mile, lb, kg, degC, degF, mph, kph.';
  }
  if (errorMessage.includes('do not match')) {
    return 'Units are incompatible. Ensure both measure the same quantity (e.g., length to length, weight to weight).';
  }
  return 'Invalid conversion. Provide a numeric value with valid source and target units.';
}
```

- [ ] **Step 3: Create `src/error-hints/statistics.ts`**

```typescript
// src/error-hints/statistics.ts

export const EXAMPLES = [
  "statistics('mean', [1, 2, 3])",
  "statistics('percentile', [10, 20, 30], 90)",
];

export function getHint(errorMessage: string): string {
  if (errorMessage.includes('Unknown operation')) {
    return 'Valid operations: mean, median, mode, std, variance, min, max, sum, percentile.';
  }
  if (errorMessage.includes('Percentile')) {
    return 'The percentile parameter is required and must be between 0 and 100.';
  }
  if (errorMessage.includes('empty')) {
    return 'Data array must contain at least one number.';
  }
  return 'Provide a valid operation and a non-empty array of numbers.';
}
```

- [ ] **Step 4: Create `src/error-hints/index.ts`**

The registry dispatcher. Exports the same `getErrorHint()` signature as the old monolith so consumers don't break.

```typescript
// src/error-hints/index.ts
import * as calculate from './calculate.js';
import * as convert from './convert.js';
import * as statistics from './statistics.js';

export type ErrorHint = {
  hint: string;
  examples: string[];
};

export type ToolName = 'calculate' | 'convert' | 'statistics';

const registry: Record<ToolName, { getHint: (error: string) => string; EXAMPLES: string[] }> = {
  calculate,
  convert,
  statistics,
};

export function getErrorHint(tool: ToolName, errorMessage: string): ErrorHint {
  const mod = registry[tool];
  return { hint: mod.getHint(errorMessage), examples: mod.EXAMPLES };
}
```

Note: `ToolName` will be extended to include `'datetime'` in Task 5. For now, it matches the existing type exactly.

- [ ] **Step 5: Update imports in tool files**

In each of these three files, change the import path:

`src/tools/calculate.ts:4` — change:

```typescript
import { getErrorHint } from '../error-hints.js';
```

to:

```typescript
import { getErrorHint } from '../error-hints/index.js';
```

`src/tools/convert.ts:4` — same change.

`src/tools/statistics.ts:4` — same change.

- [ ] **Step 6: Update import in test file**

`tests/error-hints.test.ts:3` — change:

```typescript
import { getErrorHint } from '../src/error-hints.js';
```

to:

```typescript
import { getErrorHint } from '../src/error-hints/index.js';
```

- [ ] **Step 7: Delete old monolith**

Delete `src/error-hints.ts`.

- [ ] **Step 8: Run all existing tests**

Run: `pnpm test`
Expected: All tests pass. Zero behavior change.

- [ ] **Step 9: Commit**

```bash
git add src/error-hints/ src/tools/calculate.ts src/tools/convert.ts src/tools/statistics.ts tests/error-hints.test.ts
git rm src/error-hints.ts
git commit -m "refactor: extract error-hints into per-tool registry pattern"
```

---

## Task 3: Add `normalizeDate()` to normalization module

**Files:**

- Modify: `src/normalization.ts`
- Modify: `tests/normalization.test.ts`

- [ ] **Step 1: Write failing tests for `normalizeDate`**

Add a new `describe('normalizeDate')` block in `tests/normalization.test.ts`. First, update the existing import at the top of the file to include `normalizeDate`:

```typescript
// Merge into the existing import line — do NOT add a second import statement
import { normalizeExpression, normalizeUnit, normalizeDate } from '../src/normalization.js';
```

Then add the new describe block:

```typescript
describe('normalizeDate', () => {
  it('passes through ISO date strings unchanged', () => {
    const result = normalizeDate('2026-03-21');
    expect(result.value).toBe('2026-03-21');
    expect(result.wasTransformed).toBe(false);
  });

  it('passes through ISO datetime strings unchanged', () => {
    const result = normalizeDate('2026-03-21T14:30:00');
    expect(result.value).toBe('2026-03-21T14:30:00');
    expect(result.wasTransformed).toBe(false);
  });

  it('normalizes "Month DD, YYYY" format', () => {
    const result = normalizeDate('March 12, 2026');
    expect(result.value).toBe('2026-03-12');
    expect(result.wasTransformed).toBe(true);
    expect(result.original).toBe('March 12, 2026');
  });

  it('normalizes "DD Month YYYY" format', () => {
    const result = normalizeDate('12 March 2026');
    expect(result.value).toBe('2026-03-12');
    expect(result.wasTransformed).toBe(true);
  });

  it('handles full month names case-insensitively', () => {
    const result = normalizeDate('january 1, 2026');
    expect(result.value).toBe('2026-01-01');
    expect(result.wasTransformed).toBe(true);
  });

  it('does NOT normalize ambiguous numeric formats like MM/DD/YYYY', () => {
    const result = normalizeDate('12/03/2026');
    expect(result.value).toBe('12/03/2026');
    expect(result.wasTransformed).toBe(false);
  });

  it('does NOT normalize ambiguous numeric formats like DD-MM-YYYY', () => {
    const result = normalizeDate('03-12-2026');
    expect(result.value).toBe('03-12-2026');
    expect(result.wasTransformed).toBe(false);
  });

  it('returns unparseable strings unchanged', () => {
    const result = normalizeDate('not a date');
    expect(result.value).toBe('not a date');
    expect(result.wasTransformed).toBe(false);
  });

  it('trims whitespace', () => {
    const result = normalizeDate('  2026-03-21  ');
    expect(result.value).toBe('2026-03-21');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/normalization.test.ts`
Expected: FAIL — `normalizeDate` is not exported.

- [ ] **Step 3: Implement `normalizeDate`**

Add to the bottom of `src/normalization.ts`:

```typescript
const MONTH_NAMES: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

// Matches "Month DD, YYYY" or "Month DD YYYY"
const MONTH_DD_YYYY = /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i;
// Matches "DD Month YYYY"
const DD_MONTH_YYYY = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i;

export function normalizeDate(input: string): NormalizeResult {
  const trimmed = input.trim();

  // Pass through ISO 8601 dates: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
  if (/^\d{4}-\d{2}-\d{2}(T\S*)?$/.test(trimmed)) {
    return { value: trimmed, wasTransformed: trimmed !== input, original: input };
  }

  // Try "Month DD, YYYY" or "Month DD YYYY"
  const mdyMatch = trimmed.match(MONTH_DD_YYYY);
  if (mdyMatch) {
    const monthNum = MONTH_NAMES[mdyMatch[1].toLowerCase()];
    if (monthNum) {
      const day = mdyMatch[2].padStart(2, '0');
      const year = mdyMatch[3];
      return { value: `${year}-${monthNum}-${day}`, wasTransformed: true, original: input };
    }
  }

  // Try "DD Month YYYY"
  const dmyMatch = trimmed.match(DD_MONTH_YYYY);
  if (dmyMatch) {
    const monthNum = MONTH_NAMES[dmyMatch[2].toLowerCase()];
    if (monthNum) {
      const day = dmyMatch[1].padStart(2, '0');
      const year = dmyMatch[3];
      return { value: `${year}-${monthNum}-${day}`, wasTransformed: true, original: input };
    }
  }

  // Everything else (including ambiguous numeric formats) passes through unchanged
  return { value: trimmed, wasTransformed: trimmed !== input, original: input };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/normalization.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: All tests pass (existing normalization tests unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/normalization.ts tests/normalization.test.ts
git commit -m "feat: add normalizeDate() for unambiguous natural date formats"
```

---

## Task 4: Implement datetime engine

**Files:**

- Create: `src/engines/datetime.ts`
- Create: `tests/datetime-engine.test.ts`

- [ ] **Step 1: Write failing tests for the engine**

Create `tests/datetime-engine.test.ts`. Test the engine functions directly (not the tool handler). This file tests each of the 9 operations plus edge cases.

```typescript
// tests/datetime-engine.test.ts
import { describe, it, expect } from 'vitest';
import { computeDatetime, type DatetimeOperation } from '../src/engines/datetime.js';

describe('computeDatetime', () => {
  describe('difference', () => {
    it('computes difference between two dates with breakdown', () => {
      const result = computeDatetime('difference', { from: '2026-01-01', to: '2026-03-15' });
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.breakdown).toBeDefined();
        expect(result.breakdown.months).toBe(2);
        expect(result.breakdown.days).toBe(14);
      }
    });

    it('computes difference in specific unit', () => {
      const result = computeDatetime('difference', {
        from: '2026-01-01',
        to: '2026-01-31',
        unit: 'days',
      });
      if (!('error' in result)) {
        expect(result.result).toBe('30 days');
      }
    });

    it('returns negative values when from is after to', () => {
      const result = computeDatetime('difference', {
        from: '2026-03-15',
        to: '2026-01-01',
        unit: 'days',
      });
      if (!('error' in result)) {
        expect(result.result).toContain('-');
      }
    });

    it('handles datetime strings with times', () => {
      const result = computeDatetime('difference', {
        from: '2026-01-01T08:00:00',
        to: '2026-01-01T17:30:00',
        unit: 'hours',
      });
      if (!('error' in result)) {
        expect(result.result).toBe('9 hours');
      }
    });

    it('returns error for missing from', () => {
      const result = computeDatetime('difference', { to: '2026-01-01' });
      expect('error' in result).toBe(true);
    });

    it('returns error for invalid date', () => {
      const result = computeDatetime('difference', { from: 'not-a-date', to: '2026-01-01' });
      expect('error' in result).toBe(true);
    });
  });

  describe('add', () => {
    it('adds days to a date', () => {
      const result = computeDatetime('add', { date: '2026-01-01', amount: 10, unit: 'days' });
      if (!('error' in result)) {
        expect(result.result).toBe('2026-01-11');
      }
    });

    it('adds months to a date', () => {
      const result = computeDatetime('add', { date: '2026-01-15', amount: 2, unit: 'months' });
      if (!('error' in result)) {
        expect(result.result).toBe('2026-03-15');
      }
    });

    it('handles end-of-month clamping (Jan 31 + 1 month)', () => {
      const result = computeDatetime('add', { date: '2026-01-31', amount: 1, unit: 'months' });
      if (!('error' in result)) {
        // date-fns clamps to end of February
        expect(result.result).toBe('2026-02-28');
      }
    });

    it('adds years across leap year boundary', () => {
      const result = computeDatetime('add', { date: '2024-02-29', amount: 1, unit: 'years' });
      if (!('error' in result)) {
        expect(result.result).toBe('2025-02-28');
      }
    });

    it('adds hours to a datetime', () => {
      const result = computeDatetime('add', {
        date: '2026-01-01T10:00:00',
        amount: 5,
        unit: 'hours',
      });
      if (!('error' in result)) {
        expect(result.result).toContain('T15:00:00');
      }
    });

    it('returns error for missing date', () => {
      const result = computeDatetime('add', { amount: 10, unit: 'days' });
      expect('error' in result).toBe(true);
    });

    it('returns error for missing unit', () => {
      const result = computeDatetime('add', { date: '2026-01-01', amount: 10 });
      expect('error' in result).toBe(true);
    });
  });

  describe('subtract', () => {
    it('subtracts days from a date', () => {
      const result = computeDatetime('subtract', { date: '2026-01-11', amount: 10, unit: 'days' });
      if (!('error' in result)) {
        expect(result.result).toBe('2026-01-01');
      }
    });

    it('subtracts months crossing year boundary', () => {
      const result = computeDatetime('subtract', {
        date: '2026-02-15',
        amount: 3,
        unit: 'months',
      });
      if (!('error' in result)) {
        expect(result.result).toBe('2025-11-15');
      }
    });
  });

  describe('business_days', () => {
    it('counts business days between two dates', () => {
      // Mon 2026-01-05 to Fri 2026-01-09 = 4 business days
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
      });
      if (!('error' in result)) {
        expect(result.businessDays).toBe(4);
      }
    });

    it('excludes weekends', () => {
      // Mon 2026-01-05 to Mon 2026-01-12 = 5 business days (skips Sat/Sun)
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-12',
      });
      if (!('error' in result)) {
        expect(result.businessDays).toBe(5);
      }
    });

    it('excludes custom holidays', () => {
      // Mon 2026-01-05 to Fri 2026-01-09 = 4 business days normally
      // Minus Wed 2026-01-07 holiday = 3
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-07'],
      });
      if (!('error' in result)) {
        expect(result.businessDays).toBe(3);
      }
    });

    it('handles holiday on range start date', () => {
      // Mon 2026-01-05 to Fri 2026-01-09 = 4 business days normally
      // Holiday on Mon 2026-01-05 (the start) = 3
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-05'],
      });
      if (!('error' in result)) {
        expect(result.businessDays).toBe(3);
      }
    });

    it('handles holiday on range end date', () => {
      // Mon 2026-01-05 to Fri 2026-01-09 = 4 business days normally
      // Holiday on Fri 2026-01-09 (the end) = 3
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-09'],
      });
      if (!('error' in result)) {
        expect(result.businessDays).toBe(3);
      }
    });

    it('ignores holidays that fall on weekends', () => {
      // Mon 2026-01-05 to Fri 2026-01-09 = 4 business days
      // Holiday on Sat 2026-01-10 (weekend) should not affect count
      const result = computeDatetime('business_days', {
        from: '2026-01-05',
        to: '2026-01-09',
        holidays: ['2026-01-10'],
      });
      if (!('error' in result)) {
        expect(result.businessDays).toBe(4);
      }
    });

    it('returns negative for reversed range', () => {
      const result = computeDatetime('business_days', {
        from: '2026-01-09',
        to: '2026-01-05',
      });
      if (!('error' in result)) {
        expect(result.businessDays).toBeLessThan(0);
      }
    });
  });

  describe('days_in_month', () => {
    it('returns 28 for February in a non-leap year', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 2 });
      if (!('error' in result)) {
        expect(result.days).toBe(28);
      }
    });

    it('returns 31 for March', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 3 });
      if (!('error' in result)) {
        expect(result.days).toBe(31);
      }
    });

    it('returns 29 for February in a leap year', () => {
      const result = computeDatetime('days_in_month', { year: 2024, month: 2 });
      if (!('error' in result)) {
        expect(result.days).toBe(29);
      }
    });

    it('returns error for invalid month 0', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 0 });
      expect('error' in result).toBe(true);
    });

    it('returns error for invalid month 13', () => {
      const result = computeDatetime('days_in_month', { year: 2026, month: 13 });
      expect('error' in result).toBe(true);
    });
  });

  describe('age', () => {
    it('computes age correctly', () => {
      const result = computeDatetime('age', {
        birthDate: '1990-06-15',
        asOf: '2026-03-21',
      });
      if (!('error' in result)) {
        expect(result.years).toBe(35);
        expect(result.months).toBe(9);
        expect(result.days).toBe(6);
      }
    });

    it('handles birthday not yet reached in current year', () => {
      const result = computeDatetime('age', {
        birthDate: '1990-12-25',
        asOf: '2026-03-21',
      });
      if (!('error' in result)) {
        expect(result.years).toBe(35);
      }
    });

    it('returns error for missing birthDate', () => {
      const result = computeDatetime('age', { asOf: '2026-03-21' });
      expect('error' in result).toBe(true);
    });
  });

  describe('quarter', () => {
    it('returns Q1 for January', () => {
      const result = computeDatetime('quarter', { date: '2026-01-15' });
      if (!('error' in result)) {
        expect(result.quarter).toBe(1);
        expect(result.quarterStart).toBe('2026-01-01');
        expect(result.quarterEnd).toBe('2026-03-31');
      }
    });

    it('returns Q4 for December', () => {
      const result = computeDatetime('quarter', { date: '2026-12-01' });
      if (!('error' in result)) {
        expect(result.quarter).toBe(4);
        expect(result.quarterStart).toBe('2026-10-01');
        expect(result.quarterEnd).toBe('2026-12-31');
      }
    });
  });

  describe('day_of_week', () => {
    it('returns correct day for a known date', () => {
      // 2026-03-21 is a Saturday
      const result = computeDatetime('day_of_week', { date: '2026-03-21' });
      if (!('error' in result)) {
        expect(result.dayOfWeek).toBe('Saturday');
        expect(result.dayNumber).toBe(6);
      }
    });

    it('returns Monday as dayNumber 1', () => {
      // 2026-03-16 is a Monday
      const result = computeDatetime('day_of_week', { date: '2026-03-16' });
      if (!('error' in result)) {
        expect(result.dayOfWeek).toBe('Monday');
        expect(result.dayNumber).toBe(1);
      }
    });

    it('handles leap day', () => {
      // 2024-02-29 is a Thursday
      const result = computeDatetime('day_of_week', { date: '2024-02-29' });
      if (!('error' in result)) {
        expect(result.dayOfWeek).toBe('Thursday');
        expect(result.dayNumber).toBe(4);
      }
    });
  });

  describe('is_leap_year', () => {
    it('returns true for a leap year', () => {
      const result = computeDatetime('is_leap_year', { year: 2024 });
      if (!('error' in result)) {
        expect(result.isLeapYear).toBe(true);
        expect(result.result).toBe('true');
      }
    });

    it('returns false for a non-leap year', () => {
      const result = computeDatetime('is_leap_year', { year: 2026 });
      if (!('error' in result)) {
        expect(result.isLeapYear).toBe(false);
        expect(result.result).toBe('false');
      }
    });

    it('returns false for century year not divisible by 400', () => {
      const result = computeDatetime('is_leap_year', { year: 1900 });
      if (!('error' in result)) {
        expect(result.isLeapYear).toBe(false);
      }
    });

    it('returns true for century year divisible by 400', () => {
      const result = computeDatetime('is_leap_year', { year: 2000 });
      if (!('error' in result)) {
        expect(result.isLeapYear).toBe(true);
      }
    });

    it('returns error for missing year', () => {
      const result = computeDatetime('is_leap_year', {});
      expect('error' in result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns error for unknown operation', () => {
      const result = computeDatetime('bogus' as DatetimeOperation, {});
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Unknown operation');
      }
    });

    it('returns error for ambiguous date format', () => {
      const result = computeDatetime('day_of_week', { date: '12/03/2026' });
      expect('error' in result).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/datetime-engine.test.ts`
Expected: FAIL — module `../src/engines/datetime.js` does not exist.

- [ ] **Step 3: Implement the engine**

Create `src/engines/datetime.ts`. This is the core implementation — all 9 operations as pure functions.

```typescript
// src/engines/datetime.ts
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  addSeconds,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInBusinessDays,
  getDaysInMonth as dfnsGetDaysInMonth,
  getQuarter,
  startOfQuarter,
  endOfQuarter,
  getDay,
  isLeapYear as dfnsIsLeapYear,
  parseISO,
  isValid,
  format,
  eachDayOfInterval,
  isWeekend,
} from 'date-fns';
import { normalizeDate, type NormalizeResult } from '../normalization.js';

export type DatetimeOperation =
  | 'difference'
  | 'add'
  | 'subtract'
  | 'business_days'
  | 'days_in_month'
  | 'age'
  | 'quarter'
  | 'day_of_week'
  | 'is_leap_year';

// Flexible args type — validated per operation
type DatetimeArgs = Record<string, unknown>;

type DatetimeSuccess = { result: string; note?: string; [key: string]: unknown };
type DatetimeError = { error: string };
export type DatetimeResult = DatetimeSuccess | DatetimeError;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseDate(input: unknown): { date: Date; norm: NormalizeResult } | { error: string } {
  if (typeof input !== 'string' || input.trim() === '') {
    return { error: 'Date must be a non-empty string' };
  }
  const norm = normalizeDate(input);

  // Reject ambiguous numeric formats (contain / or non-ISO dashes)
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(norm.value)) {
    return {
      error: `Ambiguous date format '${input}'. Use ISO format YYYY-MM-DD to avoid DD/MM vs MM/DD confusion`,
    };
  }

  const date = parseISO(norm.value);
  if (!isValid(date)) {
    return {
      error: `Invalid date '${input}'. Date must be in ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss`,
    };
  }
  return { date, norm };
}

function formatDate(date: Date, includeTime: boolean): string {
  return includeTime ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : format(date, 'yyyy-MM-dd');
}

function hasTime(input: string): boolean {
  return input.includes('T');
}

function requireFields(
  args: DatetimeArgs,
  fields: string[],
  operation: string,
): string | undefined {
  const missing = fields.filter((f) => args[f] === undefined || args[f] === null);
  if (missing.length > 0) {
    return `Operation '${operation}' requires fields: ${missing.join(', ')}. See tool description for details`;
  }
  return undefined;
}

function buildNote(norms: NormalizeResult[]): string | undefined {
  const transformed = norms.filter((n) => n.wasTransformed);
  if (transformed.length === 0) return undefined;
  return transformed.map((n) => `Interpreted '${n.original}' as ${n.value}`).join('; ');
}

function computeDifference(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['from', 'to'], 'difference');
  if (err) return { error: err };

  const fromParsed = parseDate(args.from);
  if ('error' in fromParsed) return fromParsed;
  const toParsed = parseDate(args.to);
  if ('error' in toParsed) return toParsed;

  const { date: fromDate, norm: fromNorm } = fromParsed;
  const { date: toDate, norm: toNorm } = toParsed;
  const unit = args.unit as string | undefined;

  if (unit) {
    let diff: number;
    switch (unit) {
      case 'days':
        diff = differenceInDays(toDate, fromDate);
        break;
      case 'weeks':
        diff = differenceInWeeks(toDate, fromDate);
        break;
      case 'months':
        diff = differenceInMonths(toDate, fromDate);
        break;
      case 'years':
        diff = differenceInYears(toDate, fromDate);
        break;
      case 'hours':
        diff = differenceInHours(toDate, fromDate);
        break;
      case 'minutes':
        diff = differenceInMinutes(toDate, fromDate);
        break;
      default:
        return { error: `Invalid unit '${unit}' for difference` };
    }
    return {
      result: `${diff} ${unit}`,
      difference: diff,
      unit,
      note: buildNote([fromNorm, toNorm]),
    };
  }

  // Full breakdown
  const totalSeconds = differenceInSeconds(toDate, fromDate);
  const sign = totalSeconds < 0 ? -1 : 1;
  const absFrom = sign < 0 ? toDate : fromDate;
  const absTo = sign < 0 ? fromDate : toDate;

  const years = differenceInYears(absTo, absFrom);
  let remainder = addYears(absFrom, years);
  const months = differenceInMonths(absTo, remainder);
  remainder = addMonths(remainder, months);
  const days = differenceInDays(absTo, remainder);
  remainder = addDays(remainder, days);
  const hours = differenceInHours(absTo, remainder);
  remainder = addHours(remainder, hours);
  const minutes = differenceInMinutes(absTo, remainder);
  remainder = addMinutes(remainder, minutes);
  const seconds = differenceInSeconds(absTo, remainder);

  const breakdown = {
    years: years * sign,
    months: months * sign,
    days: days * sign,
    hours: hours * sign,
    minutes: minutes * sign,
    seconds: seconds * sign,
  };

  const parts: string[] = [];
  if (breakdown.years !== 0) parts.push(`${breakdown.years}y`);
  if (breakdown.months !== 0) parts.push(`${breakdown.months}m`);
  if (breakdown.days !== 0) parts.push(`${breakdown.days}d`);
  if (breakdown.hours !== 0) parts.push(`${breakdown.hours}h`);
  if (breakdown.minutes !== 0) parts.push(`${breakdown.minutes}min`);
  if (breakdown.seconds !== 0) parts.push(`${breakdown.seconds}s`);

  return {
    result: parts.length > 0 ? parts.join(' ') : '0d',
    breakdown,
    note: buildNote([fromNorm, toNorm]),
  };
}

function computeAdd(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['date', 'amount', 'unit'], 'add');
  if (err) return { error: err };

  const parsed = parseDate(args.date);
  if ('error' in parsed) return parsed;

  const amount = args.amount as number;
  const unit = args.unit as string;
  const includeTime = hasTime(parsed.norm.value);
  let result: Date;

  switch (unit) {
    case 'days':
      result = addDays(parsed.date, amount);
      break;
    case 'weeks':
      result = addWeeks(parsed.date, amount);
      break;
    case 'months':
      result = addMonths(parsed.date, amount);
      break;
    case 'years':
      result = addYears(parsed.date, amount);
      break;
    case 'hours':
      result = addHours(parsed.date, amount);
      break;
    case 'minutes':
      result = addMinutes(parsed.date, amount);
      break;
    case 'seconds':
      result = addSeconds(parsed.date, amount);
      break;
    default:
      return { error: `Invalid unit '${unit}' for add` };
  }

  const timeNeeded = includeTime || ['hours', 'minutes', 'seconds'].includes(unit);
  return {
    result: formatDate(result, timeNeeded),
    note: buildNote([parsed.norm]),
  };
}

function computeSubtract(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['date', 'amount', 'unit'], 'subtract');
  if (err) return { error: err };

  return computeAdd({ ...args, amount: -(args.amount as number) });
}

function computeBusinessDays(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['from', 'to'], 'business_days');
  if (err) return { error: err };

  const fromParsed = parseDate(args.from);
  if ('error' in fromParsed) return fromParsed;
  const toParsed = parseDate(args.to);
  if ('error' in toParsed) return toParsed;

  const holidays = (args.holidays as string[] | undefined) ?? [];
  const holidaySet = new Set(holidays);

  let count = differenceInBusinessDays(toParsed.date, fromParsed.date);

  // Subtract holidays that fall on business days within the range
  // differenceInBusinessDays counts business days between the two dates
  // (exclusive of start for positive ranges). We iterate the same range
  // and subtract any holidays that are weekdays.
  if (holidays.length > 0 && count !== 0) {
    const sign = count < 0 ? -1 : 1;
    const rangeStart = sign > 0 ? fromParsed.date : toParsed.date;
    const rangeEnd = sign > 0 ? toParsed.date : fromParsed.date;

    // eachDayOfInterval includes both endpoints; we exclude rangeStart
    // to match differenceInBusinessDays' exclusive-start behavior
    const interval = eachDayOfInterval({ start: addDays(rangeStart, 1), end: rangeEnd });

    let holidayBusinessDays = 0;
    for (const day of interval) {
      const iso = format(day, 'yyyy-MM-dd');
      if (holidaySet.has(iso) && !isWeekend(day)) {
        holidayBusinessDays++;
      }
    }
    count = count - holidayBusinessDays * sign;
  }

  return {
    result: String(count),
    businessDays: count,
    note: buildNote([fromParsed.norm, toParsed.norm]),
  };
}

function computeDaysInMonth(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['year', 'month'], 'days_in_month');
  if (err) return { error: err };

  const month = args.month as number;
  if (month < 1 || month > 12) {
    return { error: 'Month must be between 1 and 12' };
  }

  const year = args.year as number;
  // date-fns months are 0-indexed
  const days = dfnsGetDaysInMonth(new Date(year, month - 1));
  return { result: String(days), days };
}

function computeAge(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['birthDate', 'asOf'], 'age');
  if (err) return { error: err };

  const birthParsed = parseDate(args.birthDate);
  if ('error' in birthParsed) return birthParsed;
  const asOfParsed = parseDate(args.asOf);
  if ('error' in asOfParsed) return asOfParsed;

  const years = differenceInYears(asOfParsed.date, birthParsed.date);
  let remainder = addYears(birthParsed.date, years);
  const months = differenceInMonths(asOfParsed.date, remainder);
  remainder = addMonths(remainder, months);
  const days = differenceInDays(asOfParsed.date, remainder);

  return {
    result: `${years} years, ${months} months, ${days} days`,
    years,
    months,
    days,
    note: buildNote([birthParsed.norm, asOfParsed.norm]),
  };
}

function computeQuarter(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['date'], 'quarter');
  if (err) return { error: err };

  const parsed = parseDate(args.date);
  if ('error' in parsed) return parsed;

  const quarter = getQuarter(parsed.date);
  const qStart = startOfQuarter(parsed.date);
  const qEnd = endOfQuarter(parsed.date);

  return {
    result: `Q${quarter}`,
    quarter,
    quarterStart: format(qStart, 'yyyy-MM-dd'),
    quarterEnd: format(qEnd, 'yyyy-MM-dd'),
    note: buildNote([parsed.norm]),
  };
}

function computeDayOfWeek(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['date'], 'day_of_week');
  if (err) return { error: err };

  const parsed = parseDate(args.date);
  if ('error' in parsed) return parsed;

  const jsDayIndex = getDay(parsed.date); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const dayOfWeek = DAY_NAMES[jsDayIndex];
  // ISO 8601: 1=Monday through 7=Sunday
  const dayNumber = jsDayIndex === 0 ? 7 : jsDayIndex;

  return {
    result: dayOfWeek,
    dayOfWeek,
    dayNumber,
    note: buildNote([parsed.norm]),
  };
}

function computeIsLeapYear(args: DatetimeArgs): DatetimeResult {
  const err = requireFields(args, ['year'], 'is_leap_year');
  if (err) return { error: err };

  const year = args.year as number;
  const leap = dfnsIsLeapYear(new Date(year, 0));

  return {
    result: String(leap),
    isLeapYear: leap,
  };
}

const OPERATIONS: Record<DatetimeOperation, (args: DatetimeArgs) => DatetimeResult> = {
  difference: computeDifference,
  add: computeAdd,
  subtract: computeSubtract,
  business_days: computeBusinessDays,
  days_in_month: computeDaysInMonth,
  age: computeAge,
  quarter: computeQuarter,
  day_of_week: computeDayOfWeek,
  is_leap_year: computeIsLeapYear,
};

export function computeDatetime(operation: DatetimeOperation, args: DatetimeArgs): DatetimeResult {
  const fn = OPERATIONS[operation];
  if (!fn) {
    return { error: `Unknown operation: ${operation}` };
  }
  return fn(args);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- tests/datetime-engine.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engines/datetime.ts tests/datetime-engine.test.ts
git commit -m "feat: implement datetime engine with 9 operations"
```

---

## Task 5: Add datetime error hints

**Files:**

- Create: `src/error-hints/datetime.ts`
- Modify: `src/error-hints/index.ts`
- Modify: `tests/error-hints.test.ts`

- [ ] **Step 1: Write failing tests for datetime hints**

Add a `describe('datetime')` block in `tests/error-hints.test.ts`:

```typescript
describe('datetime', () => {
  it('returns ISO format hint for invalid date errors', () => {
    const { hint } = getErrorHint('datetime', "Invalid date 'abc'");
    expect(hint).toContain('ISO');
  });

  it('returns ambiguous hint for ambiguous date format errors', () => {
    const { hint } = getErrorHint('datetime', "Ambiguous date format '12/03/2026'");
    expect(hint).toContain('YYYY-MM-DD');
  });

  it('returns month hint for invalid month errors', () => {
    const { hint } = getErrorHint('datetime', 'Month must be between 1 and 12');
    expect(hint).toContain('1 and 12');
  });

  it('returns missing fields hint for required field errors', () => {
    const { hint } = getErrorHint('datetime', "Operation 'add' requires fields: date, amount");
    expect(hint).toContain('requires');
  });

  it('returns fallback hint for unknown errors', () => {
    const { hint, examples } = getErrorHint('datetime', 'Something weird happened');
    expect(hint).toBeTruthy();
    expect(examples.length).toBeGreaterThan(0);
  });

  it('always includes examples', () => {
    const { examples } = getErrorHint('datetime', 'any error');
    expect(examples.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/error-hints.test.ts`
Expected: FAIL — `'datetime'` is not assignable to type `ToolName`.

- [ ] **Step 3: Create `src/error-hints/datetime.ts`**

```typescript
// src/error-hints/datetime.ts

export const EXAMPLES = [
  "datetime('difference', { from: '2026-01-01', to: '2026-03-15' })",
  "datetime('add', { date: '2026-01-01', amount: 90, unit: 'days' })",
  "datetime('age', { birthDate: '1990-06-15', asOf: '2026-03-21' })",
];

export function getHint(errorMessage: string): string {
  if (errorMessage.includes('Invalid date')) {
    return 'Date must be in ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss';
  }
  if (errorMessage.includes('Ambiguous date format')) {
    return 'Ambiguous date format. Use ISO format YYYY-MM-DD to avoid DD/MM vs MM/DD confusion';
  }
  if (errorMessage.includes('Month must be between')) {
    return 'Month must be between 1 and 12';
  }
  if (errorMessage.includes('requires fields')) {
    return errorMessage; // The error message itself is the hint
  }
  return 'Provide dates in ISO 8601 format (YYYY-MM-DD) and a valid operation: difference, add, subtract, business_days, days_in_month, age, quarter, day_of_week, is_leap_year.';
}
```

- [ ] **Step 4: Update `src/error-hints/index.ts` to include datetime**

Add `datetime` to the imports, `ToolName`, and registry:

```typescript
// src/error-hints/index.ts
import * as calculate from './calculate.js';
import * as convert from './convert.js';
import * as statistics from './statistics.js';
import * as datetime from './datetime.js';

export type ErrorHint = {
  hint: string;
  examples: string[];
};

export type ToolName = 'calculate' | 'convert' | 'statistics' | 'datetime';

const registry: Record<ToolName, { getHint: (error: string) => string; EXAMPLES: string[] }> = {
  calculate,
  convert,
  statistics,
  datetime,
};

export function getErrorHint(tool: ToolName, errorMessage: string): ErrorHint {
  const mod = registry[tool];
  return { hint: mod.getHint(errorMessage), examples: mod.EXAMPLES };
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- tests/error-hints.test.ts`
Expected: All tests pass (both existing and new datetime tests).

- [ ] **Step 6: Commit**

```bash
git add src/error-hints/datetime.ts src/error-hints/index.ts tests/error-hints.test.ts
git commit -m "feat: add datetime error hints to registry"
```

---

## Task 6: Create datetime tool definition and register it

**Files:**

- Create: `src/tools/datetime.ts`
- Modify: `src/index.ts`
- Create: `tests/datetime.test.ts`

- [ ] **Step 1: Write failing tests for the tool handler**

Create `tests/datetime.test.ts`. This tests the tool handler layer (JSON serialization, error hint inclusion, note propagation), not the engine logic (already covered in Task 4).

```typescript
// tests/datetime.test.ts
import { describe, it, expect } from 'vitest';
import { datetimeTool } from '../src/tools/datetime.js';

describe('datetimeTool', () => {
  it('has correct tool name', () => {
    expect(datetimeTool.name).toBe('datetime');
  });

  it('has a description', () => {
    expect(datetimeTool.description).toBeTruthy();
  });

  it('has an inputSchema', () => {
    expect(datetimeTool.inputSchema).toBeDefined();
  });

  it('handler returns result for add operation', async () => {
    const response = await datetimeTool.handler({
      operation: 'add',
      date: '2026-01-01',
      amount: 10,
      unit: 'days',
    });
    expect(response.isError).toBeUndefined();
    const content = JSON.parse(response.content[0].text);
    expect(content.result).toBe('2026-01-11');
    expect(content.operation).toBe('add');
  });

  it('handler returns structured fields for age', async () => {
    const response = await datetimeTool.handler({
      operation: 'age',
      birthDate: '1990-06-15',
      asOf: '2026-03-21',
    });
    const content = JSON.parse(response.content[0].text);
    expect(content.years).toBe(35);
    expect(content.months).toBe(9);
    expect(content.days).toBe(6);
    expect(content.result).toContain('35 years');
  });

  it('handler returns error with hint and examples', async () => {
    const response = await datetimeTool.handler({
      operation: 'add',
      date: 'not-a-date',
      amount: 10,
      unit: 'days',
    });
    expect(response.isError).toBe(true);
    const content = JSON.parse(response.content[0].text);
    expect(content.error).toBeTruthy();
    expect(content.hint).toBeTruthy();
    expect(content.examples).toBeInstanceOf(Array);
    expect(content.examples.length).toBeGreaterThan(0);
  });

  it('handler includes note when date is normalized', async () => {
    const response = await datetimeTool.handler({
      operation: 'day_of_week',
      date: 'March 21, 2026',
    });
    expect(response.isError).toBeUndefined();
    const content = JSON.parse(response.content[0].text);
    expect(content.note).toContain('Interpreted');
  });

  it('handler does not include note for ISO dates', async () => {
    const response = await datetimeTool.handler({
      operation: 'day_of_week',
      date: '2026-03-21',
    });
    const content = JSON.parse(response.content[0].text);
    expect(content.note).toBeUndefined();
  });

  it('handler returns error for missing required fields', async () => {
    const response = await datetimeTool.handler({ operation: 'add', date: '2026-01-01' });
    expect(response.isError).toBe(true);
    const content = JSON.parse(response.content[0].text);
    expect(content.error).toContain('requires fields');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- tests/datetime.test.ts`
Expected: FAIL — module `../src/tools/datetime.js` does not exist.

- [ ] **Step 3: Create `src/tools/datetime.ts`**

```typescript
// src/tools/datetime.ts
import { z } from 'zod/v4';
import { computeDatetime, type DatetimeOperation } from '../engines/datetime.js';
import { getErrorHint } from '../error-hints/index.js';

export const datetimeTool = {
  name: 'datetime',

  description: `Performs deterministic date and time arithmetic. Use this tool for any date calculation: differences between dates, adding/subtracting time periods, business day counting, age calculation, and date properties.

This tool does NOT handle timezone conversions or DST transitions — it performs pure calendar math. Use \`calculate\` for pure number arithmetic. Use \`convert\` for time unit conversion (hours to minutes, etc.).

Examples:
- "How many days between Jan 1 and Mar 15?" → datetime("difference", { from: "2026-01-01", to: "2026-03-15", unit: "days" })
- "What date is 90 days from today?" → datetime("add", { date: "2026-03-21", amount: 90, unit: "days" })
- "How old is someone born June 15, 1990?" → datetime("age", { birthDate: "1990-06-15", asOf: "2026-03-21" })
- "How many business days in January?" → datetime("business_days", { from: "2026-01-01", to: "2026-01-31" })
- "What day of the week is March 21, 2026?" → datetime("day_of_week", { date: "2026-03-21" })
- "Is 2024 a leap year?" → datetime("is_leap_year", { year: 2024 })
- "What quarter is October in?" → datetime("quarter", { date: "2026-10-15" })
- "How many days in February 2024?" → datetime("days_in_month", { year: 2024, month: 2 })

All dates should be in ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss. Natural formats like "March 12, 2026" are accepted but ISO is recommended.`,

  inputSchema: z.object({
    operation: z
      .enum([
        'difference',
        'add',
        'subtract',
        'business_days',
        'days_in_month',
        'age',
        'quarter',
        'day_of_week',
        'is_leap_year',
      ])
      .describe('The datetime operation to perform'),
    date: z.string().optional().describe('ISO 8601 date (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)'),
    from: z.string().optional().describe('Start date (ISO 8601)'),
    to: z.string().optional().describe('End date (ISO 8601)'),
    amount: z.number().optional().describe('Number of units to add/subtract'),
    unit: z
      .enum(['days', 'weeks', 'months', 'years', 'hours', 'minutes', 'seconds'])
      .optional()
      .describe('Time unit for add/subtract/difference'),
    year: z.number().optional().describe('Year (for days_in_month, is_leap_year)'),
    month: z.number().optional().describe('Month 1-12 (for days_in_month)'),
    birthDate: z.string().optional().describe('Birth date (ISO 8601, for age)'),
    asOf: z.string().optional().describe('Reference date (ISO 8601, for age)'),
    holidays: z
      .array(z.string())
      .optional()
      .describe('ISO date strings to exclude as holidays (for business_days)'),
  }),

  handler: async (args: {
    operation: string;
    date?: string;
    from?: string;
    to?: string;
    amount?: number;
    unit?: string;
    year?: number;
    month?: number;
    birthDate?: string;
    asOf?: string;
    holidays?: string[];
  }) => {
    const result = computeDatetime(args.operation as DatetimeOperation, args);

    if ('error' in result) {
      const { hint, examples } = getErrorHint('datetime', result.error);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: result.error,
              operation: args.operation,
              hint,
              examples,
            }),
          },
        ],
        isError: true,
      };
    }

    // Spread all structured fields from engine result
    const { note, ...rest } = result;
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            ...rest,
            operation: args.operation,
            ...(note && { note }),
          }),
        },
      ],
    };
  },
};
```

- [ ] **Step 4: Register the tool in `src/index.ts`**

Add the import at line 6:

```typescript
import { datetimeTool } from './tools/datetime.js';
```

Add the registration after the statistics block (after line 43):

```typescript
server.registerTool(
  datetimeTool.name,
  {
    description: datetimeTool.description,
    inputSchema: datetimeTool.inputSchema,
  },
  async (args) =>
    datetimeTool.handler(
      args as {
        operation: string;
        date?: string;
        from?: string;
        to?: string;
        amount?: number;
        unit?: string;
        year?: number;
        month?: number;
        birthDate?: string;
        asOf?: string;
        holidays?: string[];
      },
    ),
);
```

- [ ] **Step 5: Run datetime tool tests**

Run: `pnpm test -- tests/datetime.test.ts`
Expected: All tests pass.

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: All tests pass (datetime + all existing).

- [ ] **Step 7: Commit**

```bash
git add src/tools/datetime.ts src/index.ts tests/datetime.test.ts
git commit -m "feat: add datetime MCP tool with 9 operations"
```

---

## Task 7: Update skills and plugin metadata

**Files:**

- Create: `skills/math/DATETIME.md`
- Modify: `skills/math/SKILL.md`
- Modify: `hooks/session-start`
- Modify: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create `skills/math/DATETIME.md`**

```markdown
# DateTime Reference — `datetime` tool

## Operations

| Operation       | Required Fields          | Optional Fields | Returns                                             |
| --------------- | ------------------------ | --------------- | --------------------------------------------------- |
| `difference`    | `from`, `to`             | `unit`          | Breakdown or single-unit difference                 |
| `add`           | `date`, `amount`, `unit` |                 | New ISO date                                        |
| `subtract`      | `date`, `amount`, `unit` |                 | New ISO date                                        |
| `business_days` | `from`, `to`             | `holidays`      | Count of weekdays (excluding weekends and holidays) |
| `days_in_month` | `year`, `month`          |                 | Number of days in that month                        |
| `age`           | `birthDate`, `asOf`      |                 | Years, months, days breakdown                       |
| `quarter`       | `date`                   |                 | Quarter number, start and end dates                 |
| `day_of_week`   | `date`                   |                 | Day name and ISO day number (1=Mon through 7=Sun)   |
| `is_leap_year`  | `year`                   |                 | Boolean                                             |

### Examples

**Difference between two dates:**
```

datetime({ operation: "difference", from: "2026-01-01", to: "2026-03-15" })
→ { result: "2m 14d", breakdown: { years: 0, months: 2, days: 14, ... } }

datetime({ operation: "difference", from: "2026-01-01", to: "2026-03-15", unit: "days" })
→ { result: "73 days", difference: 73 }

```

**Add/subtract time:**
```

datetime({ operation: "add", date: "2026-01-01", amount: 90, unit: "days" })
→ { result: "2026-04-01" }

datetime({ operation: "subtract", date: "2026-03-21", amount: 2, unit: "weeks" })
→ { result: "2026-03-07" }

```

**Business days:**
```

datetime({ operation: "business_days", from: "2026-01-01", to: "2026-01-31" })
→ { result: "22", businessDays: 22 }

datetime({ operation: "business_days", from: "2026-01-01", to: "2026-01-31", holidays: ["2026-01-19"] })
→ { result: "21", businessDays: 21 }

```

**Age:**
```

datetime({ operation: "age", birthDate: "1990-06-15", asOf: "2026-03-21" })
→ { result: "35 years, 9 months, 6 days", years: 35, months: 9, days: 6 }

```

**Quarter:**
```

datetime({ operation: "quarter", date: "2026-10-15" })
→ { result: "Q4", quarter: 4, quarterStart: "2026-10-01", quarterEnd: "2026-12-31" }

```

**Day of week:**
```

datetime({ operation: "day_of_week", date: "2026-03-21" })
→ { result: "Saturday", dayOfWeek: "Saturday", dayNumber: 6 }

```

**Days in month / Leap year:**
```

datetime({ operation: "days_in_month", year: 2024, month: 2 })
→ { result: "29", days: 29 }

datetime({ operation: "is_leap_year", year: 2024 })
→ { result: "true", isLeapYear: true }

```

## Date Format

All dates must be in **ISO 8601** format:
- Date only: `YYYY-MM-DD` (e.g., `"2026-03-21"`)
- Date and time: `YYYY-MM-DDTHH:mm:ss` (e.g., `"2026-03-21T14:30:00"`)

Natural formats like `"March 12, 2026"` and `"12 March 2026"` are accepted and
normalized automatically. Ambiguous numeric formats like `"12/03/2026"` are
**rejected** — always use ISO to avoid DD/MM vs MM/DD confusion.

## Units

Valid units for `add`, `subtract`, and `difference`: `days`, `weeks`, `months`,
`years`, `hours`, `minutes`, `seconds`.

## Common Errors

| Error                                | Cause                          | Fix                                |
| ------------------------------------ | ------------------------------ | ---------------------------------- |
| "Invalid date 'xyz'"                 | Unparseable date string        | Use ISO format: YYYY-MM-DD         |
| "Ambiguous date format '12/03/2026'" | Could be DD/MM or MM/DD        | Use ISO format: 2026-03-12         |
| "Month must be between 1 and 12"     | Invalid month number           | Use 1-12                           |
| "Operation 'X' requires fields: ..." | Missing required parameters    | Add the listed fields              |
| "Unknown operation: X"               | Typo in operation name         | Use one of the 9 valid operations  |

## Key Design Notes

- **Determinism:** `age` requires `asOf` (no "today" default). The LLM knows the
  current date from its system prompt and should pass it explicitly.
- **No timezone/DST:** This tool performs pure calendar math. It does not handle
  timezone conversions or daylight saving time transitions.
- **Reversed ranges OK:** `difference` and `business_days` accept `from` after `to`
  and return negative values.
```

- [ ] **Step 2: Update `skills/math/SKILL.md`**

Add `datetime` to the "Which Tool to Use" table. Insert a new row after the `statistics` row:

```
| A date calculation or property        | `datetime`   | "Days between Jan 1 and Mar 15" → `datetime("difference", ...)`  |
```

Add a `datetime` section to the "Tool Quick Reference" at the bottom, before the closing of the file:

```markdown
### datetime

Takes `operation` (enum) and operation-specific fields.
```

datetime({ operation: "difference", from: "2026-01-01", to: "2026-03-15", unit: "days" })
datetime({ operation: "add", date: "2026-01-01", amount: 90, unit: "days" })
datetime({ operation: "age", birthDate: "1990-06-15", asOf: "2026-03-21" })

```

Operations: `difference`, `add`, `subtract`, `business_days`, `days_in_month`,
`age`, `quarter`, `day_of_week`, `is_leap_year`.

For details on each operation and date format, see [DATETIME.md](DATETIME.md).
```

Also update the skill description in the frontmatter (line 4) to mention datetime:

```
  Guidance for using Euclid's deterministic MCP math tools (calculate, convert,
  statistics, datetime). Use when the user's request requires numerical computation,
  unit conversion, statistical analysis, or date/time arithmetic instead of mental math.
```

And update "The Rule" paragraph to mention date arithmetic.

- [ ] **Step 3: Update `hooks/session-start`**

Change the context string on line 27 to include `datetime`:

```bash
context="Euclid deterministic math tools are available via MCP. For ANY numerical computation, unit conversion, statistical calculation, or date/time arithmetic, use the Euclid MCP tools (calculate, convert, statistics, datetime) instead of mental math. Never predict or estimate when a deterministic tool is available."
```

- [ ] **Step 4: Update `.claude-plugin/plugin.json`**

Change the `description` on line 4 to:

```json
"description": "Deterministic math tools for LLMs — MCP server + skills that teach Claude to use calculate, convert, statistics, and datetime tools instead of mental math",
```

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 6: Run lint and format**

Run: `pnpm lint && pnpm format`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add skills/math/DATETIME.md skills/math/SKILL.md hooks/session-start .claude-plugin/plugin.json
git commit -m "feat: add datetime skill documentation and update plugin metadata"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors.

- [ ] **Step 3: Run format check**

Run: `pnpm format:check`
Expected: All files formatted.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: Build succeeds, `dist/index.js` created.

- [ ] **Step 5: Smoke test the MCP server**

Run: `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | pnpm dev 2>/dev/null | head -1`
Expected: JSON response with server capabilities including 4 tools.

- [ ] **Step 6: Verify no stale imports**

Run: `pnpm test` one more time after all changes.
Expected: All pass, no import errors.
