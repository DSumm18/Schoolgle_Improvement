# Tasks

## Active

- [ ] **Zod validation on API inputs** - Add schema validation to routes accepting user data. P1
- [ ] **Ofsted EIF 2025 migration** - Migrate UI from legacy 6-category framework to new EIF 2025 types and ratings. P1
- [ ] **Ofsted readiness dashboard** - Build gap analysis view showing evidence coverage per framework area. P1
- [ ] **Google Drive evidence scanning** - Wire up Drive API to auto-scan and match docs to framework. P1

## Waiting On

- [ ] **GoCardless integration** - Webhook/mandate routes have TODOs. Needed for DPO billing
- [ ] **Ofsted SEF auto-generation** - Depends on evidence scanning being complete
- [ ] **Vision AI photo inspections** - Connect to estates module for cross-app image analysis

## Someday

- [ ] **SEND module** - EHCP workflow and provision mapping (currently 1 component)
- [ ] **Ed Parent app** - Parent dashboard with school comms (currently stub)
- [ ] **Ed Staff app** - Teacher quick tools (currently stub)
- [ ] **Sim Studio** - Interactive simulations beyond demo grade
- [ ] **Lesson plan AI generator** - Teaching & Learning module feature
- [ ] **Budget import from SIMS/Arbor** - Finance module feature

## Done

- [x] **Fix API auth middleware** - Applied `protectedRoute` wrapper to ~280+ routes across all domains. Estates (11), governance (8), meetings (10), intelligence (4), surveys (12), compliance items (4), risk (12), org/packs/tasks/teams (20+), SIAMS/ofsted (14), misc (30+). Intentionally public: webhooks, OAuth callbacks, DfE lookups, survey submissions, ed embed/website-chat.
- [x] **Ed AI document skills** - Added DOCUMENT_FUNCTION_SCHEMAS (7 functions) to skills registry: list_document_templates, generate_document, list_generated_documents, get_document, send_document, generate_newsletter. Wired into `/api/skills/invoke` with response formatters in skills-agent.ts.
- [x] **Newsletter generation API** - Built `POST /api/documents/newsletter` with branded HTML output, 9 section types, auto-safeguarding (DSL detection from staff_directory), auto-attendance (DfE 95% threshold messaging), auto-diary dates (next 14 days from meetings). Saves to `generated_documents` table.
- [x] **HR sickness enhancements** - Analytics API, enhanced dashboard/detail pages, phased return planner, OH referral detection, wellbeing resources.
- [x] **Document Production Engine** - Universal cross-module system with 38 templates, handlebars-style placeholders, auto-resolve from 6 data sources, trigger rules.
- [x] **Risk Register & Strategic Plan** - 6 DB tables, 5x5 heat map, dual scoring, trust escalation, ATH 2025 thresholds.
- [x] **Meeting Companion** - Live guided meetings, GDPR-compliant recorder, digital signatures, auto-minutes with branding.
- [x] **School Intelligence Engine** - Cross-module analysis, DfE data, EEF research, zero-knowledge pupil assessment.
- [x] **Website Compliance Scanner** - 28 statutory requirements, 2-phase assessment, Ofsted evidence integration.
- [x] **Compliance Module** - 25 DB tables, 36 templates, 12 sub-routes, DPO service.
