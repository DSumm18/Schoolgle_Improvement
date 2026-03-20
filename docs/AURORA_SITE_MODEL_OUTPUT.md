# Aurora Primary School — Site Model Output

**Date:** 2026-03-19

---

## 1. Inferred Aurora School Structure

### Derived from Schoolgle Data

| Data Point       | Source                               | Value                                                                                                                                        |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| School name      | Demo page + seed data                | Aurora Primary School                                                                                                                        |
| Location         | Demo page                            | Town Street, Leeds, LS19 6PP                                                                                                                 |
| Pupils           | Test harness (arbor_pupil_roll.xlsx) | 420                                                                                                                                          |
| Staff            | Seeded via API (16 Mar 2026)         | 35 (2 HT, 5 SLT, 24 teachers, 3 caretakers, 2 viewers)                                                                                       |
| Classes          | Migration (20260312)                 | 14 classes, 2FE: Oak/Maple (R), Birch/Elm (Y1), Ash/Willow (Y2), Holly/Rowan (Y3), Cedar/Pine (Y4), Beech/Chestnut (Y5), Hazel/Sycamore (Y6) |
| Building         | Seed data (003_estates)              | Main Building (3 floors)                                                                                                                     |
| Hall             | Seed data                            | Capacity 200                                                                                                                                 |
| Boiler Room      | Seed data                            | Basement                                                                                                                                     |
| SEN pupils       | Test harness (sen_register)          | 84 (20% of roll)                                                                                                                             |
| Contractors      | Seed data                            | 10 contractors (fire, gas, legionella, asbestos, electrical, lift)                                                                           |
| Statutory checks | Seed data                            | 9 checks (8 complete, 1 overdue: fire risk assessment)                                                                                       |
| Helpdesk tickets | Seed data                            | 5 tickets (2 open, 1 in progress, 2 resolved)                                                                                                |

### Inferred (Not in Data)

| Item                                   | Assumption                                                             | Reasoning                                          |
| -------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| 4 floors (basement + ground + 2 upper) | 3-floor building in seed data = ground + 2 upper + basement for boiler | Standard Victorian/Edwardian primary school layout |
| EYFS on ground floor                   | Safeguarding + outdoor access requirement                              | DfE Building Bulletin 103                          |
| KS2 on upper floors                    | Standard in multi-storey primaries                                     | Common UK practice                                 |
| 2 SEND intervention rooms              | 84 SEN pupils (20% of roll)                                            | Higher than average, needs dedicated spaces        |
| Kitchen + dining separate from hall    | Standard school catering arrangement                                   | Most primaries have this                           |
| 2 muster points (EYFS + main)          | Young children need separate assembly point                            | Fire safety guidance                               |
| 6 fire exits                           | 3-storey building fire safety requirements                             | Building Regulations Approved Document B           |

---

## 2. Spatial Model

**File:** `apps/platform/src/lib/show-me-site/aurora-site-model.ts`

### Entity Hierarchy

```
Site (Aurora Primary School)
├── Building (Main Building)
│   ├── Floor (Basement, level -1)
│   │   └── Zone (Service Area)
│   │       ├── Room (Boiler Room)
│   │       ├── Room (Storage)
│   │       └── Room (Caretaker's Room)
│   ├── Floor (Ground, level 0)
│   │   ├── Zone (Admin & Reception)
│   │   │   ├── Room (Reception)
│   │   │   ├── Room (Head's Office)
│   │   │   ├── Room (School Office)
│   │   │   └── Room (Meeting Room)
│   │   ├── Zone (EYFS & KS1)
│   │   │   ├── Room (Oak - Reception)
│   │   │   ├── Room (Maple - Reception)
│   │   │   ├── Room (Birch - Year 1)
│   │   │   └── Room (Elm - Year 1)
│   │   ├── Zone (Communal)
│   │   │   ├── Room (Main Hall, cap 200)
│   │   │   ├── Room (Kitchen)
│   │   │   └── Room (Dining Area)
│   │   └── Zone (Welfare)
│   │       ├── Room (Medical Room)
│   │       └── Room (Intervention Room 1)
│   ├── Floor (First, level 1)
│   │   ├── Zone (KS1 Upper & KS2 Lower)
│   │   │   ├── Room (Ash - Year 2)
│   │   │   ├── Room (Willow - Year 2)
│   │   │   ├── Room (Holly - Year 3)
│   │   │   └── Room (Rowan - Year 3)
│   │   └── Zone (KS2 & Shared)
│   │       ├── Room (Cedar - Year 4)
│   │       ├── Room (Pine - Year 4)
│   │       ├── Room (Library)
│   │       ├── Room (ICT Suite)
│   │       ├── Room (Staff Room)
│   │       └── Room (Intervention Room 2)
│   └── Floor (Second, level 2)
│       ├── Zone (Upper KS2)
│       │   ├── Room (Beech - Year 5)
│       │   ├── Room (Chestnut - Year 5)
│       │   ├── Room (Hazel - Year 6)
│       │   └── Room (Sycamore - Year 6)
│       └── Zone (PPA & Resources)
│           ├── Room (PPA Room)
│           └── Room (Resource Store)
├── External Areas
│   ├── KS1 Playground
│   ├── KS2 Playground
│   ├── School Field
│   ├── Sensory Garden
│   ├── Staff Car Park
│   ├── Bin Store
│   └── EYFS Outdoor Area
└── Muster Points
    ├── Main (KS2 Playground, cap 500)
    └── EYFS (EYFS Outdoor Area, cap 100)
```

### Room Count: 31 rooms across 4 floors

