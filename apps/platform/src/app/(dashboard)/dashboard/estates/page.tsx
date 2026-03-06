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
