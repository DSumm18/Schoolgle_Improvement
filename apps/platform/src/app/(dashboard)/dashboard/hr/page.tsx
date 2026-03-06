"use client";

import {
  Users,
  Calculator,
  TrendingUp,
  ClipboardCheck,
  BookOpen,
} from "lucide-react";
import {
  ModulePageHeader,
  ModuleAppCard,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

const tools = [
  {
    title: "Staff Directory",
    description:
      "Centralised people management with roles, direct reports and contact data.",
    status: "Live" as const,
    href: "/dashboard/hr/people",
    icon: Users,
  },
  {
    title: "Maternity Calculator",
    description:
      "Specialized tool for calculating parental leave payouts and schedules.",
    status: "Live" as const,
    href: "/dashboard/hr/maternity-leave-calculator",
    icon: Calculator,
  },
  {
    title: "Meeting Companion",
    description:
      "Guided HR meetings with compliance checklists and auto-generated minutes.",
    status: "Live" as const,
    href: "/dashboard/hr/meetings",
    icon: ClipboardCheck,
  },
  {
    title: "Performance Review",
    description: "Manage appraisal cycles and staff development goals.",
    status: "Coming Soon" as const,
    href: "#",
    icon: TrendingUp,
  },
];

export default function HRModulePage() {
  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="hr"
        icon={Users}
        label="HR & People"
        title="Workforce Management"
        description="Streamline personnel management, compliance and staff wellbeing with integrated HR intelligence."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, index) => (
          <ModuleAppCard
            key={tool.title}
            moduleId="hr"
            icon={tool.icon}
            title={tool.title}
            description={tool.description}
            href={tool.href}
            status={tool.status}
            index={index}
          />
        ))}
      </div>

      <ModuleFeatureBanner
        moduleId="hr"
        icon={BookOpen}
        title="The Science of Staff Retention"
        description="Our HR tools are built on research from the EEF and CIPD, focusing on reducing teacher cognitive overload and fostering professional growth."
      />
    </div>
  );
}
