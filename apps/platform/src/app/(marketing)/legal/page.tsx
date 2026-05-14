import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";

import { legalPageLinks } from "@/components/website/LegalPage";

export const metadata: Metadata = {
  title: "Legal and Trust Centre | Schoolgle",
  description:
    "Schoolgle legal, privacy, AI governance, security, DPA and sub-processor information in one place.",
};

const featuredLinks = legalPageLinks.filter((link) => link.href !== "/legal");

export default function LegalHubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-slate-50/70 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">
            Legal and trust centre
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
            Everything schools need to review how Schoolgle handles data, AI and governance.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            These pages bring together the documents and plain-English
            explanations that heads, SBMs, governors, DPOs and trust teams need
            before using Schoolgle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              ICO registration ZC103199
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
              Company No. 16776489
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {featuredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-lg border border-border bg-background p-5 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <FileText className="mb-4 h-5 w-5 text-indigo-600" />
                  <h2 className="font-semibold">{link.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {link.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-background p-6">
          <ShieldCheck className="mb-4 h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold">What this means in practice</h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Schoolgle is designed for schools to stay in control. The school or
            trust remains the data controller for its data. Schoolgle acts as a
            processor where it provides the platform, keeps AI advisory, and
            records evidence, approvals and audit trails where the product
            workflow requires them.
          </p>
        </div>
      </section>
    </main>
  );
}
