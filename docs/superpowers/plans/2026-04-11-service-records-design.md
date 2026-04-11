# Service Records + Per-Asset Schedules + Cost Splitting

**Date:** 11 April 2026
**Author:** Jarvis (Product Architect)
**Status:** Design → Implementation

## 1. The Problem

> "We have 3 boilers. Contractor does all 3 in one visit, sends one invoice for £900. But they might have been bought at different times so they need different service schedules. Current systems just say 'boiler service — annual' and lump them together. We need to be smarter. The £900 needs to split — maybe £200 for boiler 1, £350 for boiler 2, £350 for boiler 3. Each boiler needs its own running cost, its own next-due date, and we need bundling suggestions when dates cluster." — David

## 2. Why existing systems fail

| System | Model | Gap |
|--------|-------|-----|
| Every Compliance | One task per domain per site | Can't track per-asset schedules |
| Atlas Facilities | Asset has last/next service | No invoice-to-asset cost linking |
| Parago | Task-based checks | No cost splitting |
| Civica | Asset-level schedules exist | No AI cost allocation |
| PlanitPlus | Single task per check type | No per-asset anything |

**None auto-allocate invoice costs across multiple assets.** That's our wedge.

## 3. Three distinct concepts currently conflated

1. **Compliance check** — the statutory requirement (e.g. "annual gas safety inspection"). Template, not an event.
2. **Asset service schedule** — per-asset `next_service_due` date. Already on `estates_assets` but underused.
3. **Service record** — the event that happened. Currently missing as a first-class entity (we hack it via `maintenance_history` JSONB).

## 4. New data model

### estates_service_records (the event)
- id, organization_id, service_date, service_type, compliance_domain, compliance_check_id
- contractor_id, engineer_name
- invoice_reference, invoice_evidence_id, certificate_reference
- total_cost, currency
- notes, overall_result (pass/fail/advisory/mixed)
- source (manual / ai_extracted / contractor_portal)

### estates_service_record_assets (junction — one row per asset serviced)
- id, service_record_id, asset_id
- result (pass/fail/advisory/not_assessed)
- findings, remedial_actions, remedial_cost_estimate
- **cost_allocated** (this asset's share)
- **allocation_method** (manual / equal_split / weighted_capacity / invoice_line_item / ai_extracted)
- **last_service_date, next_service_due** (denormalised for fast per-asset lookups)
- certificate_evidence_id
- UNIQUE(service_record_id, asset_id)

## 5. Cost allocation methods

- **Equal split**: £900 / 3 = £300 each (default for manual)
- **Weighted capacity**: reads `specifications.capacity_kw` from each asset, weights by share
- **Invoice line items (AI)**: extend Gemini prompt to pull per-asset line items from the invoice. Most accurate.
- **Manual override**: user edits the form

## 6. Per-asset scheduling

`getAssetWithLinks` returns `last_service_date` / `next_service_due` from the *most recent junction row* for this asset, not from `estates_assets.last_inspection_date`.

Compliance dashboard roll-up:
```sql
SELECT compliance_domain,
  COUNT(*) FILTER (WHERE next_service_due < NOW() + INTERVAL '30 days') as due_soon,
  COUNT(*) FILTER (WHERE next_service_due < NOW()) as overdue
FROM estates_service_record_assets sra
JOIN estates_service_records sr ON sra.service_record_id = sr.id
WHERE sr.organization_id = $1
GROUP BY compliance_domain;
```

## 7. Bundling opportunities (Ed skill)

Given per-asset schedules, find clusters:
- Same compliance domain
- Next-due dates within a configurable window (default 90 days)
- Estimate saving: (N-1) × typical callout fee
- Suggest: "These 3 boilers are due May-July. Bundle one visit. Est. saving £400."

## 8. Migration path

- Keep `maintenance_history` JSONB (frozen, read-only)
- New writes go to service_records + junction
- Asset detail page shows both (service_records first, legacy below)
- Asset's `last_inspection_date` / `next_inspection_due` get updated when a new junction row is added (application code)

## 9. Implementation order

1. Migration: tables + indexes
2. TypeScript types
3. DB helper layer
4. API routes (POST, GET by asset)
5. `getAssetWithLinks` reads from service_records
6. Contractor report apply → creates service_records + junction
7. Gemini prompt: extract invoice line items
8. Cost allocation helpers
9. Ed skill: `create_service_record` (PROPOSE flow)
10. Ed skill: `find_bundling_opportunities`
11. Asset detail UI — service history from service_records
12. Compliance dashboard per-asset roll-up
13. "Log Service" button + form

## 10. Why this wins

- No competitor auto-allocates costs — manual spreadsheet work everywhere else
- Asset-level schedules (not task-level) model reality correctly
- Bundling recommendations are unique — schools save money from this alone
- Ed reads the invoice → proposes the allocation → user approves → zero manual entry

The combination: read invoice → allocate costs → update schedules → surface bundling. No spreadsheet, no double-entry, no guessing.
