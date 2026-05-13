# Schoolgle App Connection Map

Last updated: 1 May 2026

## Principle

Schoolgle is not trying to become the canonical file store for every school document. The connected Drive or SharePoint folder remains the source of truth for original files. Schoolgle stores the operational layer around those files: metadata, scan state, classifications, extracted summaries, findings, tasks, owners, review dates and audit trails.

This prevents two dangerous failure modes:

- schools updating a Drive policy while Schoolgle silently uses an old database copy;
- modules scanning the whole vault when they only need a focused folder.

## Shared Connector Boundary

The approved connector boundary is:

```text
Schoolgle
├── Ofsted Readiness
├── SIAMS Readiness
├── Trust Assessor
├── MIS Exports
├── Policies
├── Compliance
├── Finance
└── Estates
```

Schoolgle should scan only inside this connected `Schoolgle` folder. It should not read from Drive root, personal folders or public “anyone with the link” shares.

Each module should show a small connection header stating:

- the folder it is using;
- when that folder was last scanned;
- how many relevant files were detected;
- what remains the source of truth;
- what Schoolgle stores in its database.

## App-to-Folder Map

| App | Primary Connected Path | Also Consumes | Source of Truth | Schoolgle DB Stores |
| --- | --- | --- | --- | --- |
| Policy Manager | `Schoolgle / Policies / Current Policies` and `Schoolgle / Policies / Review Due` | Governance, Ofsted, SIAMS | Drive/SharePoint policy document, unless generated in Schoolgle | Policy register metadata, file ID, owner, review dates, approval state, scan status and checks |
| Ofsted Readiness | `Schoolgle / Ofsted Readiness` | Policy Manager, Trust Assessor, School Intelligence, website scans, tasks | Evidence files, live website, validated intelligence tables | Evidence matches, readiness findings, checklist status, scan summaries, tasks and evidence trails |
| SIAMS Readiness | `Schoolgle / SIAMS Readiness` | Policy Manager, website scans, tasks | SIAMS evidence files and live website | SIAMS evidence matches, framework assessments, findings, tasks and evidence trail |
| Trust Assessor | `Schoolgle / Trust Assessor` | DfE warehouse, School Intelligence | Trust spreadsheets and DfE datasets | Explicit validated values, school/trust summaries, heatmaps, data-quality warnings and narratives |
| School Intelligence | `Schoolgle / MIS Exports` | DfE warehouse, Trust Assessor | MIS exports and DfE datasets | Approved imports, pseudonymised pupil records, cohort outcomes, gaps, trends and warnings |
| Compliance | `Schoolgle / Compliance` | Policy Manager, tasks | Compliance files and Schoolgle statutory records | Compliance items, checks, training status, SCR metadata, findings, reminders and tasks |
| Estates | `Schoolgle / Estates` | Compliance, tasks | Contractor certificates, invoices and premises evidence | Assets, contractors, checks, helpdesk tickets, inspections, tasks and evidence metadata |
| Governance | `Schoolgle / Policies` plus governance records | Policy Manager, meetings, tasks | Approved documents and governance records | Governors, visits, meetings, approvals, policy review links and governance task history |

## Policy Manager Source of Truth

The Policy Manager should not blindly copy every policy into Supabase. Its default model should be:

1. policy file stays in Drive or SharePoint;
2. Schoolgle stores a policy register row pointing to the file;
3. scans extract dates, titles, policy type, approval state and statutory checks;
4. review tasks are created in Schoolgle;
5. the next scan checks whether the source file changed.

If a policy is authored inside Schoolgle, the generated document record can become a Schoolgle-managed source, but it should still be exportable/publishable and linked back to the policy register.

## Archive Rule

Every app evidence folder may contain `_Archive - Do Not Scan`. Archived files are retained for audit and manual lookup but should not count as current evidence, readiness coverage or policy compliance.

Schoolgle may surface archived matches as warnings, for example: “A safeguarding policy exists only in archive, so no current policy was counted.”

## Inbox Rule

`00 Inbox - To Sort` is a safe drop-zone for messy schools. Schoolgle may classify files and suggest where they belong, but it should not silently move or delete school files. The safer workflow is:

1. scan inbox;
2. classify likely module/folder;
3. show “suggested filing” actions;
4. let an admin approve moves;
5. record the move in the audit trail.

## Implementation Notes

The code-level map lives in `apps/platform/src/lib/schoolgle-connector.ts`. The app-level status API is `GET /api/data-connections/app-status?appKey=<app-key>`, backed by `school_data_connections` scan metadata.

The UI pattern should be reused as each module is connected:

```text
Connected to: Schoolgle / Policies
3 relevant files · Last scan 01/05/2026 06:59
Drive/SharePoint is source of truth. Schoolgle stores metadata, review state and tasks.
```
