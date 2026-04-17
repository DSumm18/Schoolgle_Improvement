# Validation Against Source Workbook

Date: 2026-04-16

## Result
- Status: **PASS**
- Independent recomputation vs dashboard payload mismatches: **0**

## What was validated
1. Trust-level weighted outcomes by year (EYFS GLD, Year 1-6 Combined ARE).
2. Trust deprivation gaps by year (Non-FSM minus FSM).
3. School composite weighted rankings.
4. Heatmap values for every school/year cell.
5. Issue count totals (critical/warning/info) between analysis JSON and dashboard payload.
6. Spot-check raw workbook cells shown in dashboard.

## Confirmed values
- Trust outcomes: EYFS `0.584`, Y1 `0.474`, Y2 `0.513`, Y3 `0.516`, Y4 `0.421`, Y5 `0.464`, Y6 `0.576`.
- Trust gaps: EYFS `0.045`, Y1 `0.082`, Y2 `0.156`, Y3 `0.212`, Y4 `0.204`, Y5 `0.123`, Y6 `0.129`.
- School ranking: LPS `0.583`, CVPS `0.562`, FPS `0.531`, HPS `0.511`, GHPS `0.501`, CHPS `0.479`, LGPS `0.451`.
- Year 4 mean/spread panel check: mean `0.444`, max `0.540`, min `0.310`, spread `23.0pp`.
- Question engine checks: largest dip `EYFS->Year 1 (-11.0pp)`, largest rise `Year 5->Year 6 (+11.2pp)`, top serious-flag school `GHPS (15)`.

## Important caveat
Validation confirms the dashboard accurately represents the **workbook contents** (including anomalous entries like non-integer counts/text-formatted percentages). If source entries are incorrect, visuals will faithfully reflect those errors until corrected in source.
