# COSHH Implementation — Show Me Site

**Date:** 2026-03-19
**Status:** First live version deployed

---

## 1. Shared Compliance Workflow Pattern

The COSHH implementation reuses the existing Schoolgle compliance architecture. No parallel tables were created.

### Pattern (reusable across all compliance domains)

```
Domain Registration     → statutory-checks.ts defines checks per domain
                            ↓
Statutory Completions  → estates_statutory_completions (one table, all domains)
                            ↓
Tasks                  → estates_compliance_tasks (scheduled, assigned, tracked)
                            ↓
Evidence               → estates_evidence (photos, docs, certs, linked by domain + task)
                            ↓
Domain-Specific Data   → e.g., coshh_register (product inventory per location)
                            ↓
Show Me Visualisation  → site overlay + room drawer
                            ↓
Ed AI                  → context-aware prompts, evidence analysis, proposed updates
                            ↓
Human Confirmation     → responsible person reviews and approves
                            ↓
Audit Trail            → all changes logged with who, when, what, and why
```

### What this pattern already supports

| Compliance Domain | Domain Code  | Checks Defined | Same Pattern? |
| ----------------- | ------------ | -------------- | ------------- |
| Fire Safety       | `fire`       | 12 checks      | YES           |
| Legionella        | `legionella` | 8 checks       | YES           |
| Asbestos          | `asbestos`   | 6 checks       | YES           |
| Electrical        | `electrical` | 5 checks       | YES           |
| Gas               | `gas`        | 4 checks       | YES           |
| **COSHH**         | `coshh`      | **15 checks**  | **YES**       |
| + 12 more domains | various      | various        | YES           |

All use the same tables: `estates_statutory_completions`, `estates_compliance_tasks`, `estates_evidence`, `estates_delegations`.

### Future domains that can use this exact pattern

- Weekly fire alarm tests → `estates_statutory_completions` with `domain=fire`, `frequency=weekly`
- Internal premises checks → new domain code, same tables
- Emergency lighting flick tests → `domain=electrical`, check type `emergency_lighting_flick`
- Water hygiene routines → `domain=legionella`, existing checks
- External uploaded reports → `estates_evidence` with `source_type=upload`, AI classification via Ed

---

## 2. Data Model / Files Changed

### Existing tables used (no new tables created)

| Table                           | Purpose for COSHH                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `estates_statutory_completions` | 15 COSHH checks (risk assessment, inventory, SDS, training, storage, spill kits, eye wash, disposal) |
| `estates_compliance_tasks`      | Scheduled COSHH tasks with `compliance_domain = 'coshh'`                                             |
| `estates_evidence`              | Photos, SDS files, inspection reports with `compliance_domain = 'coshh'`                             |
| `coshh_register`                | Product inventory (name, GHS codes, storage, quantity, AI scan fields) — **already existed**         |
| `estates_assets`                | Storage locations (cupboards, prep rooms) with `compliance_domains` including `'coshh'`              |
| `estates_delegations`           | COSHH responsible person delegation                                                                  |

### Files changed

