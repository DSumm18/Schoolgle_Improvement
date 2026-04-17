# Intelligence Brain — Shadow Mode (Phase 1)
**Date:** 16 April 2026

## Goal
Introduce a shared orchestration layer for Schoolgle Intelligence without breaking existing module APIs.

Phase 1 is **non-invasive**:
- Existing route outputs remain primary.
- Candidate "brain" outputs run in parallel (shadow).
- Differences are logged for validation before any production switch.

## Implemented Integration Points
- `POST /api/intelligence` (School Intelligence)
- `GET /api/ofsted/readiness` (Ofsted Readiness)
- `GET /api/trust-analysis` (Trust DfE Data Feed)
- `GET /api/intelligence/shadow-diffs` (Leadership monitoring endpoint)

## Shared Orchestration Layer
- File: `apps/platform/src/lib/intelligence-brain/orchestrator.ts`
- Capabilities:
  - Route-level mode resolution (`off` / `shadow` / `primary`)
  - Metric-level baseline vs candidate comparisons
  - Best-effort shadow diff persistence (`intelligence_shadow_diffs`)
  - Debug response support (opt-in only)

## Shadow Diffs Storage + Monitoring
- Migration: `apps/platform/supabase/migrations/20260416_intelligence_shadow_diffs.sql`
- Monitoring API: `GET /api/intelligence/shadow-diffs`
  - Auth: protected route, role `slt+`
  - Filters: `route`, `hours`, `limit`, `include_metrics`
  - Output: per-run divergence stats + aggregated by-route divergence rates

## Ofsted Shadow Candidate
- File: `apps/platform/src/lib/intelligence-brain/ofsted-shadow-candidate.ts`
- Candidate source: cached `evidence_gap_results` rows (`framework='ofsted'`)
- Converts status distribution to comparable readiness metrics:
  - `overall_score`
  - `critical_gaps`
  - `total_evidence`
  - `areas_analyzed`

## Feature Flags
Global:
- `INTELLIGENCE_BRAIN_MODE=off|shadow|primary`

Route-specific:
- `INTELLIGENCE_BRAIN_OFSTED_READINESS_MODE=off|shadow|primary`
- `INTELLIGENCE_BRAIN_SCHOOL_INTELLIGENCE_MODE=off|shadow|primary`
- `INTELLIGENCE_BRAIN_TRUST_ANALYSIS_MODE=off|shadow|primary`

If route-specific is set, it overrides global.

## Debugging (No API Contract Break by Default)
Use one of:
- Query param: `?debug_brain=true`
- Header: `x-schoolgle-debug-brain: 1`

When enabled, responses include `_brainShadow` payload with mode + comparison summary.

## Safety Notes
- Primary outputs are unchanged in phase 1.
- Shadow persistence is best-effort and non-blocking.
- If shadow table does not exist, route still succeeds.
- Shadow output is only included when debug flag is explicitly enabled.

## Rollout Recommendation
1. Deploy with all flags `off`.
2. Enable `shadow` for internal orgs only.
3. Review `/api/intelligence/shadow-diffs` daily for divergence patterns.
4. Define hard thresholds for acceptable divergence.
5. Only then consider route-level `primary` switch.
