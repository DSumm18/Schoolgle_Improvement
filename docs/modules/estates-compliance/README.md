# Estates Compliance Module - Summary & Next Actions

**Status:** Planning Complete
**Date:** 2026-01-23
**Phase:** Ready to Start Development

---

## What We've Created

### Documentation Created

| Document | Purpose | Status |
|----------|---------|--------|
| `implementation-plan.md` | Comprehensive implementation plan with database schema, phases, file structure | âœ… Complete |
| `architecture-diagram.md` | Visual representations of architecture, data flows, user journeys | âœ… Complete |
| `20260123_estates_compliance_phase1.sql` | Database migration for Phase 1 (shared infrastructure) | âœ… Complete |
| `feature-description.md` | **Marketing-ready product descriptions** - accurate to what we're building | âœ… Complete |
| `statutory-vs-good-practice.md` | **Critical differentiator** - distinguishing statutory from good practice | âœ… Complete |
| `estates-strategy-budget-planning.md` | **Budget planning & estates strategy** - 3-year planning horizon | âœ… Complete |
| `market-research-template.md` | Template for competitive analysis | âœ… Complete |
| `market-research-findings.md` | Actual research findings (Every, Parago, iAM Compliant) | âœ… Complete |
| `domain-mapping.md` | All 9 compliance domains mapped with skill requirements | âœ… Complete |
| `workflows-and-integration.md` | Detailed workflows, contractor management, role-based auth | âœ… Complete |

---

## Key Decisions Made

### 1. Modular Architecture

**Decision:** Independent but linked modules

- **Shared modules** (used by all domains): Assets, Contractors, Helpdesk, Calendar, Documents, Reports
- **Domain modules** (independent): Legionella, Fire, Asbestos, Electrical, Mechanical, Water, Lift/LOLER, Playground, Accessibility

**Rationale:** Allows iterative development, easier testing, reusability across modules

### 2. MVP Focus

**Decision:** Legionella as pilot domain

- Start with Legionella (weekly flush, monthly inspection)
- Prove the architecture works
- Expand to other domains using same patterns

**Rationale:** Small enough to ship quickly, complex enough to test everything

### 3. Mobile-First Approach

**Decision:** Native mobile app (React Native)

- Not just mobile-responsive
- Offline mode for field workers
- Camera integration for photos
- QR/barcode scanner
- Voice input (Edwina)

**Rationale:** User research showed "no native mobile app" is a top complaint

### 4. Unified Helpdesk

**Decision:** Single helpdesk across ALL Schoolgle modules

- Estates, HR, Finance, Teaching & Learning, Safeguarding
- Email-to-ticket conversion
- AI categorization
- Cross-module visibility

**Rationale:** Simplifies staff experience, centralizes all facilities/issues

### 5. Contractor Integration

**Decision:** End-to-end contractor workflow

- Appointment booking
- Secure document upload (unique links)
- AI processing of reports
- Auto-detection of findings
- Integrated with helpdesk

**Rationale:** Removes manual coordination, reduces errors

---

## What's in Phase 1 (Foundation)

### Database Tables

| Table | Purpose | Shared? |
|-------|---------|---------|
| `estates_assets` | Asset register | âœ… Yes |
| `estates_contractors` | Contractor register | âœ… Yes |
| `estates_contracts` | Contract register | âœ… Yes |
| `estates_user_qualifications` | Qualification tracking | âœ… Yes |
| `estates_delegations` | Delegation management | âœ… Yes |
| `estates_compliance_tasks` | All tasks across domains | âœ… Yes |
| `estates_helpdesk_tickets` | Unified ticket system | âœ… Yes |
| `estates_helpdesk_comments` | Ticket comments | âœ… Yes |
| `estates_helpdesk_activity` | Ticket activity log | âœ… Yes |
| `estates_notification_templates` | Notification templates | âœ… Yes |

### Storage Buckets

- `estates-documents` - Certificates, reports (50MB limit)
- `estates-images` - Photos, evidence (20MB limit)

### Extended Tables

