import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalCard,
  LegalPageShell,
  LegalSection,
} from "@/components/website/LegalPage";
import { schoolgleCompanyDetails } from "@/lib/company-details";

export const metadata: Metadata = {
  title: "Data Protection | Schoolgle",
  description:
    "Schoolgle data protection summary for UK school DPOs, including controller/processor roles, DPIAs, DPA, security and contact details.",
};

export default function DataProtectionPage() {
  return (
    <LegalPageShell
      eyebrow="Data protection"
      title="Data protection summary for schools and DPOs"
      description="A practical index for school DPOs reviewing Schoolgle before a school sends live data."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <LegalCard title="Controller and processor roles">
          <p>
            The subscribing school or trust remains the data controller for
            school data. Schoolgle acts as processor when delivering the
            platform, support, security and agreed product workflows.
          </p>
        </LegalCard>
        <LegalCard title="Company and registration details">
          <p>
            {schoolgleCompanyDetails.legalName}. Company number{" "}
            {schoolgleCompanyDetails.companyNumber}. ICO registration{" "}
            {schoolgleCompanyDetails.icoRegistration}. Registered office:{" "}
            {schoolgleCompanyDetails.registeredOffice}.
          </p>
        </LegalCard>
      </div>

      <LegalSection title="Before sending live data">
        <p>
          Schools should review the relevant product schedule, Data Processing
          Agreement and DPIA/product annex before sending live pupil, staff,
          contractor or evidence data to Schoolgle.
        </p>
        <p>
          Product-specific DPIA annexes are used where a module or app processes
          higher-risk data, such as children&apos;s data, SEND/characteristic
          data, safeguarding-adjacent information, contractor DBS status or
          uploaded evidence containing personal data.
        </p>
      </LegalSection>

      <LegalSection title="Key review documents">
        <div className="grid gap-4 md:grid-cols-2">
          <LegalCard title="Privacy policy">
            <p>
              How Schoolgle explains roles, data categories, AI use, rights,
              children&apos;s data and contact routes.{" "}
              <Link href="/privacy" className="underline">
                Read the privacy policy
              </Link>
              .
            </p>
          </LegalCard>
          <LegalCard title="Data Processing Agreement">
            <p>
              Summary of the controller/processor agreement structure and
              Article 28 duties.{" "}
              <Link href="/dpa" className="underline">
                View the DPA page
              </Link>
              .
            </p>
          </LegalCard>
          <LegalCard title="Sub-processors">
            <p>
              Third-party providers used to deliver Schoolgle and the purposes
              they support.{" "}
              <Link href="/sub-processors" className="underline">
                View sub-processors
              </Link>
              .
            </p>
          </LegalCard>
          <LegalCard title="Security">
            <p>
              Access control, organisation scoping, encryption, audit logging
              and incident support.{" "}
              <Link href="/security" className="underline">
                View security overview
              </Link>
              .
            </p>
          </LegalCard>
        </div>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For data-protection queries, email{" "}
          <a
            href={`mailto:${schoolgleCompanyDetails.privacyEmail}`}
            className="underline"
          >
            {schoolgleCompanyDetails.privacyEmail}
          </a>{" "}
          or{" "}
          <a
            href={`mailto:${schoolgleCompanyDetails.dpoEmail}`}
            className="underline"
          >
            {schoolgleCompanyDetails.dpoEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
