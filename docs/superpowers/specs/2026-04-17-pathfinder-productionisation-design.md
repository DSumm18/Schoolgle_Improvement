# Pathfinder Productionisation — Design

**Date:** 2026-04-17
**Status:** Approved (take-the-lead implementation)
**Replaces:** Legacy `/dashboard/estates/floor-plan` (a deprecation redirect) and the hardcoded Grove House 3D scene at `/dashboard/show-me/site`.

## Product principle

The uploaded PDF/site plan is a **one-time setup template**. After approval, the operational product is the clean saved Pathfinder model (2D plan + 3D site view). End users never see the PDF again — it is kept only as reference metadata against the model.

The live product is the rendered Pathfinder site plan that links to Estates locations, Asset Register, helpdesk tickets, QR scans, fire routes, and future overlays.

## Goals

1. A school can open `/estates-compliance/pathfinder`, upload or connect a PDF, and have Pathfinder produce a draft clean model.
2. The school reviews, edits, approves, and publishes that model.
3. Publishing syncs rooms and site features into `estates_locations`.
4. Assets from the Asset Register appear over the model (mapped and unmapped); unmapped assets can be placed on the model; moves persist to `estates_assets.location_details.pathfinder`.
5. When the site changes later, a new PDF creates a **draft revision** without overwriting the live model; asset pins are preserved where room IDs still match, otherwise flagged as `needs_review` (never silently deleted).
6. The prototype route `/pathfinder-prototype` continues to work unchanged.

## Non-goals

- Rebuilding the 3D renderer; we progressively adapt `PathfinderPrototype`.
- Replacing the existing extractors (vision / raster / local) — we route a different image at them.
- Building a Drive-file picker for PDFs in this pass (will be stubbed "Coming soon" if scope bleeds; Upload is the gated path).

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    /estates-compliance/pathfinder                        │
│                                                                          │
│  No live model?                                                          │
│    → PathfinderSourceIntake                                              │
│         ↓ (pick file, choose page)                                       │
│      client-side pdfjs rasterise → PNG                                   │
│         ↓ (signed upload)                                                │
│      Supabase Storage: pathfinder-sources/{orgId}/...                    │
│         ↓                                                                │
│      POST /api/estates/pathfinder/extract                                │
│         ↓ (vision → raster → local, now pointing at stored PNG)          │
│      DRAFT row in estates_pathfinder_models                              │
│         ↓                                                                │
│      Load PathfinderPrototype on that extraction_result                  │
│                                                                          │
│  Live model present?                                                     │
│    → load extraction_result of is_live=true row straight into canvas     │
│    → "Upload new plan" button opens intake as a draft REVISION           │
│                                                                          │
│  Review / edit / approve → POST /api/estates/pathfinder/model            │
│  Publish → POST /api/estates/pathfinder/sync                             │
│       flips is_live, supersedes previous, flags orphan pins              │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data model

### Extend `estates_pathfinder_models` (new migration, additive only)

| Column | Type | Purpose |
|---|---|---|
| `source_document_id` | text | File id from source (e.g. Drive file id) |
| `source_document_provider` | text | `upload` \| `google_drive` \| ... |
| `source_document_path` | text | Supabase Storage path for source PDF |
| `source_page_number` | int | Page that was rasterised |
| `generated_image_url` | text | Storage path for rasterised PNG |
| `extraction_mode` | text | `vision` \| `raster` \| `local` |
| `extraction_timestamp` | timestamptz | When the extractor last ran |
| `parent_model_id` | uuid (self-FK, null) | The model this revision branched from |
| `revision_number` | int (default 1) | Revision counter within the parent chain |
| `is_live` | boolean (default false) | Only one row per org can be true |
| `superseded_by` | uuid (self-FK, null) | Next revision that replaced this one |

Partial unique index: one `is_live=true` per `organization_id`.

No destructive changes. Existing rows remain valid.

### New Storage bucket: `pathfinder-sources`

Private bucket. Path convention: `{organizationId}/{modelId}/{source.pdf|page-N.png}`. RLS: read/write only by members of that organisation (enforced through service-role server APIs; client uses signed URLs).

### Asset pin contract — unchanged