- `organization_members` - Added `compliance_role`
- `organizations` - Added `compliance_rag_status`, `compliance_last_review`
- `actions` - Added `compliance_task_id`
- `estates_compliance_tasks` - Extended with `findings_classified` (statutory vs good practice)

### Additional Table (Budget Planning - NEW)

- `estates_budget_items` - Budget planning and estates strategy
  - Links findings to budget line items
  - Multi-year planning (3-5 years)
  - Classification: statutory, good practice, optional
  - Cost estimates and actuals
  - Governor report generation

---

## What's in Phase 2 (Legionella MVP)

### Additional Table

- `estates_legionella_outlets` - Domain-specific outlets

### Features

- Outlet registration with QR codes
- Weekly flush flow (mobile-first, Ed guided)
- Monthly inspection contractor workflow
- Temperature recording with validation (cold <20Â°C, hot >50Â°C)
- Authorization checks (delegations, qualifications)
- Risk assessment
- Findings detection and management
- Compliance dashboard (RAG status)
- Governor reports
- Logbook export (PDF)
- Native mobile app (iOS/Android)

---

## How Modules Link Together

```
Assets â†â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚                               â”‚
        â”‚ asset_id                      â”‚ linked_task_id
        â–¼                               â”‚
Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
        â”‚                       â”‚      â”‚
        â”‚ assigned_to           â”‚      â”‚
        â–¼                       â”‚      â”‚
Users (auth.users)              â”‚      â”‚
        â”‚                       â”‚      â”‚
        â”‚ user_id               â”‚      â”‚
        â–¼                       â”‚      â”‚
Qualifications                  â”‚      â”‚
Delegations                      â”‚      â”‚
                                 â”‚      â”‚
                                 â”‚      â”‚
Contractors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
        â”‚                              â”‚
        â”‚ contractor_id                â”‚
        â–¼                              â”‚
Contracts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
        â”‚                       â”‚      â”‚
        â”‚ asset_ids[]           â”‚      â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
                                       â”‚
Helpdesk Tickets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚
        â”œâ”€ asset_id
        â”œâ”€ task_id
        â”œâ”€ contractor_id
        â””â”€ contract_id
```

---

## Development Roadmap

### Week 1-2: Phase 1 Foundation

**Goal:** Core shared infrastructure

1. **Database**
   - [ ] Run migration `20260123_estates_compliance_phase1.sql`
   - [ ] Verify all tables created
   - [ ] Test RLS policies
   - [ ] Create storage buckets

2. **Backend Services**
   - [ ] AssetService (CRUD)
   - [ ] ContractorService (CRUD)
   - [ ] ContractService (CRUD)
   - [ ] TaskService (CRUD, scheduling)
   - [ ] QualificationService (authorization checks)
   - [ ] DelegationService
   - [ ] HelpdeskService (CRUD, email integration)

3. **Shared UI Components**
   - [ ] AssetCard, AssetRegister
   - [ ] ContractorCard, ContractorRegister
   - [ ] TaskCard, TaskList, TaskCreationModal
   - [ ] HelpdeskTicketForm, TicketList, TicketDetail
   - [ ] RAGStatusBadge
   - [ ] CalendarView
   - [ ] ComplianceDashboard

4. **API Routes**
   - [ ] `/api/estates/assets`
   - [ ] `/api/estates/contractors`
   - [ ] `/api/estates/tasks`
   - [ ] `/api/estates/helpdesk`
   - [ ] `/api/estates/qualifications`

5. **Authentication**
   - [ ] Compliance role middleware
   - [ ] Qualification check middleware
   - [ ] Delegation validation

### Week 3-4: Phase 2 Legionella MVP

**Goal:** First working domain with AI skills

1. **Database (Domain)**
   - [ ] Create `estates_legionella_outlets` table
   - [ ] Seed example outlets
   - [ ] Create task templates

2. **Legionella UI**
   - [ ] Outlet registration form
   - [ ] Outlet list with QR codes
   - [ ] Weekly flush flow (mobile)
   - [ ] Monthly inspection flow
   - [ ] Temperature recording form
   - [ ] Risk assessment form
   - [ ] Compliance dashboard
   - [ ] Reports page

