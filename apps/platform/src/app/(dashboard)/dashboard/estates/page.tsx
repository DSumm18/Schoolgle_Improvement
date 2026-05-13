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
  Sparkles,
  Map,
  QrCode,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
} from "lucide-react";

const apps = [
  {
    icon: Building2,
    title: "GEMS Audit",
    description:
      "DfE Good Estate Management self-assessment, assurance gaps, and trustee-ready evidence.",
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
    icon: Map,
    title: "Show Me Site Map",
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
];

export default function EstatesPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="estates"
        icon={Building2}
        label="Estates Management"
        title="Estates & Facilities"
        description="Live estate assurance, statutory compliance, assets, maintenance, incidents, lettings, energy, and condition planning for each school."
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
        description="Use live asset, contractor, compliance, helpdesk, and risk data to remove admin friction while keeping schools audit-ready."
      />
    </div>
  );
}
