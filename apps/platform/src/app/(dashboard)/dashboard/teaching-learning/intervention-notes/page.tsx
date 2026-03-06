"use client";

import React from "react";
import { ClipboardList, Sparkles } from "lucide-react";
import {
  ModulePageHeader,
  ModuleFeatureBanner,
} from "@/components/ui/module-page-header";

export default function InterventionNotesPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={ClipboardList}
        label="Teaching & Learning"
        title="Intervention Notes"
        description="Track the impact of targeted support. Record intervention summaries and monitor pupil development with ease."
        badge="Coming Soon"
      />

      <ModuleFeatureBanner
        moduleId="teaching-learning"
        icon={Sparkles}
        title="Evidence-Based Intervention Tracking"
        description="Log intervention sessions, track progress over time, and generate impact summaries for SLT and governors. Built-in alignment to EEF research strategies."
      />
    </div>
  );
}
