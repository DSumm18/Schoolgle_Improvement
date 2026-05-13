# Trust Assessor Documentation

**Last Updated:** 2026-04-24

## Quick Links

| Document | Purpose |
|----------|---------|
| [TRUST_ASSESSOR_KNOWLEDGE_BASE.md](../TRUST_ASSESSOR_KNOWLEDGE_BASE.md) | **START HERE** — Product knowledge base, single source of truth |
| [HANDOVER_KPI_DASHBOARD.md](HANDOVER_KPI_DASHBOARD.md) | KPI Dashboard handover (April 2026) |
| [PROMPT_CONTINUE_KPI_DASHBOARD.md](PROMPT_CONTINUE_KPI_DASHBOARD.md) | Agent prompt to continue KPI work |

## Recent Changes

### 2026-04-24: KPI Dashboard Integration
- Created `KpiDashboard` component with 6 KPI cards
- Integrated into Trust Assessor Forensic Review tab
- **KNOWN BUG:** Dashboard visibility varies by school — see handover
- Handover document created for context window limit

### 2026-04-20: School Finance Data
- Imported DfE SFB finance data (235K rows, 20 years)
- Per-pupil cost analysis for Pennine schools

### 2026-04-18: Intra-Year Progression
- Two-spreadsheet connector (mid-year + autumn term)
- Per-school Data Summary parser
- Reliability tier system (External/Derived/Self-reported)

## Component Structure

```
apps/platform/src/
├── app/(dashboard)/dashboard/school-improvement/trust-assessor/
│   └── page.tsx                          # Main page (4000+ lines)
├── components/
│   ├── trust-assessor/
│   │   ├── SchoolTabTabs.tsx             # 5-tab layout
│   │   ├── EditableText.tsx              # Track-changes editing
│   │   ├── HideableCard.tsx              # Collapsible sections
│   │   ├── CohortPassport.tsx            # Cohort validation visualization
│   │   └── PupilCardGrid.tsx             # Per-pupil cards
│   └── intelligence/
│       └── KpiDashboard.tsx              # NEW: KPI dashboard
└── lib/trust-analysis/
    ├── types.ts                          # PENNINE_SCHOOLS, URN_PREDECESSORS
    ├── demographic-expectations.ts       # Prediction model
    ├── research-citations.ts             # 14 research citations
    └── report-templates/
        └── governor-assessment.ts        # HTML report generator
```

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/intelligence/la-benchmarks?urn={urn}` | LA benchmark data |
| `/api/intelligence/demographic-cohort?urn={urn}` | Similar schools cohort |
| `/api/trust-analysis/*` | Trust-specific analysis |
| `/api/trust-assessor/*` | Assessor endpoints |

## Testing

- **Playwright tests:** See `test-kpi-*.spec.ts` files in project root
- **Dev auth:** Use `scripts/dev-auth/bootstrap.ts` for testing without real login
- **Manual verification required** — tests hit auth limits

## For New Developers

1. Read `TRUST_ASSESSOR_KNOWLEDGE_BASE.md` first
2. Understand the 3-tier data model (Free/Paid/Premium)
3. Note the research-backed requirement (every finding cites a source)
4. Customer sensitivity: exploratory tone, not accusatory
