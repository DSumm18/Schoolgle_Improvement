# Partial Data Degradation Assessment

**Date:** 2026-03-19
**Question:** What happens when a school provides incomplete data? Does Schoolgle degrade gracefully or mislead?

---

## Scenarios Tested

### Scenario 1: Staff imported, no pupils

| Module          | Behaviour                                           | Assessment |
| --------------- | --------------------------------------------------- | ---------- |
| Staff Directory | Shows 32 staff, fully functional                    | GOOD       |
| Risk Register   | Empty heatmap with "Add Risk" CTA                   | GOOD       |
| Compliance      | 36 templates available, ready to create policies    | GOOD       |
| Governance      | Empty board with "Add Governors" CTA                | GOOD       |
| Meetings        | Can create meetings, attendees from staff list      | GOOD       |
| Documents       | Can generate from 38 templates, staff data resolves | GOOD       |
| Surveys         | Fully functional without pupil data                 | GOOD       |
| Attendance      | Demo data with banner: "Sample data"                | ACCEPTABLE |
| SEND            | Demo data with banner: "Demo Mode"                  | ACCEPTABLE |
| Behaviour       | Demo data with banner: "Sample Data"                | ACCEPTABLE |
| Ed AI           | Can manage staff, create risks, generate documents  | GOOD       |
| Intelligence    | "No assessment data available" — honest             | GOOD       |
| Setup wizard    | Shows 1/5 complete (Staff ✓)                        | GOOD       |

**Verdict:** Platform is fully usable for system-of-record modules. Pupil-dependent modules honestly show demo data.

### Scenario 2: Pupils imported, no staff

| Module          | Behaviour                                                             | Assessment |
| --------------- | --------------------------------------------------------------------- | ---------- |
| Staff Directory | Empty list with "Add staff" CTA                                       | GOOD       |
| Attendance      | If pupils exist in `pupils` table, still shows demo (separate stores) | MISLEADING |
| Documents       | `{{staff_name}}` resolves to empty — blank placeholder                | FRAGILE    |
| Meetings        | No attendee suggestions (staff list empty)                            | ACCEPTABLE |
| Ed AI           | Can list pupils via `/api/pupils`. Cannot reference staff             | ACCEPTABLE |

**Verdict:** Pupils-without-staff is unusual but handled. Attendance doesn't auto-populate from `pupils` table — this is the biggest expectation gap.

### Scenario 3: Finance data but no payroll

| Module            | Behaviour                                                        | Assessment |
| ----------------- | ---------------------------------------------------------------- | ---------- |
| Finance dashboard | Budget lines and variances visible (if using client-side parser) | GOOD       |
| ICFP              | Cannot calculate staffing ratios (no payroll data)               | ACCEPTABLE |
| Payroll page      | Empty — shows upload zone                                        | GOOD       |
| Strategic Plan    | Cannot model staffing costs without payroll                      | ACCEPTABLE |

**Verdict:** Finance without payroll is common and handled — ICFP features simply don't calculate.

### Scenario 4: Assessment data but no DfE warehouse

| Module              | Behaviour                                              | Assessment |
| ------------------- | ------------------------------------------------------ | ---------- |
| Intelligence        | Can analyse uploaded assessments for gaps and accuracy | GOOD       |
| Cohort tracking     | Cannot show multi-year trends (needs DfE data)         | ACCEPTABLE |
| EEF recommendations | Still matched from assessment data alone               | GOOD       |
| DfE trends          | "No DfE data available for this school"                | HONEST     |

**Verdict:** Intelligence works with just assessment data. DfE overlay is additive, not required.

### Scenario 5: Google Drive connected but no exports uploaded

| Module           | Behaviour                                                 | Assessment |
| ---------------- | --------------------------------------------------------- | ---------- |
| Data Connections | Shows connected folder with 0 files detected per category | GOOD       |
| Ed AI            | Context shows "0 staff, 0 overdue tasks" — honest         | GOOD       |
| All modules      | Same as "no data" — demo banners or empty states          | GOOD       |

**Verdict:** Empty Drive folder doesn't mislead. System degrades to same state as no connection.

### Scenario 6: Minimal data — only governance set up

| Module            | Behaviour                                                 | Assessment |
| ----------------- | --------------------------------------------------------- | ---------- |
| Governance        | 3 governors added, 1 meeting scheduled — fully functional | GOOD       |
| All other modules | Empty states or demo banners                              | GOOD       |
| Documents         | Can generate governor-related templates with org data     | GOOD       |
| Ed AI             | Can discuss governance, create risks about board gaps     | GOOD       |
| Setup wizard      | Shows 1/5 complete (Governance ✓)                         | GOOD       |

**Verdict:** Even with minimal data, the system provides value in the modules that have data.

### Scenario 7: Historic data — 3 years of assessments

| Module       | Behaviour                                                | Assessment |
| ------------ | -------------------------------------------------------- | ---------- |
| Intelligence | Multi-year cohort tracking with COVID impact adjustment  | GOOD       |
| Trends       | Year-on-year comparison across subjects and demographics | GOOD       |
| EEF          | Recommendations strengthen with more data points         | GOOD       |

**Verdict:** Historic data adds significant value but isn't required for basic operations.

---

## Degradation Patterns

### Graceful (no user confusion)

- Empty module → shows CTA: "Add your first [item]"
- No staff → meetings work without attendee suggestions
- No DfE data → intelligence shows assessment-only analysis
- No finance → risk register still works independently
- Setup wizard tracks progress accurately

### Honest (user informed)

- Demo data → banner clearly visible on Attendance, SEND, Behaviour
- Finance demo → prominent DEMO DATA banner with upload CTA
- Canvas not ready → prompt says "not yet implemented"

### Fragile (could confuse users)

- Pupils imported but attendance still shows demo → **users expect auto-population**
- Staff deleted → documents get blank placeholders → **no warning**
- Drive connected but no import actions → **users expect "Import" buttons**

### Missing (should exist but doesn't)

- No "last imported" date visible on records
- No "source system" badge on imported data
- No freshness warning when data might be stale
- No distinction between source-data fields and Schoolgle-managed fields

---

## Summary

| Scenario               | Graceful? | Honest? | Useful?                                  |
| ---------------------- | --------- | ------- | ---------------------------------------- |
| Staff only             | YES       | YES     | YES — core modules fully operational     |
| Pupils only (no staff) | YES       | YES     | PARTIALLY — some modules need staff      |
| Finance only           | YES       | YES     | YES — budget analysis works standalone   |
| Assessments only       | YES       | YES     | YES — intelligence provides value        |
| Drive connected, empty | YES       | YES     | NO immediate value, but ready for data   |
| Governance only        | YES       | YES     | YES — governance module works standalone |
| Historic multi-year    | YES       | YES     | YES — significantly enriches analysis    |

**Overall degradation handling: 7/10** — Most scenarios handled well. Key gap is pupil-to-attendance expectation mismatch and missing trust signals on imported data.
