# Security Audit & Implementation Report

**Agent 6: Security & Validation Specialist**
**Date:** 2025-11-28
**Status:** Completed

## Executive Summary

This document outlines the security enhancements implemented for the Schoolgle Improvement application, including input validation, rate limiting, and identified security concerns.

---

## Implementation Summary

### Dependencies Added
- **zod** (v3.x) - Runtime type validation and schema parsing

### Files Created
1. `src/lib/validations.ts` - Centralized validation schemas (18 schemas)
2. `src/lib/rateLimit.ts` - Rate limiting middleware with 6 predefined limiters

### API Routes Secured (10 routes)

| Route | Validation | Rate Limiting | Notes |
|-------|-----------|---------------|-------|
| `/api/scan` | Zod schema | Scan limiter (3/5min) | Most expensive operation |
| `/api/evidence` | Zod schema | Standard limiter (100/min) | User data access |
| `/api/search` | Zod schema | Search limiter (30/min) | Embedding generation |
| `/api/organization/create` | Zod schema | Standard limiter (100/min) | Organization management |
| `/api/organization/invite` | Zod schema | Standard limiter (100/min) | Email validation added |
| `/api/voice/transcribe` | File validation | Upload limiter (5/min) | File size/type checks |
| `/api/voice/process-observation` | Zod schema | AI limiter (20/min) | LLM API calls |
| `/api/usage/track` | Zod schema | Standard limiter (100/min) | Analytics tracking |
| `/api/ed/chat` | Zod schema | AI limiter (20/min) | LLM chat interface |
| `/api/gdpr/delete` | Zod schema | GDPR limiter (1/hour) | Critical deletion ops |

---

## Validation Schemas Created

### 1. Common Validators
- `uuidSchema` - UUID validation
- `emailSchema` - Email address validation (RFC 5322)
- `nonEmptyString()` - String with min/max length
- `sanitizedString()` - XSS-safe string (strips `<>`)
- `urlSchema` - URL format validation
- `cloudProviderSchema` - Enum: google.com, microsoft.com
- `roleSchema` - Enum: admin, member, viewer
- `confidenceSchema` - Number 0-1

### 2. API-Specific Schemas
- `scanRequestSchema` - Evidence scanning (provider, token, folder, etc.)
- `evidenceRequestSchema` - Evidence retrieval by subcategory
- `searchRequestSchema` - Semantic search with embeddings
- `createOrganizationSchema` - Organization creation
- `inviteUserSchema` - User invitation with email validation
- `transcribeRequestSchema` - Audio file validation (25MB max, type checks)
- `processObservationSchema` - Observation transcript processing
- `trackUsageSchema` - Usage event tracking with 10 event types
- `edChatRequestSchema` - AI chat messages (max 50 messages)
- `gdprDeleteSchema` - GDPR deletion with confirmation requirement
- `gdprDeleteOrgSchema` - Organization deletion with admin check

### 3. Helper Functions
- `validateRequest()` - Generic validation with detailed error messages
- `sanitizeInput()` - XSS prevention (removes `<>`, `javascript:`, event handlers)
- `sanitizeObject()` - Recursive object sanitization

---

## Rate Limiting Implementation

### Architecture
- **Storage:** In-memory Map (production should use Redis)
- **Cleanup:** Automatic cleanup every 5 minutes
- **Identification:** IP address or user ID
- **Granularity:** Per-route, per-client

### Rate Limiters

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| Standard | 1 min | 100 | General API routes |
| Strict | 1 min | 10 | Expensive operations |
| AI | 1 min | 20 | LLM API calls |
| Upload | 1 min | 5 | File uploads |
| Scan | 5 min | 3 | Evidence scanning |
| GDPR | 1 hour | 1 | Data deletion |
| Search | 1 min | 30 | Semantic search |

### Response Format
```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": "45 seconds",
  "limit": 100,
  "window": "60 seconds"
}
```

Headers included:
- `Retry-After` (seconds)
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (ISO timestamp)

---

## Security Issues Identified

