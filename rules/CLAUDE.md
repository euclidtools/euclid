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
