# Euclid

> _"What is asserted without proof can be dismissed without proof — but what is proved, endures."_
> — In the spirit of Euclid of Alexandria

Twenty-three centuries ago, Euclid of Alexandria looked at the mathematics of his time — a tangle of folklore, intuition, and "trust me" — and said: _no more_. He built geometry from the ground up on axioms and proofs. If something was true, you could _show_ it was true. No hand-waving. No guessing.

Large language models have the same problem Euclid's contemporaries did. They don't calculate — they _predict_. When you ask an LLM "what's 247 x 389?", it pattern-matches against its training data and guesses what the answer probably looks like. Sometimes right, sometimes wrong. You'd never know the difference.

**Deterministic computation tools for AI agents.**

Euclid is a hosted [MCP server](https://modelcontextprotocol.io) that gives any AI agent access to real, deterministic computation engines. What is self-evident should not be guessed — and arithmetic is about as self-evident as it gets.

---

## Quick Start

### Claude Code (Recommended)

```bash
claude plugin install euclidtools/euclid
```

One command. This installs the skill (teaches Claude when to use Euclid) and auto-registers the MCP server.

### Manual MCP Registration (Claude Code)

```bash
claude mcp add euclid --transport http https://mcp.euclidtools.com
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "euclid": {
      "url": "https://mcp.euclidtools.com"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "euclid": {
      "url": "https://mcp.euclidtools.com"
    }
  }
}
```

### Windsurf

Add to `~/.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "euclid": {
      "url": "https://mcp.euclidtools.com"
    }
  }
}
```

### VS Code (Copilot)

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "euclid": {
      "type": "http",
      "url": "https://mcp.euclidtools.com"
    }
  }
}
```

### Other MCP Clients

Any MCP client that supports HTTP transport will work. Point it at:

```
https://mcp.euclidtools.com
```

Authentication is handled automatically via OAuth 2.1. Your client will prompt you to sign in on first connection.

---

## Verify It Works

After connecting, ask your AI agent:

> "What is 247 times 389?"

If Euclid is working, the agent will call the `calculate` tool instead of predicting the answer. You'll see the tool call in the response. The correct answer is **96,083** — and unlike mental math, it's guaranteed.

---

## Enforce Deterministic Computation

Installing Euclid gives your AI access to a calculator. But access alone isn't enough — the AI needs to be **instructed** to reach for it. Without an explicit directive, models will still predict math from training data by default.

Add the following to your project's AI instruction file. Pre-built versions are in the [`rules/`](rules/) directory:

| File | For |
|------|-----|
| [`rules/CLAUDE.md`](rules/CLAUDE.md) | Claude Code |
| [`rules/AGENTS.md`](rules/AGENTS.md) | OpenAI Codex |
| [`rules/.cursorrules`](rules/.cursorrules) | Cursor |
| [`rules/.windsurfrules`](rules/.windsurfrules) | Windsurf |

The content is identical — copy the one that matches your IDE into your project root (or append it to your existing instruction file).

<details>
<summary>Preview the instruction block</summary>

```markdown
## Deterministic Computation (Euclid)

**NEVER predict, guess, or mentally compute numerical results.** LLMs produce answers by
pattern-matching against training data — sometimes right, sometimes subtly wrong, and
there is no way to tell which. Always use Euclid's MCP tools instead.

| Tool         | When to Use                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `calculate`  | Arithmetic, percentages, margins, exponents, trig, logarithms, factorials — any expression with a numerical answer                    |
| `convert`    | Unit conversions: m² to acres, km to miles, L/hr to gal/hr, °C to °F, bytes to kB, etc.                                               |
| `statistics` | Mean, median, mode, std deviation, variance, percentile, min, max, sum — plus t-test, z-test, chi-squared, confidence intervals, correlation |
| `datetime`   | Date differences, add/subtract time, business days, age, day of week, quarter, leap year — any calendar arithmetic                    |
| `encode`     | Base64, hex, URL, HTML encoding/decoding; SHA-256/512, SHA-1, MD5 hashing; HMAC signatures; JWT decoding                               |
| `finance`    | Loan payments, amortization, present/future value, NPV, IRR, CAGR, margin/markup, compound interest — any financial formula            |
| `regex`      | Pattern testing, text extraction, match-all, replace, split — execute patterns, never predict whether they match                       |
| `color`      | Color conversion (hex, RGB, HSL, etc.), contrast ratios, WCAG accessibility, lighten/darken, palette generation                        |
| `validate`   | Email, URL, UUID, credit card (Luhn check), IPv4, IPv6, IBAN — structural validation with check digits                                 |
| `geo`        | Distances (Haversine/Vincenty), bearings, midpoints, destination points, polygon area, point-in-polygon, coordinate conversions        |

