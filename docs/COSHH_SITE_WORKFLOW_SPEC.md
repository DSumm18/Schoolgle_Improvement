# COSHH Room/Zone Workflow — Show Me Site

**Date:** 2026-03-19
**Status:** Design specification
**Location in product:** Show Me Site → COSHH overlay + room drawer extension

---

## 1. Proposed COSHH Room/Zone Data Model

### New Tables

```sql
-- Rooms/zones tagged as COSHH storage locations
CREATE TABLE coshh_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,              -- matches Room.id in site model (e.g., "rm-caretaker")
  name TEXT NOT NULL,                  -- e.g., "Caretaker's Cupboard", "Science Prep Room"
  location_type TEXT NOT NULL,         -- cleaning_store, science_prep, kitchen_chemical, maintenance, medical, external
  responsible_person_id UUID,          -- FK to staff_directory
  responsible_person_name TEXT,        -- denormalised for display
  review_frequency_days INT DEFAULT 30,
  last_review_date DATE,
  next_review_date DATE,
  risk_rating TEXT,                    -- low, medium, high
  storage_notes TEXT,                  -- free text: ventilation, locked cabinet, signage notes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, room_id)
);

-- COSHH register entries linked to locations
CREATE TABLE coshh_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES coshh_locations(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  hazard_category TEXT,               -- corrosive, flammable, toxic, irritant, oxidising, environmental, health_hazard
  ghs_pictograms TEXT[],              -- GHS01-GHS09 codes
  sds_available BOOLEAN DEFAULT false, -- Safety Data Sheet on file
  sds_file_id UUID,                   -- FK to evidence/document store
  quantity_description TEXT,           -- e.g., "2x 5L bottles", "1 aerosol can"
  storage_requirements TEXT,           -- e.g., "locked COSHH cabinet", "ventilated area", "separate from oxidisers"
  first_aid_summary TEXT,
  disposal_notes TEXT,
  status TEXT DEFAULT 'active',        -- active, removed, flagged
  added_by UUID,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_confirmed_date DATE,
  source TEXT,                         -- manual, ai_detected, imported
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence photos/videos per location inspection
CREATE TABLE coshh_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES coshh_locations(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,             -- image/jpeg, image/png, video/mp4
  file_name TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  captured_by UUID,
  captured_by_name TEXT,
  ai_analysis JSONB,                   -- { detected_products: [...], storage_concerns: [...], confidence: 0.85 }
  review_status TEXT DEFAULT 'pending', -- pending, reviewed, flagged
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly review records
CREATE TABLE coshh_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES coshh_locations(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  reviewed_by UUID,
  reviewed_by_name TEXT,
  evidence_ids UUID[],                 -- photos/videos used for this review
  register_snapshot JSONB,             -- snapshot of register at review time
  findings JSONB,                      -- { new_items: [...], missing_items: [...], storage_concerns: [...], matches: [...] }
  actions_created UUID[],              -- FK to actions/tasks created from this review
  overall_status TEXT,                 -- compliant, concerns, non_compliant
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Relationship to Existing Tables

| New Table       | Links To                | Via                                                 |
| --------------- | ----------------------- | --------------------------------------------------- |
| coshh_locations | Site model rooms        | `room_id` matches `Room.id` in aurora-site-model.ts |
| coshh_locations | staff_directory         | `responsible_person_id` FK                          |
| coshh_register  | coshh_locations         | `location_id` FK                                    |
| coshh_register  | estates_evidence        | `sds_file_id` (Safety Data Sheet)                   |
| coshh_evidence  | coshh_locations         | `location_id` FK                                    |
| coshh_reviews   | coshh_locations         | `location_id` FK                                    |
| coshh_reviews   | actions (unified tasks) | `actions_created` array                             |

---

## 2. UI Flow Inside Show Me Site

### New Overlay Mode: COSHH

Added to the overlay toggle bar alongside Normal, Tickets, Compliance, Evacuation, Induction.

**When COSHH overlay is active:**

- Rooms tagged as COSHH locations are highlighted in a distinct colour (orange border, light orange fill)
- Untagged rooms remain in their normal colours
- A count badge shows number of COSHH locations on the current floor
- Clicking a COSHH-tagged room opens the COSHH-specific drawer

**Tagging flow:**

- In COSHH overlay mode, non-tagged rooms show a subtle "+" icon or "Tag as COSHH" prompt on hover
- Clicking opens a quick modal: location name, type dropdown, responsible person picker
- After tagging, the room immediately appears in the COSHH overlay

### Floor plan visual treatment

| Room State                      | Fill                | Stroke      | Badge     |
| ------------------------------- | ------------------- | ----------- | --------- |
| COSHH location — compliant      | Light green         | Green       | Green dot |
| COSHH location — review due     | Light amber         | Amber       | Amber dot |
| COSHH location — concerns       | Light red           | Red         | Red dot   |
| COSHH location — never reviewed | Light grey          | Grey dashed | Grey dot  |
| Not a COSHH location            | Normal room colours | Normal      | None      |

---

## 3. Room Drawer Structure for COSHH Locations

When a COSHH-tagged room is selected, the drawer shows these sections (using the existing `DrawerSection` component):

### Section 1: COSHH Overview

- Location name
- Location type (e.g., "Cleaning Store")
- Responsible person (name + role)
- Last review date + next review date
- Risk rating badge (Low/Medium/High)
- Storage notes

### Section 2: Register (X items)

- List of registered products with:
  - Product name
  - Hazard category icon (GHS pictogram)
  - Quantity
  - SDS available indicator
  - Last confirmed date
- "Add Product" button
- "View Full Register" link

### Section 3: Evidence Gallery

- Grid of recent photos/videos (thumbnails)
- Each shows: date, captured by, review status (pending/reviewed/flagged)
- "Take Photo" button (opens camera or file picker)
- "View All Evidence" link

### Section 4: AI Analysis (latest)

- If analysis has been run on recent evidence:
  - Confirmed matches (green checkmarks)
  - Suspected new items (amber, with "Add to Register" action)
  - Suspected missing items (red, with "Confirm Removed" action)
  - Storage concerns (amber warnings)
- If no analysis: "Upload evidence photos to enable AI-assisted register checks"

### Section 5: Review History

- Last 3 reviews with date, reviewer, status
- "Start Monthly Review" button
- "View All Reviews" link

### Section 6: Actions

- Open actions/tasks linked to this COSHH location
- "Create Action" button

### Section 7: Ask Ed

- "Ask Ed about COSHH requirements for this location"
- Prefilled prompt: "What COSHH requirements apply to {location_name}? We store {product_count} products here."

---

## 4. Evidence Workflow

### Upload Flow

1. User selects a COSHH location in Show Me Site
2. Opens drawer → Evidence Gallery section
3. Clicks "Take Photo" or "Upload Evidence"
4. Camera/file picker opens (accepts JPEG, PNG, MP4)
5. File uploaded to Supabase Storage → URL stored in `coshh_evidence`
6. Evidence appears in gallery with status "pending"
7. If AI analysis is enabled, analysis runs automatically after upload

### Evidence Metadata

Each evidence record stores:

- File URL + type
- Capture date/time
- Captured by (user)
- AI analysis results (if run)
- Review status
- Free-text notes

### Evidence API (new)

```
POST /api/coshh/evidence     — upload evidence to a location
GET  /api/coshh/evidence     — list evidence for a location
PUT  /api/coshh/evidence/:id — update review status / notes
```

---

## 5. AI Analysis Workflow

### How It Works

1. User uploads photo(s) of chemical storage area
2. System sends image to vision model (Gemini 2.5 Flash via OpenRouter)
3. Prompt:

   ```
   Analyse this photo of a school chemical storage area.
   List every visible product you can identify from labels or packaging.
   For each product, provide:
   - product_name
   - manufacturer (if visible)
   - likely_hazard_category
   - ghs_pictograms (if visible on label)
   - confidence (0-1)

   Also note any storage concerns:
   - products stored together that should be separated
   - products not in a locked cabinet
   - products without clear labelling
   - spillage or damage
   - ventilation concerns
   ```

4. AI returns structured JSON
5. System compares detected products against `coshh_register` for this location:
   - **Confirmed match**: product name fuzzy-matches a register entry → green
   - **Suspected new/unregistered**: detected product not in register → amber
   - **Suspected missing**: registered product not detected in photo → red (softer — could be out of frame)
6. Results stored in `coshh_evidence.ai_analysis` JSONB

### Human Confirmation Points

| AI Finding             | What Happens                                                             | User Action Required                                                                         |
| ---------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Confirmed match        | Shown with green checkmark. Register entry `last_confirmed_date` updated | No action needed (auto-confirmed)                                                            |
| Suspected new item     | Shown with amber flag. Ed drafts a proposed register entry               | User reviews → confirms → register updated. Or dismisses as false positive                   |
| Suspected missing item | Shown with red flag                                                      | User confirms removed (register entry marked `status: removed`) or notes it was out of frame |
| Storage concern        | Shown as amber warning                                                   | User creates an action or dismisses                                                          |

**Critical rule:** AI never auto-commits changes to the register. Every register modification requires human confirmation.

---

## 6. Ed-Assisted Register Maintenance

### When a New Product Is Detected

1. AI flags: "Suspected new product: Dettol Antibacterial Surface Cleaner"
2. User clicks "Add to Register"
3. Ed prepares a proposed entry:

   ```
   Product: Dettol Antibacterial Surface Cleaner
   Manufacturer: Reckitt Benckiser
   Hazard Category: Irritant
   GHS Pictograms: GHS07 (Exclamation Mark)
   Storage: Original container, room temperature, away from food
   First Aid: If swallowed, seek medical advice. If in eyes, rinse.
   Disposal: Do not pour down drain. Dispose per local authority guidance.
   SDS: [Link to manufacturer SDS if available, or "Not yet obtained"]

   Source: AI-detected from photo evidence on [date]
   ```

4. Ed shows this in a confirmation modal
5. Responsible person reviews, edits if needed, confirms
6. Register entry created with `source: "ai_detected"`
7. `coshh_reviews` log records: "New product added: Dettol Antibacterial Surface Cleaner. Detected by AI, confirmed by [name] on [date]"

### Ed Prompts for COSHH

| Context                    | Prompt                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| General COSHH for location | "What COSHH requirements apply to a {location_type} in a primary school?"                                    |
| Specific product query     | "What are the COSHH requirements for storing {product_name}? Is it safe to store alongside {other_product}?" |
| Review preparation         | "Help me prepare for a COSHH review of {location_name}. We have {X} registered products."                    |
| Incident response          | "A {product_name} container has been damaged in {location_name}. What should we do?"                         |

---

## 7. Monthly Review Workflow

### Trigger

- Automatic: system checks `coshh_locations.next_review_date` daily via cron
- Manual: user clicks "Start Monthly Review" in the drawer

### Review Flow

1. System creates a new `coshh_reviews` record
2. User navigates to the COSHH location in Show Me Site
3. Takes fresh evidence photos
4. AI analyses new photos against:
   - Previous evidence (visual comparison)
   - Current register state
5. Review dashboard shows:
   - **Confirmed items** (still present, still on register)
   - **New items** (not on register → "Add?" prompt)
   - **Missing items** (on register but not visible → "Still here?" or "Removed?")
   - **Storage changes** (anything different from last time)
   - **Storage concerns** (identified by AI)
6. User works through each finding:
   - Confirms matches
   - Adds new items (via Ed-assisted flow)
   - Marks missing items as removed or notes them
   - Creates actions for storage concerns
7. User marks review as complete
8. `coshh_locations.last_review_date` updated, `next_review_date` calculated
9. Review record stored with full findings snapshot

### Review Status

- **Compliant**: all items confirmed, no concerns
- **Concerns**: some items flagged or storage concerns noted
- **Non-compliant**: missing items, unregistered products, or serious storage issues

---

## 8. What Existing Schoolgle Pieces Can Be Reused

| Existing Piece                    | Reuse For                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------- |
| **ShowMeShell / DrawerSection**   | Room drawer layout — COSHH sections use same component                        |
| **Aurora site model**             | Room identification — `room_id` maps COSHH locations to physical rooms        |
| **Estates evidence upload**       | File upload pattern — same MIME validation, size limits, storage approach     |
| **Ed chatbot (`openChatWith`)**   | COSHH Ed prompts — same integration already in Show Me Site                   |
| **Vision API** (Gemini 2.5 Flash) | Image analysis — already used for estates document extraction                 |
| **Actions/tasks system**          | Action creation from review findings — same unified task pattern              |
| **Compliance review schedule**    | Review frequency tracking — same `next_review_date` pattern as policy reviews |
| **Data validation pipeline**      | AI results → human review → confirmation — same approval gate pattern         |
| **Cron daily endpoint**           | Review due notifications — add COSHH review checks to existing cron           |
| **Staff directory**               | Responsible person picker — same staff lookup                                 |

---

## 9. Minimum Viable Version (What to Build First)

### Phase 1: COSHH Location Tagging + Register (1-2 days)

Build:

- `coshh_locations` table + API (`/api/coshh/locations` — CRUD)
- `coshh_register` table + API (`/api/coshh/register` — CRUD)
- COSHH overlay mode in Show Me Site
- Tag room as COSHH location (modal with name, type, responsible person)
- Drawer section showing register items (manual entry)
- "Add Product" form (manual: name, hazard, quantity, storage)

Skip for v1: AI analysis, evidence photos, monthly reviews

**Value delivered:** Schools can tag their chemical storage rooms and maintain a digital COSHH register linked to the site plan.

### Phase 2: Evidence Upload + Gallery (1 day)

Build:

- `coshh_evidence` table + API
- Photo upload in drawer (reuse estates evidence upload pattern)
- Evidence gallery with thumbnails + dates
- Evidence linked to location

Skip for v2: AI analysis, comparison

**Value delivered:** Schools can photograph their storage areas and maintain a dated visual record per location.

### Phase 3: AI-Assisted Analysis (2-3 days)

Build:

- Vision API call on evidence upload (Gemini 2.5 Flash)
- Product detection prompt
- Register comparison logic
- Results display in drawer (confirmed/new/missing/concerns)
- "Add to Register" flow with Ed-prepared entry
- "Confirm Removed" flow for missing items

**Value delivered:** AI detects products from photos and compares against the register, with human confirmation for all changes.

### Phase 4: Monthly Review Workflow (1-2 days)

Build:

- `coshh_reviews` table + API
- "Start Monthly Review" button
- Review dashboard comparing current vs previous
- Review completion + status
- Cron check for overdue reviews
- Notification to responsible person

**Value delivered:** Structured monthly COSHH reviews with before/after comparison and action tracking.

---

## Summary

| Component                     | Reuses Existing             | New Build                       | Effort  |
| ----------------------------- | --------------------------- | ------------------------------- | ------- |
| COSHH overlay in Show Me Site | Site model, overlay pattern | Overlay colour logic, tag modal | Small   |
| COSHH drawer sections         | DrawerSection component     | 5 new sections                  | Medium  |
| Location + Register tables    | Migration pattern           | 2 new tables + APIs             | Small   |
| Evidence upload               | Estates evidence pattern    | 1 new table + API               | Small   |
| AI product detection          | Vision API (Gemini)         | Prompt + comparison logic       | Medium  |
| Ed register maintenance       | openChatWith pattern        | COSHH-specific prompts          | Small   |
| Monthly review                | Compliance review pattern   | 1 new table + review flow       | Medium  |
| Cron notifications            | Existing cron daily         | Add COSHH check                 | Trivial |

**Total estimated effort for all 4 phases: 5-8 days**
**Phase 1 alone (usable COSHH register on site plan): 1-2 days**
