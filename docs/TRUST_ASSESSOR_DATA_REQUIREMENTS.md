# Trust Assessor Data Requirements

This is the working data contract for onboarding a school, trust, or local authority into Trust Assessor without using hidden sample data.

## What Schoolgle Can Populate Immediately

Schoolgle can populate the public-data layer from the DfE warehouse when every school has a valid URN:

- Latest KS2 published outcomes: Reading, Writing, Maths and Combined RWM+.
- Latest census context: number on roll, FSM, EAL and SEN percentage where the DfE row exists.
- Latest attendance context: attendance and persistent absence where the DfE row exists.
- School metadata: name, address, phase, local authority, academy trust and predecessor URN lineage where available.

Important limits:

- DfE KS2 data does not currently give Schoolgle the Year 6 cohort count in the imported `ks2_results` table, so the dashboard must not imply that the Y6 pupil count is known from that source.
- DfE public data does not give current EYFS, phonics, MTC, Y1-Y5 teacher assessment, in-year progress, intervention evidence or per-pupil journeys.
- Those fields are unlocked only when schools provide assessment/MIS/CTF exports or a structured Schoolgle capture.

## Files Needed For The Full Product View

To populate the full heatmaps, narratives and school-level tabs, schools need to provide one or more of these:

1. Trust/local authority assessment capture spreadsheet
   - One row per school and year group.
   - Required fields: cohort size, Reading/Writing/Maths/Combined expected+, Greater Depth where available, and capture period.
   - Used for: overview cards, traffic lights, full-year heatmaps, data quality checks and trustee/LA challenge prompts.

2. Per-school Data Summary workbook
   - One workbook per school, with tabs or sections for EYFS to Year 6.
   - Required fields: Autumn, mid-year, end-year or target percentages for all pupils and vulnerable groups.
   - Used for: school tab deep dives, term-on-term movement, baseline comparison and “what has changed?” narrative.

3. CTF or MIS assessment export
   - Pupil-level assessment records exported from the school MIS or assessment system.
   - Schoolgle stores pseudonymised pupil hashes, not pupil names.
   - Required fields: pupil identifier before pseudonymisation, academic year, year group, subject, attainment level/score, FSM, SEND, EAL and gender.
   - Strongly recommended fields: SEND category/type, EHCP status, FSM6, admission date, EAL arrival/date of entry to UK, prior attainment and provision flags.
   - Used for: EYFS-to-KS2 pupil journeys, demographic disaggregation, cohort milestone cards, intervention recommendations and “defend the numbers” analysis.

## Likely Export Routes By System

- SIMS: CTF export plus assessment marksheets or assessment tracking exports.
- Arbor: CTF/common transfer export plus custom report writer assessment export.
- Bromcom: CTF/common transfer export plus assessment/result analysis exports.
- Other trackers: CSV/XLSX export is acceptable if it can map to the Schoolgle assessment capture structure.
- Primary Assessment Gateway / statutory result files: useful as a validation source, but they do not replace school-held in-year assessment data.

## Demo Data Rule

If sample data is used for a sales demonstration, it must be explicitly labelled as illustrative and must not be written into the database as if it belongs to the school. The user-facing page must explain which real files would replace it during onboarding.
