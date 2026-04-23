# Document Generation and Signing Workflow System

**Date:** 23 March 2026
**Status:** Design Document
**Related:** `ONBOARDING_DOCUMENTS_DESIGN.md`, customer pipeline management

---

## Executive Summary

Schoolgle requires a comprehensive document generation and signing system to automate contract creation during onboarding, manage digital signatures, and handle renewals. This system integrates with the existing `document_production_engine` (letters, notices, reports) but focuses specifically on **legal contracts** that require formal signing and tracking.

**Key Requirements:**
1. Generate Master Services Agreements, DPAs, and other contracts on-the-fly
2. Support both-party signing (Schoolgle + School)
3. Track document lifecycle from draft to signed to expired
4. Manage contract renewals with proper notice periods
5. Support trust-level purchasing where one contract covers multiple schools

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Document Templates System](#2-document-templates-system)
3. [Document Generation Flow](#3-document-generation-flow)
4. [Signing Workflow](#4-signing-workflow)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Renewal Management](#7-renewal-management)
8. [Trust-Level Purchasing](#8-trust-level-purchasing)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. System Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT GENERATION SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │  Template       │    │  Generation     │    │  Signing        │            │
│  │  Engine         │───▶│  Service        │───▶│  Provider       │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                      │                      │                      │
│           ▼                      ▼                      ▼                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │  document_      │    │  contract_      │    │  DocuSign/      │            │
│  │  templates      │    │ _documents     │    │  HelloSign/     │            │
│  │  (existing)     │    │  (new)          │    │  Manual         │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EXISTING SYSTEMS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • subscriptions (plan, billing, period)                                       │
│  • organizations (school/trust details)                                        │
│  • document_templates, generated_documents (HR letters, etc.)                  │
│  • onboarding_queue (provisioning status)                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Reuse Existing Infrastructure** | Extend `document_templates` where possible, create new `contract_documents` for legal documents |
| **State Machine** | Documents follow strict state transitions with audit trail |
| **Provider Agnostic** | Support multiple signing providers (DocuSign, HelloSign, Adobe Sign) with easy switching |
| **Self-Service** | Schools can view and sign documents without admin intervention |
| **Trust-Aware** | Single contract can cover multiple schools with proper cascade logic |

---

## 2. Document Templates System

### 2.1 Storage Strategy: Hybrid Approach

**Templates stored in database** (`document_templates` table):
- Fast access and versioning
- Variable substitution at runtime
- Immediate updates without deployment

**Static assets in cloud storage:**
- Company logos, signatures
- PDF templates with complex layouts
- Terms and conditions as PDF attachments

### 2.2 Template Structure

```typescript
interface ContractTemplate {
  id: string;
  slug: string; // e.g., "msa-core-2025"
  name: string;
  category: "master_agreement" | "dpa" | "sla" | "addendum" | "order_form";

  // Version control
  version: string; // SemVer: "1.2.0"
  effective_from: Date;
  effective_to?: Date; // null means current
  supersedes_id?: string; // Previous version

  // Template content
  body_html: string; // Main HTML template
  sections: ContractSection[]; // Reusable sections

  // Variable definitions
  variables: TemplateVariable[];

  // Legal metadata
  requires_counter_signature: boolean; // Both Schoolgle and School must sign
  auto_renewal_clause: boolean;
  minimum_term_months: number;
  notice_period_days: number;

  // Access control
  is_active: boolean;
  required_plan: "core" | "professional" | "enterprise" | "trial" | "all";
}

interface ContractSection {
  id: string;
  title: string;
  content_html: string;
  order: number;
  conditional?: {
    variable: string;
    value: any;
  };
}

interface TemplateVariable {
  key: string; // e.g., "{{school_name}}"
  type: "text" | "date" | "currency" | "boolean" | "select" | "multi_select";
  required: boolean;
  default_value?: any;
  options?: string[]; // For select types
  description: string;
  source: "static" | "organization" | "subscription" | "user_input";
}
```

### 2.3 Variable Substitution Syntax

**Double-brace syntax** for simple variables:
```html
<h1>Master Services Agreement</h1>
<p>Between <strong>{{school_name}}</strong> and Schoolgle Limited</p>
<p>Effective date: {{contract_date}}</p>
```

**Conditional blocks** (using Mustache-style logic):
```html
{{#include_sla}}
<h2>Service Level Agreement</h2>
<p>Response time: {{sla_response_hours}} hours</p>
{{/include_sla}}

{{#is_enterprise}}
<h2>Enterprise Support</h2>
<p>Dedicated account manager assigned</p>
{{/is_enterprise}}
```

**Loop blocks** (for line items):
```html
<table>
  {{#line_items}}
  <tr>
    <td>{{description}}</td>
    <td>{{quantity}}</td>
    <td>{{unit_price}}</td>
  </tr>
  {{/line_items}}
</table>
```

### 2.4 Version Control Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Template Version History                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  msa-core-2025-v1.0.0  ──────▶  msa-core-2025-v1.1.0           │
│  (Jan 1 - Mar 31)       │         (Apr 1 - present)            │
│                        │                                       │
│                        └──── supersedes ──────────────────────┘│
│                                                                 │
│  Existing contracts on v1.0.0 remain valid until renewal       │
│  New contracts use v1.1.0                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Version Rules:**
1. **Major (X.0.0):** Breaking legal changes, requires new signature
2. **Minor (0.X.0):** Additive changes, backward compatible
3. **Patch (0.0.X):** Typos, formatting, non-legal fixes

**Contract Locking:**
- Once a contract is generated, it's locked to that template version
- Renewals can upgrade to newer versions if parties agree

---

## 3. Document Generation Flow

### 3.1 Trigger Points

| Trigger | When | Documents Generated | Actions |
|---------|------|---------------------|---------|
| **Trial Started** | User selects plan on signup | Trial Agreement, Privacy Notice | Send for signature |
| **Trial Converted** | Payment method added | Master Services Agreement, DPA | Upgrade trial → active |
| **Direct Purchase** | Skip trial, pay immediately | MSA, DPA, SLA (if enterprise) | Send for signature |
| **Module Added** | School purchases additional module | Module Addendum | Supplement existing MSA |
| **Renewal** | Contract period ending | Renewal Agreement | Send 30/60/90 days before expiry |
| **Trust School Added** | New school joins existing trust | School Addendum | Add to master trust agreement |

### 3.2 Generation Pipeline

```typescript
// Generation flow triggered by any of the above events

async function generateContract(params: {
  templateId: string;
  organizationId: string;
  subscriptionId?: string;
  variables: Record<string, any>;
  priority?: "normal" | "urgent";
}): Promise<ContractDocument> {

  // 1. Fetch template and validate version
  const template = await getActiveTemplate(params.templateId);

  // 2. Resolve variables (merge provided + auto-resolved)
  const resolvedVariables = await resolveVariables({
    template,
    organizationId: params.organizationId,
    userVariables: params.variables,
  });

  // 3. Validate required variables
  validateVariables(template, resolvedVariables);

  // 4. Render template with variables
  const renderedHtml = renderTemplate(template.body_html, resolvedVariables);

  // 5. Generate PDF
  const pdfUrl = await generatePdf(renderedHtml, {
    branding: await getOrganizationBranding(params.organizationId),
    watermark: params.priority === "urgent" ? "URGENT" : undefined,
  });

  // 6. Create contract record
  const contract = await createContractRecord({
    organizationId: params.organizationId,
    subscriptionId: params.subscriptionId,
    templateId: template.id,
    templateVersion: template.version,
    renderedHtml,
    pdfUrl,
    variables: resolvedVariables,
    status: "draft",
  });

  // 7. Audit log
  await auditLog("contract.generated", {
    contractId: contract.id,
    templateId: template.id,
    organizationId: params.organizationId,
  });

  return contract;
}
```

### 3.3 PDF Generation Approach

**Primary: Puppeteer (server-side rendering)**
- HTML to PDF conversion
- Preserves formatting, headers, footers
- Supports digital signatures overlay

**Fallback: jsPDF**
- For simple documents
- No external dependencies

**Configuration:**
```typescript
const pdfOptions = {
  format: "A4",
  margin: {
    top: "20mm",
    right: "20mm",
    bottom: "20mm",
    left: "20mm",
  },
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
      {{document_title}} - Page <span class="pageNumber"></span>
    </div>
  `,
  footerTemplate: `
    <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
      Schoolgle Limited - {{school_name}} - Generated {{generation_date}}
    </div>
  `,
  printBackground: true,
};
```

### 3.4 API Endpoints for Generation

```
POST   /api/contracts/generate
       - Generate contract from template
       - Body: { templateId, organizationId, variables, subscriptionId? }

GET    /api/contracts/{id}/preview
       - Preview contract before finalising
       - Returns HTML for browser rendering

POST   /api/contracts/{id}/finalise
       - Convert draft to final, generate PDF
       - Returns PDF URL

POST   /api/contracts/{id}/send-for-signature
       - Initiate signing workflow
       - Creates signing request, sends email

GET    /api/contracts/{id}/download
       - Download signed PDF
       - Requires authentication
```

---

## 4. Signing Workflow

### 4.1 Signing Provider Options

| Provider | Pros | Cons | Cost | Recommendation |
|----------|------|------|------|----------------|
| **DocuSign** | Industry standard, robust API | Expensive for low volume | ~£25-50/mo | Phase 2 (Enterprise) |
| **HelloSign (Dropbox)** | Good UX, reasonable pricing | Less customisation | ~£15-30/mo | Phase 2 |
| **Adobe Sign** | Adobe integration | Complex setup | ~£20-40/mo | Later |
| **PandaDoc** | Good for contracts | CRM-focused | ~£35-60/mo | Later |
| **Manual Upload** | Free, simple | No audit trail, manual | Free | **Phase 1 (MVP)** |

### 4.2 Phase 1: Manual Signing (MVP)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MANUAL SIGNING FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. Contract Generated (Draft)                                                 │
│     │                                                                          │
│     ▼                                                                          │
│  2. Admin Reviews & Finalises                                                  │
│     │                                                                          │
│     ▼                                                                          │
│  3. PDF Generated                                                              │
│     │                                                                          │
│     ▼                                                                          │
│  4. Email Sent to School with Download Link                                    │
│     │                                                                          │
│     ▼                                                                          │
│  5. School Prints, Signs, Scans                                                │
│     │                                                                          │
│     ▼                                                                          │
│  6. School Uploads Signed PDF                                                  │
│     │                                                                          │
│     ▼                                                                          │
│  7. Admin Verifies & Marks as Signed                                           │
│     │                                                                          │
│     ▼                                                                          │
│  8. Contract Active                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Phase 2: Digital Signing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DIGITAL SIGNING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. Contract Finalised                                                         │
│     │                                                                          │
│     ▼                                                                          │
│  2. Create Signing Request (DocuSign/HelloSign API)                            │
│     │                                                                          │
│     ├─────────────────────────────────────────────────────────────────────┐   │
│     │                                                                       │   │
│     ▼                                                                       │   │
│  3. Schoolgle Signs First (embedded or email)                               │   │
│     │                                                                       │   │
│     ▼                                                                       │   │
│  4. Request Routed to School Signatory                                       │   │
│     │                                                                       │   │
│     ▼                                                                       │   │
│  5. School Signs (email link or embedded)                                   │   │
│     │                                                                       │   │
│     ▼                                                                       │   │
│  6. Provider Merges Signatures, Returns Signed PDF                           │   │
│     │                                                                       │   │
│     ▼                                                                       │   │
│  7. Webhook Updates Status to "signed"                                       │   │
│     │                                                                       │   │
│     ▼                                                                       │   │
│  8. Contract Active                                                          │   │
│                                                                             │   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Signature States

```typescript
type ContractStatus =
  | "draft"           // Initial state, being edited
  | "pending_review"  // Awaiting admin review
  | "ready_to_sign"   // Finalised, ready for signatures
  | "awaiting_schoolgle"  // Waiting for Schoolgle signature
  | "awaiting_school"     // Waiting for School signature
  | "signed"          // Both parties signed
  | "expired"         // Contract period ended
  | "cancelled"       // Terminated before expiry
  | "superseded"      // Replaced by new version
  | "declined";       // School declined to sign
```

### 4.5 Reminder & Escalation System

```typescript
interface ReminderSchedule {
  days_after_sent: number;
  recipient: "school" | "schoolgle";
  method: "email" | "sms" | "phone";
  template: string;
}

const DEFAULT_REMINDERS: ReminderSchedule[] = [
  { days_after_sent: 3, recipient: "school", method: "email", template: "gentle_reminder" },
  { days_after_sent: 7, recipient: "school", method: "email", template: "follow_up_reminder" },
  { days_after_sent: 14, recipient: "school", method: "email", template: "urgent_reminder" },
  { days_after_sent: 21, recipient: "schoolgle", method: "email", template: "escalation_notice" },
];
```

**Escalation Rules:**
1. **Day 3:** Gentle reminder
2. **Day 7:** Follow-up with customer success
3. **Day 14:** Urgent reminder, flag in admin dashboard
4. **Day 21:** Escalate to leadership, consider trial extension
5. **Day 30:** Mark as stale, archive

### 4.6 Both-Party Signing Sequence

```
Schoolgle ──────▶ Signs First ──────▶ Routes to School
                                        │
                                        ▼
                                    School Signs
                                        │
                                        ▼
                                   Auto-Complete
                                        │
                                        ▼
                                   [SIGNED]
```

**Alternative: Concurrent Signing**
```
                    ┌───────────────────────────────────┐
                    │                                   │
                    ▼                                   ▼
              Schoolgle                           School
                    │                                   │
                    └───────────────┬───────────────────┘
                                    │
                                    ▼
                                Both Signed
                                    │
                                    ▼
                               Auto-Complete
```

---

## 5. Database Schema

### 5.1 New Table: `contract_documents`

Extends the existing document system specifically for legal contracts.

```sql
CREATE TABLE IF NOT EXISTS contract_documents (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization and subscription linkage
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    trust_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- For trust-level contracts

    -- Template reference
    template_id UUID NOT NULL REFERENCES document_templates(id),
    template_version TEXT NOT NULL,

    -- Document identification
    contract_type TEXT NOT NULL CHECK (contract_type IN (
        'master_agreement',
        'dpa',
        'sla',
        'trial_agreement',
        'module_addendum',
        'school_addendum',
        'renewal_agreement',
        'order_form',
        'privacy_notice',
        'cookie_policy'
    )),
    contract_number TEXT UNIQUE, -- Auto-generated: MSA-2025-001
    document_title TEXT NOT NULL,

    -- Content
    rendered_html TEXT,
    pdf_url TEXT,
    pdf_storage_path TEXT,

    -- Variable values used for generation
    template_variables JSONB DEFAULT '{}',

    -- Signing workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'pending_review',
        'ready_to_sign',
        'awaiting_schoolgle',
        'awaiting_school',
        'signed',
        'expired',
        'cancelled',
        'superseded',
        'declined'
    )),

    -- Signing provider integration
    signing_provider TEXT CHECK (signing_provider IN ('docusign', 'hellosign', 'adobe_sign', 'manual')),
    provider_envelope_id TEXT UNIQUE, -- External provider reference
    provider_document_id TEXT,
    signing_url TEXT, -- URL for school to sign
    embedded_signing_url TEXT, -- URL for iframe embedding

    -- Dates
    contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL,
    end_date DATE,

    -- Signing tracking
    sent_for_signature_at TIMESTAMPTZ,
    sent_to_email TEXT,
    schoolgle_signed_at TIMESTAMPTZ,
    schoolgle_signed_by TEXT,
    school_signed_at TIMESTAMPTZ,
    school_signed_by TEXT,
    signed_at TIMESTAMPTZ, -- When both parties signed

    -- Reminders
    last_reminder_sent_at TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,
    next_reminder_due TIMESTAMPTZ,

    -- Renewal tracking
    renewal_notice_sent BOOLEAN DEFAULT FALSE,
    renewal_notice_days INTEGER,
    auto_renew BOOLEAN DEFAULT TRUE,
    superseded_by_id UUID REFERENCES contract_documents(id),

    -- Relationship to trust contract
    parent_contract_id UUID REFERENCES contract_documents(id),
    cascade_to_schools BOOLEAN DEFAULT FALSE,

    -- Financial summary (for reference)
    contract_value INTEGER, -- in pence
    billing_currency TEXT DEFAULT 'GBP',
    payment_terms TEXT,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Indexes
CREATE INDEX idx_contract_documents_org ON contract_documents(organization_id);
CREATE INDEX idx_contract_documents_subscription ON contract_documents(subscription_id);
CREATE INDEX idx_contract_documents_trust ON contract_documents(trust_id);
CREATE INDEX idx_contract_documents_status ON contract_documents(status);
CREATE INDEX idx_contract_documents_type ON contract_documents(contract_type);
CREATE INDEX idx_contract_documents_dates ON contract_documents(start_date, end_date);
CREATE INDEX idx_contract_documents_provider ON contract_documents(signing_provider, provider_envelope_id);
CREATE INDEX idx_contract_documents_parent ON contract_documents(parent_contract_id);
CREATE INDEX idx_contract_documents_renewal ON contract_documents(end_date)
    WHERE status = 'signed' AND auto_renew = TRUE;
```

### 5.2 New Table: `contract_signatures`

Track individual signatures on a contract (for both-party and multi-party scenarios).

```sql
CREATE TABLE IF NOT EXISTS contract_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract_documents(id) ON DELETE CASCADE,

    -- Signatory details
    party TEXT NOT NULL CHECK (party IN ('schoolgle', 'school', 'trust')),
    signatory_role TEXT NOT NULL, -- e.g., "headteacher", "finance_director"
    signatory_name TEXT NOT NULL,
    signatory_email TEXT,
    signatory_title TEXT,

    -- Signature details
    signature_method TEXT CHECK (signature_method IN ('electronic', 'digital', 'wet_ink', 'clickwrap')),
    signature_ip TEXT,
    signature_user_agent TEXT,
    signature_image_url TEXT, -- For wet_ink uploads

    -- Timestamps
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Provider reference
    provider_signature_id TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    UNIQUE(contract_id, party, signatory_role)
);

CREATE INDEX idx_contract_signatures_contract ON contract_signatures(contract_id);
CREATE INDEX idx_contract_signatures_party ON contract_signatures(party);
```

### 5.3 New Table: `contract_reminders`

Automated reminder scheduling and tracking.

```sql
CREATE TABLE IF NOT EXISTS contract_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract_documents(id) ON DELETE CASCADE,

    -- Reminder details
    reminder_sequence INTEGER NOT NULL, -- 1st, 2nd, 3rd reminder
    days_after_sent INTEGER NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,

    -- Recipient
    recipient TEXT NOT NULL CHECK (recipient IN ('school', 'schoolgle', 'admin')),
    recipient_email TEXT,

    -- Content
    subject TEXT,
    body_template TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error_message TEXT,

    -- Delivery tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

CREATE INDEX idx_contract_reminders_contract ON contract_reminders(contract_id);
CREATE INDEX idx_contract_reminders_scheduled ON contract_reminders(scheduled_for)
    WHERE status = 'pending';
```

### 5.4 New Table: `contract_templates`

Extended template definitions specifically for contracts (can reference `document_templates` or be standalone).

```sql
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'master_agreement', 'dpa', 'sla', 'trial', 'addendum', 'renewal'
    )),

    -- Version control
    version TEXT NOT NULL DEFAULT '1.0.0',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    supersedes_id UUID REFERENCES contract_templates(id),

    -- Template content (can also reference document_templates)
    document_template_id UUID REFERENCES document_templates(id),
    body_html TEXT,

    -- Variable definitions
    variables JSONB DEFAULT '[]', -- Array of variable definitions
    required_variables TEXT[] DEFAULT '{}',

    -- Contract-specific settings
    requires_counter_signature BOOLEAN DEFAULT TRUE,
    auto_renewal_clause BOOLEAN DEFAULT TRUE,
    minimum_term_months INTEGER DEFAULT 12,
    notice_period_days INTEGER DEFAULT 60,

    -- Access control
    required_plan TEXT[] DEFAULT ARRAY['core', 'professional', 'enterprise'],
    is_active BOOLEAN DEFAULT TRUE,

    -- Legal approval
    approved_by_legal BOOLEAN DEFAULT FALSE,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,

    -- Metadata
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_templates_slug ON contract_templates(slug);
CREATE INDEX idx_contract_templates_active ON contract_templates(is_active, effective_from);
```

### 5.5 Helper Functions

```sql
-- Generate sequential contract numbers
CREATE OR REPLACE FUNCTION generate_contract_number(contract_type TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    sequence_num INTEGER;
    result TEXT;
BEGIN
    -- Determine prefix from contract type
    CASE contract_type
        WHEN 'master_agreement' THEN prefix := 'MSA'
        WHEN 'dpa' THEN prefix := 'DPA'
        WHEN 'sla' THEN prefix := 'SLA'
        WHEN 'trial_agreement' THEN prefix := 'TRIAL'
        WHEN 'module_addendum' THEN prefix := 'ADD'
        WHEN 'school_addendum' THEN prefix := 'SCH'
        WHEN 'renewal_agreement' THEN prefix := 'REN'
        ELSE prefix := 'CON'
    END CASE;

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM contract_documents
    WHERE contract_number LIKE prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';

    -- Format: PREFIX-YYYY-#### (e.g., MSA-2025-0001)
    result := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Check for contracts nearing expiry
CREATE OR REPLACE FUNCTION check_contract_expiry()
RETURNS TABLE (
    contract_id UUID,
    organization_id UUID,
    days_remaining INTEGER,
    auto_renew BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.id,
        cd.organization_id,
        EXTRACT(DAY FROM (cd.end_date - CURRENT_DATE))::INTEGER AS days_remaining,
        cd.auto_renew
    FROM contract_documents cd
    WHERE cd.status = 'signed'
      AND cd.end_date <= CURRENT_DATE + INTERVAL '90 days'
      AND cd.end_date >= CURRENT_DATE
      AND NOT cd.renewal_notice_sent;
END;
$$ LANGUAGE plpgsql;

-- Schedule renewal reminders
CREATE OR REPLACE FUNCTION schedule_renewal_reminders()
RETURNS VOID AS $$
DECLARE
    contract RECORD;
    notice_period INTEGER;
BEGIN
    FOR contract IN
        SELECT * FROM check_contract_expiry()
        WHERE days_remaining <= 90
    LOOP
        -- Determine notice period based on contract value or default
        notice_period := COALESCE(
            (SELECT ct.notice_period_days
             FROM contract_templates ct
             JOIN contract_documents cd ON cd.template_id = ct.id
             WHERE cd.id = contract.contract_id),
            60
        );

        -- Schedule reminder if within notice period
        IF contract.days_remaining <= notice_period THEN
            INSERT INTO contract_reminders (
                contract_id,
                reminder_sequence,
                days_after_sent,
                scheduled_for,
                recipient,
                recipient_email,
                status
            )
            SELECT
                contract.contract_id,
                1,
                0,
                NOW() + INTERVAL '1 hour',
                'school',
                o.email,
                'pending'
            FROM organizations o
            WHERE o.id = contract.organization_id;

            -- Mark notice as sent
            UPDATE contract_documents
            SET renewal_notice_sent = TRUE
            WHERE id = contract.contract_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. API Endpoints

### 6.1 Contract Management

```
# Contract CRUD
GET    /api/admin/contracts
       - List all contracts (admin view)
       - Query: status, organizationId, type, dateRange

GET    /api/admin/contracts/{id}
       - Get contract details with full audit trail

POST   /api/admin/contracts
       - Create contract from template
       - Body: { templateId, organizationId, subscriptionId?, variables }

PATCH  /api/admin/contracts/{id}
       - Update contract (draft only)
       - Body: { status, variables, notes }

DELETE /api/admin/contracts/{id}
       - Delete draft contract only

# Contract Actions
POST   /api/admin/contracts/{id}/finalise
       - Finalise draft contract, generate PDF

POST   /api/admin/contracts/{id}/send-for-signature
       - Initiate signing workflow
       - Body: { signatoryEmail, signatoryName, method }

POST   /api/admin/contracts/{id}/cancel
       - Cancel contract before signing
       - Body: { reason }

POST   /api/admin/contracts/{id}/renew
       - Initiate renewal process
       - Body: { newEndDate?, upgradeVariables? }

GET    /api/admin/contracts/{id}/download
       - Download PDF (signed or unsigned)

GET    /api/admin/contracts/{id}/preview
       - Preview HTML in browser
```

### 6.2 School-Facing Endpoints

```
GET    /api/contracts
       - List organization's contracts

GET    /api/contracts/{id}
       - Get contract details

GET    /api/contracts/{id}/sign
       - Get signing URL or embed code

POST   /api/contracts/{id}/sign
       - Submit signature (manual upload method)
       - Body: { signaturePdfUrl }

POST   /api/contracts/{id}/decline
       - Decline to sign
       - Body: { reason }

GET    /api/contracts/{id}/download
       - Download signed PDF
```

### 6.3 Template Management

```
GET    /api/admin/contract-templates
       - List contract templates

POST   /api/admin/contract-templates
       - Create contract template
       - Body: { slug, name, category, bodyHtml, variables, ... }

GET    /api/admin/contract-templates/{id}
       - Get template details

PATCH  /api/admin/contract-templates/{id}
       - Update template (create new version if active)

POST   /api/admin/contract-templates/{id}/activate
       - Activate template version

POST   /api/admin/contract-templates/{id}/deactivate
       - Deactivate template
```

### 6.4 Webhooks (Signing Provider)

```
POST   /api/webhooks/signing/{provider}
       - Handle signature events from DocuSign/HelloSign
       - Provider-specific envelope ID in body
       - Updates contract status automatically
```

### 6.5 Admin Dashboard Endpoints

```
GET    /api/admin/contracts/dashboard
       - Summary stats: pending, signed, expiring soon

GET    /api/admin/contracts/expiring
       - Contracts expiring within 90 days

POST   /api/admin/contracts/send-batch-reminders
       - Send reminders to multiple contracts
       - Body: { contractIds[] }

GET    /api/admin/contracts/utilisation
       - Contract utilisation by module
```

---

## 7. Renewal Management

### 7.1 Renewal Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CONTRACT LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [SIGNED] ──────────────────────────────────────────────────────▶ [EXPIRED]    │
│     │                                                                        │
│     │  90 days before expiry                                                  │
│     ▼                                                                        │
│  [RENEWAL_NOTICE_SENT]                                                       │
│     │                                                                        │
│     │  School confirms renewal                                               │
│     ▼                                                                        │
│  [RENEWAL_PENDING]                                                           │
│     │                                                                        │
│     ├───────────────────┬────────────────────┐                               │
│     ▼                   ▼                    ▼                               │
│  [AUTO_RENEWED]      [MANUAL_RENEWAL]     [NOT_RENEWING]                     │
│     │                   │                    │                               │
│     ▼                   ▼                    ▼                               │
│  New Contract         New Contract        [EXPIRED]                          │
│  created              created             (grace period)                     │
│  (same terms)         (negotiated)                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Notice Periods

| Plan | Notice Period | When Notice Sent |
|------|---------------|------------------|
| Core | 30 days | 30 days before expiry |
| Professional | 60 days | 60 days before expiry |
| Enterprise | 90 days | 90 days before expiry |
| Trial | 7 days | 7 days before trial ends |

### 7.3 Auto-Renewal Logic

```typescript
async function processAutoRenewal(contractId: string): Promise<{
  renewed: boolean;
  newContractId?: string;
  action: "auto_renewed" | "manual_required" | "not_renewing" | "already_renewed";
}> {
  const contract = await getContract(contractId);

  // Check if already renewed
  if (contract.superseded_by_id) {
    return { renewed: false, action: "already_renewed" };
  }

  // Check if auto-renew is enabled
  if (!contract.auto_renew) {
    return { renewed: false, action: "manual_required" };
  }

  // Check if contract is in good standing
  const subscription = await getSubscription(contract.subscription_id);
  if (subscription.status === "cancelled" || subscription.status === "past_due") {
    return { renewed: false, action: "not_renewing" };
  }

  // Create renewal contract
  const newContract = await generateContract({
    templateId: contract.template_id,
    organizationId: contract.organization_id,
    subscriptionId: contract.subscription_id,
    variables: {
      ...contract.template_variables,
      renewal_date: new Date().toISOString().split("T")[0],
      previous_contract_number: contract.contract_number,
    },
    contractType: "renewal_agreement",
  });

  // Link to original contract
  await updateContract(contract.id, {
    superseded_by_id: newContract.id,
  });

  // Update subscription period
  await updateSubscription(contract.subscription_id, {
    current_period_start: new Date(contract.end_date),
    current_period_end: addYears(contract.end_date, 1),
  });

  return { renewed: true, newContractId: newContract.id, action: "auto_renewed" };
}
```

### 7.4 Version Control for Renewals

**In-Place Renewal:**
- Same contract, extended dates
- Amendments recorded as addendum
- Used for minor term changes

**New Contract Renewal:**
- Fresh contract with new version
- Old contract marked as "superseded"
- Used for major changes or plan upgrades

---

## 8. Trust-Level Purchasing

### 8.1 Trust vs Single School Contracts

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TRUST CONTRACT STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MASTER TRUST AGREEMENT                                │   │
│  │                    East Sussex Academy Trust                            │   │
│  │                    Trust-level pricing, terms                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                 │                                             │
│                                 │ covers                                      │
│                                 ▼                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │   School   │  │   School   │  │   School   │  │   School   │              │
│  │     A      │  │     B      │  │     C      │  │     D      │              │
│  │ (signed)   │  │ (signed)   │  │ (signed)   │  │ (pending)  │              │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    SCHOOL ADDENDUM                                      │   │
│  │                    School-specific modules, pricing                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Trust Contract Schema Extensions

```sql
-- Extend contract_documents for trust support
ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS contract_scope TEXT
    CHECK (contract_scope IN ('single_school', 'trust_master', 'school_addendum'));

ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS covered_schools UUID[] DEFAULT '{}';
-- Array of organization IDs covered by this contract

ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS trust_pricing JSONB DEFAULT '{}';
-- { tier: "trust", base_per_school: 500, discount_percent: 20, ... }
```

### 8.3 Cascade Mechanism

When a new school joins a trust with an existing contract:

```typescript
async function addSchoolToTrustContract(
  trustContractId: string,
  newSchoolId: string
): Promise<ContractDocument> {

  // 1. Verify trust contract is active
  const trustContract = await getContract(trustContractId);
  if (trustContract.status !== "signed") {
    throw new Error("Trust contract must be signed before adding schools");
  }

  // 2. Create school addendum
  const addendum = await generateContract({
    templateId: getTemplateId("school_addendum"),
    organizationId: newSchoolId,
    variables: {
      trust_name: trustContract.organization_name,
      master_contract_number: trustContract.contract_number,
      school_inherited_modules: trustContract.enabled_modules,
      school_pricing: calculateSchoolPricing(trustContract, newSchoolId),
    },
    parentContract_id: trustContractId,
  });

  // 3. Update trust contract
  await updateContract(trustContractId, {
    covered_schools: [...trustContract.covered_schools, newSchoolId],
  });

  // 4. Create subscription for new school
  await createSubscription({
    organizationId: newSchoolId,
    plan: trustContract.plan,
    modules: trustContract.enabled_modules,
    pricing: trustContract.trust_pricing,
    contractId: addendum.id,
  });

  return addendum;
}
```

### 8.4 Pricing Models

**Per-School Tiered Pricing:**
```
1-5 schools:   £500/school
6-15 schools:  £400/school (20% discount)
16-30 schools: £300/school (40% discount)
30+ schools:   Custom pricing
```

**Trust-Level Modules:**
```
Core modules: Included for all schools in trust
Premium modules: Per-school pricing
Trust-wide analytics: £2,000 flat fee
```

---

## 9. Implementation Phases

### 9.1 Phase 1: MVP (Manual Signing) - 3 days

**Deliverables:**
1. Database schema creation
2. Contract generation API (HTML to PDF)
3. Manual signing workflow (upload signed PDF)
4. Admin dashboard for contract tracking
5. Basic email notifications

**Acceptance Criteria:**
- Can generate Master Services Agreement from template
- School can download, sign, and upload PDF
- Admin can verify and mark as signed
- Dashboard shows pending/signed contracts

### 9.2 Phase 2: Renewals & Trusts - 2 days

**Deliverables:**
1. Renewal notice system
2. Auto-renewal logic
3. Trust-level contracts
4. School addendum generation
5. Contract utilisation reports

**Acceptance Criteria:**
- Renewal notices sent 30/60/90 days before expiry
- Auto-renewal creates new contract
- Trust contracts cover multiple schools
- New schools can be added to existing trust contracts

### 9.3 Phase 3: Digital Signing - 3-5 days

**Deliverables:**
1. DocuSign or HelloSign integration
2. Both-party signing workflow
3. Webhook handling for signature events
4. Embedded signing UI
5. Signature audit trail

**Acceptance Criteria:**
- Contracts sent via DocuSign/HelloSign
- Both parties sign electronically
- Status updates automatically via webhook
- Signed PDF stored securely

### 9.4 Phase 4: Advanced Features - 2 days

**Deliverables:**
1. Contract versioning and history
2. Amendment workflow
3. Bulk operations (batch reminders)
4. Advanced reporting
5. API for third-party integrations

**Acceptance Criteria:**
- Full contract history visible
- Amendments can be created and signed
- Bulk reminder system
- Export contract data for accounting

---

## Appendix A: Variable Definitions Reference

### Common Contract Variables

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `{{school_name}}` | text | organization | Legal name of school |
| `{{school_urn}}` | text | organization | DfE URN |
| `{{school_address}}` | text | organization | Full postal address |
| `{{school_postcode}}` | text | organization | Postcode |
| `{{contact_name}}` | text | user_input | Primary contact name |
| `{{contact_email}}` | text | user_input | Primary contact email |
| `{{contact_role}}` | text | user_input | Job title |
| `{{headteacher_name}}` | text | organization | Headteacher name |
| `{{headteacher_email}}` | text | organization | Headteacher email |
| `{{plan_name}}` | select | subscription | Core, Professional, Enterprise |
| `{{plan_price}}` | currency | subscription | Annual price |
| `{{plan_duration}}` | select | subscription | Annual, Monthly |
| `{{start_date}}` | date | subscription | Contract start |
| `{{end_date}}` | date | subscription | Contract end |
| `{{included_modules}}` | array | subscription | List of modules |
| `{{payment_method}}` | select | subscription | Card, Invoice, BACS |
| `{{payment_terms}}` | text | subscription | 14/30 days, monthly |
| `{{sla_response_hours}}` | number | subscription | SLA response time |
| `{{user_limit}}` | number | subscription | Max users |
| `{{storage_limit_gb}}` | number | subscription | Storage allowance |
| `{{contract_date}}` | date | system | Date of signing |
| `{{contract_number}}` | text | system | Generated number |
| `{{trust_name}}` | text | organization | Trust name (if applicable) |
| `{{trust_schools}}` | array | organization | Schools in trust |
| `{{school_pricing}}` | currency | calculated | Per-school price |

---

## Appendix B: Template Examples

### Master Services Agreement (Excerpt)

```html
<h1>Master Services Agreement</h1>

<p><strong>Between:</strong></p>
<p>Schoolgle Limited, a company registered in England and Wales under number 12345678, whose registered office is at 123 School Lane, London, EC1A 1BB ("Schoolgle")</p>

<p>And</p>

<p><strong>{{school_name}}</strong><br/>
{{school_address}}<br/>
{{school_postcode}}<br/>
Company Registration No: {{company_number}} (if applicable)<br/>
("The School")</p>

<p>Together referred to as the "Parties"</p>

<h2>1. Definitions and Interpretation</h2>
<p>1.1 "Agreement" means these Master Services Terms including any Schedules and appendices;</p>
<p>1.2 "Commencement Date" means {{start_date}};</p>
<p>1.3 "Fees" means the fees set out in Schedule 1;</p>
<p>1.4 "Services" means the online school improvement platform services as described in Schedule 2;</p>

<h2>2. Services</h2>
<p>2.1 Schoolgle shall provide the Services to the School in accordance with this Agreement.</p>
<p>2.2 The Services shall include the following modules:</p>
<ul>
  {{#included_modules}}
  <li>{{.}}</li>
  {{/included_modules}}
</ul>

<h2>3. Fees and Payment</h2>
<p>3.1 The School shall pay Schoolgle the Fees of {{plan_price}} per {{plan_duration}}.</p>
<p>3.2 Payment shall be made via {{payment_method}} within {{payment_terms}}.</p>

{{#is_enterprise}}
<h2>4. Service Level Agreement</h2>
<p>4.1 Schoolgle shall use reasonable endeavours to ensure the Services are available 99.5% of the time.</p>
<p>4.2 Response times for support requests shall not exceed {{sla_response_hours}} hours.</p>
{{/is_enterprise}}

<h2>5. Term and Termination</h2>
<p>5.1 This Agreement shall commence on the Commencement Date and shall continue for a period of 12 months ("Initial Period").</p>
<p>5.2 Thereafter, this Agreement shall automatically renew for successive 12-month periods unless either party gives not less than 60 days' written notice prior to the end of the then-current period.</p>

<p><strong>Signed:</strong></p>
<p>For and on behalf of Schoolgle Limited: _______________________</p>
<p>Name: {{schoolgle_signatory}}</p>
<p>Date: _______________________</p>

<p>For and on behalf of {{school_name}}: _______________________</p>
<p>Name: {{signatory_name}}</p>
<p>Position: {{signatory_role}}</p>
<p>Date: _______________________</p>
```

---

## Appendix C: Quick Reference

### Status Transitions
```
draft → ready_to_sign → awaiting_school → signed
                    ↘ awaiting_schoolgle ↗
```

### Key Files to Create
```
apps/platform/src/app/api/contracts/
├── route.ts                    # List contracts
├── [id]/
│   ├── route.ts                # Get/update/delete
│   ├── finalise/route.ts       # Generate PDF
│   ├── send-for-signature/route.ts
│   ├── download/route.ts
│   ├── renew/route.ts
│   └── cancel/route.ts
├── generate/route.ts           # Create from template
└── dashboard/route.ts          # Summary stats

apps/platform/src/lib/
├── contract-generator.ts       # PDF generation
├── contract-templates.ts       # Template definitions
└── signing-providers/
    ├── docusign.ts
    ├── hellosign.ts
    └── manual.ts

apps/platform/supabase/migrations/
└── 20260323_contract_documents.sql
```

### Environment Variables
```bash
# Signing providers (optional for Phase 1)
DOCUSIGN_CLIENT_ID=
DOCUSIGN_CLIENT_SECRET=
DOCUSIGN_ACCOUNT_ID=
HELLOSIGN_API_KEY=

# PDF generation
PDF_GENERATION_METHOD=puppeteer  # puppeteer|jspdf
```

---

**End of Document**
