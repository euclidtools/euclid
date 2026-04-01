---
name: math
description: >
  Guidance for using Euclid's deterministic MCP math tools (calculate, convert,
  statistics, datetime, encode, finance). Use when the user's request requires numerical computation,
  unit conversion, statistical analysis, date/time arithmetic, encoding/hashing, or financial
  calculations instead of mental math.
---

# Euclid Math Tools

## The Rule

If a user's request requires a numerical result, unit conversion, statistical
computation, or date/time arithmetic, use the Euclid MCP tools. **Never predict,
estimate, or mentally compute when a deterministic tool is available.**

This applies to all math: arithmetic, percentages, exponents, roots, trigonometry,
logarithms, factorials, combinatorics, unit conversions, dataset statistics, and
date calculations such as differences, offsets, ages, and calendar properties.

Even for "simple" math like `247 * 38`, use the `calculate` tool. Mental math
is a prediction — the tool is deterministic.

## Which Tool to Use

| The user needs...                                               | Use          | Example                                                                                                                    |
| --------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| A numerical result from a math expression                       | `calculate`  | "What is 15% of 847?" → `0.15 * 847`                                                                                       |
| To convert between units of measurement                         | `convert`    | "Convert 5 km to miles" → `convert(5, "km", "mile")`                                                                       |
| A statistic computed on a dataset                               | `statistics` | "Average of these scores" → `statistics("mean", [...])`                                                                    |
| A date calculation or property                                  | `datetime`   | "Days between Jan 1 and Mar 15" → `datetime("difference", ...)`                                                            |
| To encode, decode, hash, or inspect a JWT                       | `encode`     | "Base64-encode this" → `encode("base64_encode", ...)`                                                                      |
| A financial calculation (loan, NPV, IRR, CAGR, margin)          | `finance`    | "Monthly payment on a $350k mortgage at 6.5%?" → `finance("loan_payment", { principal: 350000, rate: 6.5, periods: 360 })` |
| To test, match, extract, replace, or split with regex           | `regex`      | "Does this match the pattern?" → `regex("test", ...)`                                                                      |
| Color conversion, accessibility check, palette, or manipulation | `color`      | "Convert #FF6B35 to HSL" → `color("convert", { color: "#FF6B35", from_space: "hex", to_space: "hsl" })`                    |
| A conceptual explanation                                        | None         | "Explain what a derivative is"                                                                                             |
| A rough estimate or guess                                       | None         | "About how many people fit in a stadium"                                                                                   |
| Symbolic algebra (no numeric answer)                            | None         | "Simplify x^2 + 2x"                                                                                                        |

## Key Behaviors

**Always use the tool, never fall back to mental math.** If a calculation errors,
read the `hint` and `examples` fields in the error response. Fix the input and
retry. Do not fall back to predicting the answer.

**Chain tools when needed.** Calculate a value, then convert its units. Compute
individual values, then run statistics on them. Each tool does one thing well.

**Present full precision.** Do not round or truncate Euclid results unless the
user explicitly asks for rounding. The tool returns precise results — preserve them.

**Unicode and natural language work.** Expressions with `×`, `÷`, `√`, `π`, `²`,
`³` are normalized automatically. Unit names like `"celsius"`, `"fahrenheit"`,
`"miles per hour"` are also normalized. No need to manually convert these.

**Use `calculate` broadly.** Percentages, compound interest, combinatorics,
trigonometry, logarithms, factorials — anything with a single correct numerical
answer belongs in `calculate`.

## Tool Quick Reference

### calculate

Takes `expression` (string) and optional `precision` (number, default 14).

```
calculate({ expression: "0.15 * 847" })
calculate({ expression: "sin(30 deg)", precision: 6 })
calculate({ expression: "12! / (4! * 8!)" })
```

For expression syntax, available functions, and edge cases, see
[EXPRESSIONS.md](EXPRESSIONS.md).

### convert

Takes `value` (number), `from` (string), `to` (string).

```
convert({ value: 100, from: "fahrenheit", to: "celsius" })
convert({ value: 60, from: "mph", to: "kph" })
convert({ value: 1024, from: "bytes", to: "kB" })
```

For supported units, aliases, and categories, see [UNITS.md](UNITS.md).

### statistics

Takes `operation` (enum) and operation-specific fields. Supports both descriptive and inferential statistics.

**Descriptive** — takes `data` (number[]), optional `percentile` (0-100):

