# Connector Registry Foundation + First BYO — Phase 2 Design Spec

**Date:** 11 April 2026
**Status:** APPROVED
**Author:** David Summerscales / Claude Code
**Scope:** Phase 2a (Registry Foundation) + Phase 2b (First BYO: CSV Upload)

---

## Vision

Connectors are the universal data primitive. Every module in Schoolgle consumes data through connectors — not direct database queries. There are four layers of connectors:

1. **We-Control** — auto-connected, we're data controller (6 DfE datasets, EEF corpus, contextual factors, Schoolgle Intelligence, planned externals)
2. **School-Control Pre-Built** — OAuth or upload, school is controller, we are processor (Google Drive, OneDrive, Live Attendance, MIS APIs)
3. **Bring Your Own (BYO)** — school plugs in ANY data source (Google Sheets, Forms, CSV upload, Excel, Webhook, Airtable/Notion) — named, schema-mapped, join-ready
4. **Derived** — School Intelligence reports that combine Layers 1-3 become connectors themselves

Apps enumerate which connectors they need. The registry returns status. Missing connectors show one-click setup wizards. Planned connectors are visible (not hidden) so schools and David can see the roadmap.

**The superpower:** Schools can join THEIR data with OUR data on common keys (postcode, URN, pupil_hash, date, year_group, etc.) and build visualisations nobody else could build. Every school has dozens of Google Sheets no other EdTech product will ever integrate — except Schoolgle, because we just ask them to point at the sheet.

---

## Design Decisions

### 1. Four-Layer Connector Registry

All connectors live in a single registry at `src/lib/connectors/registry.ts` with a unified type contract:

```typescript
interface Connector {
  id: string;                          // "dfe-attendance", "byo:safeguarding-log", etc.
  layer: 1 | 2 | 3 | 4;                // 1=we-control, 2=school-prebuilt, 3=byo, 4=derived
  category: string;                     // "dfe-historic", "live-mis", "documents", "byo-csv", etc.
  name: string;
  description: string;
  icon: string;                         // emoji or image path
  colour: string;                       // hex colour for UI
  dataController: 'us' | 'school';      // GDPR legal basis
  setupType: 'auto' | 'oauth' | 'upload' | 'api' | 'byo' | 'planned';
  status: 'active' | 'setup-needed' | 'planned';
  joinKeys: JoinKey[];                  // which fields this connector can join on
  schema?: ConnectorFieldSchema;        // column types for BYO/derived connectors
  consumers: string[];                  // which apps use this connector
  setupGuideUrl?: string;               // link to setup wizard
  dataSource?: {                        // where the data lives
    type: 'supabase-table' | 'external-api' | 'oauth-fetch' | 'byo-upload';
    reference: string;                  // table name, API URL, etc.
  };
}

type JoinKey = 'urn' | 'postcode' | 'pupil_hash' | 'staff_id' | 'date' | 'year_group' | 'cohort' | 'location_code' | 'laestab';
```

### 2. Consumer Mapping

Each app declares which connectors it needs:

```typescript
const CONSUMER_DEPENDENCIES: Record<string, string[]> = {
  'ofsted-readiness': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'dfe-ks4-results', 'google-drive', 'contextual-factors',
  ],
  'ofsted-readiness/attendance-behaviour': [
    'dfe-attendance', 'dfe-exclusions', 'live-attendance', 'contextual-factors', 'google-drive',
  ],
  'school-intelligence': [
    'dfe-attendance', 'dfe-ks2-results', 'dfe-census', 'dfe-workforce',
    'dfe-exclusions', 'dfe-ks4-results', 'eef-research', 'contextual-factors',
    'live-attendance', 'live-assessments',
  ],
  // ...
};

function getConnectorsForConsumer(appId: string): Connector[];
```

### 3. Settings Page Refactor

`/dashboard/settings/connectors` becomes the unified connector management UI:
- Grouped by layer (1: We-Control / 2: School-Control / 3: BYO / 4: Derived)
- Shows active + setup-needed + planned connectors
- Per-connector status dot, row count, last sync
- "Connect" button on setup-needed connectors opens a wizard based on `setupType`
- Planned connectors marked with "Coming Soon" badge, non-interactive
- BYO section has a prominent "+ Add a Connector" button

### 4. BYO CSV Upload (First Real BYO)

