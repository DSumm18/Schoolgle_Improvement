"use client";

import {
  Shield,
  Church,
  FileText,
  TrendingUp,
  Target,
  Sparkles,
} from "lucide-react";
import {
  ModulePageHeader,
  ModuleAppCard,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

const tools = [
  {
    id: "ofsted-readiness",
    title: "Ofsted Readiness",
    description:
      "Track compliance against the Education Inspection Framework with evidence mapping and gap analysis.",
    icon: Shield,
    href: "/dashboard/ofsted-readiness",
    status: "Live",
  },
  {
    id: "siams-readiness",
    title: "SIAMS Readiness",
    description:
      "Prepare for Church School inspections with framework analysis and evidence linking.",
    icon: Church,
    href: "/dashboard/siams",
    status: "Live",
  },
  {
    id: "sef-builder",
    title: "SEF Builder",
    description:
      "Draft comprehensive self-evaluation forms aligned to Ofsted judgements.",
    icon: FileText,
    href: "/dashboard/sef",
    status: "Beta",
  },
  {
    id: "sdp-builder",
    title: "SDP Builder",
    description:
      "Create and manage school development plans with linked actions and evidence.",
    icon: TrendingUp,
    href: "/dashboard/sdp",
    status: "Beta",
  },
  {
    id: "action-plan",
    title: "Action Plan",
    description:
      "Track strategic tasks, assign owners, and monitor completion rates.",
    icon: Target,
    href: "/dashboard/action-plan",
    status: "Live",
  },
];

export default function ImprovementPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="improvement"
        icon={Shield}
        label="Inspection Readiness"
        title="Improvement Tools"
        description="Comprehensive tools to prepare for Ofsted and SIAMS inspections, manage self-evaluation, and track strategic improvement actions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, idx) => (
          <ModuleAppCard
            key={tool.id}
            moduleId="improvement"
            icon={tool.icon}
            title={tool.title}
            description={tool.description}
            href={tool.href}
            status={tool.status}
            index={idx}
          />
        ))}
      </div>

      <ModuleFeatureBanner
        moduleId="improvement"
        icon={Sparkles}
        title="AI-Powered Insights"
        description="Our AI automatically maps your evidence to framework requirements and identifies gaps for inspection readiness."
      />
    </div>
  );
}
