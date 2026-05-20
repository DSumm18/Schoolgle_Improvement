# Deployment and release control

Last updated: 20 May 2026  
Status: Release-control baseline for live customer rollout.

## Release principle

Schoolgle must use a preview-first release path once schools are live on the platform. Do not deploy directly from a local working tree to production unless there is a documented emergency and a rollback target has been identified.

## Standard release path

1. Confirm the release scope and name the customer impact areas.
2. Run focused tests for every changed product area.
3. Run the platform production build from `apps/platform`.
4. Push a release branch and let Vercel create a preview deployment.
5. Smoke test the preview against key customer journeys.
6. Promote the verified preview to production or merge through the agreed production branch.
7. Record the production deployment id, commit, smoke-test result and rollback target.

## Current minimum smoke-test set

- Sign in as a Schoolgle admin and a school-level user.
- Switch between parent entities and child schools without losing sidebar position.
- Open `School Improvement Assessor` from the School Improvement module.
- Open Class Builder and verify pupil import, QR/session entry and school-level access.
- Open Estates and verify dashboard, assets, tasks and compliance pages load.
- Open Data Connections and verify Google Drive connected state and non-destructive scan/refresh wording.
- Open Ofsted Readiness and verify website scan evidence links, findings and task creation still load.
- Open Ed and verify it uses Fish Audio only when the Fish API key is configured, otherwise browser TTS.

## Customer-safe change control

- Use feature flags or module entitlements for unfinished products and customer-specific pilots.
- Add folders and connector structures only for products the organisation has access to.
- Never delete, move or overwrite customer Drive/SharePoint files during connector refresh.
- Treat database migrations as forward-only and non-destructive unless a separate data-retention plan is approved.
- Label demo or illustrative data clearly and keep it out of production customer reporting unless the school has approved it.
- Keep UI changes small and product-owner approved once customers have active workflows.

## Rollback expectation

Every production deployment should have a known rollback target:

- previous production deployment id or URL;
- commit hash deployed;
- migration risk summary;
- customer journeys affected;
- person who approved the promotion.

## Tooling gaps to close

- Add a CI workflow for the platform app using Node 20.
- Make root `npm run build` align with the actual platform build or document that Vercel uses `cd apps/platform && npm run build`.
- Require preview smoke-test notes before production promotion.
- Add a release note template for customer-visible UI or workflow changes.
- Keep Vercel access available to the release operator so deployments can be inspected and rolled back quickly.
