# Schoolgle Intelligence Module

## Overview

The Intelligence Module provides data-driven school improvement insights by connecting to schools' existing data files (census XMLs, assessment CTFs) stored in Google Drive or OneDrive.

**Key Principle**: Data stays where it is — in the school's cloud storage. Schoolgle reads, processes, and analyzes it in memory without storing sensitive pupil data.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    School's Cloud Storage                   │
│  (Google Drive / OneDrive)                                  │
│  ┌────────────────┐  ┌────────────────┐                   │
│  │ Census XMLs    │  │ Assessment     │                   │
│  │ (Spring,       │  │ CTFs/XMLs      │                   │
│  │  Summer,       │  │ (EYFSP,        │                   │
│  │  Autumn)       │  │  Phonics,      │                   │
│  └────────────────┘  │  KS1, KS2)     │                   │
│                      └────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ OAuth 2.0
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Schoolgle Platform                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Intelligence Module                                    │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Data         │  │ Parser       │  │ Dashboard   │ │ │
│  │  │ Connectors   │→ │ Services     │→ │ Templates   │ │ │
│  │  │              │  │              │  │             │ │ │
│  │  │ • Scan Drive │  │ • Census     │  │ • Overview  │ │ │
│  │  │ • Detect     │  │ • Assessments│  │ • Trends    │ │ │
│  │  │   Files      │  │ • Validate   │  │ • Ofsted    │ │ │
│  │  └──────────────┘  └──────────────┘  │   Defence    │ │ │
│  │                                        │ • Pupils    │ │ │
│  └────────────────────────────────────────┴─────────────┘ │
│                          │                                   │
│                          │ (In-memory only, never stored)    │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Canonical MIS Data Types                               │ │
│  │ (Pupil, Attendance, Assessment, SEN, etc.)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **School connects their Google Drive or OneDrive**
   - OAuth 2.0 flow (already built in `cloud-service.ts`)
   - Access tokens stored encrypted in Supabase
   - School can revoke access at any time

2. **Schoolgle scans for data files**
   - Detects DfE-standard census XML files
   - Detects assessment CTF/XML files
   - Shows connection status in UI

3. **Files are parsed in memory**
   - `census-parser.ts` → Demographics, SEN, EAL, attendance
   - `assessment-parser.ts` → EYFSP, Phonics, KS1, KS2 results
   - Data transformed to canonical MIS types

4. **Dashboard templates render insights**
   - No hardcoded school-specific data
   - Works for ANY school with the same DfE-standard files
   - Templates can be extended with AI analysis

## Data Sources

### Census XML Files
| Type | File Pattern | Unlocks |
|------|-------------|---------|
| School Census | `census*.xml`, `spr*.xml` | Pupil demographics, SEN analysis, attendance trends, EAL tracking |
| Workforce Census | `workforce*.xml` | Staff qualifications, absence analysis, QTVI tracking |

### Assessment Files
| Type | File Pattern | Unlocks |
|------|-------------|---------|
| EYFSP | `eyfsp*.xml`, `FSP_*.xml` | Reception baseline, GLD trends, cohort comparison |
| Phonics | `phonics*.xml`, `PHO_*.xml` | Y1/Y2 pass rates, retake analysis |
| KS1 | `ks1*.xml`, `KS1_*.xml` | Y2 attainment, R/W/M breakdown, progress |
| KS2 | `ks2*.xml`, `KS2_*.xml` | Y6 SATs, progress scores, national comparison |

### Additional Files
| Type | File Pattern | Unlocks |
|------|-------------|---------|
| Class Demographics | `Class*.csv`, `Demographics*.xlsx` | Class-level breakdowns, summer-born analysis |
| SEN Report | `SEN*.xlsx`, `sen_register*.csv` | Detailed SEN provision, EHCP tracking |

## Database Schema

### `intelligence_data_sources`
Tracks each detected/parsed data file.

```sql
source_type: census_school, census_workforce, assessment_eyfsp, etc.
status: pending, parsing, connected, partial, error
record_count: Number of records parsed
data_summary: JSONB with cached summary for UI
```

### No pupil data stored in Supabase!
- Per-pupil data exists ONLY in the school's cloud storage
- Schoolgle reads and processes it in memory
- Revoking Drive access = instant data removal
- This is GDPR-compliant by design

## File Structure

