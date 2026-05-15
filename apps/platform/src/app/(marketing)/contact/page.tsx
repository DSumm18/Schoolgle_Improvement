import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalCard,
  LegalPageShell,
  LegalSection,
} from "@/components/website/LegalPage";
import { schoolgleCompanyDetails } from "@/lib/company-details";

export const metadata: Metadata = {
  title: "Contact | Schoolgle",
  description:
    "Contact Schoolgle for product, support, data protection and customer assurance enquiries.",
};

export default function ContactPage() {
  return (
    <LegalPageShell
      eyebrow="Contact"
      title="Contact Schoolgle"
      description="Use these contact routes for product, support, data protection and customer assurance questions."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <LegalCard title="General and support">
          <p>
            Email{" "}
            <a
              className="underline"
              href={`mailto:${schoolgleCompanyDetails.adminEmail}`}
            >
              {schoolgleCompanyDetails.adminEmail}
            </a>{" "}
            for general, product, support and customer pack queries.
          </p>
        </LegalCard>
        <LegalCard title="Privacy and DPO">
          <p>
            Email{" "}
            <a
              className="underline"
              href={`mailto:${schoolgleCompanyDetails.privacyEmail}`}
            >
              {schoolgleCompanyDetails.privacyEmail}
            </a>{" "}
            or{" "}
            <a
              className="underline"
              href={`mailto:${schoolgleCompanyDetails.dpoEmail}`}
            >
              {schoolgleCompanyDetails.dpoEmail}
            </a>{" "}
            for data-protection, DPA, DPIA, DSAR or school DPO queries.
          </p>
        </LegalCard>
      </div>

      <LegalSection title="Company details">
        <p>
          {schoolgleCompanyDetails.legalName} is registered in{" "}
          {schoolgleCompanyDetails.registeredJurisdiction}. Company number{" "}
          {schoolgleCompanyDetails.companyNumber}. Registered office:{" "}
          {schoolgleCompanyDetails.registeredOffice}. ICO registration{" "}
          {schoolgleCompanyDetails.icoRegistration}.
        </p>
      </LegalSection>

      <LegalSection title="Useful pages for school DPOs">
        <p>
          If you are reviewing Schoolgle before sending data, start with the{" "}
          <Link href="/data-protection" className="underline">
            data protection summary
          </Link>
          ,{" "}
          <Link href="/privacy" className="underline">
            privacy policy
          </Link>
          ,{" "}
          <Link href="/dpa" className="underline">
            DPA summary
          </Link>
          ,{" "}
          <Link href="/sub-processors" className="underline">
            sub-processor list
          </Link>{" "}
          and{" "}
          <Link href="/security" className="underline">
            security overview
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
