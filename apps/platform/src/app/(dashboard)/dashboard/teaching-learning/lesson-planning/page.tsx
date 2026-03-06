"use client";

import React from "react";
import { BookOpen, Sparkles } from "lucide-react";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

export default function LessonPlanningPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={BookOpen}
        label="Teaching & Learning"
        title="Lesson Planning"
        description="We're building an intelligent lesson planning engine that aligns with your school's curriculum and Ofsted requirements automatically."
        badge="Coming Soon"
      />

      <ModuleFeatureBanner
        moduleId="teaching-learning"
        icon={Sparkles}
        title="Intelligent Lesson Planning"
        description="AI-powered lesson plans aligned to your curriculum, differentiated by ability, and mapped to Ofsted expectations. Create a week's worth of plans in minutes."
      />
    </div>
  );
}
