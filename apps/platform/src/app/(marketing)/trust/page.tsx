import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalCard,
  LegalPageShell,
  LegalSection,
} from "@/components/website/LegalPage";
import { schoolgleCompanyDetails } from "@/lib/company-details";

export const metadata: Metadata = {
  title: "Trust Centre | Schoolgle",
  description:
    "Plain-English Schoolgle trust centre covering data protection, AI governance, security, sub-processors and school control.",
};

export default function TrustCentrePage() {
  return (
    <LegalPageShell
      eyebrow="Trust centre"
      title="Built for school governance, not mystery automation"
      description="A plain-English summary of how Schoolgle approaches data protection, AI safety, security and accountability for UK schools."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <LegalCard title="Registered organisation">
          <p>
            {schoolgleCompanyDetails.legalName} is registered in{" "}
            {schoolgleCompanyDetails.registeredJurisdiction}.
          </p>
          <p>Company No. {schoolgleCompanyDetails.companyNumber}.</p>
          <p>Registered office: {schoolgleCompanyDetails.registeredOffice}.</p>
          <p>ICO registration: {schoolgleCompanyDetails.icoRegistration}.</p>
        </LegalCard>
        <LegalCard title="Controller and processor roles">
          <p>
            The subscribing school or trust is normally the data controller for
            its school data. Schoolgle acts as a processor when it provides the
            platform on that organisation&apos;s instructions.
          </p>
        </LegalCard>
      </div>

      <LegalSection title="How Schoolgle handles school data">
        <p>
          Schoolgle is designed to connect to school-owned systems where
          possible, rather than making unnecessary copies of original files.
          Drive, OneDrive or SharePoint should remain the source of truth for
          original documents. Schoolgle stores the metadata, extracted checks,
          evidence links, tasks, review dates and audit history needed for the
          workflow.
        </p>
        <p>
          Assessment and intelligence workflows should use pseudonymised or
          cohort-level data wherever possible. Sensitive pupil, staff,
          safeguarding, SEND and HR data should only be processed where the
          workflow requires it and the user has the right permissions.
        </p>
      </LegalSection>

      <LegalSection title="AI governance">
        <p>
          Schoolgle uses AI to assist with summaries, drafts, evidence mapping
          and suggested next steps. AI output is advisory only. It must be
          reviewed by authorised school staff before action.
        </p>
        <p>
          Schoolgle does not predict Ofsted or SIAMS outcomes and does not make
          final decisions about safeguarding, SEND, HR, admissions, exclusions,
          assessment outcomes or compliance status.
        </p>
        <p>
          Read the full <Link href="/ai-governance" className="text-primary underline">AI Governance page</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Security and auditability">
        <p>
          Schoolgle uses authenticated access, organisation scoping, database
          row-level security, encryption in transit and audit logs across key
          workflows. Approval-based workflows should record who reviewed or
          accepted an AI-assisted output and when.
        </p>
      </LegalSection>

      <LegalSection title="Useful documents">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/privacy" className="rounded-lg border border-border p-4 hover:bg-slate-50">
            Privacy policy
          </Link>
          <Link href="/security" className="rounded-lg border border-border p-4 hover:bg-slate-50">
            Security overview
          </Link>
          <Link href="/dpa" className="rounded-lg border border-border p-4 hover:bg-slate-50">
            Data Processing Agreement
          </Link>
          <Link href="/sub-processors" className="rounded-lg border border-border p-4 hover:bg-slate-50">
            Sub-processors
          </Link>
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}