3. **AI Skills Package**
   - [ ] Create `skill-legionella` package
   - [ ] Implement MCP tools:
     - `check_flush_requirement`
     - `validate_temperature`
     - `check_authorization`
     - `create_finding`
   - [ ] Knowledge pack (HSE L8)
   - [ ] Conversation flows

4. **Mobile App (React Native)**
   - [ ] Project setup (Expo)
   - [ ] Auth integration
   - [ ] Task list
   - [ ] Flush flow
   - [ ] Camera integration
   - [ ] Offline mode
   - [ ] QR scanner

### Week 5-6: Phase 3 Fire Safety

**Goal:** Second domain (prove patterns)

1. Database: Fire tables
2. UI: Fire safety workflows
3. AI: skill-fire-safety package
4. Mobile: Extend with fire workflows

### Week 7+: Phase 4 Additional Domains

**Sequence:** Asbestos â†’ Electrical â†’ Mechanical â†’ Water â†’ Lift/LOLER â†’ Playground â†’ Accessibility

---

## What Makes Us Different

### MAJOR DIFFERENTIATORS (No one else does this)

| Differentiator | What It Means | Why It Matters |
|----------------|---------------|----------------|
| **Statutory vs Good Practice** | Every finding classified as ðŸ”´ Statutory, ðŸŸ¡ Good Practice, or ðŸ”µ Optional | Schools only spend on what's legally required. Budgets go further. |
| **Source Attribution** | Every requirement cites its source (HSE L8, RRO 2005, etc.) | Not "fluffy" advice - actual legislation with links. |
| **Estates Strategy & Budget Planning** | Day-to-day findings feed into 3-5 year budget plans | No more surprise expenditures. Evidence-based budgeting. |
| **Contractor Validation** | AI checks contractor reports against actual regulations | Catch upselling. Make informed decisions. |

### Feature Comparison vs Competitors

| Feature | Competitors | Schoolgle |
|---------|-------------|-----------|
| Statutory vs Good Practice | âŒ Not distinguished | âœ… Clearly separated |
| Source Attribution | âŒ Rarely shown | âœ… Always cited (HSE, legislation) |
| Budget Planning | âŒ Not included | âœ… Built-in 3-year planning |
| Mobile app | âŒ Web-only or poor apps | âœ… Native iOS/Android with offline |
| Logbook export | âŒ Digital-only | âœ… Print/export for physical logbook |
| Expert guidance | âŒ Limited help files | âœ… Ed AI expert always available |
| Authorization | âŒ No qualification tracking | âœ… Role-based authorization checks |
| Contractors | âŒ Manual coordination | âœ… End-to-end workflow with AI |
| Helpdesk | âŒ Module-specific | âœ… Unified across ALL modules |
| Voice input | âŒ No | âœ… Edwina voice support |
| QR scanning | âŒ Limited | âœ… Full QR/barcode support |

---

## Immediate Next Actions

### 1. Review & Approve

- [ ] Review implementation plan
- [ ] Review database migration
- [ ] Approve architecture approach
- [ ] Confirm MVP scope (Legionella only)

### 2. Setup

- [ ] Create `apps/platform/src/app/(dashboard)/estates-compliance/` directory structure
- [ ] Create `apps/platform/src/components/estates-compliance/` directory structure
- [ ] Create `apps/platform/src/lib/estates-compliance/` directory structure
- [ ] Create `packages/skills-estates-compliance/` directory structure

### 3. Database

- [ ] Run migration: `supabase db push` or run SQL in Supabase dashboard
- [ ] Verify tables created
- [ ] Test RLS policies
- [ ] Create storage buckets

### 4. Start Development

- [ ] Begin Phase 1: Asset register (simplest, proves patterns)
- [ ] Build AssetService
- [ ] Build AssetRegister UI component
- [ ] Test CRUD operations
- [ ] Add QR code generation

