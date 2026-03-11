# Ofsted Readiness Scanner — GDPR & Data Protection Architecture

## Core Principles

1. **Data Minimisation**: Only access what's needed, only when needed, only for scan duration
2. **No Data Storage**: Schoolgle never stores document contents on its servers or in Supabase
3. **No Training**: AI API (OpenRouter commercial) contractually guarantees inputs/outputs NOT used for training
4. **Zero Data Retention**: API logs retained max 7 days, reducible to zero with ZDR addendum
5. **School Controls Access**: Admin grants/revokes access, chooses folder, can disconnect any time
6. **Output is Anonymised**: Report cards contain grades, percentages, flags — never pupil names, UPNs, or identifiable data

---

## Data Flow Architecture

### Step-by-Step

| Step | What Happens                                           | Data Location                                 |
| ---- | ------------------------------------------------------ | --------------------------------------------- |
| 1    | School admin connects Google Drive via OAuth           | Token encrypted in `ofsted_drive_connections` |
| 2    | Admin clicks "Run Scan"                                | Scan record created in `ofsted_scans`         |
| 3    | Backend reads folder structure via Drive API           | **Metadata only** — filenames, IDs, dates     |
| 4    | For each document, content streamed into server memory | **In memory only** — never on disk            |
| 5    | Content sent to AI API as prompt                       | **Transit only** — TLS encrypted              |
| 6    | AI response received and parsed                        | **In memory** — grades, flags, quotes         |
| 7    | Document content **immediately discarded**             | **Gone** — garbage collected                  |
| 8    | Anonymised report card stored in Supabase              | Grades, scores, flags — **no pupil data**     |

### What IS Stored

- Report card grades (e.g., "Expected Standard" for Inclusion)
- Percentage scores (e.g., 72% overall readiness)
- Flags and recommendations (e.g., "Safeguarding policy needs updating")
- Document **filenames** (not content) — e.g., "safeguarding-policy-2025.pdf"
- Matched keywords (e.g., ["KCSIE", "safeguarding"])
- Key quotes from documents (short excerpts only, no pupil-identifiable data)

### What is NEVER Stored

- Full document content
- Pupil names, UPNs, DOBs, addresses
- Assessment data with identifiable pupils
- Staff personal information
- Images of pupil work (processed in memory, discarded)
- Raw attendance records with named pupils

---

## AI API Compliance

### OpenRouter Commercial API

| Requirement                | Status                                |
| -------------------------- | ------------------------------------- |
| Data NOT used for training | Contractual guarantee                 |
| Commercial/Enterprise tier | Required — consumer tier NOT suitable |
| API key authentication     | Server-side only, never client-side   |
| TLS encryption in transit  | Yes — HTTPS enforced                  |
| Log retention              | Max 7 days (configurable)             |
| DPA available              | Via OpenRouter/model provider terms   |
| GDPR-compliant hosting     | US/EU infrastructure                  |

### Critical: API Tier

The scanning engine **MUST** use the commercial API (server-side Next.js API routes), NOT:

- Browser-based calls through any consumer AI product
- Client-side API calls (keys would be exposed)
- Consumer/free tier accounts (may train on data)

---

## Compliance Documents Required

| Document                                 | Status                            | Responsibility              |
| ---------------------------------------- | --------------------------------- | --------------------------- |
| DPA with AI provider (OpenRouter)        | Available via commercial terms    | Schoolgle                   |
| DPA between Schoolgle and school         | Needs creating                    | Schoolgle provides template |
| DPIA (Data Protection Impact Assessment) | Needs creating                    | Schoolgle creates           |
| Privacy notice update for schools        | Template provided                 | Schools adapt to context    |
| Lawful basis documentation               | Legitimate Interest (Art 6(1)(f)) | Documented in DPIA          |
| Record of processing activities          | Maintained                        | Schoolgle updates           |

---

## Lawful Basis

**Article 6(1)(f) — Legitimate Interest** is the primary basis:

- Schools have a legitimate interest in preparing for Ofsted inspection
- Processing is necessary to achieve this purpose (AI analysis of evidence)
- Impact on data subjects is minimal (data processed transiently, output anonymised)
- Balancing test favours processing (educational benefit outweighs minimal risk)

**Alternative: Article 6(1)(a) — Consent** may be used if schools prefer explicit consent flow.

---

## Technical Safeguards

### Access Control

- OAuth 2.0 with read-only scope (`drive.readonly`)
- School admin designates specific folder (not entire Drive)
- Access revocable at any time from Google/Microsoft admin console
- Schoolgle RLS ensures organisation-based data isolation

### Token Security

- Access tokens encrypted at rest in `ofsted_drive_connections`
- Refresh tokens encrypted separately
- Token expiry tracked and refreshed server-side
- Tokens never exposed to client-side code

### Audit Trail

- All scans logged with: who triggered, when, what was scanned
- Evidence matches logged with: confidence, keywords (not content)
- Connection events logged: connect, disconnect, last scan

### Data Retention

- Report cards: Retained while school has active subscription
- Drive connections: Soft-deleted on disconnect (tokens cleared)
- Scan history: Retained for trend analysis, deletable on request
- Document content: **Zero retention** — never stored

---

## School-Side Responsibilities

Schools must:

1. **Update their privacy notice** to mention Schoolgle as a data processor
2. **Designate who** can connect Drive and trigger scans (admin role)
3. **Choose carefully** which folder to connect (only school evidence, not personal files)
4. **Ensure** they have lawful basis to share documents with a processor
5. **Review** the Schoolgle DPA before connecting

---

## Data Subject Rights

| Right                  | How Exercised                                       |
| ---------------------- | --------------------------------------------------- |
| Access (Art 15)        | School admin can view all stored report cards       |
| Rectification (Art 16) | Report cards can be regenerated by re-scanning      |
| Erasure (Art 17)       | School can disconnect Drive + request data deletion |
| Portability (Art 20)   | PDF export of report cards available                |
| Object (Art 21)        | School can disconnect at any time                   |

Note: Since Schoolgle only stores anonymised output, individual pupil data rights are typically handled by the school directly (as data controller), not by Schoolgle (as data processor).
