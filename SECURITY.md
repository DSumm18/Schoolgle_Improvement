# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please email admin@schoolgle.co.uk

## API Keys & Secrets

**NEVER commit API keys, tokens, or secrets to this repository.**

### Correct way to handle secrets:

1. Store in environment variables
2. Use `.env.local` (gitignored)
3. Reference via `process.env.VARIABLE_NAME`

### Example:

```typescript
// ❌ BAD - Never do this
const apiKey = "sk-abc123...";

// ✅ GOOD - Use environment variables
const apiKey = process.env.NEXT_PUBLIC_API_KEY;
```

## Pre-commit Checklist

Before committing, verify:
- [ ] No API keys in code
- [ ] No tokens or passwords
- [ ] No private URLs or endpoints
- [ ] Secrets are in .env.local only
