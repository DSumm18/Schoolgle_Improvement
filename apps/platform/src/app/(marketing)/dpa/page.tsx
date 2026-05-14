import type { Metadata } from "next";

import {
  LegalCard,
  LegalPageShell,
  LegalSection,
} from "@/components/website/LegalPage";

export const metadata: Metadata = {
  title: "Data Processing Agreement | Schoolgle",
  description:
    "Schoolgle Data Processing Agreement information for schools and trusts under UK GDPR Article 28.",
};

const article28Checklist = [
  "Subject matter and duration of processing",
  "Nature and purpose of processing",
  "Types of personal data and categories of data subjects",
  "Controller obligations and documented instructions",
  "Confidentiality duties for authorised people",
  "Appropriate technical and organisational security measures",
  "Sub-processor authorisation and flow-down terms",
  "Support for data subject rights, security, DPIAs and breach duties",
  "Deletion, return and retention at the end of service",
  "Audit, assurance and inspection arrangements",
];

const processingSchedule = [
  {
    title: "Subject matter",
    text: "Provision of the Schoolgle platform, including school operations, evidence workflows, compliance tracking, AI-assisted summaries and audit records.",
  },
  {
    title: "Duration",
    text: "The term of the school or trust agreement, plus any agreed deletion, return, legal hold or audit-retention period.",
  },
  {
    title: "Nature and purpose",
    text: "Hosting, indexing, extracting, summarising, connecting evidence, creating tasks, recording reviews and supporting authorised users.",
  },
  {
    title: "Data subjects",
    text: "Authorised school users, staff, governors, contractors, pupils and parents or carers where the school chooses to connect or enter that data.",
  },
  {
    title: "Personal data types",
    text: "Account details, roles, contact details, operational records, compliance records, usage logs, evidence metadata and school-controlled document content where connected.",
  },
  {
    title: "Special category and high-risk data",
    text: "Not requested by default. Safeguarding, SEND, health, HR, DBS or other sensitive information may appear only where the school controls and connects relevant records.",
  },
];

export default function DpaPage() {
  return (
    <LegalPageShell
      eyebrow="Data Processing Agreement"
      title="How Schoolgle handles processor duties for schools"
      description="Schools and trusts need clear GDPR paperwork before using a platform with school data. This page explains the DPA position and how to request the current template."
    >
      <LegalSection title="Controller and processor roles">
        <p>
          The school or trust is normally the data controller for its pupil,
          staff, governance and operational data. Schoolgle Limited acts as a
          data processor when it processes that data to provide the platform.
        </p>
        <p>
          The DPA is the UK GDPR Article 28 agreement that records Schoolgle&apos;s
          processor obligations and the school&apos;s documented instructions.
        </p>
      </LegalSection>

      <LegalCard title="Template status: for legal/DPO review before signature">
        <p>
          This page is a public explanation of the intended DPA structure. It is
          not legal advice and is not, by itself, a signed data processing
          agreement. Schools, trusts, local authorities and DPOs should review
          the current DPA template before relying on it.
        </p>
      </LegalCard>

      <LegalSection title="What the DPA covers">
        <div className="grid gap-4 md:grid-cols-2">
          <LegalCard title="Processing instructions">
            <p>
              Schoolgle processes school data only to provide and support the
              service, unless otherwise agreed with the school or required by
              law.
            </p>
          </LegalCard>
          <LegalCard title="Security measures">
            <p>
              Access controls, encryption, audit logs, organisation scoping and
              supplier controls are documented in the DPA and security pages.
            </p>
          </LegalCard>
          <LegalCard title="Sub-processors">
            <p>
              The DPA links to the public sub-processor list and explains how
              schools are notified of material changes.
            </p>
          </LegalCard>
          <LegalCard title="End of service">
            <p>
              The DPA covers return, deletion or retention of data at the end
              of the service, subject to legal and audit requirements.
            </p>
          </LegalCard>
        </div>
      </LegalSection>

      <LegalSection title="Article 28 checklist">
        <p>
          The DPA template is intended to cover the minimum UK GDPR Article 28
          processor clauses. Before signature, the school or trust should check
          that the final agreement includes:
        </p>
        <ul className="grid gap-3 text-sm md:grid-cols-2">
          {article28Checklist.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-border bg-slate-50 p-3 text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Draft processing schedule">
        <div className="grid gap-4 md:grid-cols-2">
          {processingSchedule.map((item) => (
            <LegalCard key={item.title} title={item.title}>
              <p>{item.text}</p>
            </LegalCard>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Breach, deletion and assistance">
        <p>
          If Schoolgle becomes aware of a personal data breach affecting school
          data processed for a school or trust, the DPA should require
          notification to the controller without undue delay and provide
          reasonable information to support the controller&apos;s UK GDPR
          assessment.
        </p>
        <p>
          At the end of service, the DPA should explain how school data is
          returned, deleted or retained where required for legal, security,
          accounting or audit reasons. It should also describe how Schoolgle
          assists with data subject rights, DPIAs and security assessments
          where relevant to the service.
        </p>
      </LegalSection>

      <LegalSection title="Request the current DPA template">
        <p>
          The public template is being kept under version control and should be
          reviewed for each school or trust before signature. To request the
          current DPA pack, contact admin@schoolgle.co.uk or
          privacy@schoolgle.co.uk.
        </p>
        <p>
          If your trust or local authority has its own processor terms, send
          them to Schoolgle for review.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
