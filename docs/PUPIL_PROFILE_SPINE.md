# Pupil Profile Spine

Date: 2026-06-08

## Product Decision

Schoolgle should not become a heavy second Arbor/MIS. The import layer should stay deliberately thin: it creates and refreshes the core pupil profile records needed for matching, class lists, pupil passes and module links.

The day-to-day operational record is the **Pupil Profile**. App-specific data remains in the app that owns it, but every pupil-related record should link back to the core `pupils.id` or to a stable pupil reference that can be resolved to it.

## Operating Model

1. **Data Upload creates the spine**
   - Imports basic pupil identity/roll data.
   - Updates matched pupils.
   - Adds new pupils.
   - Flags missing pupils for archive review rather than deleting them.

2. **Pupil Profile is the user-facing card**
   - Shows core details, class/year, source refs and import status.
   - Aggregates module cards such as SEND, assessment/work, attendance, behaviour and GDPR.
   - Does not flatten all app data into one giant pupil table.

3. **Apps own detailed records**
   - SEND owns SEND register, provision, actions, notes, annual-review runway and funding data.
   - Assessment/work apps own pupil work, evidence, AI assessment and feedback records.
   - Attendance, behaviour and safeguarding records stay in their own restricted modules.

4. **The spine controls GDPR discovery**
   - A pupil data inventory declares which modules hold data about a pupil.
   - DSAR/export/archive/anonymise/delete tooling should use that inventory so records are not missed.
   - Highly restricted modules must still enforce module-specific permissions.

## Current Implementation Slice

- `apps/platform/src/lib/pupil-profile-spine.ts` defines the module inventory and profile-card builder.
- `apps/platform/src/app/api/pupils/[id]/profile/route.ts` aggregates core pupil data and linked SEND counts.
- `apps/platform/src/app/(dashboard)/dashboard/pupils/[id]/page.tsx` displays the Pupil Profile card.
- Data Upload now has a `View profile` action for imported pupils.
- SEND register rows are hydrated with `pupil_record_id` where they match the core pupil spine, allowing SEND to link back to the profile.

## Rules For Future Modules

Any new pupil-facing module should:

- Store app-specific fields in its own module table.
- Link to `pupils.id` where possible.
- If importing from external systems, store source refs and match them conservatively.
- Register itself in the pupil data inventory.
- Declare sensitivity, access role expectations, retention owner and DSAR inclusion.
- Avoid exposing sensitive module records through the profile unless the user has the right module permission.

## Open Product Work

- Add editable Pupil Profile fields for Schoolgle-owned overlays.
- Add field-level provenance: imported, manually amended, module-created, or reconciled.
- Add profile audit history.
- Add GDPR export/archive/anonymise/delete actions driven by the inventory.
- Add module-aware access rules so teachers, SENCO, SLT and safeguarding roles see only appropriate tabs.
- Build Staff Profile Cards using the same pattern for staff details, login mapping, permissions, module access, classes and responsibilities.
