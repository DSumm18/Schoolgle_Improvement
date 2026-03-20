# Pilot Golden Journeys — Validation Results

**Date:** 2026-03-19
**Method:** Source code analysis of UI pages, API routes, and database schema. Runtime testing not performed (requires live environment).

---

## Validation Approach

Each journey is assessed based on:

- Whether the UI page exists and has real data fetching
- Whether the API route has real CRUD handlers with org scoping
- Whether the database schema supports the data model
- Whether empty/loading/error states exist
- Whether demo data masking is present
- Whether file upload/download paths exist where relevant

**Legend:** PASS = end-to-end code path exists and is sound | PARTIAL = some gaps | FAIL = broken or missing

---

## Journey 1: Create a Risk, Edit, Recalculate, Add Mitigation, Review Later

| Step                     | Status | Evidence                                                                                       |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------- |
| Create risk via UI       | PASS   | `/dashboard/risk` has "Add Risk" button, POST `/api/risk` creates with auto-generated risk_ref |
| Edit risk                | PASS   | PUT `/api/risk/[id]` updates, expandable detail row in UI                                      |
| Recalculate score        | PASS   | Ed skill `recalculate_risk_scores` implemented; API also available via `/api/risk/score`       |
| Add mitigation           | PASS   | Ed skill `add_mitigation` implemented; UI has mitigations in risk detail                       |
| Review later             | PASS   | Data persists in `risk_register` table, org-scoped query on page load                          |
| Heatmap reflects changes | PASS   | GET `/api/risk/heatmap` returns live 5x5 matrix                                                |
| Ed integration           | PASS   | 6 risk skills all implemented and wired                                                        |

**Result: PASS**

---

## Journey 2: Log an Estates/Compliance Issue and Retrieve Later

| Step                     | Status | Evidence                                                           |
| ------------------------ | ------ | ------------------------------------------------------------------ |
| Create helpdesk ticket   | PASS   | UI at `/estates-compliance/helpdesk`, POST `/api/estates/helpdesk` |
| Add details and priority | PASS   | Form fields for priority, description, location, category          |
| Save and confirm         | PASS   | Ticket created in `estates_helpdesk_tickets` table                 |
| Retrieve later           | PASS   | GET `/api/estates/helpdesk` returns org-scoped list                |
| View ticket detail       | PASS   | `/estates-compliance/helpdesk/[ticketId]` detail page              |
| Add comments             | PASS   | POST `/api/estates/helpdesk/[id]/comments`                         |
| Update status            | PASS   | PUT `/api/estates/helpdesk/[id]` with status change                |

**Result: PASS**

---

## Journey 3: Upload a File/Image/Evidence to a Record

| Step                      | Status  | Evidence                                                                                         |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Navigate to evidence page | PASS    | `/estates-compliance/evidence` and `/estates-compliance/evidence/upload`                         |
| Upload file               | PARTIAL | POST `/api/estates/evidence` handles upload, multiple sources (upload, Drive, OneDrive)          |
| File type validation      | FAIL    | No MIME type whitelist on evidence uploads (security finding from Phase 1)                       |
| Link to record            | PASS    | Evidence linked to compliance domain, expiry date, title                                         |
| Retrieve later            | PASS    | GET `/api/estates/evidence` returns org-scoped list                                              |
| Open/download file        | PARTIAL | File metadata stored, actual file retrieval depends on storage backend (not verified at runtime) |
| Permissions               | PASS    | Uses `protectedRoute` with caretaker role minimum                                                |

**Result: PARTIAL** — Upload path exists but file type validation missing and actual file storage/retrieval needs runtime verification.

---

## Journey 4: Create a Meeting/Action and Confirm Follow-up Visibility

| Step                        | Status  | Evidence                                                                                        |
| --------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| Create meeting              | PASS    | POST `/api/meetings` with template, attendees, date                                             |
| Add attendees               | PASS    | `meeting_attendees` table with multi-attendee support                                           |
| Start meeting               | PASS    | POST `/api/meetings/[id]/start`                                                                 |
| Complete meeting            | PASS    | POST `/api/meetings/[id]/complete`                                                              |
| Generate minutes            | PASS    | POST `/api/meetings/[id]/minutes`                                                               |
| Digital signature           | PASS    | POST `/api/meetings/[id]/sign`                                                                  |
| Create follow-up action     | PARTIAL | Action can be created via Actions Hub, but no direct "create action from meeting" link verified |
| Action visible in dashboard | PASS    | Actions appear in unified tasks aggregation                                                     |

**Result: PASS** (with caveat: meeting→action link is indirect, not a single-click flow)

---

## Journey 5: Retrieve a School Intelligence Insight

| Step                     | Status | Evidence                                                                             |
| ------------------------ | ------ | ------------------------------------------------------------------------------------ |
| Navigate to intelligence | PASS   | `/dashboard/intelligence` or via Ed skill                                            |
| Run analysis             | PASS   | `run_intelligence_analysis` skill calls `SchoolIntelligenceEngine.runFullAnalysis()` |
| View cohort journey      | PASS   | `get_cohort_journey` traces year groups with COVID impact                            |
| View DfE trends          | PASS   | `get_dfe_trends` queries attendance, census, KS2, workforce, exclusions              |
| EEF recommendations      | PASS   | 33 strategies matched by keyword, ranked by impact × evidence                        |
| Pupil assessment upload  | PASS   | CSV upload with HMAC-SHA256 pseudonymisation                                         |
| Data dependency          | CAVEAT | Requires DfE warehouse data and/or uploaded assessment data to be meaningful         |

**Result: PASS** (conditional on data availability)

---

## Journey 6: Access Staff Directory and Confirm Details

