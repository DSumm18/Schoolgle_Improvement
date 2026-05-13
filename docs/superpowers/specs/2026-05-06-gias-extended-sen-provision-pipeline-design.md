# DfE GIAS Extended SEN Provision Pipeline Design

## Purpose

Trust Assessor must be able to explain school context accurately without hardcoded or manually pasted provision details. SEN provision data is high-trust/high-risk: if the app states that a school has a VI, HI, ASD, SLCN, SEN unit or resourced provision incorrectly, school leaders will spot it immediately. The pipeline must therefore prioritise official sources, confidence labelling and mismatch detection.

## Scope

This design covers a reusable DfE/GIAS extended profile pipeline for fields not currently held in the `schools` warehouse table:

- type of SEN provision;
- type of resourced provision;
- resourced provision number on roll;
- resourced provision capacity;
- SEN unit number on roll;
- SEN unit capacity;
- date last changed / confirmed;
- source URL and source timestamp;
- confidence and conflict status.

This is not a Rochdale-only enrichment and must work for any trust, LA, school group or single school with URNs.

## Source Priority

1. Official GIAS bulk/export data where these columns are available.
2. Live GIAS establishment page scrape as fallback for missing extended fields.
3. DfE SEN school-level underlying file as cross-check, not as the sole source for human-readable provision type.
4. Manual override only with explicit provenance and visible confidence label.

## Data Model

Create a dedicated table, rather than stuffing these fields into `organizations.settings`:

`school_gias_extended_profiles`

Core columns:

- `urn integer primary key`
- `school_name text`
- `sen_provision_type text`
- `resourced_provision_type text`
- `resourced_provision_on_roll integer null`
- `resourced_provision_capacity integer null`
- `sen_unit_on_roll integer null`
- `sen_unit_capacity integer null`
- `gias_last_confirmed date null`
- `source_url text not null`
- `source_method text not null` — `bulk_export`, `gias_page_scrape`, `manual_verified`
- `source_fetched_at timestamptz not null`
- `confidence_status text not null` — `verified`, `missing`, `conflicting`, `stale`, `manual_verified`
- `validation_notes jsonb not null default '[]'`
- `raw_snapshot jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Optional later columns can split SEN provision into normalized codes, e.g. `['SLCN', 'ASD']`, but the raw official label should also be retained.

## Validation Rules

The pipeline must not silently trust a single scraped value.

Validation checks:

- If GIAS says `Resourced provision` or `SEN unit`, the DfE SEN file should normally show `RP_Unit` or `SEN_Unit` for the same URN/year.
- If GIAS has on-roll greater than capacity, keep the value but add a warning note, because this can be true but needs context.
- If SEN file flags provision but GIAS has no provision type, mark `conflicting`.
- If GIAS page cannot be fetched or parsed, mark `missing` rather than guessing.
- If source data is older than a defined threshold, mark `stale` and show the last confirmed date.

## Product Behaviour

Trust Assessor should use this table to generate provision-aware insights:

- “This school has a HI resourced provision, so compare outcomes with provision-aware peers.”
- “This school has no SEN unit/resource provision; high EHCP rate therefore reflects mainstream complexity rather than a designated base.”
- “GIAS and SEN census disagree; verify before making a strong claim.”

Reports should show the source/confidence label close to any statement about provision.

## Rochdale Example

From live GIAS checks:

- Shawclough Community Primary School: ASD and PMLD; resourced provision and SEN unit; RP 7/8; SEN unit 21/20.
- Marland Hill Community Primary School: HI; resourced provision.
- Boarshaw Community Primary School: SLCN and ASD; SEN unit; SEN unit 24/24.

These should be imported through the same pipeline as any other LA/trust, not manually placed into Rochdale settings.

## Implementation Shape

- Add migration for `school_gias_extended_profiles`.
- Add a server-side GIAS extended profile importer/parser.
- Add a reconciliation function that compares GIAS profile fields with DfE SEN school-level rows.
- Add API endpoint for fetching extended profiles by org tree.
- Feed Trust Assessor public-data report from this table.
- Add tests using saved HTML/fixtures for the three Rochdale provision examples.

## Non-Goals

- Do not hardcode Grove House, Rochdale or any specific school into product code.
- Do not infer provision type only from pupil primary-need counts.
- Do not make strong report claims without source and confidence labels.
