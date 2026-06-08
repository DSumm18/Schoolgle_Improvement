# UAT Database Safety

Date: 2026-06-08

## Purpose

Local development and UAT can use live-like data for non-paying testbed schools such as Grove House Primary School and Aurora Primary, but paying live customer accounts must not be accidentally used as local test sandboxes.

## Runtime Rules

- `SCHOOLGLE_DB_ENV=uat` or `NEXT_PUBLIC_SCHOOLGLE_DB_ENV=uat` allows local development against a remote UAT-style database connection.
- `SCHOOLGLE_LOCAL_ALLOWED_ORG_IDS` is a comma-separated allow-list for organisations that local/UAT can access.
- `SCHOOLGLE_PROTECTED_LIVE_ORG_IDS` is a comma-separated deny-list for paying/live organisations that must not be accessible from local/UAT.
- Production runtime is not blocked by this guard, so authorised users can still use protected organisations in the production app.

## Rawdon / Grove Operating Model

- Rawdon St Peter's should be listed in `SCHOOLGLE_PROTECTED_LIVE_ORG_IDS`.
- Grove House Primary School and Aurora Primary can be listed in `SCHOOLGLE_LOCAL_ALLOWED_ORG_IDS` while used as UAT/testbed organisations.
- If an organisation appears in neither list, it is only accessible in local/UAT when no allow-list has been configured.

## Local Command

Use:

```bash
npm run dev:uat
```

This sets the database environment to `uat`, runs the existing database safety check, then starts the Next.js dev server.

## Enforcement Points

- Shared API auth middleware blocks requests for protected/disallowed organisations in local/UAT.
- The organisation switcher API filters protected/disallowed organisations out of the selectable list.

## Test Data Hygiene

Grove House Primary School may contain live-like trial data that should be preserved as the clean customer starting point. Treat it as production-grade data even when it is used for UAT.

- Current non-sensitive Grove House SEND baseline: `docs/uat-baselines/grove-house-send-baseline-2026-06-08.md`.
- Before any test that writes database records, capture a baseline of the affected organisation and tables.
- Prefer non-destructive tests using dedicated test records that are clearly named, timestamped and tagged with a test run identifier.
- Every write test must define its cleanup path before the test runs.
- Cleanup must remove or revert all records created or changed by the test run.
- After cleanup, re-check counts and key records against the baseline before moving to the next feature.
- Never run broad delete/update statements against Grove House data without a scoped organisation ID and a scoped test run identifier.
- Do not store raw pupil/customer data in repo docs, Obsidian or Notion when recording baselines. Store counts, checksums, table names, timestamps and test-run IDs instead.
- If a test cannot be safely cleaned up, run it against a disposable seeded fixture organisation rather than Grove House.

## SEND Build QA Gate

For the SEND product build, each feature must pass this gate before the next feature begins:

1. Write targeted tests for the library/API behaviour.
2. Run the targeted tests and record the command.
3. Browser-test the user flow where the change is user-facing.
4. Confirm database writes persist correctly.
5. Cleanup any test data or revert edited test records.
6. Re-check the Grove House baseline.
7. Record remaining risks before starting the next feature.

## Failure Message

When blocked, the API returns HTTP `403` with either:

- `PROTECTED_LIVE_ORG_BLOCKED`
- `LOCAL_ORG_NOT_ALLOWED`
