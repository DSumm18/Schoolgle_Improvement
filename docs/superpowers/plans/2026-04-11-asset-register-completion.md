# Asset Register Completion + Estates Module App Structure

**Author:** Jarvis (QA Test Lead + Product Architect)
**Date:** 11 April 2026
**Goal:** Complete the asset register as the linchpin of the estates module — every ticket, task, cost, warranty, contractor, and piece of evidence connects through the asset. Then define the full sub-app structure for estates so we stop half-finishing features.

---

## 1. Why This Matters

David's feedback:
> "We've been hopping between features. We keep starting things and not finishing them. Build all this out so you can sign it off."

The asset register is where the product promise lives. If it works properly, then the killer moment happens naturally:

> Caretaker reports "the main boiler in Plant Room 2 won't ignite"
> → Ticket created, linked to asset BOI-001
> → Ed automatically queries the asset
> → "That's the Vaillant combi you bought from BluePlumb Ltd on 3 March 2024. It's still under warranty until 3 March 2029. Don't call someone out — call BluePlumb on 01274 xxx xxx. Their reference is invoice INV-2234. I can draft the service request email for you if you'd like."

Without a complete asset register, none of that is possible. We'd waste the school's money every time they called a different contractor.

---

## 2. What Exists Today (Honest Audit)

### Built
- `estates_assets` table with: id, org_id, asset_type enum, category, subcategory, name, code, qr_code, barcode, building, floor, room, location_details JSONB, parent_asset_id, installation_date, manufacturer, model, serial_number, specifications JSONB, status, compliance_domains[], image_url, notes
- Phase 2 columns (DB only, not in types): warranty_expiry, warranty_provider, expected_life_years, condition_grade, replacement_cost_estimate, insurance_value, linked_compliance_checks[], maintenance_history JSONB, last_inspection_date, next_inspection_due
- Asset CRUD service + API routes + two parallel UIs (`/estate/assets` and `/estates-compliance/assets`)
- QR code generation
- Parent-child asset hierarchy
- Evidence table with asset_id foreign key
- Helpdesk ticket table with asset_id foreign key

### Built but Broken
- **TypeScript Asset type is missing 10+ fields** that exist in the DB — any code that tries to use them fails silently
- **API routes ignore Phase 2 fields** on create/update — can't save warranty info through the API
- **UI forms don't have warranty/condition/cost fields** — user can't enter what they need
- **No warranty status check anywhere** — the DB has the data but no code reads it