Asset Register remains source of truth. Pathfinder stores pin metadata on the asset at `location_details.pathfinder` per the existing `PathfinderAssetPin` shape. Orphan pins (their `roomId`/`siteFeatureId` doesn't resolve in the live model) get `confidence: 0.1` and `updatedAt` touched; the UI shows them in "Needs review".

## APIs

### New

- `POST /api/estates/pathfinder/upload-url` — issue a signed upload URL for `pathfinder-sources`. Returns `{ path, uploadUrl, publicPath }`.
- `POST /api/estates/pathfinder/extract` — body: `{ sourceImageUrl, sourceDocumentName, sourceDocumentProvider, sourceDocumentId?, sourcePageNumber?, sourceDocumentPath?, parentModelId?, mode? }`. Runs vision→raster→local against the supplied image (downloads it server-side), persists a **draft** row in `estates_pathfinder_models` (status=`draft`, is_live=false), returns `{ model, extractionResult }`.
- `POST /api/estates/pathfinder/revisions` — body: `{ parentModelId }`. Returns a scaffolded draft revision referencing the parent. (Actual extraction still goes through `/extract` with `parentModelId`.)

### Changed

- `POST /api/estates/pathfinder/sync` — now also:
  - If `publish: true`, sets the target model `is_live=true`, `status=published`, `published_at=now`.
  - Finds any previous `is_live=true` model for the org and sets it `is_live=false, superseded_by=<new id>`.
  - Computes orphaned asset pins (pins whose `modelId` points at the superseded model AND whose `roomId`/`siteFeatureId` doesn't exist in the new model). Writes `location_details.pathfinder.status = "needs_review"` on those assets.

### Kept unchanged

- `GET /api/estates/pathfinder/model` — extended to accept `?live=true` to return the current live model, else latest updated.
- `POST /api/estates/pathfinder/model` — still updates/creates a row.
- `GET/POST /api/estates/pathfinder/assets` — unchanged surface.
- `PATCH /api/estates/pathfinder/assets/[id]/pin` — unchanged surface; callers will start setting `status: "mapped"` explicitly.
- `POST /api/pathfinder/prototype/extract` — **untouched**, still hardcoded to Grove House. Keeps `/pathfinder-prototype` working.

## UI

### `/estates-compliance/pathfinder`

Wrapper page fetches live model (`GET /api/estates/pathfinder/model?live=true`):
- **No live model →** show `PathfinderSourceIntake` (new component). After the user completes intake+extract, render `<PathfinderPrototype estatesMode />` hydrated with the new draft.
- **Live model present →** render `<PathfinderPrototype estatesMode />` hydrated with the live model. Top-right shows a small "Plan updated? Upload new version" button which opens `PathfinderSourceIntake` in **revision mode** (passes `parentModelId`).

### `PathfinderSourceIntake` (new)

- Tabs: **Upload PDF/image** (default), **Connect from Drive** (stubbed "Coming soon" in this pass; the wrapper accepts a future `onDriveConnect` prop).
- Upload flow:
  1. User picks a file.
  2. If PDF: render thumbnails of each page with `pdfjs-dist` (client-side), user picks a page.
  3. Client rasterises the chosen page to PNG at 1600px wide.
  4. Client calls `/api/estates/pathfinder/upload-url` twice (source + png).
  5. Client uploads both directly to Supabase Storage.
  6. Client calls `/api/estates/pathfinder/extract` with the stored PNG URL + metadata.
  7. On success, lift the returned `{ model, extractionResult }` to the parent page.

### `PathfinderPrototype` (adaptations, `estatesMode` only)

- On mount (estatesMode + organizationId): `GET /api/estates/pathfinder/model?live=true`. If present, seed `data` from `extraction_result` and `estatesModelId` from `id`.
- Replace dev-only local/raster/vision buttons in estatesMode with a single **Run extraction** action that reuses the stored source image. Dev toggle stays for `/pathfinder-prototype`.
- **Assets tab:** add an "Unmapped assets" list sourced from `estatesAssetSummary.unplaced`. Each row has a "Place on map" button that enters a place-pin mode (cursor becomes a crosshair; next click on a room/site feature commits a PATCH to `/api/estates/pathfinder/assets/[id]/pin`).
- Existing selected-asset nudge buttons already PATCH on save; just make sure the PATCH is wired (it currently only updates local state).
- **Revision banner:** when the hydrated model has `parent_model_id`, show a banner with orphaned-pin count, diff summary (`X rooms added, Y renamed, Z removed`), Approve, and Publish.
- Prototype route `/pathfinder-prototype` (estatesMode=false) keeps existing behaviour.

### Asset Register entry point

`/estates-compliance/assets` — each asset row gains a small Pathfinder indicator:
- ● mapped (green) if `location_details.pathfinder.roomId` exists.
- ◌ unmapped (grey) otherwise.
- A right-click/context action "Place on Pathfinder" links to `/estates-compliance/pathfinder?placeAsset=<id>` which the Pathfinder page can pick up and pre-select into place-pin mode.

## Security / auth

- Every new API uses the existing `protectedRoute` wrapper with `requiredRole: "caretaker"` for mutations, default for reads.
- `organizationId` is always read from `auth` — never from request body. Body `organizationId` is ignored.
- Storage paths always start with `auth.organizationId` to prevent cross-org leakage via signed URLs.
- Existing RLS on `estates_pathfinder_models` already enforces org-based access; new columns inherit it.

## Out of scope for this pass

- Drive-file picker for PDFs (stubbed).
- Auto-diff of rooms between revisions at sub-geometry level — we only count room ID changes; visual diff is an incremental follow-up.
- Mobile-first intake flow (desktop-first this pass).
- Automatic rerun of extraction on an existing source (manual re-run is fine).

## Testing / verification

1. **Lint & typecheck** scoped to changed files.
2. `/pathfinder-prototype` loads Grove House and runs extraction — unchanged behaviour.
3. `/estates-compliance/pathfinder` loaded as authenticated user:
   - No live model → intake shown → upload PDF → page selected → PNG rendered → extract succeeds → canvas hydrates with returned model → save → approve → publish → `estates_locations` rows appear.
   - Live model present → canvas hydrates on mount → "Upload new version" triggers revision flow → new draft created with `parent_model_id` set → publish flips `is_live` and supersedes the previous.
4. Asset Register:
   - Unmapped asset appears in Pathfinder "Unmapped assets" list.
   - Clicking "Place on map" then clicking a room on the canvas → asset's `location_details.pathfinder.roomId` equals the selected room.
5. Orphan flow:
   - Publish a revision whose schema deletes a room that previously held a pinned asset → that asset now shows `status: "needs_review"` under Pathfinder overlay.
6. Collect curl/request evidence for each new API and a browser screenshot of the happy path.

## Rollout

Single feature-branch PR. Migration runs via `supabase db push`. Storage bucket created via migration. No flag gating — Pathfinder is already live on the page; we're replacing its internals. The old `/dashboard/estates/floor-plan` redirect keeps its current target (`/dashboard/show-me/site`) until we flip it to `/estates-compliance/pathfinder` in a follow-up, so no user is stranded mid-flight.
