"use client";

import React from "react";
import { CheckSquare, Sparkles } from "lucide-react";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

export default function AssessmentSupportPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={CheckSquare}
        label="Teaching & Learning"
        title="Assessment Support"
        description="Streamline your marking and assessment. Get AI-driven insights into pupil progress and automated feedback suggestions."
        badge="Coming Soon"
      />

      <ModuleFeatureBanner
        moduleId="teaching-learning"
        icon={Sparkles}
        title="Smarter Assessment & Feedback"
        description="AI-assisted marking, automated feedback generation, and progress tracking dashboards. Spend less time on admin and more time on teaching."
      />
    </div>
  );
}
