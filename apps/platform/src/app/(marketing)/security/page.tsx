import type { Metadata } from "next";

import {
  LegalCard,
  LegalPageShell,
  LegalSection,
} from "@/components/website/LegalPage";

export const metadata: Metadata = {
  title: "Security | Schoolgle",
  description:
    "Schoolgle security overview for UK schools and trusts, including access control, encryption, audit logs and incident handling.",
};

export default function SecurityPage() {
  return (
    <LegalPageShell
      eyebrow="Security"
      title="Security controls for school data and operational workflows"
      description="This page summarises the technical and organisational controls Schoolgle uses to protect school information."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <LegalCard title="Access control">
          <p>
            Product routes use authenticated sessions and role-based access
            controls. Sensitive modules should restrict access to authorised
            staff such as SLT, administrators, governors or module owners.
          </p>
        </LegalCard>
        <LegalCard title="Organisation scoping">
          <p>
            Schoolgle workflows should scope records to the authenticated
            organisation. Server routes must not trust caller-supplied
            organisation ids for ordinary school users.
          </p>
        </LegalCard>
        <LegalCard title="Encryption">
          <p>
            Connections use HTTPS/TLS. Database and hosting providers apply
            encryption controls for stored data according to their platform
            commitments.
          </p>
        </LegalCard>
        <LegalCard title="Audit logs">
          <p>
            Key workflows use audit logs for actions, approvals, compliance
            records and changes. AI-assisted workflows should record source
            references and human approval status.
          </p>
        </LegalCard>
      </div>

      <LegalSection title="AI and sensitive data">
        <p>
          AI features must follow the Schoolgle model registry and approved
          provider policy. Sensitive data should be minimised before AI
          processing, and AI outputs must remain reviewable by school staff.
        </p>
      </LegalSection>

      <LegalSection title="Incident and breach handling">
        <p>
          Schoolgle aims to support schools with audit trails and investigation
          records. Where a personal data breach affects a school, Schoolgle
          would notify the school without undue delay, work with the school as
          controller and provide relevant
          information for UK GDPR breach assessment and notification duties.
        </p>
      </LegalSection>

      <LegalSection title="Current improvement areas">
        <p>
          Internal compliance tracking has identified ongoing work around
          structured logging, local storage minimisation, breach workflow
          automation and privacy settings. These are tracked as product and
          engineering governance tasks.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <LegalCard title="DPO review before reliance">
            <p>
              A DPO or legal reviewer should confirm the final DPA, supplier
              list, transfer safeguards, breach workflow and retention schedule
              before a school relies on the public legal pack.
            </p>
          </LegalCard>
          <LegalCard title="No hidden decision-making">
            <p>
              Security and governance controls should preserve the product rule
              that AI outputs are advisory, reviewable and auditable, not final
              school decisions.
            </p>
          </LegalCard>
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}