---

## File Structure to Create

```
apps/platform/src/
â”œâ”€â”€ app/(dashboard)/estates-compliance/
â”‚   â”œâ”€â”€ page.tsx                          # Dashboard
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â”œâ”€â”€ page.tsx
â”‚   â”‚   â””â”€â”€ new/page.tsx
â”‚   â”œâ”€â”€ contractors/
â”‚   â”‚   â”œâ”€â”€ page.tsx
â”‚   â”‚   â””â”€â”€ new/page.tsx
â”‚   â”œâ”€â”€ tasks/
â”‚   â”‚   â”œâ”€â”€ page.tsx
â”‚   â”‚   â””â”€â”€ [id]/page.tsx
â”‚   â””â”€â”€ helpdesk/
â”‚       â”œâ”€â”€ page.tsx
â”‚       â””â”€â”€ new/page.tsx
â”‚
â”œâ”€â”€ components/estates-compliance/
â”‚   â”œâ”€â”€ shared/
â”‚   â”‚   â”œâ”€â”€ AssetCard.tsx
â”‚   â”‚   â”œâ”€â”€ AssetRegister.tsx
â”‚   â”‚   â”œâ”€â”€ TaskCard.tsx
â”‚   â”‚   â””â”€â”€ RAGStatusBadge.tsx
â”‚   â””â”€â”€ legionella/
â”‚       â””â”€â”€ (Phase 2)
â”‚
â””â”€â”€ lib/estates-compliance/
    â”œâ”€â”€ database/
    â”‚   â”œâ”€â”€ assets.ts
    â”‚   â”œâ”€â”€ contractors.ts
    â”‚   â””â”€â”€ tasks.ts
    â””â”€â”€ services/
        â”œâ”€â”€ AssetService.ts
        â””â”€â”€ ContractorService.ts

packages/skills-estates-compliance/
â”œâ”€â”€ skill-legionella/
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ mcp-tools.ts
â”‚   â””â”€â”€ knowledge-pack.ts
â””â”€â”€ shared-skills/
    â”œâ”€â”€ skill-compliance-basics/
    â””â”€â”€ skill-contractor-management/
```

---

## Questions to Resolve

1. **Mobile App Framework:** Confirm React Native with Expo is acceptable (or prefer something else?)

2. **AI Model Selection:** Current stack uses OpenRouter with approved-provider models. Should we use same for Estates Compliance?

3. **Email Integration:** For helpdesk email-to-ticket, do we have email infrastructure or need to set up?

4. **QR Code Generation:** Any preference on library? (React QR Code seems standard)

5. **Offline Sync Strategy:** For mobile app, how aggressive should we be with offline mode? (Queue everything, or sync first when possible?)

6. **Voice Input:** Edwina TTS - should we integrate immediately or Phase 2?

---

## Success Criteria for MVP

### Phase 1 (Foundation)
- [ ] All database tables created and tested
- [ ] Asset register functional (CRUD)
- [ ] Contractor register functional (CRUD)
- [ ] Task scheduling framework working
- [ ] Helpdesk functional with email-to-ticket
- [ ] RAG status dashboard working

### Phase 2 (Legionella)
- [ ] Outlet registration working
- [ ] Weekly flush flow complete on mobile
- [ ] Ed AI guidance integrated
- [ ] Temperature validation working
- [ ] Authorization checks functional
- [ ] Contractor booking workflow complete
- [ ] Findings auto-detection working
- [ ] Governor reports generating
- [ ] Logbook export working

---

## Contact & Review

**Document Owner:** Product Team
**Review Date:** 2026-01-23
**Next Review:** After Phase 1 completion

**Questions?** See:
- `implementation-plan.md` for detailed technical plan
- `architecture-diagram.md` for visual representations
- `feature-description.md` for marketing-ready product descriptions
- `statutory-vs-good-practice.md` for the statutory classification framework
- `estates-strategy-budget-planning.md` for budget planning features
- `workflows-and-integration.md` for workflow details
- `market-research-findings.md` for competitor analysis