### Missing Entirely
- **Purchase fields** (David's explicit ask): purchase_date, purchase_price, purchase_order_number, invoice_number, purchased_from_contractor_id, warranty_terms, purchase_document_url
- **Asset type expansion**: current enum only has 10 types — missing furniture (tables/chairs), IT equipment (computers/screens/printers), kitchen equipment, AV equipment, musical instruments, sports equipment, books/teaching resources, grounds equipment
- **Service history**: maintenance_history JSONB exists but no functions to append/query
- **Service due alerts**: next_inspection_due exists but no scheduling
- **Warranty workflow**: no Ed skill, no email draft template, no supplier contact lookup
- **Ticket → asset linking in UI**: ticket form doesn't have an asset picker
- **Asset detail page**: no single-asset page showing purchase info, warranty, service history, linked tickets, linked tasks, linked evidence

---

## 3. Design: Asset Register as Single Source of Truth

### 3.1 Extended Schema (Additional Migration)

```sql
-- Add missing purchase + warranty detail columns
ALTER TABLE estates_assets
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS purchase_currency TEXT DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS purchase_order_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS purchased_from_contractor_id UUID REFERENCES estates_contractors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
  ADD COLUMN IF NOT EXISTS warranty_terms TEXT,
  ADD COLUMN IF NOT EXISTS purchase_document_evidence_id UUID REFERENCES estates_evidence(id) ON DELETE SET NULL;

-- Expand asset_type to cover the full range
-- Note: Postgres enum alters require a different approach — use ALTER TYPE ADD VALUE
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'furniture';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'it_equipment';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'kitchen_equipment';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'av_equipment';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'musical_instrument';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'sports_equipment';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'grounds_equipment';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'teaching_resource';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'signage';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'security_equipment';
```

If `asset_type` is a text column with a CHECK constraint rather than a true enum, we alter the check constraint instead.

### 3.2 TypeScript Type (Complete)

```typescript
export interface Asset {
  // Identity
  id: string;
  organization_id: string;
  asset_type: AssetType;  // expanded list
  category: string | null;
  subcategory: string | null;
  name: string;
  code: string;  // auto-generated (e.g. BOI-001)
  qr_code: string | null;
  barcode: string | null;

  // Location
  building: string | null;
  floor: string | null;
  room: string | null;
  location_details: Record<string, unknown> | null;
  parent_asset_id: string | null;

  // Technical
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  specifications: Record<string, unknown> | null;
  installation_date: string | null;

  // Purchase (NEW)
  purchase_date: string | null;
  purchase_price: number | null;
  purchase_currency: string;
  purchase_order_number: string | null;
  invoice_number: string | null;
  purchased_from_contractor_id: string | null;
  purchase_document_evidence_id: string | null;

  // Warranty (NEW — expose existing DB fields + new ones)
  warranty_start_date: string | null;
  warranty_expiry: string | null;
  warranty_provider: string | null;
  warranty_terms: string | null;

  // Lifecycle
  expected_life_years: number | null;
  condition_grade: 'A' | 'B' | 'C' | 'D' | null;
  replacement_cost_estimate: number | null;
  insurance_value: number | null;

  // Maintenance
  last_inspection_date: string | null;
  next_inspection_due: string | null;
  maintenance_history: Array<{
    date: string;
    action: string;
    performed_by: string;
    contractor_id?: string;
    cost?: number;
    notes?: string;
  }> | null;
  linked_compliance_checks: string[];

  // Status
  status: 'active' | 'inactive' | 'disposed' | 'under_repair' | 'retired';
  compliance_domains: string[];
  image_url: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

// Computed fields (not stored — derived on read)
export interface AssetWithWarrantyStatus extends Asset {
  warranty_status: 'active' | 'expiring_soon' | 'expired' | 'none';
  warranty_days_remaining: number | null;
  supplier_contact?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}
```

### 3.3 Ed Skills (New)

Three new skills for Terry:

**Skill: `get_asset_details`** (read-only)
- Input: `asset_id` OR `asset_code` OR `serial_number`
- Returns: full asset record + warranty status + supplier contact if linked + last 5 maintenance history entries + open tickets against this asset

**Skill: `check_asset_warranty`** (read-only)
- Input: `asset_id`
- Returns: `{ under_warranty, provider, expiry_date, days_remaining, terms, recommended_action }`
- recommended_action is: "call_supplier" | "out_of_warranty" | "warranty_expiring" | "unknown"

**Skill: `draft_warranty_claim_email`** (PROPOSE flow)
- Input: `asset_id`, `issue_description`
- Returns: proposal with pre-filled email draft to the warranty provider
- Includes: asset details, purchase reference, invoice number, issue description, request for callout
- User approves before anything is sent

### 3.4 Ticket-to-Asset Linking

When creating a ticket via Ed or via form:
1. User describes the issue
2. Form has an "Affected Asset" field with a searchable picker (by name, code, QR scan)
3. If asset selected, ticket is created with `asset_id` set
4. Immediately after create, Ed automatically calls `check_asset_warranty`
5. If under warranty, Ed shows a banner on the ticket: "⚠️ Under warranty with [provider] until [date]. Call them first."
6. Ed offers: "Draft email to [provider]?"

### 3.5 Asset Detail Page

New route: `/estates-compliance/assets/[id]`

Sections:
- **Header**: Name, code, QR code, photo, status badge, warranty badge
- **Location**: Building, floor, room, link to floor plan
- **Technical specs**: Manufacturer, model, serial, installation date
- **Purchase info**: Date, price, invoice, supplier (link to contractor), PO number, linked purchase document
- **Warranty**: Start, expiry, provider, terms, days remaining, "Make warranty claim" button
- **Service history**: Chronological list from maintenance_history
- **Linked tickets**: Open + resolved tickets filtered by asset_id
- **Linked compliance tasks**: PAT testing, annual service, etc.
- **Evidence**: All photos/docs linked to this asset
- **Costs**: Running total of service costs + replacement cost estimate + insurance value
- **Actions**: Edit, Generate QR, Dispose, Archive, Add Photo, Add Service Record

---

## 4. Estates Module App Structure

David's feedback: gaps should be separate apps within estates, connected but identifiable.

### Recommended Structure

All live under `/estates-compliance/` (or migrate to `/estates/` as the parent module) with clear sub-apps:

```
/estates-compliance/                   ← Estates Compliance (module root)
├── /                                  ← Compliance Overview (RAG dashboard) — BUILT
├── /assets                            ← Asset Register — NEEDS COMPLETION
│   └── /[id]                          ← Asset Detail — NEW
├── /helpdesk                          ← Helpdesk Tickets — BUILT (needs asset picker)
│   └── /[id]                          ← Ticket Detail — BUILT
├── /contractors                       ← Contractor Management — BUILT (needs expansion)
│   ├── /[id]                          ← Contractor Detail
│   └── /portal                        ← Contractor-facing portal — NEW SUB-APP
├── /asbestos                          ← Asbestos Register — NEW SUB-APP
│   ├── /                              ← Overview + map
│   ├── /surveys                       ← Survey documents
│   └── /register                      ← Presumed + identified asbestos
├── /permits                           ← Permit to Work — NEW SUB-APP
│   ├── /                              ← Active permits
│   ├── /new                           ← Request new permit
│   └── /[id]                          ← Permit detail + sign-off
├── /tasks                             ← Compliance Tasks — BUILT
├── /routines                          ← Daily Routines — BUILT
├── /diary                             ← Site Diary — BUILT (needs POST fix)
├── /evidence                          ← Evidence Library — BUILT
├── /locations                         ← Floor Plans + Rooms — BUILT
├── /condition                         ← Condition Surveys — PARTIAL
├── /strategy                          ← 5-Year Estates Strategy — NEW SUB-APP
└── /reports                           ← Reports Hub — BUILT
    ├── /governor                      ← Governor PDF — BUILT
    ├── /ofsted                        ← Ofsted evidence pack — NEW
    └── /strategy                      ← 5-year plan export — NEW
```

### Why this structure?

1. **Every sub-app has a clear user** (caretaker uses routines + diary, SBM uses contractors + assets + reports, head uses governor report)
2. **Every sub-app connects via foreign keys** — no data duplication
3. **The Asset Register is the hub** — tickets, tasks, evidence, contractors, finance, compliance all link through it
4. **New sub-apps don't disrupt existing ones** — asbestos register can ship without touching the dashboard
5. **Clear completion criteria per sub-app** — avoids the "half-finished" trap

### Priority Order

| # | Sub-app | Priority | Reason |
|---|---------|----------|--------|
| 1 | **Asset Register completion** | Critical | Linchpin — everything else depends on this |
| 2 | **Warranty workflow (Ed skills + ticket picker)** | Critical | David's specific ask — the killer demo moment |
| 3 | **Contractor Management expansion** | High | Needed for asset→supplier linking |
| 4 | **Asbestos Register** | High | Regulatory must-have for pre-2000 schools |
| 5 | **Contractor Portal** | High | Biggest competitive differentiator |
| 6 | **Permit to Work** | Medium | Legal requirement but not demo-critical |
| 7 | **5-Year Strategy** | Medium | Planned, specced, not built |
| 8 | **Mobile PWA** | Medium | Responsive layout of existing pages |

This session tackles **#1 and #2** to completion. #3-#8 become separate plans.

---

## 5. Implementation Plan (This Session)

### Task A: DB Schema Extension
Apply migration to add purchase fields + expand asset_type enum.

### Task B: TypeScript Types
Update `Asset` interface with all Phase 2 and Phase 3 fields.

### Task C: Service Layer
Extend `AssetService` with:
- `getWarrantyStatus(assetId)` → returns warranty computed fields + supplier contact
- `appendMaintenanceHistory(assetId, entry)` → append to JSONB
- `getAssetWithLinks(assetId)` → asset + tickets + tasks + evidence

### Task D: API Routes
- Extend `POST /api/estates/assets` and `PUT /api/estates/assets/[id]` to accept all new fields
- New `GET /api/estates/assets/[id]/warranty` → warranty status
- New `GET /api/estates/assets/[id]/full` → asset with all linked data

### Task E: Ed Skills
Three new skills registered + wired in `/api/skills/invoke/route.ts`:
- `get_asset_details`
- `check_asset_warranty`
- `draft_warranty_claim_email`

Update Terry's prompt with asset management behaviour.

### Task F: Asset Create/Edit Form
Full form capturing: all purchase fields, all warranty fields, condition grade, cost estimates, supplier picker.

### Task G: Asset Detail Page
New page at `/estates-compliance/assets/[id]` with all sections from 3.5.

### Task H: Ticket Form Asset Picker
Update the "New Ticket" form to include a searchable asset picker. When asset selected, auto-run warranty check and show banner.

### Task I: Seed Grove House with Sample Assets
Create 10 representative assets for Grove House to demo the full flow:
- 1 combi boiler (under warranty)
- 1 fire extinguisher (warranty expired)
- 1 computer (under warranty, linked to contractor)
- 1 classroom table (no warranty)
- 1 CCTV camera (under warranty)
- 1 playground climbing frame (annual inspection due)
- 1 kitchen dishwasher (under warranty)
- 1 emergency light (compliance-linked)
- 1 printer
- 1 whiteboard

### Task J: End-to-End Verification
- Create asset via API → verify all fields saved
- Retrieve via API → all fields present
- Create ticket linked to asset → auto warranty check
- Ed skill returns correct warranty status
- Asset detail page renders with all sections
- Upload photo to asset → appears on detail page

---

## 6. Acceptance Criteria

The asset register is signed off when:

- [ ] All 10 Grove House sample assets exist with full purchase/warranty info
- [ ] Asset create form captures every field a school would need
- [ ] Asset detail page displays everything linked to that asset
- [ ] Ticket form has asset picker + shows warranty banner on selection
- [ ] Ed's `check_asset_warranty` returns correct status for any asset
- [ ] Ed's `draft_warranty_claim_email` produces a usable draft
- [ ] When you create a ticket against the Vaillant boiler, Ed says "still under warranty until 3 March 2029, call BluePlumb"
- [ ] API build passes
- [ ] Unit tests for warranty status calculation
- [ ] Integration test creates asset → creates ticket → queries warranty → verifies response

---

## 7. What Comes Next (Separate Plans)

After this session:

- **Plan 2026-04-12-contractor-portal** — external contractor login, upload RAMS/insurance/DBS, claim jobs
- **Plan 2026-04-12-asbestos-register** — specialist sub-app with survey upload + re-inspection scheduling
- **Plan 2026-04-12-permit-to-work** — workflow app for hot work / confined space / working at height
- **Plan 2026-04-12-estates-strategy** — 5-year plan builder linking to condition + finance
- **Plan 2026-04-12-estates-mobile-pwa** — mobile-first layouts + offline check completion

Each gets its own plan, its own acceptance criteria, its own test sign-off. No more half-finished work.