This applies everywhere — not just code. Analytics, business metrics, growth rates,
marketing numbers, cost calculations, date arithmetic, financial projections during
conversation. If there is a number to compute, a date to calculate, or data to
encode, hash, or validate, use Euclid. No exceptions.
```

</details>

**Why this matters:** LLMs will confidently produce incorrect arithmetic with no indication anything is wrong. A model that returns `247 × 389 = 96,183` looks just as confident as one that returns the correct `96,083`. The only way to guarantee correctness is to compute, not predict.

---

## Tools

Euclid exposes 10 purpose-built tools across computation, encoding, validation, and spatial domains.

### `calculate`

Evaluates mathematical expressions deterministically via [mathjs](https://mathjs.org).

```
calculate("(245 * 389) + (12^3 / 7)")  → 95,551.857...
calculate("sqrt(144)")                  → 12
calculate("sin(45 deg)")                → 0.707...
calculate("10!")                         → 3,628,800
calculate("e^(i * pi) + 1")            → 0  (Euler's identity)
```

Supports: arithmetic, order of operations, exponents, roots, trigonometry, logarithms, factorials, constants (pi, e, phi), complex numbers, Unicode math symbols (×, ÷, √, π, ², ³).

### `convert`

Converts between units deterministically.

```
convert(100, "fahrenheit", "celsius")   → 37.778
convert(5, "km", "miles")              → 3.107
convert(1024, "bytes", "kB")           → 1.024
convert(60, "mph", "km/h")             → 96.561
```

Supports: length, mass, volume, temperature, area, speed, time, data, and [100+ units](https://mathjs.org/docs/datatypes/units.html). Natural language aliases (e.g. "celsius", "miles per hour") are normalized automatically.

### `statistics`

Statistical calculations — both descriptive and inferential.

```
statistics("mean", [23, 45, 12, 67, 34])          → 36.2
statistics("std", [23, 45, 12, 67, 34])            → 21.159
statistics("z_test_proportion", { ... })            → { significant: true, p_value: 0.023 }
statistics("confidence_interval", { data: [...] })  → { lower: 28.1, upper: 44.3 }
```

Descriptive: mean, median, mode, std, variance, min, max, sum, percentile.
Inferential: z-test, t-test, chi-squared, confidence intervals, correlation, normal CDF/inverse.

### `datetime`

Deterministic date and time arithmetic.

```
datetime("difference", { from: "2026-01-01", to: "2026-03-15", unit: "days" })  → 73
datetime("add", { date: "2026-01-01", amount: 90, unit: "days" })               → "2026-04-01"
datetime("age", { birthDate: "1990-06-15", asOf: "2026-03-21" })                → 35
datetime("business_days", { from: "2026-01-01", to: "2026-01-31" })             → 22
```

9 operations: difference, add, subtract, business_days, days_in_month, age, quarter, day_of_week, is_leap_year.

### `encode`

Deterministic encoding, decoding, hashing, and JWT inspection.

```
encode("base64_encode", { input: "hello world" })               → "aGVsbG8gd29ybGQ="
encode("sha256", { input: "hello world" })                      → "b94d27b9..."
encode("hmac", { input: "data", key: "secret", algorithm: "sha256" }) → "1b779..."
encode("jwt_decode", { input: "eyJhbGci..." })                  → { header, payload, signature }
```

16 operations: base64, base64url, hex, url, html (encode/decode), sha256, sha512, sha1, md5, hmac, jwt_decode.

### `finance`

Financial calculations using arbitrary-precision decimal arithmetic via [decimal.js](https://github.com/MikeMcl/decimal.js).

```
finance("loan_payment", { principal: 350000, rate: 6.5, periods: 360 })   → $2,212.24/mo
finance("irr", { cashflows: [-100000, 30000, 35000, 40000, 45000] })      → 17.094%
finance("compound_growth", { start_value: 2.1M, end_value: 4.8M, periods: 4 }) → 22.958% CAGR
```

16 operations: loan_payment, amortization, present_value, future_value, periods, interest_rate, npv, irr, roi, markup, margin, discount, percentage_change, compound_growth, simple_interest, compound_interest.

### `color`

Color conversion, accessibility checks, and palette generation via [culori](https://culorijs.org).

```
color("convert", { color: "#FF6B35", to_space: "hsl" })
color("contrast_ratio", { foreground: "#FFFFFF", background: "#2563EB" })  → "4.62:1"
color("wcag_level", { foreground: "#FFFFFF", background: "#2563EB" })      → "AA"
color("analogous", { color: "#2563EB", count: 5 })
```

14 operations across conversion, accessibility (WCAG), manipulation, and palette generation. 8 color spaces: hex, rgb, hsl, hsv, cmyk, lab, oklab, oklch.

### `regex`

Safe regex execution via [RE2](https://github.com/nicolo-ribaudo/re2-wasm) (guaranteed linear-time, no ReDoS).

```
regex("test", { pattern: "^\\d{3}-\\d{4}$", subject: "555-1234" })     → true
regex("matchAll", { pattern: "\\d+", subject: "abc 123 def 456" })     → ["123", "456"]
regex("replace", { pattern: "\\s+", subject: "a  b  c", replacement: " " }) → "a b c"
```

6 operations: test, match, matchAll, replace, split, escape.

### `validate`

Structural validation with check digits.

```
validate("email", { input: "user@example.com" })        → { valid: true }
validate("credit_card", { input: "4111111111111111" })   → { valid: true, type: "Visa" }
validate("iban", { input: "GB82WEST12345698765432" })    → { valid: true }
```

Formats: email, url, uuid, credit_card (Luhn), ipv4, ipv6, iban.

### `geo`

Geospatial calculations via [turf.js](https://turfjs.org) and [geodesy](https://github.com/chrisveness/geodesy).

```
geo("distance", { from: [lat, lon], to: [lat, lon] })        → km (Haversine or Vincenty)
geo("bearing", { from: [lat, lon], to: [lat, lon] })         → degrees
geo("point_in_polygon", { point: [lat, lon], polygon: [...] }) → true/false
```

Distance, area, midpoint, bearing, destination point, point-in-polygon, coordinate conversions.

---

## The Problem

LLMs are non-deterministic. Every token they produce is a _prediction_ — including math:

- `247 × 389` → the model _predicts_ `96,083` (sometimes it gets `96,183` or `95,983`)
- `sin(47.3°) × cos(12.1°)` → the model _predicts_ something close-ish
- `15% of $8,472.50` → the model _predicts_ a dollar amount

Sometimes the predictions are correct. Sometimes they're subtly wrong. The problem is you can never be sure which is which.

**Euclid makes this a non-issue.** When an AI agent has Euclid available, it sends expressions to a real computation engine and returns the computed result. Deterministic. Correct. Every time.

Think of it like what `grep` did for AI code search — a simple, proven tool that gives the model a capability it fundamentally lacks.

---

## Why Not Just Use Code Execution?

Many LLM environments have code execution tools (Python sandboxes, etc.) that can do math. The difference:

|                     | Code Execution                     | Euclid                                     |
| ------------------- | ---------------------------------- | ------------------------------------------ |
| **Overhead**        | Spins up a sandbox/interpreter     | Near-zero — evaluates an expression string |
| **Latency**         | Hundreds of ms to seconds          | Single-digit ms                            |
| **Availability**    | Varies by client                   | Any MCP client                             |
| **Model behaviour** | Model writes _code_ that does math | Model writes a _math expression_           |
| **Failure modes**   | Syntax errors, runtime exceptions  | Clear error with hint and examples         |
| **Token cost**      | Code generation is verbose         | Expression strings are minimal             |

---

## Pricing

Every account starts with **1,000 free tool calls** — no credit card required.

After that, top up credits at [app.euclidtools.com](https://app.euclidtools.com).

---

## Philosophy

LLMs are incredibly powerful, but they have a fundamental limitation: everything they produce is a prediction. For creative writing, reasoning, and conversation, that's a feature. For math, it's a bug.

The solution isn't to make models better at predicting math. It's to give them a calculator.

This is part of a broader principle: **wherever a model does something predictive that should be deterministic, give it a deterministic tool.** Math is the most obvious case, but the same logic applies to unit conversions, date arithmetic, regex evaluation, encoding, and more.

---

## License

The Euclid MCP server is proprietary software. This repository contains connection instructions, skills, and documentation — all provided for integration purposes.

All rights reserved. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <i>Euclid of Alexandria formalised mathematical proof 2,300 years ago.<br>
  We're just giving his tools to the machines.</i>
</p>
