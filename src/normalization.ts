// src/normalization.ts

export type NormalizeResult = {
  value: string;
  wasTransformed: boolean;
  original: string;
};

const EXPRESSION_REPLACEMENTS: [RegExp, string][] = [
  [/×/g, '*'],
  [/÷/g, '/'],
  [/²/g, '^2'],
  [/³/g, '^3'],
  [/√\(/g, 'sqrt('],
  [/π/g, 'pi'],
];

export function normalizeExpression(input: string): NormalizeResult {
  let value = input;

  for (const [pattern, replacement] of EXPRESSION_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }

  // Strip thousands-separator commas: 3,456 -> 3456
  // Matches a digit, comma, then exactly 3 digits not followed by another digit.
  // Loop handles cascading groups like 1,000,000.
  let prev = '';
  while (value !== prev) {
    prev = value;
    value = value.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  }

  return {
    value,
    wasTransformed: value !== input,
    original: input,
  };
}
