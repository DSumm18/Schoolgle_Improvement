"use client";

import {
  ModulePageHeader,
  ModuleAppCard,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";
import {
  Building2,
  Hammer,
  ShieldCheck,
  Zap,
  Accessibility,
  Sparkles,
  Map,
  QrCode,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  Workflow,
  ListChecks,
} from "lucide-react";

const apps = [
  {
    icon: Building2,
    title: "Building Audit",
    description:
      "Structural integrity, heating, plumbing and electrical infrastructure health assessments.",
    href: "/dashboard/estates/audit",
    status: "Live",
  },
  {
    icon: Hammer,
    title: "Maintenance",
    description:
      "Helpdesk, reactive repairs, and planned preventative maintenance scheduling.",
    href: "/dashboard/estates/maintenance",
    status: "Pilot",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Checks",
    description:
      "Statutory compliance tracking, document storage, and audit-ready reporting.",
    href: "/estates-compliance",
    status: "Live",
  },
  {
    icon: Zap,
    title: "Energy & Utilities",
    description:
      "Monitor consumption, costs, carbon footprint, and renewable energy feasibility.",
    href: "/dashboard/estates/energy",
    status: "Preview",
  },
  {
    icon: ShieldCheck,
    title: "Health & Safety",
    description:
      "Fire safety, asbestos, legionella, and statutory compliance monitoring.",
    href: "/estates-compliance",
    status: "Live",
  },
  {
    icon: Map,
    title: "Floor Plan",
    description:
      "Interactive building map with 9 data overlays. Pin assets, track issues, and plan routes.",
    href: "/dashboard/estates/floor-plan",
    status: "Preview",
  },
  {
    icon: QrCode,
    title: "Asset Tags",
    description:
      "Generate and print QR code labels for physical assets. Scan to view compliance history instantly.",
    href: "/dashboard/estates/asset-tags",
    status: "Live",
  },
  {
    icon: ClipboardCheck,
    title: "Condition Survey",
    description:
      "Visual A-D grading of building elements with backlog costing. Feeds into risk register for urgent items.",
    href: "/dashboard/estates/condition-survey",
    status: "Live",
  },
  {
    icon: Calendar,
    title: "Lettings",
    description:
      "Manage room bookings, calculate hire charges, and track lettings income from community and commercial groups.",
    href: "/dashboard/estates/lettings",
    status: "Live",
  },
  {
    icon: AlertTriangle,
    title: "Incident Reports",
    description:
      "RIDDOR-compliant incident and near-miss reporting with investigation tracking and corrective actions.",
    href: "/dashboard/estates/incidents",
    status: "Live",
  },
  {
    icon: Workflow,
    title: "Workflows",
    description:
      "Ed-orchestrated multi-step processes. Equipment failure, incident response, and onboarding workflows.",
    href: "/dashboard/workflows",
    status: "Live",
  },
  {
    icon: ListChecks,
    title: "Procedures (SOPs)",
    description:
      "Step-by-step guided checklists for H&S, fire safety, premises checks, and incident response procedures.",
    href: "/dashboard/sops",
    status: "Live",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    description:
      "Equality Act compliance, DDA requirements, and inclusive environment audits.",
    href: "#",
    status: "Coming Soon",
  },
];

export default function EstatesPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="estates"
        icon={Building2}
        label="Estates Management"
        title="Estates & Facilities"
        description="Automate compliance tracking, energy optimization, and maintenance schedules across your entire educational portfolio."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app, i) => (
          <ModuleAppCard
            key={app.title}
            moduleId="estates"
            icon={app.icon}
            title={app.title}
            description={app.description}
            href={app.href}
            status={app.status}
            index={i}
          />
        ))}
      </div>

      <ModuleFeatureBanner
        moduleId="estates"
        icon={Sparkles}
        title="Ready to modernise your estates management?"
        description="Connect your existing spreadsheets or use our intelligent templates to start getting live insights in minutes. Schoolgle automates compliance tracking so your team can focus on what matters."
      />
    </div>
  );
}
