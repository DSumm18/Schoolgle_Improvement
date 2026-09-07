# Schoolgle website content release — 7 September 2026

David asked to implement the website improvements prepared on 5 September, while preserving existing sign-in and application behaviour. This release ports only the reviewed marketing work from the dirty development checkout into the clean release repository, based on `ffea9db1` (the published Worlds learning introduction).

## Changes

- Stable homepage headline, real existing demo screenshots, user-controlled Finance/SEND product tour and practical Schoolgle copy.
- Completed Governance and Teaching overviews and clearer module availability/professional-review wording.
- Eighteen source-linked articles, shared server-rendered/content-API bodies, canonical legacy redirects and real missing-page responses.
- Honest contact route instead of a newsletter form that did not save subscriptions.
- Reliable click/keyboard dropdowns, retained Worlds and sign-in links, and enquiry links that work from inner pages.
- Friendlier enquiry failures, explicit response-success checks and labelled controls. The existing waitlist endpoint and database behaviour are unchanged.

The existing public screenshot assets show demo/sample data. They are product illustrations, not customer-outcome evidence. Older module claims of guaranteed compliance, universal drive scanning, impact inferred from spending correlations and automatic contractor clearance were qualified during this port. Time-sensitive article claims were checked against primary DfE/Ofsted/EEF sources, including the inspection material effective 7 September 2026.

## Boundaries

No changes to login, password recovery, OAuth callbacks, Supabase auth context, middleware, protected dashboard layouts, environment variables, database schema or pupil data flows. The only API route changed is the public article-content endpoint. The existing Worlds games, artwork and learning introduction are retained.

The website copy describes product areas and asks visitors to discuss current availability; it is not a claim that every described workflow is available in every school subscription.

## Verification before deployment

- Full Next production build passed. Existing configuration skips whole-repository type validation; a build pass is not a full typecheck pass.
- 34 focused editorial/module tests passed, plus scoped ESLint and whitespace checks.
- Existing public baseline: nine sign-in/navigation checks passed with no write requests, including email/provider entry controls, recovery navigation, expired-reset handling, signed-out protected-page redirects and one unauthenticated API 401.
- Five enquiry frontend checks passed with intercepted API responses: required email, friendly failure and retained values, rejection of false success, confirmed success and clearing for a new request. No enquiry or email was sent.
- Responsive homepage, keyboard tour and navigation checks use the exact current React components and production CSS on the existing local preview service; Next Image/Link and analytics are adapted for that preview. Actual Next routing and image delivery require the deployed checks.

Evidence is in `test-results/website-release/` (local test artifacts). The original review is documented in the Obsidian Schoolgle Website Enhancement page and the linked Notion business brief.

## Limits and follow-up

Public production checks must pass after release. No credentials were entered and no authenticated school session was manufactured: successful account sign-in, provider callbacks, session refresh and school permissions remain unverified without a permitted account session. Do not describe an HTTP 200 login page as proof of successful authentication.

The enquiry frontend was tested against simulated responses. Live persistence and staff follow-up were not exercised, and no automatic email delivery is asserted. The prior audit's staging enquiry check remains outstanding.

Existing login issues recorded separately: long mobile introductory panel, lost intended destination on protected-page redirects and permissive `next` path validation. These were not changed by the marketing release.
