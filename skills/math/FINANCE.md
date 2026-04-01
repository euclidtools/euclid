# Finance Tool Reference

## When to Use `finance`

Use the `finance` tool for any calculation that involves a **financial formula**:
loan payments, amortization schedules, present/future value, NPV, IRR, CAGR,
margin vs markup, compound interest.

Use `calculate` instead for **simple money arithmetic** — `500 * 12`, `price * 1.08`,
`revenue - costs`. If there is no financial formula involved, `calculate` is the right tool.

## Rate Convention

**Rates default to percent.** Pass `6.5` for 6.5%, not `0.065`.

- `{ rate: 6.5 }` → interpreted as 6.5% annually
- `{ rate: 0.065, rate_type: "decimal" }` → same value in decimal form

**Periods** = total payment periods, not years. A 30-year monthly mortgage = `periods: 360`.

## Operations

| Operation           | Use when you need...                           | Key params                                 |
| ------------------- | ---------------------------------------------- | ------------------------------------------ |
| `loan_payment`      | Monthly/periodic payment amount                | `principal`, `rate`, `periods`             |
| `amortization`      | Payment schedule with principal/interest split | `principal`, `rate`, `periods`, `limit?`   |
| `present_value`     | Today's value of a future amount               | `future_value`, `rate`, `periods`          |
| `future_value`      | Future value of a present amount               | `present_value`, `rate`, `periods`         |
| `periods`           | How many periods to reach a target value       | `present_value`, `future_value`, `rate`    |
| `interest_rate`     | Solve for the rate given PV, FV, periods       | `present_value`, `future_value`, `periods` |
| `npv`               | Net present value of cash flows                | `rate`, `cashflows`                        |
| `irr`               | Internal rate of return                        | `cashflows`                                |
| `roi`               | Return on investment                           | `cost`, `gain`                             |
| `markup`            | Selling price from cost + markup%              | `cost`, `markup_percent`                   |
| `margin`            | Margin from cost and price                     | `cost`, `price`                            |
| `discount`          | Price after discount%                          | `price`, `discount_percent`                |
| `percentage_change` | % change between two values                    | `old_value`, `new_value`                   |
| `compound_growth`   | CAGR                                           | `start_value`, `end_value`, `periods`      |
| `simple_interest`   | Simple interest (I = Prt)                      | `principal`, `rate`, `time`                |
| `compound_interest` | Compound interest                              | `principal`, `rate`, `time`                |

## Common Mistakes

- **Margin vs markup confusion:** Margin = (price - cost) / price. Markup = (price - cost) / cost. A 40% markup on $100 = $140. A 40% margin means cost is $60 on a $100 price. They are NOT the same.
- **Forgetting compounding frequency:** Default is `monthly`. For annual bonds, pass `compounding: "annually"`.
- **Sending annual rate when monthly is expected:** The `rate` is always annual. The tool handles the per-period conversion based on `compounding`.
- **Continuous compounding with payments:** `loan_payment` and `amortization` reject `compounding: "continuously"`. Use `monthly` or another discrete frequency.
