# Euclid MCP v1 — Design

## Summary

Euclid is a lightweight MCP server that exposes deterministic math tools to LLMs. It gives any MCP-compatible client access to a real calculator (powered by mathjs) instead of relying on token prediction for math.

npm package: `euclid-mcp`. Brand: Euclid. License: MIT.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tool architecture | Separate tools (`calculate`, `convert`, `statistics`) | Clearer affordances for the LLM, focused schemas per tool |
| Percentage syntax | No preprocessing | The model translates natural language to valid expressions; tool stays deterministic |
| Error format | Middle ground — mathjs message + original expression, no stack trace | Enough for the model to retry; no noise |
| Expression limit | 1000 characters | Generous for any legitimate expression |
| Computation timeout | 5 seconds, hardcoded | Legitimate expressions evaluate in ms; no need for configurability |
| Output format | Simple — `{ result, expression }` | Model infers type from the result string |
| Statistics in v1 | Yes | Straightforward to implement, rounds out the tool set |
| Timeout mechanism | `vm.runInNewContext` with timeout | Handles synchronous mathjs timeout natively, lighter than worker threads |

## Architecture

```
euclid-mcp/
├── src/
│   ├── index.ts           # MCP server setup, stdio transport, tool registration
│   ├── engine.ts          # Sandboxed mathjs instance, validation, timeout, error formatting
│   └── tools/
│       ├── calculate.ts   # calculate tool: schema + handler
│       ├── convert.ts     # convert tool: schema + handler
│       └── statistics.ts  # statistics tool: schema + handler
├── tests/
│   ├── calculate.test.ts
│   ├── convert.test.ts
│   ├── statistics.test.ts
│   └── edge-cases.test.ts
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
└── .github/
    └── workflows/
        └── ci.yml
```

- `index.ts` creates an MCP `Server`, registers the three tools, connects via stdio transport
- Each tool file exports a name, description, zod input schema, and handler function
- Handlers call into `engine.ts` which owns the sandboxed mathjs instance
- `engine.ts` handles input validation, computation timeout, sandboxing, and error formatting

## Tool Definitions

### `calculate`

Input:
- `expression: string` — mathematical expression to evaluate
- `precision?: number` — decimal places (default 10)

Output (success): `{ result: "95550.7142857143", expression: "(245 * 389) + (12^3 / 7)" }`
Output (error): `{ error: "SyntaxError: Unexpected operator + (char 3)", expression: "2 ++ 3" }`

Tool description teaches the model when to use it (arithmetic, exponents, trig, logs, factorials, constants, complex numbers) and when not to (estimates, conceptual explanations, symbolic algebra).

### `convert`

Input:
- `value: number` — the numeric value to convert
- `from: string` — source unit
- `to: string` — target unit

Output (success): `{ result: "3.10686", from: "km", to: "miles", value: 5 }`

### `statistics`

Input:
- `operation: enum` — one of: mean, median, mode, std, variance, min, max, sum, percentile
- `data: number[]` — array of numbers (max 10,000 elements)
- `percentile?: number` — required when operation is "percentile"

Output (success): `{ result: "36.2", operation: "mean" }`

All tools return `isError: true` in the MCP response on failure.

## Engine & Security

Sandboxed mathjs instance with disabled functions:
- `import`, `createUnit`, `evaluate`, `parse`, `simplify` — all throw errors

Input validation:
- Expression length: max 1000 characters
- Statistics data array: max 10,000 elements

Computation timeout:
- 5 seconds via `vm.runInNewContext` with `timeout` option
- On timeout: `"Computation timed out after 5 seconds"`

Error formatting:
- Catches mathjs errors, extracts message (no stack trace)
- Returns `{ error: "<type>: <message>", expression: "<original input>" }`

## Testing

Unit tests with vitest:
- `calculate.test.ts` — arithmetic, exponents, trig, logs, factorials, constants, complex numbers, precision
- `convert.test.ts` — length, weight, temperature, volume, data units, invalid pairs
- `statistics.test.ts` — all 9 operations, edge cases (single element, empty array, percentile validation)
- `edge-cases.test.ts` — division by zero, overflow, NaN, Infinity, length limit, timeout, disabled functions, malicious input

No LLM benchmarks in v1.

## Distribution & Dev Tooling

- `pnpm` package manager
- `tsx` for dev execution, `tsup` for bundling
- `vitest` for tests, `eslint` + `prettier` for code quality
- `changesets` for versioning
- `bin` field in `package.json` for `npx euclid-mcp`
- CI: lint, test, build on PR to main (Node 20)
