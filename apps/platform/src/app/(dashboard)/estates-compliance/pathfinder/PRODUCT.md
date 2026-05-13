# Pathfinder

## What It Is

Pathfinder turns a school's uploaded site plan or floor-plan PDF into a clean, editable operational map. The source PDF is used during setup only; the live product is the reviewed Pathfinder model connected to Estates locations, Asset Register pins, tickets, QR scans, and routes.

## Who Uses It

School operations teams, caretakers, office staff, senior leaders, and anyone responsible for estates compliance or asset location data.

## Key Screens

- First-run setup wizard at `/estates-compliance/pathfinder`
- PDF/image upload and page selection
- Optional room-list upload for room schedules, condition surveys, CSV/Excel files, or text PDFs
- Draft review canvas with room-list validation badges
- Asset overlay with "Save pin to Asset Register"

## Workflow

1. The user opens Estates Compliance and clicks Pathfinder.
2. If no live model exists, Pathfinder explains the setup process step by step.
3. The user uploads a site plan PDF/image and optionally uploads a room list or condition survey.
4. Pathfinder rasterises the chosen page, stores the source in the private `pathfinder-sources` bucket, and extracts a draft model.
5. Room-list references are compared with detected rooms so missing or unmatched spaces are surfaced before approval.
6. The user reviews rooms and asset placements.
7. Publishing syncs approved spaces into Estates locations and makes one live Pathfinder model for the signed-in organisation.

## Ed Integration

Ed can use Pathfinder context in future to explain where assets, rooms, tickets, and compliance issues are located. The Asset Register remains the source of truth for assets.

## Killer Features

- Guided setup for users who have never seen an AI site-plan workflow before
- Optional room-list validation from council schedules, condition surveys, spreadsheets, or text PDFs
- Organisation-scoped storage and model records
- Asset pins saved back to the Asset Register with mapped, needs-position, or needs-review status

## Cross-Module

- Estates locations receive approved rooms and site spaces.
- Asset Register receives Pathfinder pin metadata in `location_details.pathfinder`.
- Helpdesk, QR, routes, and compliance overlays can reference the live model.

## Technical Notes

- Uploaded sources are stored in the private Supabase Storage bucket `pathfinder-sources`.
- Extracted models are stored in `estates_pathfinder_models` by `organization_id`.
- Upload paths start with the organisation id so storage RLS can enforce tenant isolation.
- Only approved rooms/site features are synced into `estates_locations`.
- Revisions supersede the previous live model and mark orphaned asset pins as needing review.

## Version History

- 2026-04-23: Added first-run setup wizard, optional room-list parsing, room-list validation summary, safer empty-extraction handling, and stricter Asset Register pin status preservation.