| File                                                                | Change                                                                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/platform/src/app/(dashboard)/dashboard/show-me/site/page.tsx` | Added COSHH overlay mode, COSHH banner, 3 COSHH drawer sections, COSHH room identification, COSHH colour logic, COSHH Ed prompts, COSHH statutory checks fetch |

### Files already existing (no changes needed)

| File                                                     | Why it's relevant                                   |
| -------------------------------------------------------- | --------------------------------------------------- |
| `src/lib/estates-compliance/coshh-checks.ts`             | 15 COSHH check definitions already defined          |
| `src/types/estates-compliance.ts`                        | `ComplianceDomain` union already includes `"coshh"` |
| `src/app/api/estates/statutory-completions/route.ts`     | Already supports `?domain=coshh` filtering          |
| `src/app/api/estates/evidence/route.ts`                  | Already supports `compliance_domain = 'coshh'`      |
| `supabase/migrations/20260307_vision_ai_room_checks.sql` | `coshh_register` table already created              |

---

## 3. What Is Now Live in the UI for COSHH

### COSHH Overlay Mode

- New "COSHH" button in the overlay toggle bar (orange icon, distinct from other modes)
- When active:
  - Orange info banner: "Highlighted rooms contain or may contain hazardous substances"
  - COSHH-relevant rooms highlighted in orange (boiler, kitchen, storage, caretaker, medical)
  - Non-COSHH rooms dimmed to grey
  - Clicking a highlighted room opens COSHH-specific drawer sections

### COSHH Room Identification

Rooms are identified as COSHH-relevant by:

- Room type: `boiler`, `kitchen`, `storage`, `medical`
- Room name contains: "caretaker", "cleaning", "science"

This is rule-based from the site model — no manual tagging needed for the first version.

### COSHH Drawer Sections (3 new sections)

**COSHH Status** — Shows:

- COSHH location badge with room-type-specific description
- Statutory checks summary (fetched from `/api/estates/statutory-completions?domain=coshh`)
- Status badges per check (completed/overdue/pending with green/red/amber)
- Link to full COSHH checks in Compliance Hub

**Substance Register** — Shows:

- Explanation that the register is managed in the Compliance Hub
- Direct link to open the COSHH Register
- Note that evidence photos can be used for AI-assisted verification

**Evidence & Inspections** — Shows:

- Explanation of the AI evidence analysis workflow
- "Upload COSHH Evidence" button (links to existing evidence upload page)
- Trust message: "All proposed changes require your confirmation before the register is updated"

---

## 4. How the AI Admin-Reduction Flow Works

### Current (built)

- Ed "Ask Ed about COSHH for this room" button opens Ed with a context-aware prompt
- Prompt includes room name, room type, and the type of substances likely stored there
- Ed uses its estates specialist knowledge to advise on COSHH requirements

### Next Phase (specified, not yet built)

1. User uploads evidence photos via `/api/estates/evidence` with `compliance_domain = 'coshh'`
2. Vision API (Gemini 2.5 Flash) analyses the image
3. Detected products compared against `coshh_register` entries for this storage location
4. Results classified: confirmed match / suspected new / suspected missing / storage concern
5. Ed prepares proposed register entries for new products
6. Responsible person reviews and confirms before register is updated
7. All changes logged with evidence link, AI confidence, and human sign-off

---

## 5. Where Human Confirmation Happens

| Action                                 | Requires Confirmation? | Who Confirms                                |
| -------------------------------------- | ---------------------- | ------------------------------------------- |
| Viewing COSHH data                     | No                     | Anyone with access                          |
| Uploading evidence photos              | No (upload only)       | Uploader                                    |
| AI detecting products in photos        | No (analysis only)     | N/A                                         |
| Adding a new product to the register   | **YES**                | COSHH responsible person or delegated staff |
| Removing a product from the register   | **YES**                | COSHH responsible person                    |
| Marking a statutory check as complete  | **YES**                | Assigned staff or responsible person        |
| Creating an action from COSHH findings | **YES**                | COSHH responsible person                    |
| Completing a monthly review            | **YES**                | Reviewer signs off                          |

**AI never silently updates the register, completes checks, or creates actions.** Every modification requires human confirmation through the existing Schoolgle approval patterns.

---

## 6. How the Audit Trail Is Maintained

All COSHH data flows through existing Schoolgle audit structures:

| Data                  | Audit Mechanism                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Statutory checks      | `estates_statutory_completions.completed_by`, `completed_at` — who marked it complete and when |
| Evidence uploads      | `estates_evidence.uploaded_by`, `created_at` — who uploaded what and when                      |
| Evidence verification | `estates_evidence.verified_by`, `verified_at`, `ai_verified`, `ai_confidence_score`            |
| Register changes      | `coshh_register.updated_at`, + `source` field ("manual", "ai_detected", "imported")            |
| Task completion       | `estates_compliance_tasks.status`, audit via `updated_at`                                      |
| Delegations           | `estates_delegations.valid_from`, `valid_until`, `status` — temporal authorisation             |

No separate COSHH audit table needed — the existing estate compliance audit trail covers everything.

---

## 7. What Parts Are Ready to Be Reused

| Component                                      | Reusable For                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Overlay mode pattern in Show Me Site           | Any compliance domain overlay (fire checks, legionella, electrical)      |
| Room-type-to-domain mapping function           | Auto-identify which compliance domains apply to which rooms              |
| Domain-specific drawer sections                | Same `DrawerSection` pattern for fire safety checks, water hygiene, etc. |
| Statutory checks fetch + display               | Same API call pattern for any `domain=X` parameter                       |
| "Upload Evidence" link to existing upload page | Same pattern for fire inspection photos, legionella test results         |
| Ed contextual COSHH prompts                    | Same pattern for fire safety prompts, legionella prompts, etc.           |
| Room identification rules                      | Extend `isCoshhRoom()` pattern to `isFireRoom()`, `isWaterRoom()`, etc.  |

### To add a new compliance overlay (e.g., Fire Safety)

1. Add `"fire"` to the `OverlayMode` union
2. Add a `{ id: "fire", label: "Fire", icon: Flame }` entry to `OVERLAY_MODES`
3. Create `isFireRoom()` — rooms with fire exits, corridors, hall, kitchen
4. Add fire overlay colour in `getOverlayColor()`
5. Add fire banner text
6. Add fire drawer sections (same pattern as COSHH sections)
7. Fetch `?domain=fire` from same API

**Time to add a second domain overlay: ~1 hour.**

---

## 8. What Should Be Built Next

### Immediate next (COSHH Phase 2)

1. **COSHH Register view in drawer** — Fetch `coshh_register` entries and display product list with GHS pictograms, quantities, and SDS links directly in the drawer (currently links to Compliance Hub)
2. **Evidence gallery** — Show recent COSHH evidence photos as thumbnails in the drawer instead of just an upload link
3. **AI vision analysis** — Wire evidence upload → Gemini 2.5 Flash → product detection → register comparison → proposed updates display

### After COSHH Phase 2

4. **Fire Safety overlay** — Second compliance domain overlay using the same pattern
5. **Monthly COSHH review workflow** — Start review → upload evidence → AI comparison → confirm → sign off
6. **External report upload** — Upload a legionella report or FRA, Ed classifies it, extracts findings, proposes actions