### CRITICAL ISSUES

#### 1. Service Role Key Exposure
**Severity:** CRITICAL
**Location:** Multiple API routes
**Issue:** Supabase service role keys bypass Row Level Security (RLS)

**Routes affected:**
- `/api/evidence/route.ts`
- `/api/organization/create/route.ts`
- `/api/organization/invite/route.ts`
- `/api/usage/track/route.ts`
- `/api/gdpr/delete/route.ts`

**Current State:**
```typescript
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // BYPASSES RLS
);
```

**Risk:**
- Data isolation depends on manual filtering
- One mistake = data leak across organizations
- No database-level enforcement

**Recommendations:**
1. **Use authenticated client in browser requests**
   ```typescript
   // In API routes that handle user requests:
   import { createServerClient } from '@supabase/ssr'

   const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Uses RLS
       { cookies: ... }
   );
   ```

2. **Reserve service role for admin operations only**
   - GDPR deletion
   - System-level operations
   - Scheduled tasks

3. **Implement additional authorization checks**
   ```typescript
   // Verify user owns the resource
   const { data: org } = await supabase
       .from('organizations')
       .select('id')
       .eq('id', organizationId)
       .eq('user_id', userId) // Double-check ownership
       .single();

   if (!org) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
   }
   ```

#### 2. No Authentication Middleware
**Severity:** HIGH
**Issue:** API routes don't verify user authentication

**Current State:**
- Routes accept `userId` from request body
- No token verification
- Clients can impersonate any user

**Recommendation:**
Implement authentication middleware:
```typescript
// src/lib/auth.ts
export async function verifyAuth(req: NextRequest): Promise<{ userId: string } | null> {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) return null;

    // Verify JWT token with Supabase or Firebase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) return null;

    return { userId: data.user.id };
}

// In API routes:
const auth = await verifyAuth(req);
if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### HIGH PRIORITY ISSUES

#### 3. Environment Variable Validation
**Severity:** HIGH
**Issue:** Missing validation for required environment variables

**Recommendation:**
Create startup validation:
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
```

#### 4. CORS Configuration
**Severity:** MEDIUM
**Issue:** No explicit CORS configuration visible

**Recommendation:**
```typescript
// next.config.js
module.exports = {
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,DELETE,OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Authorization,Content-Type' },
                ],
            },
        ];
    },
};
```

#### 5. SQL Injection via JSON Operators
**Severity:** MEDIUM
**Location:** `/api/evidence/route.ts`

**Issue:**
```typescript
.eq('metadata->>fileId', file.id) // Potentially unsafe
```

**Recommendation:**
- Use parameterized queries
- Validate `fileId` format before query
- Consider using Supabase typed queries

#### 6. Sensitive Data Logging
**Severity:** MEDIUM
**Issue:** Console.log statements may leak sensitive data

**Locations:**
- Access tokens logged in scan route
- User IDs in various routes
- API keys potentially in error messages

**Recommendation:**
```typescript
// Redact sensitive data
console.log('[Scan]', {
    provider,
    userId,
    accessToken: 'REDACTED',
    folderId: folderId.substring(0, 8) + '...'
});
```

### MEDIUM PRIORITY ISSUES

#### 7. File Upload Security
**Severity:** MEDIUM
**Issue:** Limited file validation in `/api/voice/transcribe`

**Current Implementation:**
- File size check (25MB) ✓
- MIME type check ✓
- Missing: File content validation

**Recommendation:**
```typescript
// Verify file header matches MIME type
const buffer = await audioFile.arrayBuffer();
const header = new Uint8Array(buffer.slice(0, 4));

// Check for valid audio file signatures
const isValidAudio =
    (header[0] === 0x52 && header[1] === 0x49) || // RIFF (WAV)
    (header[0] === 0xFF && header[1] === 0xFB) || // MP3
    (header[0] === 0x1A && header[1] === 0x45);   // WEBM

if (!isValidAudio) {
    return NextResponse.json({ error: 'Invalid audio file' }, { status: 400 });
}
```

