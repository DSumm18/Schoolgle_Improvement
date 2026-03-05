# Ed Form Helper - Security & Allowlisting

## Preventing Misuse

Ed should NOT fill certain forms. We need **form allowlisting**.

---

## Forms Ed CAN Fill (Allowlist)

| Category | Examples | Approval |
|----------|----------|----------|
| **School Forms** | Safeguarding, Admissions, Free School Meals | School-enabled |
| **Government** | GOV.UK forms, NHS services | School-enabled |
| **Job Applications** | School job applications | School-enabled |
| **Parent Communication** | School contact forms | Always allowed |
| **Surveys** | School surveys, feedback forms | Always allowed |

## Forms Ed BLOCKS (Blocklist)

| Category | Reason |
|----------|--------|
| **Banking** | HSBC, Barclays, etc. - Financial forms |
| **Shopping** | Amazon, eBay - Checkout forms |
| **Social Media** | Facebook, Twitter signup |
| **Gaming** | Gambling sites |
| **Password Reset** - Security risk |
| **Admin Panels** - School MIS systems (unless staff) |

---

## Implementation: Form Allowlist

```typescript
interface FormPolicy {
  allowedDomains: string[];
  allowedFormTypes: FormType[];
  blockedDomains: string[];
  blockedFieldTypes: FieldType[];
  requireExplicitConsent: string[];
}

// Default policies
const DEFAULT_POLICY: FormPolicy = {
  allowedDomains: [
    // School domains (configured per school)
  ],

  // Block financial sites
  blockedDomains: [
    'bank', 'barclays', 'hsbc', 'lloyds', 'natwest',
    'amazon', 'ebay', 'paypal',
    'facebook', 'twitter', 'instagram', 'tiktok',
    'bet365', 'williamhill', 'gambl'
  ],

  // Never fill password fields
  blockedFieldTypes: ['password', 'credit-card', 'ssn'],

  // Require extra consent for sensitive forms
  requireExplicitConsent: ['safeguarding', 'medical', 'special-needs']
};

async function checkFormAllowed(form: DetectedForm, currentUrl: string): Promise<AllowResult> {
  const hostname = new URL(currentUrl).hostname.toLowerCase();

  // 1. Check blocklist
  for (const blocked of DEFAULT_POLICY.blockedDomains) {
    if (hostname.includes(blocked)) {
      return {
        allowed: false,
        reason: `BLOCKED: Forms on ${hostname} are not allowed for security reasons.`,
        canOverride: false
      };
    }
  }

  // 2. Check for password fields
  const hasPassword = form.fields.some(f => f.type === 'password');
  if (hasPassword) {
    return {
      allowed: false,
      reason: "BLOCKED: Forms with password fields cannot be filled for security.",
      canOverride: false
    };
  }

  // 3. Check for credit card fields
  const hasCreditCard = form.fields.some(f =>
    f.label?.toLowerCase().includes('card') ||
    f.label?.toLowerCase().includes('cvv') ||
    f.name?.toLowerCase().includes('card')
  );
  if (hasCreditCard) {
    return {
      allowed: false,
      reason: "BLOCKED: Payment forms cannot be filled.",
      canOverride: false
    };
  }

  // 4. Check if school has enabled this domain
  const schoolDomains = await getSchoolAllowedDomains(userOrgId);
  const isSchoolDomain = schoolDomains.some(d => hostname.includes(d));

  if (isSchoolDomain) {
    return { allowed: true, reason: "APPROVED: School-enabled domain." };
  }

  // 5. Public forms need user confirmation
  return {
    allowed: true,
    requiresConfirmation: true,
    reason: `Forms on ${hostname} are not pre-approved. Continue anyway?`
  };
}

// Display to user
interface AllowResult {
  allowed: boolean;
  reason: string;
  requiresConfirmation?: boolean;
  canOverride?: boolean;
}
```

---

## UI: Safety Warnings

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Security Check                                            │
│                                                                 │
│  This form is on: rawdon-st-peters.co.uk                       │
│                                                                 │
│  It contains: Name, Phone, Email, Concern                     │
│                                                                 │
│  ✅ This looks like a safeguarding form                       │
│  ✅ No password or payment fields detected                     │
│                                                                 │
│  [ Allow Ed to help fill ]  [ No thanks ]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│  🛑  BLOCKED                                                   │
│                                                                 │
│  This form contains password fields.                          │
│                                                                 │
│  For your security, Ed will NOT fill password forms.          │
│                                                                 │
│  [ I understand ]                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## School-Managed Allowlist

```typescript
// Database table: ed_form_allowlist
interface AllowlistEntry {
  organization_id: string;
  domain: string;
  form_type?: string;
  enabled_by: string;
  enabled_at: string;
  requires_staff: boolean; // Only logged-in staff can use
}

// School admin manages via dashboard
async function updateSchoolAllowlist(orgId: string, domains: string[]) {
  await supabase.from('ed_form_allowlist').upsert(
    domains.map(d => ({
      organization_id: orgId,
      domain: d,
      enabled_by: userId,
      enabled_at: new Date().toISOString()
    }))
  );
}
```

---

## Student Mode vs Parent Mode

```typescript
enum UserType {
  PARENT,      // Can fill public forms (safeguarding, admissions)
  STAFF,       // Can fill school forms + MIS systems
  STUDENT,     // Limited - only surveys, feedback
  GOVERNOR     // Can fill governance forms
}

function getAllowedForms(userType: UserType): FormType[] {
  switch (userType) {
    case UserType.PARENT:
      return ['safeguarding', 'admissions', 'contact', 'survey'];
    case UserType.STAFF:
      return ['safeguarding', 'admissions', 'contact', 'survey', 'mis', 'hr'];
    case UserType.STUDENT:
      return ['survey', 'feedback'];
    case UserType.GOVERNOR:
      return ['safeguarding', 'governance', 'survey'];
  }
}
```

---

## Audit Logging

```typescript
// Log ALL form filling attempts (anonymized)
async function logFormFillingAttempt(data: {
  organization_id: string;
  user_type: UserType;
  domain: string;
  form_type: string;
  allowed: boolean;
  reason?: string;
}) {
  await supabase.from('ed_form_filling_audit').insert({
    ...data,
    session_id: generateAnonymousId(),
    timestamp: new Date().toISOString(),
  });
}

// School can review
async function getSchoolAuditLog(orgId: string) {
  return await supabase
    .from('ed_form_filling_audit')
    .select('*')
    .eq('organization_id', orgId)
    .order('timestamp', { ascending: false })
    .limit(100);
}
```

---

## Summary: Security Layers

```
1. Domain Blocklist (hardcoded)
   ├── Banking sites
   ├── Shopping sites
   └── Social media

2. Field Type Blocklist
   ├── Password fields (NEVER fill)
   ├── Credit card fields
   └── SSN/National Insurance

3. School Allowlist (configurable)
   └── School adds approved domains

4. User Type Permissions
   ├── Parent: Public forms only
   ├── Staff: School forms + MIS
   └── Student: Limited

5. Explicit Confirmation
   └── User must approve for unknown domains

6. Audit Logging
   └── All attempts logged for review
```

This keeps Ed safe while still being useful!