- 14 classrooms (matching the 14 tree-named classes)
- 4 admin/office rooms
- 3 communal areas (hall, kitchen, dining)
- 3 welfare rooms (medical, 2x intervention)
- 3 service rooms (boiler, storage, caretaker)
- 4 toilet blocks

---

## 3. Generated Floor Plan Files

| File                                                    | Description                                   | Size   |
| ------------------------------------------------------- | --------------------------------------------- | ------ |
| `apps/platform/public/site-plans/aurora-basement.svg`   | Basement (boiler, storage, caretaker)         | 1.4KB  |
| `apps/platform/public/site-plans/aurora-ground.svg`     | Ground floor (admin, EYFS/KS1, hall, welfare) | 4.5KB  |
| `apps/platform/public/site-plans/aurora-first.svg`      | First floor (Y2-Y4, library, ICT, staffroom)  | 3.8KB  |
| `apps/platform/public/site-plans/aurora-second.svg`     | Second floor (Y5-Y6, PPA, resources)          | 2.5KB  |
| `apps/platform/public/site-plans/aurora-all-floors.svg` | Combined all-floors view                      | 13.5KB |

Each SVG:

- Colour-coded by room type (green=classroom, orange=hall, blue=admin, purple=staffroom, etc.)
- Labelled with room names and year groups
- Fire exits marked with door emoji + direction labels
- `data-room-id` attributes on each room rect for interactive overlay binding
- Corridors shown in grey

---

## 4. How Overlays Connect to Show Me Site

### Architecture

The spatial model uses `data-room-id` attributes on every SVG room rectangle. This enables:

```
SVG Floor Plan → click room rect → read data-room-id → look up in AURORA_SITE model → fetch linked data from APIs
```

### Overlay Types Supported

| Overlay               | Data Source                                    | How It Connects                                                                 |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| **Estates tickets**   | `GET /api/estates/helpdesk?organizationId=...` | Match ticket `location` or `room_id` to Room.id                                 |
| **Assets**            | `GET /api/estates/assets?organizationId=...`   | Match asset `location_id` to Room.id                                            |
| **Compliance items**  | `GET /api/estates/statutory-completions`       | Match domain (fire/legionella/etc.) to rooms with relevant equipment            |
| **Evacuation routes** | `EVACUATION_ROUTES` in site model              | Match `fromRoomId` to highlight path steps                                      |
| **Room risk/status**  | Derived from ticket count + compliance status  | Colour overlay: green (no issues), amber (open tickets), red (critical/overdue) |
| **Induction mode**    | `getEvacuationRoute(roomId)` + room details    | Show new starter their room, nearest exit, muster point, evacuation steps       |

### Interactive Behaviours (Specification)

| Action                      | What Happens                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Click a room                | Detail drawer opens showing: room name, type, capacity, year group/class, linked tickets, linked assets, compliance status, evacuation route |
| Select "Evacuation" overlay | All rooms coloured by distance-to-exit (green=close, red=far). Routes drawn as paths. Fire exits highlighted in red                          |
| Select "Tickets" overlay    | Rooms with open tickets turn amber/red. Click to see ticket list                                                                             |
| Select "Induction" mode     | User picks their room → shows nearest exit, muster point, step-by-step evacuation, key contacts, fire extinguisher locations                 |
| Select "Compliance" overlay | Rooms coloured by statutory check status: green (all current), amber (due soon), red (overdue)                                               |

---

## 5. Assumptions Made (Data Gaps)

| Assumption                       | Why                                                 | Impact                                                             |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| Building layout is synthetic     | No real architectural plans in Schoolgle data       | Layout is operationally believable but not geographically accurate |
| Room sizes from DfE BB103        | No actual area measurements                         | Standard compliant but approximate                                 |
| EYFS ground floor, KS2 upper     | Standard primary school practice                    | Could be different in the real school                              |
| 2 staircases (west + east)       | 3-storey fire safety requirement                    | Real building may have different staircase positions               |
| 6 fire exits                     | Building Regulations Approved Document B minimum    | Real exits may differ                                              |
| Evacuation distances approximate | Calculated from grid position, not real measurement | Sufficient for induction mode, not for fire safety audit           |
| Kitchen/dining separate rooms    | Common primary arrangement                          | Some schools have combined space                                   |
| Library on first floor           | Common in multi-storey primaries                    | Could be ground floor in reality                                   |
| 2 muster points                  | Fire safety best practice for EYFS separation       | Real school may have one or more                                   |
| External areas inferred          | Typical CoE primary school                          | Real layout will differ                                            |

---

## 6. What Should Be Built Next

### Immediate (to make the site plan interactive in Schoolgle)

1. **Show Me Site page** (`/dashboard/show-me/site`) — Uses ShowMeShell or a new SitePlanShell component with floor selector + SVG viewer + detail drawer
2. **Room click handler** — Parse `data-room-id` from SVG click events → look up in `AURORA_SITE` model → show detail drawer
3. **Overlay toggle bar** — Buttons for: Normal / Tickets / Compliance / Evacuation / Induction
4. **Ticket overlay API call** — Fetch helpdesk tickets → match to rooms → colour rooms by ticket count/severity
5. **Evacuation route renderer** — Draw SVG paths from room to exit to muster point using `EVACUATION_ROUTES` data

### Medium Term

6. **Asset tag integration** — QR codes already exist in Schoolgle (`QRCodeGenerator.tsx`). Link scanned QR → room in site model
7. **Real floor plan upload** — Allow schools to upload their actual floor plan image/SVG and map rooms onto it
8. **Multi-building support** — Some schools have separate buildings (e.g., mobile classrooms, church hall)
9. **Contractor zone access** — Show which zones a contractor needs access to for their scheduled check
10. **Live ticket status on plan** — WebSocket or polling to update room colours as tickets are created/resolved