#### 8. Error Message Information Disclosure
**Severity:** LOW
**Issue:** Detailed error messages expose internal structure

**Current:**
```typescript
return NextResponse.json({ error: error.message }, { status: 500 });
```

**Recommendation:**
```typescript
return NextResponse.json({
    error: 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
}, { status: 500 });
```

#### 9. Missing HTTPS Enforcement
**Severity:** MEDIUM
**Recommendation:** Add security headers

```typescript
// next.config.js
module.exports = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};
```

---

## Production Recommendations

### Immediate Actions (Before Production)
1. [ ] Implement authentication middleware
2. [ ] Switch to RLS-enabled Supabase client for user requests
3. [ ] Add environment variable validation
4. [ ] Configure CORS properly
5. [ ] Replace in-memory rate limiting with Redis
6. [ ] Add security headers
7. [ ] Implement proper logging (redact sensitive data)
8. [ ] Set up monitoring/alerting for rate limit violations

### Short-term Improvements
1. [ ] Add request signing for service-to-service calls
2. [ ] Implement IP allowlisting for admin endpoints
3. [ ] Add CAPTCHA for sensitive operations
4. [ ] Set up audit logging for GDPR operations
5. [ ] Implement Content Security Policy (CSP)
6. [ ] Add database query timeouts
7. [ ] Implement request ID tracing

### Long-term Enhancements
1. [ ] Web Application Firewall (WAF)
2. [ ] DDoS protection (Cloudflare, AWS Shield)
3. [ ] Security scanning (Snyk, SonarQube)
4. [ ] Penetration testing
5. [ ] Bug bounty program
6. [ ] Compliance certifications (SOC 2, ISO 27001)

---

## Testing Recommendations

### Security Tests to Add
```typescript
// Example test for rate limiting
describe('Rate Limiting', () => {
    it('should block requests after limit', async () => {
        const requests = Array(101).fill(null).map(() =>
            fetch('/api/search', {
                method: 'POST',
                body: JSON.stringify({ query: 'test' })
            })
        );

        const responses = await Promise.all(requests);
        const blocked = responses.filter(r => r.status === 429);

        expect(blocked.length).toBeGreaterThan(0);
    });
});

// Example test for validation
describe('Input Validation', () => {
    it('should reject invalid email', async () => {
        const res = await fetch('/api/organization/invite', {
            method: 'POST',
            body: JSON.stringify({
                email: 'invalid-email',
                role: 'member',
                organizationId: '123',
                invitedBy: '456'
            })
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Invalid email');
    });
});
```

---

## Compliance Notes

### GDPR Compliance
- ✓ Data deletion endpoint implemented
- ✓ Confirmation required for deletion
- ✓ Audit logging for deletions
- ⚠ Need to verify data retention in backups
- ⚠ Need data export endpoint (Article 20)

### UK GDPR / Data Protection Act 2018
- ✓ Right to erasure implemented
- ⚠ Need Privacy Impact Assessment (PIA)
- ⚠ Need Data Processing Agreement (DPA) for AI providers

### Security Best Practices
- ✓ Input validation
- ✓ Rate limiting
- ✓ XSS prevention (basic)
- ⚠ Authentication needed
- ⚠ Authorization needs improvement
- ⚠ Encryption at rest verification needed
- ⚠ Security headers needed

---

## Conclusion

**Validation Schemas Created:** 18 schemas
**API Routes Secured:** 10 routes
**Rate Limiters Implemented:** 7 configurations
**Critical Issues Identified:** 2
**High Priority Issues:** 4
**Medium Priority Issues:** 3

### Dependencies to Install
```bash
npm install zod  # Already installed
```

### Next Steps
1. Review and address CRITICAL issues immediately
2. Implement authentication middleware
3. Migrate to Redis for production rate limiting
4. Conduct security review with team
5. Set up monitoring and alerting

---

**Report Generated By:** Agent 6 - Security & Validation Specialist
**Contact:** For questions or concerns, review this document with your security team.