| Step                        | Status | Evidence                                                    |
| --------------------------- | ------ | ----------------------------------------------------------- |
| Navigate to staff directory | PASS   | `/dashboard/hr/people`                                      |
| View staff list             | PASS   | GET `/api/staff` with org scoping                           |
| Search/filter staff         | PASS   | Client-side search in UI                                    |
| View staff detail           | PASS   | `/dashboard/hr/people/[id]` detail page                     |
| Add new staff member        | PASS   | Modal-based creation form                                   |
| Import staff CSV            | PASS   | Robust CSV import with template, fuzzy role matching, dedup |
| Export staff CSV            | PASS   | GET `/api/staff/import` returns CSV download                |
| Edit staff                  | PASS   | Modal with pre-populated fields                             |
| Delete/archive staff        | PASS   | Confirmation dialog, soft-delete via `is_active: false`     |

**Result: PASS**

---

## Journey 7: Complete a Survey Flow and Review Responses

| Step                  | Status | Evidence                                         |
| --------------------- | ------ | ------------------------------------------------ |
| Create survey         | PASS   | POST `/api/surveys` with type, audience, title   |
| Add pages/questions   | PASS   | POST `/api/surveys/[id]/pages` and `/questions`  |
| AI-generate questions | PASS   | Separate dialog with AI prompt input             |
| Distribute survey     | PASS   | POST `/api/surveys/[id]/distribute`              |
| Collect responses     | PASS   | POST `/api/surveys/[id]/responses`               |
| View results          | PASS   | `/dashboard/surveys/[id]/results` with analytics |
| AI analysis           | PASS   | POST `/api/surveys/[id]/analyze`                 |
| Export results        | PASS   | POST `/api/surveys/[id]/export`                  |

**Result: PASS**

---

## Journey 8: Store and Retrieve a Document

| Step                   | Status | Evidence                                                                  |
| ---------------------- | ------ | ------------------------------------------------------------------------- |
| Browse templates       | PASS   | GET `/api/documents/templates` returns 38 templates                       |
| Generate document      | PASS   | POST `/api/documents/generate` with template + placeholders               |
| Placeholder resolution | PASS   | Auto-resolves from Staff, Org, Meetings, Absence, Contractors (6 sources) |
| View/edit draft        | PASS   | `/dashboard/documents/[id]` detail page                                   |
| Finalise document      | PASS   | PUT `/api/documents/[id]/finalise`                                        |
| Send document          | PASS   | POST `/api/documents/[id]/send` via email                                 |
| Retrieve later         | PASS   | GET `/api/documents` with status filter                                   |

**Result: PASS**

---

## Journey 9: Validate School Onboarding Dataset

| Step                        | Status  | Evidence                                                                                                                             |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Sign up and select school   | PASS    | 3-step onboarding with DfE GIAS lookup                                                                                               |
| Organisation auto-populated | PASS    | Name, address, phone, email, website, LA, phase from DfE                                                                             |
| Church school detected      | PASS    | SIAMS features auto-enabled                                                                                                          |
| Import staff CSV            | PASS    | Robust import with validation and dedup                                                                                              |
| Import org users            | PASS    | CSV preview with role validation                                                                                                     |
| Set up class assignments    | PASS    | Manual UI with year group, term, FTE, role                                                                                           |
| See populated dashboard     | PARTIAL | Dashboard shows announcements/events but no "setup completion %" widget                                                              |
| Module data visible         | PARTIAL | Modules that are systems of record start empty with good CTAs. Modules needing import data (attendance, SEND) show demo data instead |

**Result: PARTIAL** — Onboarding works well. Post-onboarding "what to do next" guidance is missing. Demo data in pupil-dependent modules is misleading.

---

## Journey 10: Imported Data Supports Connected Workflows

| Step                                          | Status  | Evidence                                                                          |
| --------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| Staff import populates directory              | PASS    | CSV → `staff_directory` table                                                     |
| Staff appear in meeting attendee picker       | PARTIAL | Meetings reference staff but unclear if import triggers attendee auto-populate    |
| Staff appear in document placeholder resolver | PASS    | Document generation resolves `staff_name`, `staff_email`, etc. from live queries  |
| Class assignments link staff to year groups   | PASS    | `staff_class_assignments` table with role, term, FTE                              |
| Finance import populates budget views         | PARTIAL | Import endpoint functional but dashboard shows demo data instead of imported data |
| Unified tasks aggregate across modules        | PASS    | `/api/tasks` aggregates from actions, estates, compliance, risk, training         |

**Result: PARTIAL** — Staff import integrates well. Finance import doesn't connect to dashboard. No pupil import exists.

---

## Summary

| Journey                    | Result  | Blocker                                                             |
| -------------------------- | ------- | ------------------------------------------------------------------- |
| 1. Risk lifecycle          | PASS    | —                                                                   |
| 2. Estates issue lifecycle | PASS    | —                                                                   |
| 3. File/evidence upload    | PARTIAL | File type validation missing; storage retrieval untested at runtime |
| 4. Meeting → action        | PASS    | Meeting-to-action link is indirect                                  |
| 5. Intelligence insight    | PASS    | Requires data to be populated                                       |
| 6. Staff directory         | PASS    | —                                                                   |
| 7. Survey lifecycle        | PASS    | —                                                                   |
| 8. Document lifecycle      | PASS    | —                                                                   |
| 9. School onboarding       | PARTIAL | No setup wizard; demo data in pupil modules                         |
| 10. Connected data flows   | PARTIAL | Finance dashboard disconnected; no pupil import                     |

**7/10 PASS, 3/10 PARTIAL, 0/10 FAIL**
