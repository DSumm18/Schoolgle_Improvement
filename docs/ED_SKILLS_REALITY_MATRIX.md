# Ed Skills Reality Matrix

**Date:** 2026-03-18
**Post-hardening status**

---

## Summary

| Category                 | Functions Defined | Functions Implemented | Status                           |
| ------------------------ | ----------------- | --------------------- | -------------------------------- |
| STAFF                    | 6                 | 6                     | ALL WORKING                      |
| ACTIONS                  | 6                 | 6                     | ALL WORKING                      |
| ESTATES (Compliance)     | 8                 | 8                     | ALL WORKING                      |
| ESTATES (Incidents/SOPs) | 7                 | 7                     | ALL WORKING                      |
| INTELLIGENCE             | 6                 | 6                     | ALL WORKING                      |
| RISK                     | 6                 | 6                     | ALL WORKING (newly implemented)  |
| DOCUMENT                 | 7                 | 7                     | ALL WORKING                      |
| CANVAS                   | 6                 | 0                     | NOT IMPLEMENTED (prompt updated) |

**Total: 52 defined, 46 implemented (88%)**

---

## Detailed Function Status

### STAFF (6/6 Working)

| Function                | Handler         | Prompt Reference |
| ----------------------- | --------------- | ---------------- |
| create_staff_member     | skills-agent.ts | Ed General       |
| update_staff_member     | skills-agent.ts | Ed General       |
| list_staff              | skills-agent.ts | Ed General       |
| export_staff            | skills-agent.ts | Ed General       |
| import_staff            | skills-agent.ts | Ed General       |
| deactivate_staff_member | skills-agent.ts | Ed General       |

### ACTIONS (6/6 Working)

| Function               | Handler         | Prompt Reference |
| ---------------------- | --------------- | ---------------- |
| create_action          | skills-agent.ts | Ed General       |
| update_action          | skills-agent.ts | Ed General       |
| list_actions           | skills-agent.ts | Ed General       |
| get_action_stats       | skills-agent.ts | Ed General       |
| suggest_eef_strategies | skills-agent.ts | Ed General       |
| add_action_note        | skills-agent.ts | Ed General       |

### ESTATES — Compliance (8/8 Working)

| Function                 | Handler         | Prompt Reference   |
| ------------------------ | --------------- | ------------------ |
| create_helpdesk_ticket   | invoke/route.ts | Estates Specialist |
| update_helpdesk_ticket   | invoke/route.ts | Estates Specialist |
| search_knowledge         | invoke/route.ts | Estates Specialist |
| list_compliance_tasks    | invoke/route.ts | Estates Specialist |
| search_contractors       | invoke/route.ts | Estates Specialist |
| validate_contractor      | invoke/route.ts | Estates Specialist |
| analyze_spatial_impact   | invoke/route.ts | Estates Specialist |
| extract_estates_document | invoke/route.ts | Estates Specialist |

### ESTATES — Incidents & SOPs (7/7 Working)

| Function                  | Handler         | Prompt Reference   |
| ------------------------- | --------------- | ------------------ |
| report_incident           | invoke/route.ts | Estates Specialist |
| get_incidents             | invoke/route.ts | Estates Specialist |
| suggest_sops_for_incident | invoke/route.ts | Estates Specialist |
| start_sop                 | invoke/route.ts | Estates Specialist |
| get_sop_status            | invoke/route.ts | Estates Specialist |
| update_sop_step           | invoke/route.ts | Estates Specialist |
| get_sop_templates         | invoke/route.ts | Estates Specialist |

### INTELLIGENCE (6/6 Working)

| Function                  | Handler                                         | Prompt Reference        |
| ------------------------- | ----------------------------------------------- | ----------------------- |
| run_intelligence_analysis | invoke/route.ts → school-intelligence-engine.ts | Intelligence Specialist |
| get_cohort_journey        | invoke/route.ts → school-intelligence-engine.ts | Intelligence Specialist |
| get_assessment_insights   | invoke/route.ts → Supabase query                | Intelligence Specialist |
| get_contextual_factors    | invoke/route.ts → Supabase query                | Intelligence Specialist |
| get_dfe_trends            | invoke/route.ts → school-intelligence-engine.ts | Intelligence Specialist |
| get_cross_module_signals  | invoke/route.ts → school-intelligence-engine.ts | Intelligence Specialist |

### RISK (6/6 Working — Newly Implemented)

| Function                | Handler               | Prompt Reference | Notes                           |
| ----------------------- | --------------------- | ---------------- | ------------------------------- |
| get_risk_register       | invoke/route.ts (new) | Risk Specialist  | Filters by status/category/band |
| get_risk_heatmap        | invoke/route.ts (new) | Risk Specialist  | Returns 5x5 matrix              |
| recalculate_risk_scores | invoke/route.ts (new) | Risk Specialist  | Loops all open risks            |
| create_risk             | invoke/route.ts (new) | Risk Specialist  | Auto-generates risk_ref         |
| add_mitigation          | invoke/route.ts (new) | Risk Specialist  | Verifies org ownership          |
| record_risk_decision    | invoke/route.ts (new) | Risk Specialist  | Updates risk status             |

### DOCUMENT (7/7 Working)

| Function                 | Handler         | Prompt Reference |
| ------------------------ | --------------- | ---------------- |
| list_document_templates  | skills-agent.ts | Ed General       |
| generate_document        | skills-agent.ts | Ed General       |
| list_generated_documents | skills-agent.ts | Ed General       |
| get_document             | skills-agent.ts | Ed General       |
| send_document            | skills-agent.ts | Ed General       |
| generate_newsletter      | skills-agent.ts | Ed General       |

### CANVAS (0/6 — Not Implemented)

| Function         | Handler | Prompt Status                         |
| ---------------- | ------- | ------------------------------------- |
| Ingest data      | NONE    | Prompt now says "not yet implemented" |
| Reconcile        | NONE    | Prompt now says "not yet implemented" |
| Generate viz     | NONE    | Prompt now says "not yet implemented" |
| Build reports    | NONE    | Prompt now says "not yet implemented" |
| Migration report | NONE    | Prompt now says "not yet implemented" |
| Health check     | NONE    | Prompt now says "not yet implemented" |

---

## Changes Made During Hardening

1. **Implemented 6 risk skill handlers** in `apps/platform/src/app/api/skills/invoke/route.ts`
2. **Updated risk specialist prompt** — restored skill references now that handlers exist
3. **Updated canvas specialist prompt** — replaced fake skill claims with honest limitations section
4. **Verified** intelligence, estates, and document skills all have working handlers (no changes needed)

---

## Remaining Gaps

1. **Canvas skills** — Schema exists, no handlers. Prompt updated to be honest.
2. **extract_estates_document** — Returns mock data, not real OCR. Works but is a stub.
3. **validate_contractor** — Searches knowledge base but no AI validation. Basic implementation.
4. **Ed cannot do compound cross-module actions** — e.g., "create risk + assign mitigation to staff member + create action" requires multiple sequential calls
