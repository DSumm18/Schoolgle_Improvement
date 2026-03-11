import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Schoolgle",
  description:
    "Schoolgle Privacy Policy. How we collect, use, and protect your data in compliance with UK GDPR and the Data Protection Act 2018.",
};

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold text-foreground mt-12 mb-4 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: March 2026 &middot; Version 2.0
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 p-6 rounded-2xl border border-border bg-muted/30">
          <h2 className="text-lg font-semibold mb-3">Contents</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              <a href="#who-we-are" className="hover:text-foreground underline">
                Who we are
              </a>
            </li>
            <li>
              <a
                href="#data-we-collect"
                className="hover:text-foreground underline"
              >
                Data we collect
              </a>
            </li>
            <li>
              <a
                href="#data-we-do-not-collect"
                className="hover:text-foreground underline"
              >
                Data we do NOT collect
              </a>
            </li>
            <li>
              <a
                href="#how-we-use-ai"
                className="hover:text-foreground underline"
              >
                How we use AI
              </a>
            </li>
            <li>
              <a
                href="#legal-basis"
                className="hover:text-foreground underline"
              >
                Legal basis for processing
              </a>
            </li>
            <li>
              <a
                href="#sub-processors"
                className="hover:text-foreground underline"
              >
                Sub-processors
              </a>
            </li>
            <li>
              <a
                href="#international-transfers"
                className="hover:text-foreground underline"
              >
                International transfers
              </a>
            </li>
            <li>
              <a
                href="#data-retention"
                className="hover:text-foreground underline"
              >
                Data retention
              </a>
            </li>
            <li>
              <a
                href="#your-rights"
                className="hover:text-foreground underline"
              >
                Your rights
              </a>
            </li>
            <li>
              <a
                href="#childrens-data"
                className="hover:text-foreground underline"
              >
                Children&apos;s data
              </a>
            </li>
            <li>
              <a href="#cookies" className="hover:text-foreground underline">
                Cookies
              </a>
            </li>
            <li>
              <a href="#complaints" className="hover:text-foreground underline">
                Complaints
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-foreground underline">
                Contact
              </a>
            </li>
          </ol>
        </nav>

        {/* Roles box */}
        <div className="p-6 rounded-2xl border border-border bg-muted/30 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-foreground">
                Data Controller
              </span>
              <p className="text-muted-foreground">
                The subscribing school or multi-academy trust that holds the
                Schoolgle account.
              </p>
            </div>
            <div>
              <span className="font-semibold text-foreground">
                Data Processor
              </span>
              <p className="text-muted-foreground">
                Schoolgle Ltd, acting on the controller&apos;s instructions.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Who we are */}
        <SectionHeading id="who-we-are">1. Who we are</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Schoolgle Ltd (&quot;Schoolgle&quot;, &quot;we&quot;, &quot;us&quot;)
          provides an AI-powered school improvement platform for UK schools and
          multi-academy trusts. Our platform helps school leaders organise
          evidence, track compliance, manage estates, and prepare for
          inspections.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Under UK GDPR and the Data Protection Act 2018, the subscribing school
          or trust is the{" "}
          <strong className="text-foreground">Data Controller</strong>.
          Schoolgle Ltd acts as a{" "}
          <strong className="text-foreground">Data Processor</strong>,
          processing personal data only on the controller&apos;s documented
          instructions.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Our Data Protection Officer (DPO) can be contacted at{" "}
          <a
            href="mailto:admin@schoolgle.co.uk"
            className="text-primary underline"
          >
            admin@schoolgle.co.uk
          </a>
          .
        </p>
        <p className="text-muted-foreground leading-relaxed">
          ICO Registration: Pending (Application C1888815)
        </p>

        {/* 2. Data we collect */}
        <SectionHeading id="data-we-collect">2. Data we collect</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          We collect and process the following categories of personal data:
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold border-b border-border">
                  Category
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Examples
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Account data
                </td>
                <td className="p-3">
                  Name, email address, role, school/trust name
                </td>
                <td className="p-3">Authentication, access control, billing</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  School improvement data
                </td>
                <td className="p-3">
                  Documents uploaded or connected via cloud storage, evidence
                  notes, assessment judgements, action plans
                </td>
                <td className="p-3">
                  Core platform functionality: evidence matching, framework
                  assessment, action tracking
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Staff directory data
                </td>
                <td className="p-3">
                  Staff names, roles, email addresses, phone numbers (as entered
                  by the school)
                </td>
                <td className="p-3">
                  HR management, task assignment, communication
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Estates data
                </td>
                <td className="p-3">
                  Asset registers, contractor details, inspection records,
                  photos of rooms/equipment
                </td>
                <td className="p-3">
                  Compliance tracking, maintenance scheduling
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Usage data</td>
                <td className="p-3">
                  IP address, browser type, pages visited, feature usage, error
                  logs
                </td>
                <td className="p-3">
                  Service improvement, debugging, security monitoring
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Data we do NOT collect */}
        <SectionHeading id="data-we-do-not-collect">
          3. Data we do NOT collect
        </SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Schoolgle is designed for school leaders and staff. We do not collect
          or process the following data categories:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">
              Pupil names or identifiable pupil data
            </strong>{" "}
            &mdash; the platform operates at the school/evidence level, not
            individual pupil level
          </li>
          <li>
            <strong className="text-foreground">
              Medical or health records
            </strong>
          </li>
          <li>
            <strong className="text-foreground">Financial data</strong> &mdash;
            we do not store bank details or payroll information (Stripe handles
            payment card data directly)
          </li>
          <li>
            <strong className="text-foreground">Biometric data</strong>
          </li>
          <li>
            <strong className="text-foreground">Special category data</strong>{" "}
            &mdash; unless incidentally present in documents uploaded by the
            school, in which case Guardian Mode redacts it before AI processing
          </li>
        </ul>

        {/* 4. How we use AI */}
        <SectionHeading id="how-we-use-ai">4. How we use AI</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Schoolgle uses artificial intelligence to help schools organise and
          analyse their improvement evidence. Here is exactly how:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold border-b border-border">
                  AI use case
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  What happens
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Model / Provider
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Document analysis
                </td>
                <td className="p-3">
                  Extracted text is PII-masked then sent to an LLM to identify
                  evidence against Ofsted/SIAMS framework requirements
                </td>
                <td className="p-3">
                  Google Gemini Flash (primary), Gemini Flash Lite (fallback)
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  OCR for scanned documents
                </td>
                <td className="p-3">
                  Scanned PDFs and images are processed to extract text
                </td>
                <td className="p-3">Mistral OCR (EU-hosted)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Voice transcription
                </td>
                <td className="p-3">
                  Voice input in Ed (our assistant) is transcribed using browser
                  APIs; no audio is sent to our servers
                </td>
                <td className="p-3">Web Speech API (on-device)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Room/asset scanning
                </td>
                <td className="p-3">
                  Photos taken during estates inspections are analysed to
                  identify compliance issues
                </td>
                <td className="p-3">Gemini 2.5 Flash (vision)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">
                  Conversational assistant (Ed)
                </td>
                <td className="p-3">
                  School leaders can ask Ed questions about their data, draft
                  documents, and manage tasks
                </td>
                <td className="p-3">Gemini 2.5 Flash via OpenRouter</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-muted/30 mb-4">
          <h3 className="font-semibold text-foreground mb-2">
            Our AI commitments
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              All AI models are used in{" "}
              <strong className="text-foreground">API mode only</strong> &mdash;
              your data is never used to train models
            </li>
            <li>
              We prefer{" "}
              <strong className="text-foreground">
                EU/UK-hosted providers
              </strong>{" "}
              where possible (Mistral, Supabase EU, Firebase EU)
            </li>
            <li>
              For US-hosted providers, we have Standard Contractual Clauses
              (SCCs) or UK International Data Transfer Agreements (IDTAs) in
              place
            </li>
            <li>
              Guardian Mode automatically detects and redacts personally
              identifiable information before it reaches AI models
            </li>
            <li>
              No automated decisions are made without human oversight &mdash; AI
              suggests, humans decide
            </li>
          </ul>
        </div>

        {/* 5. Legal basis */}
        <SectionHeading id="legal-basis">
          5. Legal basis for processing
        </SectionHeading>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold border-b border-border">
                  Processing activity
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Legal basis (UK GDPR)
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3">Providing the platform service</td>
                <td className="p-3">
                  Article 6(1)(b) &mdash; performance of a contract
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">
                  Security monitoring and fraud prevention
                </td>
                <td className="p-3">
                  Article 6(1)(f) &mdash; legitimate interests
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Analytics cookies</td>
                <td className="p-3">Article 6(1)(a) &mdash; consent</td>
              </tr>
              <tr>
                <td className="p-3">Responding to legal obligations</td>
                <td className="p-3">
                  Article 6(1)(c) &mdash; legal obligation
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. Sub-processors */}
        <SectionHeading id="sub-processors">6. Sub-processors</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          We use the following third-party sub-processors to deliver our
          service:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold border-b border-border">
                  Provider
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Purpose
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Location
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Transfer mechanism
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">Supabase</td>
                <td className="p-3">Database, authentication</td>
                <td className="p-3">EU (Frankfurt)</td>
                <td className="p-3">Adequacy (EU)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Firebase (Google)
                </td>
                <td className="p-3">Authentication (OAuth)</td>
                <td className="p-3">EU</td>
                <td className="p-3">Adequacy (EU)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">Mistral AI</td>
                <td className="p-3">OCR, document processing</td>
                <td className="p-3">EU (Paris)</td>
                <td className="p-3">Adequacy (EU)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">OpenRouter</td>
                <td className="p-3">AI model routing gateway</td>
                <td className="p-3">US</td>
                <td className="p-3">UK SCCs / IDTA</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Google (Gemini)
                </td>
                <td className="p-3">Primary AI analysis, vision</td>
                <td className="p-3">US</td>
                <td className="p-3">UK SCCs / IDTA</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Anthropic (Claude)
                </td>
                <td className="p-3">AI analysis (via OpenRouter)</td>
                <td className="p-3">US</td>
                <td className="p-3">UK SCCs / IDTA</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">
                  Microsoft Azure
                </td>
                <td className="p-3">Text-to-speech</td>
                <td className="p-3">UK (London)</td>
                <td className="p-3">Domestic</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Stripe</td>
                <td className="p-3">Payment processing</td>
                <td className="p-3">US</td>
                <td className="p-3">EU-US DPF</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 7. International transfers */}
        <SectionHeading id="international-transfers">
          7. International transfers
        </SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Where personal data is transferred outside the UK, we rely on one of
          the following safeguards:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">UK adequacy regulations</strong>{" "}
            &mdash; for transfers to the EU/EEA
          </li>
          <li>
            <strong className="text-foreground">
              UK International Data Transfer Agreement (IDTA)
            </strong>{" "}
            &mdash; for transfers to the US (Google, Anthropic)
          </li>
          <li>
            <strong className="text-foreground">
              Standard Contractual Clauses (SCCs)
            </strong>{" "}
            &mdash; as a supplementary measure alongside the IDTA
          </li>
          <li>
            <strong className="text-foreground">
              EU-US Data Privacy Framework (DPF)
            </strong>{" "}
            &mdash; for Stripe, which is a certified participant
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          We conduct Transfer Impact Assessments (TIAs) for all US-based
          sub-processors and review them annually.
        </p>

        {/* 8. Data retention */}
        <SectionHeading id="data-retention">8. Data retention</SectionHeading>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold border-b border-border">
                  Data type
                </th>
                <th className="text-left p-3 font-semibold border-b border-border">
                  Retention period
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3">Account data</td>
                <td className="p-3">
                  Until account deletion + 30 days grace period
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">
                  School improvement data (documents, evidence, assessments)
                </td>
                <td className="p-3">
                  Until account deletion + 30 days grace period
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Application logs</td>
                <td className="p-3">12 months</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Database backups</td>
                <td className="p-3">90 days</td>
              </tr>
              <tr>
                <td className="p-3">AI processing logs</td>
                <td className="p-3">30 days (anonymised metadata only)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          When a school requests account deletion, all personal data is removed
          within 30 days. Anonymised, aggregated analytics data may be retained
          indefinitely for service improvement.
        </p>

        {/* 9. Your rights */}
        <SectionHeading id="your-rights">9. Your rights</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Under UK GDPR, you have the following rights:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">Right of access</strong> &mdash;
            request a copy of your personal data
          </li>
          <li>
            <strong className="text-foreground">Right to rectification</strong>{" "}
            &mdash; correct inaccurate or incomplete data
          </li>
          <li>
            <strong className="text-foreground">Right to erasure</strong>{" "}
            &mdash; request deletion of your personal data
          </li>
          <li>
            <strong className="text-foreground">Right to restriction</strong>{" "}
            &mdash; restrict processing in certain circumstances
          </li>
          <li>
            <strong className="text-foreground">
              Right to data portability
            </strong>{" "}
            &mdash; receive your data in a machine-readable format
          </li>
          <li>
            <strong className="text-foreground">Right to object</strong> &mdash;
            object to processing based on legitimate interests
          </li>
        </ul>
        <div className="p-6 rounded-2xl border border-border bg-muted/30">
          <h3 className="font-semibold text-foreground mb-2">
            How to exercise your rights
          </h3>
          <p className="text-sm text-muted-foreground">
            Contact our DPO at{" "}
            <a
              href="mailto:admin@schoolgle.co.uk"
              className="text-primary underline"
            >
              admin@schoolgle.co.uk
            </a>{" "}
            with your request. We will respond within one month. If your request
            is complex, we may extend this by a further two months, and we will
            let you know within the first month.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            As Schoolgle acts as a Data Processor, we may redirect your request
            to your school or trust (the Data Controller) where appropriate.
          </p>
        </div>

        {/* 10. Children's data */}
        <SectionHeading id="childrens-data">
          10. Children&apos;s data
        </SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Schoolgle is designed for use by adult school staff and governors. The
          platform is not intended for, or directed at, children under 18.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The Compliance module may store limited consent records relating to
          children (e.g., photography consent, trip consent) as entered by
          school staff. In these cases, the school remains the Data Controller
          and is responsible for obtaining appropriate parental consent under
          Article 8 of UK GDPR.
        </p>

        {/* 11. Cookies */}
        <SectionHeading id="cookies">11. Cookies</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          We use a minimal number of cookies:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">Essential cookies</strong>{" "}
            &mdash; authentication session tokens (Supabase). These are strictly
            necessary and do not require consent.
          </li>
          <li>
            <strong className="text-foreground">Analytics cookies</strong>{" "}
            &mdash; only set with your explicit consent via our cookie banner.
            Used for anonymous usage statistics to improve the service.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          For full details, see our{" "}
          <Link href="/cookies" className="text-primary underline">
            Cookie Policy
          </Link>
          .
        </p>

        {/* 12. Complaints */}
        <SectionHeading id="complaints">12. Complaints</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          If you have a concern about how we handle personal data, please
          contact our DPO first at{" "}
          <a
            href="mailto:admin@schoolgle.co.uk"
            className="text-primary underline"
          >
            admin@schoolgle.co.uk
          </a>
          . We take all complaints seriously and will aim to resolve them
          promptly.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          If you are not satisfied with our response, you have the right to
          lodge a complaint with the Information Commissioner&apos;s Office
          (ICO):
        </p>
        <div className="p-6 rounded-2xl border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              Information Commissioner&apos;s Office
            </strong>
            <br />
            Website:{" "}
            <a
              href="https://ico.org.uk"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk
            </a>
            <br />
            Telephone: 0303 123 1113
            <br />
            Live chat:{" "}
            <a
              href="https://ico.org.uk/global/contact-us/live-chat"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk/global/contact-us/live-chat
            </a>
          </p>
        </div>

        {/* 13. Contact */}
        <SectionHeading id="contact">13. Contact</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For any questions about this privacy policy or our data practices:
        </p>
        <div className="p-6 rounded-2xl border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Data Protection Officer</strong>
            <br />
            Email:{" "}
            <a
              href="mailto:admin@schoolgle.co.uk"
              className="text-primary underline"
            >
              admin@schoolgle.co.uk
            </a>
            <br />
            Website:{" "}
            <a
              href="https://schoolgle.co.uk"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              schoolgle.co.uk
            </a>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground mt-12 pt-8 border-t border-border">
          This policy was last reviewed in March 2026. We will review it at
          least annually or when there are significant changes to our processing
          activities. Any material changes will be communicated to account
          holders by email.
        </p>
      </div>
    </main>
  );
}
