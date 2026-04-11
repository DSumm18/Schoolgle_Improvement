"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plug,
  Sparkles,
  ExternalLink,
  Search,
} from "lucide-react";
import Image from "next/image";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

type ConnectorStatus = "active" | "coming_soon" | "planned";

interface Connector {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: ConnectorStatus;
  href?: string;
  color: string;
  bgColor: string;
}

const connectors: Connector[] = [
  {
    id: "canva",
    name: "Canva",
    description:
      "Access school-branded templates for newsletters, letters, displays, and governor reports. Open directly in Canva.",
    logo: "/logos/connectors/canva.png",
    status: "active",
    href: "/dashboard/integrations/canva",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/20",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description:
      "Automatically scan school documents for evidence mapping. Connect your school's shared drive for AI-powered analysis.",
    logo: "/logos/connectors/google-drive.png",
    status: "active",
    href: "/dashboard/evidence",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id: "arbor-mis",
    name: "Arbor MIS",
    description:
      "Import pupil data, attendance, and assessment records directly from Arbor. Pseudonymised at source.",
    logo: "/logos/connectors/arbor.png",
    status: "coming_soon",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
  },
  {
    id: "sims-mis",
    name: "SIMS MIS",
    description:
      "Sync pupil records, attendance, and census data from SIMS. Zero-knowledge pseudonymisation built in.",
    logo: "/logos/connectors/sims.png",
    status: "coming_soon",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-100 dark:bg-sky-900/20",
  },
  {
    id: "bromcom-mis",
    name: "Bromcom MIS",
    description:
      "Connect Bromcom for seamless pupil data import. Assessment tracking and attendance sync with GDPR compliance.",
    logo: "/logos/connectors/bromcom.png",
    status: "coming_soon",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    id: "notebooklm",
    name: "NotebookLM",
    description:
      "Generate AI training podcasts, research summaries, and staff CPD materials from your school documents.",
    logo: "/logos/connectors/notebooklm.png",
    status: "coming_soon",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/20",
  },
  {
    id: "parentmail",
    name: "ParentMail",
    description:
      "Send newsletters, permission slips, and surveys to parents. Two-way communication with read receipts.",
    logo: "/logos/connectors/parentmail.png",
    status: "planned",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
  },
  {
    id: "dfe-apis",
    name: "DfE GIAS",
    description:
      "Live school data from the Department for Education. Search any school in England by URN, name, or postcode.",
    logo: "/logos/connectors/dfe.png",
    status: "active",
    href: "/dashboard/integrations/dfe",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
];

const STATUS_BADGES: Record<
  ConnectorStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  coming_soon: {
    label: "Coming Soon",
    className:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  },
  planned: {
    label: "Planned",
    className: "bg-muted text-muted-foreground",
  },
};

export default function IntegrationsPage() {
  const [search, setSearch] = useState("");

  const filtered = connectors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="integrations"
        icon={Plug}
        label="Integrations"
        title="Connectors"
        description="Connect your school's tools and data sources. Schoolgle weaves everything together so your systems talk to each other."
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search connectors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Connector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((connector, i) => {
          const badge = STATUS_BADGES[connector.status];
          const isClickable = connector.status === "active" && connector.href;

          const card = (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              whileHover={isClickable ? { y: -2 } : undefined}
              className={`group h-full ${isClickable ? "cursor-pointer" : ""}`}
            >
              <div
                className={`h-full p-6 rounded-2xl bg-card border border-border shadow-sm transition-all duration-200 ${
                  isClickable
                    ? "hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700"
                    : "opacity-75"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-1.5 rounded-xl ${
                      isClickable
                        ? "group-hover:scale-105 transition-transform duration-200"
                        : ""
                    }`}
                  >
                    <Image src={connector.logo} alt={connector.name} width={36} height={36} className="rounded-lg" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  {connector.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {connector.description}
                </p>

                {/* Action */}
                <div className="mt-auto">
                  {connector.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Connect
                    </span>
                  ) : connector.status === "coming_soon" ? (
                    <span className="text-xs text-muted-foreground">
                      Notify me when available
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      On the roadmap
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );

          if (isClickable) {
            return (
              <Link
                key={connector.id}
                href={connector.href!}
                className="block"
              >
                {card}
              </Link>
            );
          }
          return <div key={connector.id}>{card}</div>;
        })}
      </div>

      <ModuleFeatureBanner
        moduleId="integrations"
        icon={Sparkles}
        title="Your school's data, woven together"
        description="Schoolgle's yarn connects every thread of your school's information. When you connect a new source, Ed automatically discovers patterns across all your data — like a tapestry revealing the bigger picture."
      />
    </div>
  );
}
