# Data Connections Hub — Specification

**Date:** 2026-03-19
**Current page:** `/dashboard/settings/data-connections`

---

## Current State

The Data Connections page currently:

- Allows linking a Google Drive folder via share URL
- Auto-scans folder structure (9 category patterns)
- Shows file counts by category
- Allows file browsing and preview
- Shows connection status, last scan date
- Does NOT trigger imports into modules

---

## Recommended Evolution (Not Yet Built)

### Phase 1: Add Import Actions to File Browser

When a user browses files by category, add action buttons:

| Category    | Action Button                | Destination                                 |
| ----------- | ---------------------------- | ------------------------------------------- |
| staff       | "Connect to Staff Directory" | Calls `/api/staff/import` with file content |
| pupils      | "Connect to Pupil Data"      | Calls `/api/pupils` with file content       |
| fms         | "Connect to Finance"         | Calls `/api/finance/import` with file       |
| assessments | "Connect to Intelligence"    | Routes to PupilAssessmentUploader           |
| attendance  | "Connect to Attendance"      | Calls `/api/mis/read?type=attendance`       |
| behaviour   | "Connect to Behaviour"       | Calls `/api/mis/read?type=behaviour`        |
| documents   | "Connect to Compliance"      | Routes to evidence/document upload          |

### Phase 2: Connection Status Dashboard

Add a summary panel showing:

- Connected sources (Google Drive, OneDrive, Wonde)
- Last scan date with freshness badge
- Records connected per category
- Modules powered by each source
- "Refresh" button per connection
- "Disconnect" button per connection

### Phase 3: Multi-Provider Support

- OneDrive/SharePoint connection (code exists, needs UI)
- Wonde MIS API (code exists, needs API key + UI)

---

## Key Design Principles

1. **Connect, not upload** — frame every action as connecting a data source
2. **School control** — disconnect button always visible, no lock-in
3. **Transparency** — show what modules each source powers
4. **Freshness** — show when each source was last synced
5. **Progressive** — start with one source, add more over time
