import type { Metadata } from "next";

import {
  LegalCard,
  LegalPageShell,
  LegalSection,
} from "@/components/website/LegalPage";

export const metadata: Metadata = {
  title: "Website Terms | Schoolgle",
  description:
    "Schoolgle website terms of use for visitors, prospects and public website users.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Website terms"
      title="Terms for using the Schoolgle website"
      description="These terms cover use of the public Schoolgle website. Product contracts, pilot agreements and data processing terms are handled separately with schools and trusts."
    >
      <LegalCard title="Separate from product contracts">
        <p>
          These website terms do not form the full Schoolgle customer contract.
          Product access, pilots, subscriptions, service levels, data
          processing terms and commercial commitments must be agreed separately
          in writing with the school, trust or organisation.
        </p>
      </LegalCard>

      <LegalSection title="Using this website">
        <p>
          You may use this website to learn about Schoolgle, request
          information and contact us. Please do not misuse the website, attempt
          to access restricted areas, interfere with its operation or copy
          content in a way that infringes our rights.
        </p>
        <p>
          You must not attempt to probe, scan, disrupt, overload, reverse
          engineer or bypass security controls on the website or platform. Any
          suspected vulnerability should be reported responsibly to
          admin@schoolgle.co.uk.
        </p>
      </LegalSection>

      <LegalSection title="Information on this site">
        <p>
          We aim to keep website information accurate and up to date, but it is
          provided for general information only. It is not legal, safeguarding,
          financial, HR, SEND or compliance advice.
        </p>
        <p>
          Product features may change as Schoolgle develops. Any binding
          commitments will be set out in the agreement signed with your school,
          trust or organisation.
        </p>
      </LegalSection>

      <LegalSection title="No professional or statutory advice">
        <p>
          Website content is provided to explain Schoolgle and related product
          thinking. It should not be treated as legal advice, data protection
          advice, safeguarding advice, HR advice, SEND advice, inspection
          assurance or a substitute for professional judgement.
        </p>
      </LegalSection>

      <LegalSection title="AI and education content">
        <p>
          Any public explanation of AI features is descriptive only. Schoolgle
          uses AI as an assistant. School staff remain responsible for decisions
          about pupils, staff, safeguarding, SEND, compliance and school
          operations.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The Schoolgle name, website content, product descriptions, designs and
          materials are owned by or licensed to Schoolgle Limited. You may not
          reproduce substantial parts of the site for commercial use without our
          permission.
        </p>
      </LegalSection>

      <LegalSection title="External links and availability">
        <p>
          The website may link to third-party sites or guidance. Those links are
          provided for convenience and do not mean Schoolgle controls or
          endorses the linked content. We may update, suspend or remove website
          pages as the product and legal documentation develops.
        </p>
      </LegalSection>

      <LegalSection title="Liability and governing law">
        <p>
          Nothing in these terms excludes liability where it would be unlawful
          to do so. Subject to that, Schoolgle is not responsible for decisions
          taken by visitors based only on public website information. These
          website terms are governed by the laws of England and Wales.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We may update these terms as the website, product and legal pack
          develop. The latest version will be shown on this page with the
          current review date.
        </p>
      </LegalSection>

      <LegalCard title="Contact">
        <p>
          For questions about these website terms, contact
          admin@schoolgle.co.uk.
        </p>
      </LegalCard>
    </LegalPageShell>
  );
}