```
statistics({ operation: "mean", data: [85, 92, 78, 95, 88] })
statistics({ operation: "percentile", data: [120, 340, 200, 150, 180], percentile: 90 })
```

Operations: `mean`, `median`, `mode`, `std`, `variance`, `min`, `max`, `sum`,
`percentile`.

**Inferential** — hypothesis testing, confidence intervals, correlation, distributions:

| Operation             | When to use                                                              | Example                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `z_test_proportion`   | A/B test significance — "is the conversion rate difference significant?" | `statistics({ operation: "z_test_proportion", successes_a: 89, trials_a: 2340, successes_b: 120, trials_b: 2280 })`                                                                      |
| `t_test`              | Comparing group means — "are these two groups different?"                | Two-sample: `statistics({ operation: "t_test", data: [12, 14, 16], data_b: [11, 13, 15] })` / One-sample: `statistics({ operation: "t_test", data: [12, 14, 16], population_mean: 10 })` |
| `chi_squared_test`    | Testing independence in categorical data                                 | `statistics({ operation: "chi_squared_test", observed: [[89, 2251], [112, 2168]] })`                                                                                                     |
| `confidence_interval` | Estimating uncertainty around a value                                    | For mean: `statistics({ operation: "confidence_interval", data: [12, 14, 16] })` / For proportion: `statistics({ operation: "confidence_interval", successes: 89, trials: 2340 })`       |
| `correlation`         | Measuring linear relationship between two variables                      | `statistics({ operation: "correlation", data: [1, 2, 3], data_b: [2, 4, 5] })`                                                                                                           |
| `normal_cdf`          | Probability from a normal distribution                                   | `statistics({ operation: "normal_cdf", x: 1.96 })` → P ≈ 0.975                                                                                                                           |
| `normal_inverse`      | Finding a threshold value at a given percentile                          | `statistics({ operation: "normal_inverse", p: 0.95 })` → x ≈ 1.645                                                                                                                       |

All inferential operations return a `significant` boolean (at 95% confidence by default). Override with `confidence_level` (0-1). Distribution functions (`normal_cdf`, `normal_inverse`) default to standard normal (mean=0, sigma=1).

For details on each operation and data format, see [STATISTICS.md](STATISTICS.md).

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

### encode

Takes `operation` (enum), `input` (string), and operation-specific optional fields.

```
encode({ operation: "base64_encode", input: "hello world" })
encode({ operation: "sha256", input: "hello world" })
encode({ operation: "hmac", input: "data", key: "secret", algorithm: "sha256" })
```

Operations: `base64_encode`, `base64_decode`, `base64url_encode`, `base64url_decode`,
`hex_encode`, `hex_decode`, `url_encode`, `url_decode`, `html_encode`, `html_decode`,
`sha256`, `sha512`, `sha1`, `md5`, `hmac`, `jwt_decode`.

For details on each operation, input/output encodings, and edge cases, see [ENCODE.md](ENCODE.md).

### finance

Takes `operation` (enum) and operation-specific fields.

```
finance({ operation: "loan_payment", principal: 350000, rate: 6.5, periods: 360 })
finance({ operation: "npv", rate: 10, cashflows: [-100000, 30000, 40000, 50000] })
finance({ operation: "margin", cost: 60, price: 100 })
```

Operations: `loan_payment`, `amortization`, `present_value`, `future_value`, `periods`,
`interest_rate`, `npv`, `irr`, `roi`, `markup`, `margin`, `discount`, `percentage_change`,
`compound_growth`, `simple_interest`, `compound_interest`.

For detailed `finance` tool documentation, see [FINANCE.md](FINANCE.md).

### color

Takes `operation` (enum), `color` (CSS string or object), and operation-specific fields.

```
color({ operation: "convert", color: "#FF6B35", from_space: "hex", to_space: "hsl" })
color({ operation: "contrast_ratio", foreground: "#FFFFFF", background: "#2563EB" })
color({ operation: "lighten", color: "#2563EB", amount: 10 })
color({ operation: "complement", color: "#FF0000" })
```

Operations: `convert`, `parse`, `contrast_ratio`, `wcag_level`, `relative_luminance`,
`lighten`, `darken`, `saturate`, `desaturate`, `mix`, `complement`, `analogous`,
`triadic`, `tetradic`.

For detailed `color` tool documentation, see [COLOR.md](COLOR.md).
