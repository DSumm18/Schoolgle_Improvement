# Legal template DPO review note

Last updated: 14 May 2026

## Purpose

This note records the legal-template review completed for the public Schoolgle legal and trust pages. It is intended to help a DPO, solicitor or school/trust information governance lead review the website pack efficiently.

This is not legal advice. It is a best-efforts product and engineering interpretation for DPO/legal review.

## Official sources checked

- ICO guidance on controller-processor contracts and UK GDPR Article 28 clauses: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/
- ICO guidance on PECR cookies and similar technologies: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
- ICO guidance on storage and access technologies, including local storage, scripts, tags, tracking pixels and device fingerprinting: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-storage-and-access-technologies/
- ICO personal data breach guidance, including controller reporting and processor notification expectations: https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/
- Department for Education school data protection guidance: https://www.gov.uk/guidance/data-protection-in-schools

## MEEPS / PECR interpretation

No current UK data protection, education privacy or school website compliance regime was identified under the name "MEEPS".

The closest likely interpretation for this website/legal-pack work is PECR, because PECR governs cookies and similar storage/access technologies. The ICO guidance makes clear that these rules are not limited to cookies and can include local storage, scripts, tags, tracking pixels and device fingerprinting.

If "MEEPS" was intended to mean MEES, the Minimum Energy Efficiency Standards, that is an estates/property compliance issue for rented buildings and is not part of the public privacy, cookies, DPA or website terms pack. MEES should be handled separately inside Estates Compliance if Schoolgle tracks building compliance duties.

## Template position

- Public pages are written as explanations and templates, not signed legal instruments.
- The DPA page now states that it requires legal/DPO review before signature.
- The DPA page now includes an Article 28 checklist and a draft processing schedule.
- The cookie page now covers PECR-style "storage and access technologies", not only browser cookies.
- The sub-processor page now separates supplier purpose, data involved, location and safeguards to confirm.
- The terms page now separates public website terms from product contracts, pilots, DPAs and commercial terms.
- The security page now acknowledges current improvement areas and DPO confirmation points.

## DPO/legal review points

Before treating these pages as final, confirm:

- Whether Schoolgle has a formally appointed DPO or should use "privacy lead/privacy contact" wording only.
- The exact registered office, company details and contractual entity for Schoolgle Limited.
- Whether `privacy@schoolgle.co.uk` and `admin@schoolgle.co.uk` are monitored and have an internal escalation route.
- The live production hosting regions for Supabase, Vercel, email, AI providers and storage.
- Which sub-processors are actually active in production and which are optional/future.
- Whether every sub-processor has appropriate contractual terms, DPA coverage and transfer safeguards.
- The exact breach-notification commitment to include in signed customer contracts.
- The deletion, retention, backup and audit-log retention schedule after contract termination.
- Whether the product needs a DPIA template for schools using AI with pupil, staff, SEND, safeguarding or HR data.
- Whether any analytics, pixels, session replay, local storage or device identifiers are active beyond strictly necessary use.
- Whether local storage currently contains sensitive OAuth/API keys or pupil lookup information, and the remediation timeline.
- Whether AI provider prompts are consistently minimised and logged with human-review status.

## Recommended next steps

1. Convert the public DPA explanation into a downloadable DPA schedule once legal review is complete.
2. Add a signed-version register for customer contracts, DPAs and sub-processor notices.
3. Add a privacy-change log for website policy updates.
4. Complete a production cookie/storage scan before launch and whenever analytics are introduced.
5. Complete a supplier-by-supplier transfer assessment for AI and infrastructure providers before processing live school data at scale.
6. Add an internal DPIA template for high-risk AI, safeguarding, SEND, HR or pupil-data features.

## Files reviewed or updated

- `apps/platform/src/app/(marketing)/privacy/page.tsx`
- `apps/platform/src/app/(marketing)/cookies/page.tsx`
- `apps/platform/src/app/(marketing)/terms/page.tsx`
- `apps/platform/src/app/(marketing)/trust/page.tsx`
- `apps/platform/src/app/(marketing)/trust-gdpr/page.tsx`
- `apps/platform/src/app/(marketing)/security/page.tsx`
- `apps/platform/src/app/(marketing)/dpa/page.tsx`
- `apps/platform/src/app/(marketing)/sub-processors/page.tsx`
- `apps/platform/src/app/(marketing)/legal/page.tsx`
- `apps/platform/src/app/(marketing)/ai-governance/page.tsx`
- `apps/platform/src/components/website/Footer.tsx`
- `apps/platform/src/components/website/LegalPage.tsx`
