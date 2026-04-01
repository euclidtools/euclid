---
name: regex
description: >
  Guidance for using Euclid's deterministic regex tool. Use when the user's request
  involves pattern matching, text extraction, validation, replacement, or splitting
  using regular expressions — instead of predicting regex behavior.
---

# Euclid Regex Tool

## The Rule

If a user's request involves testing, matching, extracting, replacing, or splitting
text using a regular expression, use the Euclid `regex` tool. **Never predict whether
a pattern matches — execute the match and read the result.**

LLMs are unreliable at predicting regex behavior. They will confidently assert that a
pattern matches when it does not, or claim a match fails when it succeeds. This is
especially dangerous with edge cases around greediness, anchoring, Unicode, and
capture groups.

## When to Use

| The user needs...                               | Use            | Example                                                                     |
| ----------------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| To check if a string matches a pattern          | `test`         | "Does this look like an email?" → `regex("test", ...)`                      |
| To extract the first match with groups          | `match`        | "Extract the date from this string" → `regex("match", ...)`                 |
| To extract all matches from text                | `matchAll`     | "Find all IP addresses in this log" → `regex("matchAll", ...)`              |
| To replace matches in a string                  | `replace`      | "Normalize these date formats" → `regex("replace", ...)`                    |
| To split a string by a pattern                  | `split`        | "Parse this CSV with mixed delimiters" → `regex("split", ...)`              |
| To escape a literal string for use in a pattern | `escape`       | "Match this exact user input" → `regex("escape", ...)`                      |
| To verify AI-generated regex works correctly    | `test`/`match` | Always verify generated patterns against sample data before presenting them |

## RE2 Limitations

This tool uses RE2 for guaranteed linear-time execution. The following are **not supported**:

- Lookahead: `(?=...)`, `(?!...)`
- Lookbehind: `(?<=...)`, `(?<!...)`
- Backreferences: `\1`, `\2`, etc.

**Workarounds:**

- Instead of `(?<=\$)\d+` (lookbehind), use `\$(\d+)` and read capture group 1
- Instead of `\b(\w+)\s+\1\b` (backreference), match words with `\b(\w+)\b` and check for duplicates programmatically

## Key Behaviors

**Always execute, never predict.** If a regex operation errors, read the `hint` and
`examples` in the error response. Fix the input and retry. Do not fall back to
predicting the answer.

**Supported flags:** `g` (global), `i` (case-insensitive), `m` (multiline), `s` (dotAll).
The `u` flag is accepted but is a no-op — RE2 is always Unicode-aware.

**Named groups:** Both `(?<name>...)` (JS) and `(?P<name>...)` (Python/RE2) syntaxes work.

**Replacement templates:** Use `$1`, `$2` for positional groups, `$<name>` for named groups,
`$&` for the full match.

**Use escape for user input.** When building a pattern that includes user-provided text,
use the `escape` operation to prevent pattern injection.

## Quick Reference

```
regex({ operation: "test", pattern: "^\\d{3}-\\d{4}$", subject: "555-1234" })
regex({ operation: "match", pattern: "(?<user>\\w+)@(?<domain>[\\w.]+)", subject: "user@example.com" })
regex({ operation: "matchAll", pattern: "\\d+", subject: "abc 123 def 456" })
regex({ operation: "replace", pattern: "\\s+", flags: "g", subject: "a  b  c", replacement: " " })
regex({ operation: "split", pattern: "[,;]+\\s*", subject: "a, b; c" })
regex({ operation: "escape", subject: "price is $10.00" })
```