```
apps/platform/src/
├── app/(dashboard)/dashboard/intelligence/
│   ├── page.tsx                    # Main module landing (connections status)
│   ├── assessment/                 # Assessment dashboard (TODO)
│   └── pupils/                     # Pupil intelligence view (TODO)
│
├── lib/intelligence/
│   ├── types.ts                    # TypeScript interfaces
│   ├── parsers/
│   │   ├── census-parser.ts        # Census XML parser
│   │   ├── assessment-parser.ts    # Assessment CTF/XML parser (TODO)
│   │   └── demographics-parser.ts  # CSV parser (TODO)
│   └── templates/
│       ├── dashboard-template.tsx  # Main dashboard template (TODO)
│       └── ofsted-defence.tsx      # Ofsted defence template (TODO)
│
└── app/api/intelligence/
    ├── state/route.ts              # GET current state/status
    ├── scan/route.ts               # POST trigger scan (TODO)
    └── sync/route.ts               # POST sync/purge all (TODO)
```

## How to Use (Development)

### 1. Apply Database Migration
```bash
# In Supabase SQL Editor or CLI
psql -U postgres -d your_database < apps/platform/supabase/migrations/20260324_intelligence_data_sources.sql
```

### 2. Test with Sample Data
Create test files in Google Drive:
```
My Drive/
└── School Data/
    ├── Census/
    │   ├── spring_2024_census.xml
    │   ├── summer_2024_census.xml
    │   └── autumn_2024_census.xml
    └── Assessments/
        ├── eyfsp_2024.xml
        ├── phonics_2024.xml
        └── ks1_2024.xml
```

### 3. Connect School's Drive
1. Go to `/dashboard/settings/data-connections`
2. Click "Connect Google Drive"
3. Grant Schoolgle access to the folder
4. Intelligence module will auto-detect files

### 4. View Dashboard
1. Go to `/dashboard/intelligence`
2. See connection status for each data source
3. Once connected, view dashboards:
   - Assessment trends
   - Pupil-level intel
   - Ofsted defence analysis

## Template System

Each dashboard template declares required and optional data sources:

```typescript
const template: DashboardTemplate = {
  id: "assessment-intelligence",
  name: "Assessment Intelligence Dashboard",
  requiredDataSources: ["census_school", "assessment_eyfsp"],
  optionalDataSources: ["assessment_phonics", "assessment_ks1", "assessment_ks2"],
  features: [
    "EYFSP trends with SEN disaggregation",
    "Phonics pass rates by cohort",
    "KS1 attainment breakdown",
    "Ofsted defence analysis",
  ],
};
```

The template only renders features for which data is available.

## GDPR & Data Sovereignty

### ✅ What We DO
- Read files from school's cloud storage via OAuth
- Parse files in memory to extract insights
- Show aggregated statistics and trends
- Display pupil-level views (resolved live from source)
- Cache connection metadata (file IDs, names, modified dates)

### ❌ What We DON'T
- Store pupil data in Supabase
- Cache pupil names or UPNs
- Create permanent copies of assessment data
- Share data with third parties

### 🔒 School Control
- Revoke Drive access = instant data removal
- Delete connection = all metadata gone
- View audit log of all data access
- Export/purge data on demand

## Next Steps

### Immediate
- [x] Create module structure and types
- [x] Build census XML parser
- [x] Create data connection UI
- [ ] Build assessment CTF/XML parser
- [ ] Create scan API route
- [ ] Create assessment dashboard template

### Future
- [ ] Add DfE benchmarking data
- [ ] Integrate with "Show Me" feature
- [ ] Add AI-powered insights
- [ ] Generate Ofsted defence reports
- [ ] Create pupil progress tracking
- [ ] Add national comparison
- [ ] Export to governor reports

## Related Modules

- **Show Me** (`/dashboard/show-me`) — Shows what data is connected across all modules
- **Canvas** (`/dashboard/canvas`) — Multi-source data overlay and reconciliation
- **Connectors** (`/dashboard/connectors`) — Staff statutory role connectors
- **Data Connections** (`/dashboard/settings/data-connections`) — Manage cloud storage links

## References

- DfE Census Schema: https://www.gov.uk/government/collections/school-census
- CLSF Assessment Data: https://www.gov.uk/government/publications/key-stage-2-to-key-stage-3-transition-data
- MIS Data Types: `apps/platform/src/lib/mis/types.ts`
- Cloud Service: `apps/platform/src/lib/cloud-service.ts`
