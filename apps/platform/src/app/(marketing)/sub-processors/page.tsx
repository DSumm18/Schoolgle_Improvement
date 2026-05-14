import type { Metadata } from "next";

import {
  LegalPageShell,
  LegalSection,
} from "@/components/website/LegalPage";

export const metadata: Metadata = {
  title: "Sub-processors | Schoolgle",
  description:
    "Schoolgle sub-processor list showing third-party services used to provide the platform.",
};

const subProcessors = [
  {
    provider: "Supabase",
    purpose: "Database, authentication and storage services",
    location: "EU region configured for production services",
    data: "School account data, platform records, evidence metadata and stored content where used",
    safeguards: "DPA, regional configuration and supplier security controls",
  },
  {
    provider: "Vercel",
    purpose: "Application hosting and deployment",
    location: "Regional hosting configured by deployment",
    data: "Application requests, logs, deployment data and limited operational metadata",
    safeguards: "DPA, infrastructure security controls and regional deployment settings",
  },
  {
    provider: "Google",
    purpose: "OAuth, Google Drive integration and approved Gemini AI processing where used",
    location: "EU/US depending on service and contractual terms",
    data: "OAuth tokens, connected file metadata/content where authorised and AI prompts where configured",
    safeguards: "Provider DPA and transfer safeguards where relevant",
  },
  {
    provider: "Microsoft",
    purpose: "Microsoft OAuth, OneDrive/SharePoint integration and approved AI services where used",
    location: "UK/EU/US depending on service and contractual terms",
    data: "OAuth tokens, connected file metadata/content where authorised and AI prompts where configured",
    safeguards: "Provider DPA and transfer safeguards where relevant",
  },
  {
    provider: "OpenRouter",
    purpose: "Routing approved AI model requests to configured model providers",
    location: "US with transfer safeguards where applicable",
    data: "Minimised AI prompts, evidence excerpts and generated responses where AI features are used",
    safeguards: "AI provider governance review, DPA/contract terms and approved model policy",
  },
  {
    provider: "OpenAI",
    purpose: "Approved AI processing and embeddings where configured",
    location: "US with transfer safeguards where applicable",
    data: "Minimised AI prompts, embeddings inputs and generated responses where configured",
    safeguards: "Provider DPA/contract terms and transfer safeguards where relevant",
  },
  {
    provider: "Anthropic",
    purpose: "Approved AI synthesis and analysis where configured",
    location: "US with transfer safeguards where applicable",
    data: "Minimised AI prompts and generated responses where configured",
    safeguards: "Provider DPA/contract terms and transfer safeguards where relevant",
  },
  {
    provider: "Mistral AI",
    purpose: "OCR and approved AI processing where configured",
    location: "EU",
    data: "Document images or extracts where OCR or approved AI processing is requested",
    safeguards: "Provider DPA/contract terms and regional processing controls",
  },
  {
    provider: "Resend",
    purpose: "Transactional email",
    location: "US/EU depending on service routing",
    data: "Email addresses, message metadata and transactional email content",
    safeguards: "Provider DPA/contract terms and transfer safeguards where relevant",
  },
  {
    provider: "Stripe",
    purpose: "Payment processing",
    location: "US/EU with Stripe transfer safeguards",
    data: "Billing contact details, payment metadata and subscription information",
    safeguards: "Stripe data protection terms, PCI controls and transfer safeguards",
  },
];

export default function SubProcessorsPage() {
  return (
    <LegalPageShell
      eyebrow="Sub-processors"
      title="Third-party services used to provide Schoolgle"
      description="This list helps schools and trusts understand which suppliers may support the delivery of Schoolgle services."
    >
      <LegalSection title="Review status">
        <p>
          This is the public operational list for legal and DPO review. Before
          signing a school or trust DPA, Schoolgle should confirm the live
          suppliers, regions, transfer safeguards and contractual status match
          the production deployment.
        </p>
      </LegalSection>

      <LegalSection title="Sub-processor list">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3 font-semibold">Provider</th>
                <th className="p-3 font-semibold">Purpose</th>
                <th className="p-3 font-semibold">Location</th>
                <th className="p-3 font-semibold">Data involved</th>
                <th className="p-3 font-semibold">Safeguards to confirm</th>
              </tr>
            </thead>
            <tbody>
              {subProcessors.map((processor) => (
                <tr key={processor.provider} className="border-t border-border">
                  <td className="p-3 font-medium text-foreground">
                    {processor.provider}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {processor.purpose}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {processor.location}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {processor.data}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {processor.safeguards}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="Changes to this list">
        <p>
          Schoolgle aims to give schools reasonable notice of material
          sub-processor changes through contract, email or product notice where
          required. Schools should review this page and their signed DPA for the
          notice period that applies to them.
        </p>
        <p>
          Where a signed DPA gives general authorisation for sub-processors, the
          DPA should also explain how schools can object to a proposed material
          change before the new sub-processor is used for their data.
        </p>
      </LegalSection>

      <LegalSection title="AI providers">
        <p>
          School/customer data may only be sent to approved AI provider
          families under the Schoolgle model policy: OpenAI, Anthropic, Google,
          Meta Llama, Mistral and Microsoft. Any new provider family requires
          governance review before use with customer data.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
