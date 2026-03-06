"use client";

import React from "react";
import { FilePlus, Sparkles } from "lucide-react";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

export default function ResourceGeneratorPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={FilePlus}
        label="Teaching & Learning"
        title="Resource Generator"
        description="AI-powered resource creation. Generate worksheets, quizzes, and presentations tailored to your specific class needs and ability levels."
        badge="Coming Soon"
      />

      <ModuleFeatureBanner
        moduleId="teaching-learning"
        icon={Sparkles}
        title="Generate Teaching Resources Instantly"
        description="Create differentiated worksheets, knowledge organisers, quizzes, and slide decks in seconds. Tailored to your subject, year group, and ability range."
      />
    </div>
  );
}