The first concrete BYO implementation. Schools can:
1. Click "+ Add Connector" → choose "CSV Upload"
2. Upload a CSV file (up to 10MB)
3. Preview the first 10 rows
4. Name the connector ("Safeguarding Incidents Log")
5. Map each column to a type (`text`, `number`, `date`, `postcode`, `pupil_hash`, etc.)
6. System auto-detects join keys based on column types (if a column is mapped to `postcode`, it's a join key)
7. Data stored in `byo_connectors_data` table, pseudonymised if pupil data detected
8. Connector appears in Layer 3 with status `active`
9. Available to any app that wants to consume it (via `getConnectorsForConsumer`)

### 5. GDPR & Data Controller Split

Every connector declares `dataController`. The registry renders the legal basis in the setup wizard:
- **We-control connectors**: "This data is published by DfE under Open Government Licence v3.0. We're the data controller for our copy. No school action needed."
- **School-control connectors**: "You are the data controller. Schoolgle processes this data on your instructions. You can disconnect at any time. We never train AI on this data."
- **BYO connectors**: "You are the data controller. We store the data you upload. You can delete the connector and all its data at any time."

### 6. Join Key Auto-Detection

When a CSV is uploaded, the column mapping UI presents type choices. If a column is mapped to a known join key type, the registry records it. Other connectors that share the same join key become candidates for joining.

Example: Upload a "Safeguarding Incidents" CSV with columns `date, postcode, severity, notes`. Map `postcode` → type `postcode`. Registry now knows this BYO connector can join with:
- DfE Census (also has `postcode` area)
- Any other BYO connector that has `postcode`

Actual joining happens in future phases (School Intelligence report builder).

---

## Technical Architecture

### Directory Structure

```
apps/platform/src/lib/connectors/
  registry.ts                  — Connector registry, getConnectorsForConsumer, getConnector
  types.ts                     — Connector, JoinKey, ConnectorFieldSchema, BYOColumn types
  sources/
    dfe.ts                     — 6 DfE Layer 1 connectors
    planned.ts                 — Planned connectors (Police API, LA SEND, Ofsted, Arbor/SIMS APIs)
    documents.ts               — Google Drive, OneDrive connectors
    live-mis.ts                — Live Attendance, Live Assessments
    schoolgle.ts               — EEF, Contextual Factors, Schoolgle Intelligence
    byo.ts                     — BYO connector templates (CSV, Sheets, Form, etc.)
  byo/
    csv-parser.ts              — Parse uploaded CSV, detect columns, sample rows
    column-mapper.ts           — Map columns to types, auto-detect join keys
    byo-store.ts               — Load/save BYO connector data from Supabase
  consumer-mapping.ts          — Which apps need which connectors

apps/platform/src/app/api/connectors/
  registry/route.ts            — GET: full registry, filterable by layer/category/status/consumer
  [id]/route.ts                — GET one connector, PATCH status
  byo/route.ts                 — POST: create new BYO connector from CSV upload
  byo/[id]/route.ts            — GET/DELETE BYO connector
  byo/[id]/data/route.ts       — GET rows from a BYO connector (paginated)

apps/platform/src/app/(dashboard)/dashboard/settings/connectors/
  page.tsx                     — Refactored registry view grouped by layer
  byo/new/page.tsx             — BYO CSV upload + column mapping wizard

apps/platform/src/components/connectors/
  ConnectorRegistryView.tsx    — Grouped list with filters
  ConnectorCard.tsx            — Card showing status, owner, joinKeys, setupType
  ConnectorLayerSection.tsx    — Header + connectors for one layer
  RequiredConnectorsPanel.tsx  — Reusable panel any app can render
  byo/
    ByoCsvUploader.tsx         — Drag-drop upload + preview
    ByoColumnMapper.tsx        — Column → type mapping UI
    ByoJoinKeyBadges.tsx       — Shows detected join keys
```

### Database

Two new Supabase tables:

```sql
-- BYO connector definitions (schema + metadata)
CREATE TABLE byo_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'sheets', 'form', 'excel', 'webhook', 'airtable')),
  column_schema JSONB NOT NULL,  -- { columns: [{ name, type, is_join_key }] }
  join_keys TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['postcode', 'date']
  row_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

-- BYO connector row data (append-only)
CREATE TABLE byo_connector_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES byo_connectors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  row_data JSONB NOT NULL,  -- the actual row as JSON
  join_values JSONB,         -- extracted join key values for fast lookups
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_byo_rows_connector ON byo_connector_rows(connector_id);
CREATE INDEX idx_byo_rows_org ON byo_connector_rows(organization_id);
CREATE INDEX idx_byo_rows_join_values ON byo_connector_rows USING GIN(join_values);

-- RLS policies
ALTER TABLE byo_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE byo_connector_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "byo_connectors_org_access" ON byo_connectors
  FOR ALL USING (organization_id = (SELECT organization_id FROM user_organization_memberships WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "byo_rows_org_access" ON byo_connector_rows
  FOR ALL USING (organization_id = (SELECT organization_id FROM user_organization_memberships WHERE user_id = auth.uid() LIMIT 1));
```

### Migration Path from Existing `smart-connectors/`

The existing `src/lib/smart-connectors/` library stays in place but is re-exported from the new `src/lib/connectors/` structure. No imports break. Old `DATA_SOURCES` array gets wrapped:

```typescript
// src/lib/connectors/sources/dfe.ts
import { DATA_SOURCES as LEGACY_DFE_SOURCES } from '@/lib/smart-connectors/source-registry';

export const DFE_CONNECTORS: Connector[] = LEGACY_DFE_SOURCES.map((legacy) => ({
  id: `dfe-${legacy.id}`,
  layer: 1,
  category: 'dfe-historic',
  name: legacy.name,
  description: legacy.description,
  icon: '🏛',
  colour: legacy.colour,
  dataController: 'us',
  setupType: 'auto',
  status: 'active',
  joinKeys: ['urn', 'laestab'],
  consumers: ['ofsted-readiness', 'school-intelligence', 'living-sef'],
  dataSource: { type: 'supabase-table', reference: legacy.table },
}));
```

The existing Smart Connectors settings page and 3 API routes (`/sources`, `/compare`, `/reconcile`) continue to work unchanged.

---

## API Endpoints

### GET `/api/connectors/registry`
Query params: `?layer=1|2|3|4`, `?category=`, `?status=`, `?consumer=`, `?joinKey=`
Returns: array of Connectors matching the filter, each with live status (active/setup-needed/planned) and row counts where applicable.

### GET `/api/connectors/[id]`
Returns: single Connector with live status, metadata, data source info.

### POST `/api/connectors/byo`
Body: `{ name, description, source_type: 'csv', column_schema, rows: [...] }`
Creates a new BYO connector and inserts rows. Auto-detects join keys from column types.

### GET `/api/connectors/byo/[id]/data?limit=&offset=`
Returns paginated rows from a BYO connector.

### DELETE `/api/connectors/byo/[id]`
Deletes the BYO connector and all its rows.

---

## UI Specifications

### Registry Page `/dashboard/settings/connectors`

Sections, top to bottom:
1. **Header** — School name, total active connectors, "+ Add BYO Connector" button
2. **Layer 1: We-Control** — 6 DfE connectors + EEF + Contextual Factors + Schoolgle Intelligence + planned externals (greyed)
3. **Layer 2: School-Control Pre-Built** — Google Drive (active), OneDrive, Live Attendance, Live Assessments, planned APIs
4. **Layer 3: Bring Your Own** — Active BYO connectors + "+ Add Connector" card + template examples (Safeguarding Log, H&S Register, etc.)
5. **Layer 4: Derived** — Reports from School Intelligence (empty initially)

Each connector card shows:
- Icon + name + status dot (green/amber/grey)
- Description (1 line)
- Meta row: `setupType` tag, row count, last sync, `joinKeys` badges
- Hover: "View details" / "Disconnect" for active; "Set up" wizard link for setup-needed

### BYO CSV Upload Wizard `/dashboard/settings/connectors/byo/new`

4-step flow:
1. **Upload** — drag-drop file zone, max 10MB, CSV only
2. **Preview** — first 10 rows displayed, column count, row count
3. **Map columns** — table where each column gets a type dropdown (`text`, `number`, `date`, `postcode`, `pupil_hash`, `urn`, `year_group`, etc.). Auto-suggests based on column header name (e.g. "postcode" → type `postcode`)
4. **Name & confirm** — name the connector, description, review auto-detected join keys, confirm

On success: redirect to registry page with new connector visible in Layer 3.

---

## Validation & Tests

Unit tests for:
- `registry.ts` — `getConnector`, `getConnectorsForConsumer`, `filterByLayer`, `filterByJoinKey`
- `byo/csv-parser.ts` — CSV parsing, header detection, row preview
- `byo/column-mapper.ts` — auto-detect join keys from headers, type inference
- `byo/byo-store.ts` — save/load connector definitions and rows
- Migration path — all 6 DfE connectors still accessible via new registry API

Integration tests for:
- POST `/api/connectors/byo` end-to-end (upload → store → retrieve)
- GET `/api/connectors/registry` with various filters
- Consumer mapping: `getConnectorsForConsumer('ofsted-readiness')` returns correct 8 connectors

Minimum 25 tests total.

---

## Out of Scope (Future Phases)

- Google Sheets OAuth connector (Phase 2c)
- Webhook connector (Phase 2c)
- Actual cross-connector join execution (Phase 2e — needs query engine)
- School Intelligence report builder UI (Phase 3)
- Drag-and-drop custom reports into Ofsted Readiness (Phase 3)
- Dynamic schema evolution (adding columns to existing BYO connector later)
- Scheduled refresh for BYO connectors (all BYO connectors are manual upload for Phase 2b)
- Pseudonymisation of pupil data in BYO uploads — will detect and flag, but actual hashing belongs in Phase 2c with the existing pupil-pseudonymiser integration

---

## Success Criteria

1. ✅ Settings page shows 4 layers with all connectors grouped properly
2. ✅ 6 DfE connectors migrate cleanly — existing Smart Connectors page still works
3. ✅ `getConnectorsForConsumer('ofsted-readiness')` returns the correct 8 connectors
4. ✅ Planned connectors (Police API, LA SEND, Arbor/SIMS APIs) visible but marked "Planned"
5. ✅ School can upload a CSV, name it "Safeguarding Incidents Log", map columns, and see it appear as a new Layer 3 connector
6. ✅ Connector has detected join keys visible on the card (e.g., "postcode", "date")
7. ✅ School can view the uploaded rows
8. ✅ School can delete the connector and its data
9. ✅ Build passes with zero new errors
10. ✅ 25+ tests passing
