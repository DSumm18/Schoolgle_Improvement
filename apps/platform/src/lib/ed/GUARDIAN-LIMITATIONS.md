# SchoolDataGuardian — Known Limitations

**Last tested:** 13 April 2026
**Test suite:** `apps/platform/src/lib/ed/__tests__/school-data-guardian.test.ts`
**Overall score:** 37/64 PII values caught (58% detection rate)

## What the Guardian CAN Reliably Catch

| Category | Detection Rate | Method |
|----------|---------------|--------|
| UPNs (Unique Pupil Numbers) | 100% | Regex: single letter + 12 digits |
| UK phone numbers | 100% | Regex: +44/0 prefix + 9-10 digits |
| Email addresses | 100% | Regex: standard email pattern |
| UK postcodes | 100% | Regex: standard UK postcode pattern |
| NI numbers | 100% | Regex: 2 letters + 6 digits + 1 letter |
| NHS numbers | 100% | Regex: 3-3-4 digit grouping |
| Dates of birth (d/m/y format) | 83% | Regex: d/m/y with 19xx/20xx year |
| Names with role prefix | 100% | Regex: Mr/Mrs/Ms/Miss/Dr/Headteacher/etc + capitalised name |

## What the Guardian CANNOT Reliably Catch

| Category | Detection Rate | Why |
|----------|---------------|-----|
| Bare first names | 0% | No NER — "Tommy" without "Mr" is just a word to regex |
| Bare surnames | 0% | Same — "Smith" without a role prefix isn't flagged |
| Abbreviated names | 0% | "T.Smith" or "Tommy S" doesn't match any pattern |
| ISO 8601 dates | 0% | Guardian only matches d/m/y, not YYYY-MM-DD |
| Obfuscated PII | 0% | "claire dot smith at gmail dot com" bypasses email regex |
| Medical/SEN diagnoses | 0% | "Diagnosed ADHD" has no structured PII pattern |
| Safeguarding status | 0% | "Child Protection Plan" has no structured PII |
| Social worker first names | 0% | "Janet from Children's Services" — no role prefix |
| Contextual identification | 0% | "the lad in Year 4 who moved from Bradford" — no pattern |

## Risk Assessment

**High-confidence categories (safe to rely on):**
- Structured identifiers: UPNs, NI numbers, NHS numbers, emails, phone numbers, postcodes
- These have fixed, unambiguous patterns. False negatives are extremely unlikely.

**Moderate-confidence categories:**
- Names with role prefixes (Mr/Mrs/Dr etc.) — caught reliably, but only when the prefix is present
- Dates in d/m/y format — caught, but ISO format and natural language dates are missed

**Low-confidence categories (known gaps):**
- Bare names (first name only, surname only) — the most common way staff refer to pupils in chat
- This is the single biggest gap. A headteacher typing "Tommy is struggling" will have "Tommy" stored in the chat cache.

## Impact on Ed Conversation Memory

The chat cache stores PII-scrubbed messages. Given the gaps above:

- **What WILL be scrubbed:** "Contact Mrs Johnson at sarah@school.org about Tommy's UPN A801234567890" → all PII caught
- **What WON'T be scrubbed:** "Tommy is struggling with maths" → "Tommy" survives as a bare first name

**Mitigation:** The chat cache has a 7-day default retention with auto-deletion. Even if a bare name leaks into the cache, it's automatically purged within the retention window. Schools can also set retention to 0 (no cache) or exclude specific domains.

## Planned Improvement Path

1. **Short term:** Add a school-specific name dictionary. Schools upload their staff/pupil name lists, Guardian checks against them. High accuracy, zero false positives.
2. **Medium term:** Integrate a lightweight NER model (e.g., spaCy's en_core_web_sm or a fine-tuned transformer) to detect names without prefixes.
3. **Long term:** Use Claude/LLM-based PII detection as a second pass for high-sensitivity domains (safeguarding, HR). Higher accuracy but higher cost and latency.

## How to Run the Test Suite

```bash
npx vitest run apps/platform/src/lib/ed/__tests__/school-data-guardian.test.ts
```

The scorecard prints to console after all tests complete.
