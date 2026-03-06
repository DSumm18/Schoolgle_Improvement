"use client";

import {
  GraduationCap,
  BookOpen,
  FilePlus,
  CheckSquare,
  Mail,
  ClipboardList,
  Gamepad2,
} from "lucide-react";
import {
  ModulePageHeader,
  ModuleAppCard,
} from "@/components/ui/module-page-header";

const apps = [
  {
    icon: BookOpen,
    title: "Lesson Planning",
    description:
      "AI-assisted lesson plans aligned to curriculum objectives, differentiated for every learner.",
    href: "/dashboard/teaching-learning/lesson-planning",
    status: "Coming Soon",
  },
  {
    icon: FilePlus,
    title: "Resource Generator",
    description:
      "Generate worksheets, slides, and activities tailored to your topic and year group in seconds.",
    href: "/dashboard/teaching-learning/resource-generator",
    status: "Coming Soon",
  },
  {
    icon: CheckSquare,
    title: "Assessment Support",
    description:
      "Create mark schemes, quizzes, and formative assessments with instant AI feedback.",
    href: "/dashboard/teaching-learning/assessment-support",
    status: "Coming Soon",
  },
  {
    icon: Mail,
    title: "Parent Comms",
    description:
      "Draft professional parent communications, reports, and newsletters in your school's tone of voice.",
    href: "/dashboard/teaching-learning/parent-comms",
    status: "Coming Soon",
  },
  {
    icon: ClipboardList,
    title: "Intervention Notes",
    description:
      "Record, track, and review pupil interventions with structured templates and progress monitoring.",
    href: "/dashboard/teaching-learning/intervention-notes",
    status: "Coming Soon",
  },
  {
    icon: Gamepad2,
    title: "Sim Studio",
    description:
      "Practise challenging conversations and classroom scenarios in a safe, AI-powered simulation environment.",
    href: "/sim-studio",
    status: "Live",
  },
];

export default function TeachingLearningPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={GraduationCap}
        label="Teaching & Learning"
        title="Teaching & Learning"
        description="Elevate classroom outcomes with AI-powered lesson planning, resource generation, and integrated assessment support."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app, i) => (
          <ModuleAppCard
            key={app.title}
            moduleId="teaching-learning"
            icon={app.icon}
            title={app.title}
            description={app.description}
            href={app.href}
            status={app.status}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
