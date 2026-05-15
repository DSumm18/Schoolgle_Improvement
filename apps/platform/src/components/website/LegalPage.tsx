import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LegalPageLink {
  href: string;
  label: string;
  description?: string;
}

export function LegalPageShell({
  eyebrow,
  title,
  description,
  lastUpdated = "14 May 2026",
  children,
  links = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated?: string;
  children: ReactNode;
  links?: LegalPageLink[];
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-slate-50/70 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
          <p className="mt-5 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_280px]">
          <article className="space-y-10">{children}</article>
          <aside className="h-fit rounded-lg border border-border bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Legal and trust pages
            </h2>
            <div className="mt-4 space-y-3">
              {(links.length ? links : legalPageLinks).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md border border-transparent p-3 text-sm hover:border-border hover:bg-background"
                >
                  <span className="font-medium text-foreground">
                    {link.label}
                  </span>
                  {link.description ? (
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {link.description}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-muted-foreground">{children}</div>
    </section>
  );
}

export function LegalCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-slate-50 p-5", className)}>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export const legalPageLinks: LegalPageLink[] = [
  {
    href: "/legal",
    label: "Legal hub",
    description: "One place for governance, privacy and contract information.",
  },
  {
    href: "/ai-governance",
    label: "AI governance",
    description: "How Schoolgle keeps AI advisory and human-led.",
  },
  {
    href: "/privacy",
    label: "Privacy policy",
    description: "How personal data is handled.",
  },
  {
    href: "/data-protection",
    label: "Data protection",
    description: "DPO-ready summary and links to key data protection pages.",
  },
  {
    href: "/cookies",
    label: "Cookie policy",
    description: "What cookies are used and why.",
  },
  {
    href: "/terms",
    label: "Website terms",
    description: "Rules for using the public website.",
  },
  {
    href: "/trust",
    label: "Trust centre",
    description: "Plain-English security, privacy and governance summary.",
  },
  {
    href: "/security",
    label: "Security",
    description: "Technical controls and operational safeguards.",
  },
  {
    href: "/dpa",
    label: "Data Processing Agreement",
    description: "How school controller and Schoolgle processor duties work.",
  },
  {
    href: "/sub-processors",
    label: "Sub-processors",
    description: "Third-party services used to deliver Schoolgle.",
  },
];
