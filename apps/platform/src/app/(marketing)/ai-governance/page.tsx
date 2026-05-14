import type { Metadata } from "next";
import {
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import {
  AdvisoryOnlyBadge,
  AITransparencyNotice,
  AuditTrailNotice,
  HumanReviewRequiredNotice,
  SensitiveDataWarning,
} from "@/components/notices";

export const metadata: Metadata = {
  title: "AI Governance | Schoolgle",
  description:
    "How Schoolgle uses AI safely, transparently and under school staff control.",
};

const principles = [
  {
    title: "AI assists. People decide.",
    body: "Schoolgle helps staff summarise, draft, organise evidence and spot missing information. It does not make final decisions for schools.",
    icon: UserCheck,
  },
  {
    title: "Review before action.",
    body: "AI outputs should be checked by authorised staff before they are used, shared, submitted or recorded as final.",
    icon: Eye,
  },
  {
    title: "Evidence stays traceable.",
    body: "Where possible, Schoolgle links suggestions back to source evidence, review history and approval records.",
    icon: ClipboardCheck,
  },
  {
    title: "Data is minimised.",
    body: "Schoolgle is designed to connect to source systems and avoid unnecessary copying or storage of sensitive education data.",
    icon: Database,
  },
  {
    title: "Approved providers only.",
    body: "Schoolgle uses reputable AI provider families and controls model use through an internal registry and review process.",
    icon: ShieldCheck,
  },
  {
    title: "Sensitive areas stay human-led.",
    body: "Safeguarding, SEND, HR, compliance, admissions, exclusions and assessment outcomes remain the responsibility of authorised school staff.",
    icon: LockKeyhole,
  },
];

const boundaries = [
  "Schoolgle does not predict Ofsted or SIAMS inspection outcomes.",
  "Schoolgle does not make final decisions about pupils, staff or compliance.",
  "Schoolgle does not present AI output as legal advice or statutory certainty.",
  "Schoolgle does not needlessly send pupil or staff personal data to AI providers.",
  "Schoolgle does not silently approve, submit, send, move or delete school records.",
];

export default function AiGovernancePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-slate-50/60 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <AdvisoryOnlyBadge />
            <span className="text-sm font-medium text-muted-foreground">
              AI governance for UK schools
            </span>
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
            Schoolgle uses AI as an assistant, not a decision-maker.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            Schoolgle is built for education settings where professional
            judgement, safeguarding duties and school governance matter. AI can
            help reduce admin, connect evidence and prepare drafts, but school
            staff stay in control.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          <AITransparencyNotice />
          <HumanReviewRequiredNotice />
          <SensitiveDataWarning />
          <AuditTrailNotice />
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold tracking-tight">
            Our operating principles
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <article
                  key={principle.title}
                  className="rounded-lg border border-border bg-background p-5"
                >
                  <Icon className="mb-4 h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {principle.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Designed around accountability
            </h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p className="leading-7">
                Schoolgle supports audit trails, evidence records, review dates
                and approval steps so schools can see how an AI-assisted output
                was created and who accepted or changed it.
              </p>
              <p className="leading-7">
                The platform is designed to avoid unnecessary data storage. In
                evidence workflows, the original file should remain in the
                school&apos;s cloud system where possible, with Schoolgle storing the
                metadata, source reference, extracted checks and review history
                needed to support the workflow.
              </p>
              <p className="leading-7">
                Sensitive education data is handled with data minimisation,
                role-based access and clear review wording. AI outputs should
                be treated as support for school staff, not as a substitute for
                professional, legal, safeguarding or governance judgement.
              </p>
            </div>
          </div>
          <aside className="rounded-lg border border-border bg-slate-50 p-6">
            <h2 className="text-lg font-semibold">Clear boundaries</h2>
            <ul className="mt-5 space-y-3">
              {boundaries.map((boundary) => (
                <li key={boundary} className="flex gap-3 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
